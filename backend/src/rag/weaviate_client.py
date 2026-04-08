"""
src/rag/weaviate_client.py – Weaviate v4 client + schema bootstrap cho Vinmec RAG.

Collections:
  VinmecSpecialty   – Thông tin chuyên khoa, yêu cầu chuẩn bị
  VinmecProcedure   – Quy trình xét nghiệm / thủ thuật cụ thể
  VinmecDocument    – Tài liệu hướng dẫn chung (FAQ, lưu ý bệnh viện)

Embedding: text2vec-openai (hoặc text2vec-transformers nếu local).
Khi không có GPU / API key, dùng none vectorizer + manual vector.
"""
from __future__ import annotations

import logging
import os
from typing import Optional
from urllib.parse import urlparse

import weaviate
from weaviate.classes.config import Configure, DataType, Property, VectorDistances
from weaviate.classes.init import Auth

logger = logging.getLogger(__name__)

# ── Config từ env ─────────────────────────────────────────────────────────────

def _clean_env(key: str, default: str = "") -> str:
    """Đọc env var và chuẩn hoá để an toàn khi dùng làm HTTP header/value."""
    raw = os.getenv(key, default)
    value = raw.split("#", 1)[0].strip()
    # Header values phải là ASCII printable; loại bỏ control chars và unicode.
    cleaned = "".join(ch for ch in value if 32 <= ord(ch) <= 126)
    return cleaned.strip()


def _clean_int_env(key: str, default: int) -> int:
    raw = _clean_env(key, str(default))
    try:
        return int(raw)
    except ValueError:
        logger.warning("Invalid %s=%r. Fallback to %d", key, raw, default)
        return default


def _parse_weaviate_url(url: str) -> tuple[str, int, bool]:
    cleaned = _clean_env("WEAVIATE_URL", url)
    parsed = urlparse(cleaned if "://" in cleaned else f"http://{cleaned}")

    host = (parsed.hostname or "localhost").strip()
    port = parsed.port or (443 if parsed.scheme == "https" else 8079)
    secure = parsed.scheme == "https"

    if not host:
        raise ValueError(f"Invalid WEAVIATE_URL: {cleaned!r}")

    return host, port, secure


WEAVIATE_URL      = _clean_env("WEAVIATE_URL", "http://localhost:8079")
WEAVIATE_API_KEY  = _clean_env("WEAVIATE_API_KEY")           # để trống nếu local
OPENAI_API_KEY    = _clean_env("OPENAI_API_KEY") or _clean_env("OPENAI_APIKEY")
COHERE_API_KEY    = _clean_env("COHERE_API_KEY") or _clean_env("COHERE_APIKEY")

# Ghi lại env vars đã clean vào os.environ để weaviate library không tự đọc
# giá trị thô (có chứa comment tiếng Việt) khi khởi tạo httpx.Client
os.environ["WEAVIATE_URL"] = WEAVIATE_URL
os.environ["WEAVIATE_API_KEY"] = WEAVIATE_API_KEY
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
os.environ["OPENAI_APIKEY"] = OPENAI_API_KEY
os.environ["COHERE_API_KEY"] = COHERE_API_KEY
os.environ["COHERE_APIKEY"] = COHERE_API_KEY

# Vectorizer: "openai" | "cohere" | "none" (manual embedding)
VECTORIZER        = os.getenv("WEAVIATE_VECTORIZER", "none").lower()

# ── Collection names ──────────────────────────────────────────────────────────
COL_SPECIALTY  = "VinmecSpecialty"
COL_PROCEDURE  = "VinmecProcedure"
COL_DOCUMENT   = "VinmecDocument"

ALL_COLLECTIONS = [COL_SPECIALTY, COL_PROCEDURE, COL_DOCUMENT]


# ═══════════════════════════════════════════════════════════════════════════════
#  Client factory
# ═══════════════════════════════════════════════════════════════════════════════

def get_client() -> weaviate.WeaviateClient:
    """Trả về Weaviate client đã kết nối. Caller phải gọi client.close() sau khi dùng."""
    headers: dict[str, str] = {}
    if OPENAI_API_KEY:
        headers["X-OpenAI-Api-Key"] = OPENAI_API_KEY
    if COHERE_API_KEY:
        headers["X-Cohere-Api-Key"] = COHERE_API_KEY

    http_host, http_port, http_secure = _parse_weaviate_url(WEAVIATE_URL)

    grpc_host = _clean_env("WEAVIATE_GRPC_HOST", "localhost") or "localhost"
    grpc_port = _clean_int_env("WEAVIATE_GRPC_PORT", 50051)
    grpc_secure = (_clean_env("WEAVIATE_GRPC_SECURE", "false").lower() == "true")

    auth = Auth.api_key(WEAVIATE_API_KEY) if WEAVIATE_API_KEY else None

    client = weaviate.connect_to_custom(
        http_host=http_host,
        http_port=http_port,
        http_secure=http_secure,
        grpc_host=grpc_host,
        grpc_port=grpc_port,
        grpc_secure=grpc_secure,
        auth_credentials=auth,
        headers=headers,
    )
    return client


# ═══════════════════════════════════════════════════════════════════════════════
#  Schema bootstrap – tạo collections nếu chưa có
# ═══════════════════════════════════════════════════════════════════════════════

def _vectorizer_config():
    """Trả về vectorizer config phù hợp với env."""
    if VECTORIZER == "openai":
        return Configure.Vectorizer.text2vec_openai()
    elif VECTORIZER == "cohere":
        return Configure.Vectorizer.text2vec_cohere()
    else:
        # Dùng none → embed thủ công khi ingest, query bằng near_vector
        return Configure.Vectorizer.none()


def _create_specialty_collection(client: weaviate.WeaviateClient) -> None:
    """
    VinmecSpecialty — một record = một chuyên khoa/loại khám.

    Fields:
      name          tên chuyên khoa (vi)
      name_en       tên tiếng Anh
      department    khoa (Nội, Ngoại, Sản, Nhi, …)
      fasting       có nhịn ăn không (none / partial / required)
      fasting_hours số giờ nhịn ăn tối thiểu (0 nếu không cần)
      documents     giấy tờ cần mang (JSON array string)
      booking_required  đặt lịch trước bắt buộc không
      estimated_duration_min  thời gian dự kiến (phút)
      notes         lưu ý đặc biệt
      tags          keywords tìm kiếm
    """
    client.collections.create(
        name=COL_SPECIALTY,
        vectorizer_config=_vectorizer_config(),
        vector_index_config=Configure.VectorIndex.hnsw(
            distance_metric=VectorDistances.COSINE,
        ),
        properties=[
            Property(name="name",                data_type=DataType.TEXT),
            Property(name="name_en",             data_type=DataType.TEXT),
            Property(name="department",          data_type=DataType.TEXT),
            Property(name="fasting",             data_type=DataType.TEXT),
            Property(name="fasting_hours",       data_type=DataType.INT),
            Property(name="documents",           data_type=DataType.TEXT),
            Property(name="booking_required",    data_type=DataType.BOOL),
            Property(name="estimated_duration_min", data_type=DataType.INT),
            Property(name="notes",               data_type=DataType.TEXT),
            Property(name="tags",                data_type=DataType.TEXT_ARRAY),
        ],
    )
    logger.info("Created collection: %s", COL_SPECIALTY)


def _create_procedure_collection(client: weaviate.WeaviateClient) -> None:
    """
    VinmecProcedure — một record = một xét nghiệm / thủ thuật cụ thể.
    """
    client.collections.create(
        name=COL_PROCEDURE,
        vectorizer_config=_vectorizer_config(),
        vector_index_config=Configure.VectorIndex.hnsw(
            distance_metric=VectorDistances.COSINE,
        ),
        properties=[
            Property(name="name",          data_type=DataType.TEXT),
            Property(name="name_en",       data_type=DataType.TEXT),
            Property(name="procedure_type", data_type=DataType.TEXT),   # lab | imaging | procedure
            Property(name="fasting",       data_type=DataType.TEXT),
            Property(name="fasting_hours", data_type=DataType.INT),
            Property(name="preparation",   data_type=DataType.TEXT),    # hướng dẫn chuẩn bị chi tiết
            Property(name="duration_min",  data_type=DataType.INT),
            Property(name="contraindications", data_type=DataType.TEXT),
            Property(name="notes",         data_type=DataType.TEXT),
            Property(name="tags",          data_type=DataType.TEXT_ARRAY),
        ],
    )
    logger.info("Created collection: %s", COL_PROCEDURE)


def _create_document_collection(client: weaviate.WeaviateClient) -> None:
    """
    VinmecDocument — FAQ, hướng dẫn chung, chính sách bệnh viện.
    """
    client.collections.create(
        name=COL_DOCUMENT,
        vectorizer_config=_vectorizer_config(),
        vector_index_config=Configure.VectorIndex.hnsw(
            distance_metric=VectorDistances.COSINE,
        ),
        properties=[
            Property(name="title",    data_type=DataType.TEXT),
            Property(name="content",  data_type=DataType.TEXT),
            Property(name="category", data_type=DataType.TEXT),
            Property(name="source",   data_type=DataType.TEXT),
            Property(name="tags",     data_type=DataType.TEXT_ARRAY),
        ],
    )
    logger.info("Created collection: %s", COL_DOCUMENT)


def bootstrap_schema(client: weaviate.WeaviateClient, force: bool = False) -> None:
    """
    Tạo tất cả collections nếu chưa tồn tại.
    force=True → xoá và tạo lại (chỉ dùng khi dev/reset).
    """
    existing = {c.name for c in client.collections.list_all().values()}

    for col_name in ALL_COLLECTIONS:
        if col_name in existing:
            if force:
                client.collections.delete(col_name)
                logger.warning("Dropped collection: %s (force=True)", col_name)
            else:
                logger.info("Collection already exists, skipping: %s", col_name)
                continue

        if col_name == COL_SPECIALTY:
            _create_specialty_collection(client)
        elif col_name == COL_PROCEDURE:
            _create_procedure_collection(client)
        elif col_name == COL_DOCUMENT:
            _create_document_collection(client)

    logger.info("Schema bootstrap complete.")


# ═══════════════════════════════════════════════════════════════════════════════
#  Context manager helper
# ═══════════════════════════════════════════════════════════════════════════════

class WeaviateSession:
    """Context manager để đảm bảo client.close() luôn được gọi."""

    def __init__(self):
        self._client: Optional[weaviate.WeaviateClient] = None

    def __enter__(self) -> weaviate.WeaviateClient:
        self._client = get_client()
        return self._client

    def __exit__(self, *_):
        if self._client:
            self._client.close()

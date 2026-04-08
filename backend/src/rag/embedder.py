"""
src/rag/embedder.py – Centralized embedding module cho Vinmec RAG.

Thay thế logic embedding rải rác trong ingest_medical_data.py và retrieval.py.

Model hierarchy (không dùng OpenAI):
  1. intfloat/multilingual-e5-large-instruct  – tốt nhất, 560M params, 1024-dim
                                                 cần ~2GB RAM, chậm hơn
  2. intfloat/multilingual-e5-base            – RECOMMENDED tầm trung, 278M, 768-dim
                                                 chạy tốt trên CPU, ~1GB RAM
  3. intfloat/multilingual-e5-small           – nhẹ nhất, 118M, 384-dim
                                                 dùng khi RAM hạn chế (< 512MB cho model)
  4. paraphrase-multilingual-MiniLM-L12-v2   – fallback cũ (384-dim, chất lượng thấp hơn)

Tại sao multilingual-e5 tốt hơn MiniLM cho tiếng Việt:
  - Trained với E5 contrastive loss trên 1.3B multilingual pairs
  - Hiểu ngữ nghĩa tiếng Việt tốt hơn đáng kể (~15% NDCG@10 trên MIRACL-vi)
  - Hỗ trợ asymmetric retrieval đúng cách (query vs passage prefix)

QUAN TRỌNG – E5 prefix convention:
  - Document khi ingest:  "passage: " + text
  - Query khi retrieve:   "query: "   + text
  Thiếu prefix này làm giảm chất lượng đáng kể.
"""
from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Callable

logger = logging.getLogger(__name__)

# ── Env config ────────────────────────────────────────────────────────────────
EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    "intfloat/multilingual-e5-base",   # default: medium quality
)
OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY", "")

# Model → vector dimension mapping (cho reference, Weaviate tự infer)
MODEL_DIMS: dict[str, int] = {
    "intfloat/multilingual-e5-large-instruct": 1024,
    "intfloat/multilingual-e5-large":          1024,
    "intfloat/multilingual-e5-base":            768,
    "intfloat/multilingual-e5-small":           384,
    "paraphrase-multilingual-mpnet-base-v2":    768,
    "paraphrase-multilingual-MiniLM-L12-v2":    384,
    "text-embedding-3-small":                  1536,
    "text-embedding-3-large":                  3072,
}

# E5 models cần prefix
_E5_MODELS = {
    "intfloat/multilingual-e5-large-instruct",
    "intfloat/multilingual-e5-large",
    "intfloat/multilingual-e5-base",
    "intfloat/multilingual-e5-small",
}


# ═══════════════════════════════════════════════════════════════════════════════
#  Embedder factory
# ═══════════════════════════════════════════════════════════════════════════════

@lru_cache(maxsize=1)
def _load_sentence_transformer(model_name: str):
    """Load SentenceTransformer model một lần, cache lại."""
    from sentence_transformers import SentenceTransformer
    logger.info("Loading embedding model: %s", model_name)
    model = SentenceTransformer(model_name)
    dim = MODEL_DIMS.get(model_name, "unknown")
    logger.info("Model loaded. Dimension: %s", dim)
    return model


@lru_cache(maxsize=1)
def get_document_embedder() -> Callable[[str], list[float]]:
    """
    Trả về hàm embed(text) → list[float] cho DOCUMENTS khi ingest.
    Tự động thêm 'passage: ' prefix nếu dùng E5 model.
    """
    # OpenAI ưu tiên nếu có key
    if OPENAI_API_KEY:
        return _make_openai_embedder(prefix=None)

    model_name = EMBEDDING_MODEL
    use_prefix = model_name in _E5_MODELS
    prefix = "passage: " if use_prefix else ""
    model = _load_sentence_transformer(model_name)

    def embed_doc(text: str) -> list[float]:
        full_text = prefix + text
        return model.encode(full_text, normalize_embeddings=True).tolist()

    logger.info(
        "Document embedder: %s | prefix=%r | dim=%s",
        model_name, prefix, MODEL_DIMS.get(model_name, "?"),
    )
    return embed_doc


@lru_cache(maxsize=1)
def get_query_embedder() -> Callable[[str], list[float]]:
    """
    Trả về hàm embed(query) → list[float] cho QUERIES khi retrieve.
    Tự động thêm 'query: ' prefix nếu dùng E5 model.
    """
    if OPENAI_API_KEY:
        return _make_openai_embedder(prefix=None)

    model_name = EMBEDDING_MODEL
    use_prefix = model_name in _E5_MODELS
    prefix = "query: " if use_prefix else ""
    model = _load_sentence_transformer(model_name)

    def embed_query(text: str) -> list[float]:
        full_text = prefix + text
        return model.encode(full_text, normalize_embeddings=True).tolist()

    logger.info(
        "Query embedder: %s | prefix=%r | dim=%s",
        model_name, prefix, MODEL_DIMS.get(model_name, "?"),
    )
    return embed_query


@lru_cache(maxsize=4)
def _make_openai_embedder(
    model: str = "text-embedding-3-small",
    prefix: str | None = None,
) -> Callable[[str], list[float]]:
    """OpenAI embedding (dùng khi OPENAI_API_KEY có giá trị)."""
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)

    def embed(text: str) -> list[float]:
        input_text = (prefix + text) if prefix else text
        resp = client.embeddings.create(model=model, input=input_text[:8000])
        return resp.data[0].embedding

    logger.info("Embedding provider: OpenAI %s", model)
    return embed


# ═══════════════════════════════════════════════════════════════════════════════
#  Convenience: batch embed (dùng cho ingest)
# ═══════════════════════════════════════════════════════════════════════════════

def batch_embed_documents(texts: list[str], batch_size: int = 32) -> list[list[float]]:
    """
    Embed nhiều document cùng lúc — hiệu quả hơn loop từng cái.
    Chỉ dùng được với SentenceTransformer (không batch với OpenAI).
    """
    if OPENAI_API_KEY:
        embedder = get_document_embedder()
        return [embedder(t) for t in texts]

    model_name = EMBEDDING_MODEL
    use_prefix  = model_name in _E5_MODELS
    prefix      = "passage: " if use_prefix else ""

    model = _load_sentence_transformer(model_name)
    prefixed = [prefix + t for t in texts]

    all_vecs = []
    for i in range(0, len(prefixed), batch_size):
        chunk = prefixed[i : i + batch_size]
        vecs  = model.encode(chunk, normalize_embeddings=True, show_progress_bar=False)
        all_vecs.extend(vecs.tolist())

    return all_vecs


# ── Quick info ────────────────────────────────────────────────────────────────
def embedding_info() -> dict:
    """Trả về thông tin model hiện tại để log/debug."""
    provider = "openai" if OPENAI_API_KEY else "local"
    model    = "text-embedding-3-small" if OPENAI_API_KEY else EMBEDDING_MODEL
    return {
        "provider":       provider,
        "model":          model,
        "dimension":      MODEL_DIMS.get(model, "unknown"),
        "e5_prefix_used": model in _E5_MODELS,
    }
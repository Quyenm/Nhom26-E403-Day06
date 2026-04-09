"""
src/api/server.py – FastAPI server cho VinmecPrep AI (Kafka edition).

Endpoints:
  POST /chat                  – submit job lên Kafka, poll Redis cho kết quả (sync interface)
  GET  /chat/result/{job_id}  – async poll endpoint (cho client muốn non-blocking)
  POST /feedback              – lưu like/dislike theo turn vào Weaviate VinmecFeedback
  POST /feedback/end          – lưu đánh giá tổng thể cuối phiên (1-5 sao) vào VinmecFeedbackEnd
  GET  /feedback              – danh sách feedback (trainer)
  GET  /feedback/search       – semantic search feedback (trainer)
  GET  /feedback/stats        – stats like/dislike (trainer)
  GET  /feedback/end          – danh sách feedback cuối phiên (trainer)
  GET  /feedback/end/stats    – stats rating 1-5 sao (trainer)
  GET  /health                – health check

Flow /chat với Kafka:
  1. Generate job_id → XADD Kafka vinmec.chat.jobs (key=session_id)
  2. Poll Redis vinmec:result:{job_id} tối đa POLL_TIMEOUT_S giây
  3. Kafka consumer xử lý → setex Redis → API trả về kết quả

[BUG-2 FIX] asyncio.get_event_loop() → asyncio.get_running_loop()
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import uuid
from contextlib import asynccontextmanager
from typing import Optional

import redis.asyncio as aioredis
from fastapi import FastAPI, HTTPException, Request, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field

from src.config import REDIS_URL, RATE_LIMIT_RPM, REDIS_SESSION_TTL, ALLOWED_ORIGINS
from src.kafka.producer import kafka_producer

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

POLL_TIMEOUT_S  = int(os.getenv("CHAT_POLL_TIMEOUT", "45"))
POLL_INTERVAL_S = 0.25

# ── Sentry (optional) ─────────────────────────────────────────────────────────
_SENTRY_DSN = os.getenv("SENTRY_DSN", "").split("#")[0].strip()
if _SENTRY_DSN:
    try:
        import sentry_sdk
        sentry_sdk.init(dsn=_SENTRY_DSN, traces_sample_rate=0.1, send_default_pii=True)
        logger.info("Sentry initialized")
    except ImportError:
        logger.warning("sentry-sdk not installed, skipping Sentry init")

# ── Redis pool ─────────────────────────────────────────────────────────────────
_redis: Optional[aioredis.Redis] = None

# ── Trainer API key ────────────────────────────────────────────────────────────
_TRAINER_API_KEY = os.getenv("TRAINER_API_KEY", "").strip()
_api_key_header  = APIKeyHeader(name="X-Trainer-Key", auto_error=False)


def _require_trainer_key(key: Optional[str] = Depends(_api_key_header)):
    if not _TRAINER_API_KEY:
        raise HTTPException(status_code=503, detail="TRAINER_API_KEY chưa được cấu hình.")
    if key != _TRAINER_API_KEY:
        raise HTTPException(status_code=403, detail="Trainer API key không hợp lệ.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _redis
    _redis = aioredis.from_url(REDIS_URL, decode_responses=True)
    logger.info("Redis connected: %s", REDIS_URL)

    await kafka_producer.start()

    if os.getenv("EMBEDDING_WARMUP", "1") == "1":
        try:
            from src.rag.weaviate_client import VECTORIZER
            if VECTORIZER == "none":
                from src.rag.embedder import get_query_embedder
                get_query_embedder()
                logger.info("Embedding warmup complete")
        except Exception as exc:
            logger.warning("Embedding warmup skipped: %s", exc)

    yield

    await kafka_producer.stop()
    await _redis.aclose()
    logger.info("Shutdown hoàn tất")


app = FastAPI(
    title       = "VinmecPrep AI",
    version     = "2.0.0",
    description = "AI trợ lý chuẩn bị khám Vinmec – Kafka edition",
    lifespan    = lifespan,
    docs_url    = None,
    redoc_url   = None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins  = ALLOWED_ORIGINS,
    allow_methods  = ["GET", "POST", "OPTIONS"],
    allow_headers  = ["Content-Type", "Authorization", "X-Trainer-Key"],
)


# ── Rate limiting ─────────────────────────────────────────────────────────────
async def rate_limit(request: Request):
    ip  = request.headers.get("X-Real-IP") or request.client.host
    key = f"rl:{ip}"
    try:
        count = await _redis.incr(key)
        if count == 1:
            await _redis.expire(key, 60)
        if count > RATE_LIMIT_RPM:
            raise HTTPException(
                status_code=429,
                detail=f"Quá {RATE_LIMIT_RPM} requests/phút. Vui lòng thử lại sau.",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Rate limit check failed: %s", e)


# ── Schemas ───────────────────────────────────────────────────────────────────
class Message(BaseModel):
    role:    str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message:    str           = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    history:    list[Message] = Field(default_factory=list, max_length=40)


class ChatResponse(BaseModel):
    reply:        str
    session_id:   str
    job_id:       str
    blocked:      bool
    guard_result: str


class ChatJobSubmitted(BaseModel):
    """Trả về ngay khi job đã được đẩy vào Kafka (cho client async)."""
    job_id:     str
    session_id: str
    status:     str = "queued"


class FeedbackRequest(BaseModel):
    session_id: str           = Field(..., min_length=1, max_length=128)
    rating:     str           = Field(..., pattern="^(like|dislike)$")
    comment:    Optional[str] = Field(default=None, max_length=1000)


class FeedbackResponse(BaseModel):
    uuid:       str
    session_id: str
    rating:     str
    saved:      bool


class FeedbackEndRequest(BaseModel):
    """
    Đánh giá tổng thể cuối phiên chat.

    rating  : Điểm từ 1 (rất tệ) đến 5 (rất tốt) sao.
    comment : Nhận xét văn bản tuỳ chọn của người dùng.
    tags    : Danh mục đánh giá tuỳ chọn, vd ["helpful", "accurate", "fast", "needs_improvement"].
    """
    session_id: str                    = Field(..., min_length=1, max_length=128)
    rating:     int                    = Field(..., ge=1, le=5)
    comment:    Optional[str]          = Field(default=None, max_length=1000)
    tags:       Optional[list[str]]    = Field(default=None, max_length=10)


class FeedbackEndResponse(BaseModel):
    uuid:       str
    session_id: str
    rating:     int
    saved:      bool


# ── Session helpers ────────────────────────────────────────────────────────────
async def _get_history(session_id: str) -> list[dict]:
    try:
        raw = await _redis.get(f"session:{session_id}")
        return json.loads(raw) if raw else []
    except Exception:
        return []


async def _save_history(session_id: str, history: list[dict]):
    try:
        await _redis.setex(
            f"session:{session_id}",
            REDIS_SESSION_TTL,
            json.dumps(history[-40:]),
        )
    except Exception as e:
        logger.warning("Session save failed: %s", e)


# ── Kafka result polling ───────────────────────────────────────────────────────
async def _poll_result(job_id: str, timeout_s: float = POLL_TIMEOUT_S) -> dict | None:
    """
    Poll Redis vinmec:result:{job_id} cho đến khi có kết quả hoặc timeout.
    Consumer sẽ setex key này sau khi xử lý xong.
    """
    result_key = f"vinmec:result:{job_id}"
    deadline   = asyncio.get_running_loop().time() + timeout_s

    while asyncio.get_running_loop().time() < deadline:
        try:
            raw = await _redis.get(result_key)
            if raw:
                return json.loads(raw)
        except Exception as e:
            logger.warning("Redis poll error: %s", e)

        await asyncio.sleep(POLL_INTERVAL_S)

    return None


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    try:
        await _redis.ping()
        redis_ok = True
    except Exception:
        redis_ok = False
    return {"status": "ok", "redis": redis_ok}


@app.get("/sentry-debug")
async def trigger_error():
    1 / 0  # noqa


@app.post("/chat", response_model=ChatResponse, dependencies=[Depends(rate_limit)])
async def chat_endpoint(req: ChatRequest):
    """
    Submit chat job lên Kafka → poll Redis cho kết quả.
    Interface vẫn synchronous với client (blocking tối đa POLL_TIMEOUT_S giây).
    Kafka + 5 partitions xử lý song song bất đồng bộ phía sau.
    """
    session_id = req.session_id or str(uuid.uuid4())
    job_id     = str(uuid.uuid4())

    if req.history:
        history = [m.model_dump() for m in req.history]
    else:
        history = await _get_history(session_id)

    payload = {
        "message": req.message,
        "history": json.dumps(history, ensure_ascii=False),
    }

    try:
        await kafka_producer.send_job(job_id, session_id, payload)
    except Exception as e:
        logger.error("Kafka send failed: %s", e)
        raise HTTPException(status_code=503, detail="Hàng đợi tạm thời không khả dụng.")

    result = await _poll_result(job_id)

    if result is None:
        raise HTTPException(
            status_code=504,
            detail="Yêu cầu đang được xử lý, vui lòng thử lại sau.",
        )

    blocked = result.get("blocked", "false").lower() == "true"

    if not blocked:
        history.append({"role": "user",      "content": req.message})
        history.append({"role": "assistant", "content": result["reply"]})
        await _save_history(session_id, history)

    return ChatResponse(
        reply        = result["reply"],
        session_id   = session_id,
        job_id       = job_id,
        blocked      = blocked,
        guard_result = result.get("guard_result", ""),
    )


@app.post("/chat/async", response_model=ChatJobSubmitted, dependencies=[Depends(rate_limit)])
async def chat_async_endpoint(req: ChatRequest):
    """
    Submit job lên Kafka và trả về ngay (202-style).
    Client poll GET /chat/result/{job_id} để lấy kết quả.
    """
    session_id = req.session_id or str(uuid.uuid4())
    job_id     = str(uuid.uuid4())

    history = [m.model_dump() for m in req.history] if req.history else await _get_history(session_id)

    payload = {
        "message": req.message,
        "history": json.dumps(history, ensure_ascii=False),
    }

    try:
        await kafka_producer.send_job(job_id, session_id, payload)
    except Exception as e:
        logger.error("Kafka send failed: %s", e)
        raise HTTPException(status_code=503, detail="Hàng đợi tạm thời không khả dụng.")

    return ChatJobSubmitted(job_id=job_id, session_id=session_id)


@app.get("/chat/result/{job_id}", dependencies=[Depends(rate_limit)])
async def get_chat_result(job_id: str):
    """
    Poll kết quả của một job đã submit qua /chat/async.
    Trả về 202 nếu chưa xong, 200 nếu có kết quả.
    """
    result_key = f"vinmec:result:{job_id}"
    try:
        raw = await _redis.get(result_key)
    except Exception:
        raw = None

    if not raw:
        return JSONResponse(status_code=202, content={"status": "processing", "job_id": job_id})

    result  = json.loads(raw)
    blocked = result.get("blocked", "false").lower() == "true"

    return {
        "status":       "done",
        "job_id":       job_id,
        "session_id":   result.get("session_id"),
        "reply":        result.get("reply"),
        "blocked":      blocked,
        "guard_result": result.get("guard_result", ""),
    }


@app.post("/", response_model=ChatResponse, dependencies=[Depends(rate_limit)])
async def chat_root(req: ChatRequest):
    return await chat_endpoint(req)


# ── Feedback (like / dislike per turn) ────────────────────────────────────────
@app.post("/feedback", response_model=FeedbackResponse, dependencies=[Depends(rate_limit)])
async def feedback_endpoint(req: FeedbackRequest):
    """
    Nhận like/dislike từ người dùng.
    Lấy lịch sử chat từ Redis → lưu vào Weaviate VinmecFeedback.
    [BUG-2 FIX] asyncio.get_running_loop() thay vì get_event_loop()
    """
    from src.db.feedback import save_feedback

    messages = await _get_history(req.session_id)

    if not messages:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lịch sử chat cho session này. Session có thể đã hết hạn.",
        )

    loop = asyncio.get_running_loop()
    try:
        obj_uuid = await loop.run_in_executor(
            None, save_feedback, req.session_id, req.rating, messages, req.comment
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    return FeedbackResponse(
        uuid       = obj_uuid,
        session_id = req.session_id,
        rating     = req.rating,
        saved      = True,
    )


@app.get("/feedback", dependencies=[Depends(_require_trainer_key)])
async def get_feedback_list(
    rating: Optional[str] = Query(default=None, pattern="^(like|dislike)$"),
    limit:  int           = Query(default=50, ge=1, le=500),
    offset: int           = Query(default=0, ge=0),
):
    from src.db.feedback import get_feedback
    loop = asyncio.get_running_loop()
    rows = await loop.run_in_executor(None, get_feedback, rating, limit, offset)
    return {"total": len(rows), "offset": offset, "items": rows}


@app.get("/feedback/search", dependencies=[Depends(_require_trainer_key)])
async def search_feedback_endpoint(
    q:      str           = Query(..., min_length=1, max_length=500),
    rating: Optional[str] = Query(default=None, pattern="^(like|dislike)$"),
    limit:  int           = Query(default=20, ge=1, le=100),
):
    from src.db.feedback import search_feedback
    loop    = asyncio.get_running_loop()
    results = await loop.run_in_executor(None, search_feedback, q, rating, limit)
    return {"query": q, "rating": rating, "total": len(results), "items": results}


@app.get("/feedback/stats", dependencies=[Depends(_require_trainer_key)])
async def get_feedback_stats():
    from src.db.feedback import count_feedback
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, count_feedback)


# ── Feedback End (end-of-session survey) ──────────────────────────────────────
@app.post("/feedback/end", response_model=FeedbackEndResponse, dependencies=[Depends(rate_limit)])
async def feedback_end_endpoint(req: FeedbackEndRequest):
    """
    Nhận đánh giá tổng thể cuối phiên chat (1-5 sao + comment + tags).
    Lấy lịch sử chat từ Redis → vectorize full_text → lưu vào VinmecFeedbackEnd.

    Mỗi session chỉ được submit 1 lần. Gọi lại với cùng session_id → HTTP 409.
    """
    from src.db.feedback import save_feedback_end

    messages = await _get_history(req.session_id)

    if not messages:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lịch sử chat cho session này. Session có thể đã hết hạn.",
        )

    loop = asyncio.get_running_loop()
    try:
        obj_uuid = await loop.run_in_executor(
            None,
            save_feedback_end,
            req.session_id,
            req.rating,
            messages,
            req.comment,
            req.tags,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    return FeedbackEndResponse(
        uuid       = obj_uuid,
        session_id = req.session_id,
        rating     = req.rating,
        saved      = True,
    )


@app.get("/feedback/end", dependencies=[Depends(_require_trainer_key)])
async def get_feedback_end_list(
    rating: Optional[int] = Query(default=None, ge=1, le=5),
    limit:  int           = Query(default=50, ge=1, le=500),
    offset: int           = Query(default=0, ge=0),
):
    """Danh sách feedback cuối phiên để trainer phân tích CSAT / NPS."""
    from src.db.feedback import get_feedback_end
    loop = asyncio.get_running_loop()
    rows = await loop.run_in_executor(None, get_feedback_end, rating, limit, offset)
    return {"total": len(rows), "offset": offset, "items": rows}


@app.get("/feedback/end/stats", dependencies=[Depends(_require_trainer_key)])
async def get_feedback_end_stats():
    """Thống kê rating 1-5 sao, avg_rating và breakdown theo từng mức."""
    from src.db.feedback import count_feedback_end
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, count_feedback_end)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Đã xảy ra lỗi. Vui lòng thử lại hoặc gọi 1900 54 61 54."},
    )
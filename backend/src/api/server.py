"""
src/api/server.py – FastAPI server cho VinmecPrep AI.

Endpoints:
  POST /chat    – single-turn hoặc multi-turn với history
  GET  /health  – health check (redis ping)

Fixes so với bản cũ:
  - CORS: đổi allow_origins từ ["*"] về env var (default localhost)
  - Rate limit IP: dùng X-Real-IP (không thể spoof) thay vì X-Forwarded-For
  - Thêm global rate limit (không chỉ per-IP)
  - Thêm Sentry error tracking (nếu SENTRY_DSN có trong .env)
"""
from __future__ import annotations

import logging
import os
import uuid
from contextlib import asynccontextmanager
from typing import Optional

import redis.asyncio as aioredis
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from src.config import REDIS_URL, RATE_LIMIT_RPM, REDIS_SESSION_TTL, ALLOWED_ORIGINS

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ── Sentry (optional) ─────────────────────────────────────────────────────────
_SENTRY_DSN = os.getenv("SENTRY_DSN", "").split("#")[0].strip()
if _SENTRY_DSN:
    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=_SENTRY_DSN,
            traces_sample_rate=0.1,
            send_default_pii=True
        )
        logger.info("Sentry initialized")
    except ImportError:
        logger.warning("sentry-sdk not installed, skipping Sentry init")

# ── Redis pool ─────────────────────────────────────────────────────────────────
_redis: Optional[aioredis.Redis] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _redis
    _redis = aioredis.from_url(REDIS_URL, decode_responses=True)
    logger.info("Redis connected: %s", REDIS_URL)

    # Warm up embedder once per API process to avoid first-request load spikes.
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
    await _redis.aclose()
    logger.info("Redis closed")


app = FastAPI(
    title="VinmecPrep AI",
    version="1.1.0",
    description="AI trợ lý chuẩn bị khám Vinmec",
    lifespan=lifespan,
    docs_url=None,   # Tắt Swagger UI ở production (bật lại khi dev: docs_url="/docs")
    redoc_url=None,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# FIX: không dùng ["*"] — inject từ ALLOWED_ORIGINS trong .env
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# ── Rate limiting ─────────────────────────────────────────────────────────────
async def rate_limit(request: Request):
    """
    Giới hạn RATE_LIMIT_RPM requests/phút mỗi IP.

    FIX: Dùng X-Real-IP (set bởi nginx với $remote_addr, không thể spoof)
    thay vì X-Forwarded-For (client có thể inject giá trị giả).
    """
    # X-Real-IP được nginx set thành $remote_addr → không thể spoof
    ip = request.headers.get("X-Real-IP") or request.client.host
    key = f"rl:{ip}"
    try:
        count = await _redis.incr(key)
        if count == 1:
            await _redis.expire(key, 60)
        if count > RATE_LIMIT_RPM:
            raise HTTPException(
                status_code=429,
                detail=f"Quá {RATE_LIMIT_RPM} requests/phút. Vui lòng thử lại sau."
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Rate limit check failed: %s", e)  # Fail open


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
    blocked:      bool
    guard_result: str


# ── Session helpers (Redis-backed history) ────────────────────────────────────
async def _get_history(session_id: str) -> list[dict]:
    import json
    try:
        raw = await _redis.get(f"session:{session_id}")
        return json.loads(raw) if raw else []
    except Exception:
        return []

async def _save_history(session_id: str, history: list[dict]):
    import json
    try:
        await _redis.setex(
            f"session:{session_id}",
            REDIS_SESSION_TTL,
            json.dumps(history[-40:]),
        )
    except Exception as e:
        logger.warning("Session save failed: %s", e)


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
    division_by_zero = 1 / 0


@app.post("/chat", response_model=ChatResponse, dependencies=[Depends(rate_limit)])
async def chat_endpoint(req: ChatRequest):
    import asyncio
    from src.agent.vinmec_agent import chat

    session_id = req.session_id or str(uuid.uuid4())

    if req.history:
        history = [m.model_dump() for m in req.history]
    else:
        history = await _get_history(session_id)

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, chat, req.message, history)

    if not result["blocked"]:
        history.append({"role": "user",      "content": req.message})
        history.append({"role": "assistant",  "content": result["reply"]})
        await _save_history(session_id, history)

    return ChatResponse(
        reply        = result["reply"],
        session_id   = session_id,
        blocked      = result["blocked"],
        guard_result = result["guard_result"],
    )


# Backward-compat path for proxies that forward /api/chat as POST /.
@app.post("/", response_model=ChatResponse, dependencies=[Depends(rate_limit)])
async def chat_root(req: ChatRequest):
    return await chat_endpoint(req)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Đã xảy ra lỗi. Vui lòng thử lại hoặc gọi 1900 54 61 54."},
    )

"""
src/config.py – Centralized config loaded from env / .env file.
"""
from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()

# ── LLM via LiteLLM ─────────────────────────────────────────────────────────
LLM_MODEL        = os.getenv("LLM_MODEL",       "groq/qwen/qwen3-32b")
LLM_API_BASE     = os.getenv("LLM_API_BASE",    None)
LLM_API_KEY      = os.getenv("LLM_API_KEY",     os.getenv("GROQ_API_KEY", ""))
LLM_TEMPERATURE  = float(os.getenv("LLM_TEMPERATURE", "0.3"))
LLM_MAX_TOKENS   = int(os.getenv("LLM_MAX_TOKENS", "2048"))

# ── Search ───────────────────────────────────────────────────────────────────
SERPER_API_KEY   = os.getenv("SERPER_API_KEY",  "")
SEARXNG_URL      = os.getenv("SEARXNG_URL",     "http://searxng:8080")
WEB_SEARCH_TOP_K = int(os.getenv("WEB_SEARCH_TOP_K", "5"))

# ── Weaviate ─────────────────────────────────────────────────────────────────
WEAVIATE_URL     = os.getenv("WEAVIATE_URL",    "http://weaviate:8080")
WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY", "").split("#")[0].strip()

# ── Redis ────────────────────────────────────────────────────────────────────
REDIS_URL        = os.getenv("REDIS_URL",       "redis://redis:6379/0")
REDIS_SESSION_TTL= int(os.getenv("REDIS_SESSION_TTL", "86400")) # 1 ngày thay vì 1 giờ
REDIS_CACHE_TTL  = int(os.getenv("REDIS_CACHE_TTL",   "300"))

# ── Rate limiting ─────────────────────────────────────────────────────────────
RATE_LIMIT_RPM   = int(os.getenv("RATE_LIMIT_RPM", "20"))
MAX_INPUT_CHARS  = int(os.getenv("MAX_INPUT_CHARS", "2000"))

# ── API ───────────────────────────────────────────────────────────────────────
API_HOST         = os.getenv("API_HOST", "0.0.0.0")
API_PORT         = int(os.getenv("API_PORT", "8000"))

# ── CORS ─────────────────────────────────────────────────────────────────────
# FIX: Không dùng ["*"]. Set ALLOWED_ORIGINS trong .env, cách nhau bằng dấu phẩy.
# VD: ALLOWED_ORIGINS=https://yourapp.vinmec.com,https://admin.vinmec.com
_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:8890,http://localhost:3000")
ALLOWED_ORIGINS  = [o.strip() for o in _origins_raw.split(",") if o.strip()]

# ── Trainer ───────────────────────────────────────────────────────────────────
# Key để bảo vệ GET /feedback, GET /feedback/search, GET /feedback/stats.
# Set trong .env: TRAINER_API_KEY=some_long_random_secret
TRAINER_API_KEY = os.getenv("TRAINER_API_KEY", "").strip()

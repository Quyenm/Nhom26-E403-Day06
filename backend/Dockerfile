FROM python:3.11-slim

# Build args
ARG APP_DIR=/app

WORKDIR ${APP_DIR}

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl wget build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (Docker layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser ${APP_DIR}
USER appuser

# Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD curl -sf http://localhost:8000/health || exit 1

EXPOSE 8000

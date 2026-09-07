# syntax=docker/dockerfile:1
FROM python:3.12-slim

WORKDIR /app

# System deps commonly needed by upstream optional tools (yt-dlp etc. optional).
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY server/requirements.txt /app/server/requirements.txt
RUN pip install --no-cache-dir -r /app/server/requirements.txt

COPY . /app

ENV PYTHONUNBUFFERED=1 \
    RESEARCH_HOST=0.0.0.0 \
    RESEARCH_PORT=8080 \
    LAST30DAYS_MEMORY_DIR=/tmp/last30days-memory

# Do NOT set LAST30DAYS_API_BASE / LAST30DAYS_API_KEY on this service.
# Do NOT set NODE_ENV (N/A). RESEARCH_API_KEY must be provided at runtime.
# Zeabur injects PORT for HTTP routing; prefer it when present.

EXPOSE 8080

CMD ["sh", "-c", "uvicorn server.app:app --host ${RESEARCH_HOST:-0.0.0.0} --port ${PORT:-${RESEARCH_PORT:-8080}}"]

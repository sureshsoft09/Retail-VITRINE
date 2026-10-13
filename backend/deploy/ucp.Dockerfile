FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8082 \
    PYTHONPATH=/app:/app/agents/src:/app/agents/cloud_run_host

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/app/ucp/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend /app/backend
COPY agents /app/agents
COPY shared /app/shared

EXPOSE 8080

CMD exec uvicorn backend.app.ucp.main:app --host 0.0.0.0 --port ${PORT:-8080}

FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir fastapi uvicorn pydantic google-cloud-bigquery google-cloud-firestore httpx pyyaml google-adk

COPY agents /app/agents
COPY backend /app/backend
COPY shared /app/shared

EXPOSE 8080

CMD ["uvicorn", "backend.app.bff.main:app", "--host", "0.0.0.0", "--port", "8080"]

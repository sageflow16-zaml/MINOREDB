FROM python:3.12-slim

# Railway's DOCKERFILE builder passes the *repo root* as the build context
# even when dockerfilePath points to backend/Dockerfile.  All source files
# are therefore under /app/backend/ inside the container (COPY . . copies
# from the repo root, not from backend/).
WORKDIR /app/backend

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "entrypoint.py"]

# Project Minore Docker Guide
## Status: PROPOSED

### 1. Build and Run
```bash
# Build and start services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### 2. Environment Configuration
Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
# Edit .env with appropriate values
```

### 3. Healthchecks
- **Backend**: `http://localhost:8000/docs` (Swagger UI)
- **Database**: Check via `docker-compose ps` to see if `db` is `healthy`.

from typing import Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_url(cls, value: str) -> str:
        host = value.split("@")[-1].split(":")[0] if "@" in value else ""
        if host in ("db",):
            raise ValueError(
                f"DATABASE_URL points to Docker Compose host '{host}' which does not exist "
                "outside docker-compose. Use Railway's DATABASE_URL environment variable."
            )
        # Railway injects postgresql:// without +driver. Only psycopg[binary] (v3) is
        # installed (psycopg2 was removed). Rewrite to postgresql+psycopg:// so
        # SQLAlchemy loads the psycopg (v3) dialect instead of failing with
        # "Can't load plugin: sqlalchemy.dialects:postgresql".
        if value.startswith("postgresql://") and "postgresql+" not in value:
            value = value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    # Port the uvicorn server binds to (Railway injects this dynamically).
    PORT: int = 8000

    # Runtime environment: "development" | "production" | "test"
    ENVIRONMENT: str = "development"

    # CORS: comma-separated list of allowed origins.
    CORS_ORIGINS: str = ""
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: str = "*"
    CORS_ALLOW_HEADERS: str = "*"

    # TrustedHost: comma-separated list of allowed Host headers.
    ALLOWED_HOSTS: str = ""

    # OpenAPI / docs exposure. Disable in production.
    DOCS_ENABLED: bool = True

    # Security headers
    HSTS_ENABLED: bool = False
    HSTS_MAX_AGE: int = 31536000
    HSTS_INCLUDE_SUBDOMAINS: bool = True
    HSTS_PRELOAD: bool = True

    # Rate limiting (in-memory, per client IP). Disabled when 0.
    RATE_LIMIT_PER_MINUTE: int = 0

    # Request body size limits in bytes. 0 = unlimited.
    MAX_REQUEST_SIZE: int = 0
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5 MiB

    # Pagination: hard cap on `limit` query params.
    MAX_PAGE_SIZE: int = 1000

    # JWT authentication
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Optional shared API key for machine-to-machine access
    API_KEY: Optional[str] = None
    WEBHOOK_SECRET: Optional[str] = None

    @field_validator('API_KEY', mode='before')
    def empty_str_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if isinstance(value, str) and not value.strip():
            return None
        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        if origins:
            return origins
        # Default: allow local dev origins and the production Vercel domain.
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://project-minore.vercel.app",
            "https://project-minore-production.up.railway.app",
        ]

    @property
    def allowed_host_list(self) -> list[str]:
        if not self.ALLOWED_HOSTS.strip():
            return []
        return [h.strip() for h in self.ALLOWED_HOSTS.split(",") if h.strip()]

    def clamp_limit(self, limit: int) -> int:
        """Clamp a caller-supplied `limit` to a safe upper bound."""
        if limit is None or limit <= 0:
            return 100
        return min(limit, self.MAX_PAGE_SIZE)


settings = Settings()

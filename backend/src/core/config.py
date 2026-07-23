from typing import Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = ""

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_url(cls, value: str) -> str:
        if not value:
            return value
        host = value.split("@")[-1].split(":")[0] if "@" in value else ""
        if host in ("db",):
            raise ValueError(
                f"DATABASE_URL points to Docker Compose host '{host}' which does not exist "
                "outside docker-compose. Use your DATABASE_URL environment variable (Neon/Render)."
            )
        # Convert bare postgresql:// to postgresql+psycopg:// for SQLAlchemy.
        # psycopg 3 (binary) is the installed driver.
        if value.startswith("postgresql://") and "postgresql+" not in value:
            value = value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    # Port the uvicorn server binds to (Render injects this dynamically).
    PORT: int = 8000

    # Runtime environment: "development" | "production" | "test"
    ENVIRONMENT: str = "development"

    # CORS: comma-separated list of allowed origins.
    CORS_ORIGINS: str = ""
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: str = "GET,POST,PUT,DELETE,PATCH,OPTIONS"
    CORS_ALLOW_HEADERS: str = "Authorization,Content-Type,Accept,X-API-Key,X-Request-ID"

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
    # For production multi-instance deployments, use a shared store (Redis) or gateway limiter.
    RATE_LIMIT_PER_MINUTE: int = 60

    # Request body size limits in bytes. 0 = unlimited.
    MAX_REQUEST_SIZE: int = 10 * 1024 * 1024  # 10 MiB
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5 MiB

    # Pagination: hard cap on `limit` query params.
    MAX_PAGE_SIZE: int = 1000

    # JWT authentication
    # WARNING: JWT_SECRET_KEY must be at least 32 characters and unique per deployment.
    # The default below is INSECURE — always override via environment variable.
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Optional shared API key for machine-to-machine access
    API_KEY: Optional[str] = None
    WEBHOOK_SECRET: Optional[str] = None

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        if value in ("change-me-in-production", "change-me-to-a-random-secret-at-least-32-chars-long", ""):
            import warnings
            warnings.warn(
                "JWT_SECRET_KEY is set to a weak/default value. "
                "Generate a secure key with: openssl rand -hex 32",
                RuntimeWarning,
            )
        return value

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

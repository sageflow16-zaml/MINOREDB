from typing import Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str

    # Port the uvicorn server binds to (Railway injects this dynamically).
    PORT: int = 8000

    # Runtime environment: "development" | "production" | "test"
    ENVIRONMENT: str = "development"

    # CORS: comma-separated list of allowed origins.
    # Never use "*" together with credentials. Leave empty to deny all cross-origin
    # requests (safest default for production).
    CORS_ORIGINS: str = ""
    CORS_ALLOW_CREDENTIALS: bool = False
    CORS_ALLOW_METHODS: str = "GET,POST,PUT,DELETE,OPTIONS"
    CORS_ALLOW_HEADERS: str = "Authorization,Content-Type,Accept"

    # TrustedHost: comma-separated list of allowed Host headers.
    # Empty means "do not enforce" (development convenience). In production set this.
    ALLOWED_HOSTS: str = ""

    # OpenAPI / docs exposure. Disable in production.
    DOCS_ENABLED: bool = True

    # Security headers
    HSTS_ENABLED: bool = False  # enable behind TLS in production
    HSTS_MAX_AGE: int = 31536000
    HSTS_INCLUDE_SUBDOMAINS: bool = True
    HSTS_PRELOAD: bool = True

    # Rate limiting (in-memory, per client IP). Disabled when 0.
    RATE_LIMIT_PER_MINUTE: int = 0

    # Request body size limits in bytes. 0 = unlimited.
    MAX_REQUEST_SIZE: int = 0
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5 MiB

    # Pagination: hard cap on `limit` query params to prevent unbounded result sets.
    MAX_PAGE_SIZE: int = 1000

    # Optional API key. When set, all /api/v1 routes require the
    # `X-API-Key` header to match. When unset, the API is open
    # (backward compatible with existing deployments/tests).
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
        if not self.CORS_ORIGINS.strip():
            return []
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

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

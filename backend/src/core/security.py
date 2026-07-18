import bcrypt
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from src.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def setup_security(app: FastAPI) -> None:
    # --- CORS ---------------------------------------------------------------
    origins = settings.cors_origin_list
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=[m.strip() for m in settings.CORS_ALLOW_METHODS.split(",")],
        allow_headers=[h.strip() for h in settings.CORS_ALLOW_HEADERS.split(",")],
    )

    # --- Trusted Host -------------------------------------------------------
    allowed_hosts = settings.allowed_host_list
    if allowed_hosts:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=allowed_hosts,
        )

    # --- Compression --------------------------------------------------------
    app.add_middleware(GZipMiddleware, minimum_size=1000)
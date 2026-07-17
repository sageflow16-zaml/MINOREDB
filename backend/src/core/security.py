from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from src.core.config import settings


def setup_security(app: FastAPI) -> None:
    # --- CORS ---------------------------------------------------------------
    # Never combine a wildcard origin with credentials (invalid per the CORS
    # spec and a security risk). Origins are explicitly configured per env.
    origins = settings.cors_origin_list
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,  # empty list => no cross-origin access
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=[m.strip() for m in settings.CORS_ALLOW_METHODS.split(",")],
        allow_headers=[h.strip() for h in settings.CORS_ALLOW_HEADERS.split(",")],
    )

    # --- Trusted Host -------------------------------------------------------
    # Only enforce when an explicit allow-list is provided. A wildcard ("*")
    # provides no protection and is therefore not supported.
    allowed_hosts = settings.allowed_host_list
    if allowed_hosts:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=allowed_hosts,
        )

    # --- Compression --------------------------------------------------------
    app.add_middleware(GZipMiddleware, minimum_size=1000)
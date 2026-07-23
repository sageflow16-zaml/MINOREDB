import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

os.environ["VERCEL"] = "1"

from src.core.config import settings

if settings.JWT_SECRET_KEY in ("change-me-in-production", "change-me-to-a-random-secret-at-least-32-chars-long", ""):
    import logging
    logging.warning(
        "JWT_SECRET_KEY is set to a weak/default value. "
        "Generate a secure key with: openssl rand -hex 32"
    )
    if settings.ENVIRONMENT == "production":
        raise RuntimeError(
            "Production environment requires a secure JWT_SECRET_KEY. "
            "Set JWT_SECRET_KEY environment variable to a random value (min 32 chars)."
        )

from src.agents.factory import register_all_agents
register_all_agents()

from src.main import app

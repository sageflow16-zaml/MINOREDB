import json
from typing import Any
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)

def _derive_key(secret: str, salt: bytes | None = None) -> tuple[bytes, bytes]:
    if salt is None:
        salt = os.urandom(16)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=600000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
    return key, salt


def encrypt_credentials(credentials: dict[str, Any], context: str = "") -> dict:
    """Encrypt credentials dict into a Fernet-encrypted JSON blob.
    
    Uses the JWT_SECRET_KEY as the base secret, derived via PBKDF2.
    Returns a dict with the encrypted payload, salt, and context.
    """
    if not credentials:
        return {}
    secret = settings.JWT_SECRET_KEY
    if secret in ("change-me-in-production", ""):
        logger.warning("JWT_SECRET_KEY is weak; broker credential encryption is compromised")
    key, salt = _derive_key(secret + context)
    fernet = Fernet(key)
    plaintext = json.dumps(credentials, default=str).encode()
    encrypted = fernet.encrypt(plaintext)
    return {
        "encrypted": encrypted.decode(),
        "salt": base64.b64encode(salt).decode(),
        "context": context,
    }


def decrypt_credentials(stored: dict | None) -> dict[str, Any]:
    """Decrypt credentials previously encrypted with encrypt_credentials.
    
    Accepts either the encrypted dict structure or returns the input as-is
    (for backward compatibility with plaintext-stored credentials).
    """
    if not stored:
        return {}
    if "encrypted" not in stored:
        if isinstance(stored, dict):
            return stored
        return {}
    try:
        secret = settings.JWT_SECRET_KEY
        salt = base64.b64decode(stored["salt"])
        key, _ = _derive_key(secret + stored.get("context", ""), salt)
        fernet = Fernet(key)
        plaintext = fernet.decrypt(stored["encrypted"].encode())
        return json.loads(plaintext.decode())
    except Exception as e:
        logger.error("Failed to decrypt broker credentials: %s", e)
        return {}

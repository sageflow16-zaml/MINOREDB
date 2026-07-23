from datetime import datetime, timezone
from typing import Any
from src.core.logging import get_logger

audit_logger = get_logger("audit")


SECURITY_EVENTS = frozenset({
    "login",
    "login_failed",
    "logout",
    "register",
    "token_refresh",
    "token_refresh_failed",
    "password_change",
    "api_key_create",
    "api_key_revoke",
    "config_update",
    "data_export",
    "data_import",
    "webhook_rejected",
    "permission_violation",
    "auth_failed",
    "account_disabled",
    "broker_credential_update",
    "plugin_install",
    "plugin_uninstall",
    "rate_limit_exceeded",
})


class AuditEvent:
    __slots__ = ("event", "actor_id", "resource", "details", "ip_address", "user_agent")

    def __init__(
        self,
        event: str,
        actor_id: str | None = None,
        resource: str | None = None,
        details: dict[str, Any] | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        if event not in SECURITY_EVENTS:
            raise ValueError(f"Unknown audit event: {event}")
        self.event = event
        self.actor_id = actor_id
        self.resource = resource
        self.details = details or {}
        self.ip_address = ip_address
        self.user_agent = user_agent


def log_audit(event: AuditEvent) -> None:
    """Log a structured audit event with standard fields."""
    extra = {
        "audit_event": event.event,
        "actor_id": event.actor_id,
        "resource": event.resource,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "details": event.details,
        "ip_address": event.ip_address,
        "user_agent": event.user_agent,
    }
    audit_logger.info(f"audit:{event.event}", extra={"extra_data": extra})

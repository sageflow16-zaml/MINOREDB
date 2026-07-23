from typing import Any
from src.broker.providers.base import BrokerProviderBase
from src.core.logging import get_logger

logger = get_logger(__name__)


class ProviderRegistry:
    """Registry for broker providers."""

    _providers: dict[str, type[BrokerProviderBase]] = {}

    @classmethod
    def register(cls, provider_class: type[BrokerProviderBase]) -> type[BrokerProviderBase]:
        instance = provider_class()
        cls._providers[instance.provider_name] = provider_class
        logger.info("Registered broker provider: %s (%s)", instance.provider_name, instance.display_name)
        return provider_class

    @classmethod
    def get(cls, provider_name: str) -> type[BrokerProviderBase] | None:
        return cls._providers.get(provider_name)

    @classmethod
    def create(cls, provider_name: str, credentials: dict[str, Any] | None = None,
               config: dict[str, Any] | None = None) -> BrokerProviderBase | None:
        provider_cls = cls.get(provider_name)
        if not provider_cls:
            return None
        provider = provider_cls()
        return provider

    @classmethod
    def list_providers(cls) -> list[dict[str, Any]]:
        result = []
        for name, cls_type in cls._providers.items():
            instance = cls_type()
            result.append({
                "name": name,
                "display_name": instance.display_name,
                "icon": instance.icon,
                "required_credentials": instance.required_credentials,
                "optional_credentials": instance.optional_credentials,
                "supports_live_prices": instance.supports_live_prices,
                "supports_streaming": instance.supports_streaming,
            })
        return result

    @classmethod
    def is_registered(cls, provider_name: str) -> bool:
        return provider_name in cls._providers

from datetime import datetime
from typing import Any
from src.broker.providers.base import (
    BrokerProviderBase, ProviderAccount, ProviderTrade,
    ProviderPosition, ProviderOrder, ProviderHealth,
)
from src.core.logging import get_logger

logger = get_logger(__name__)


class DXtradeProvider(BrokerProviderBase):
    def __init__(self):
        self._connected = False
        self._credentials: dict = {}
        self._config: dict = {}

    @property
    def provider_name(self) -> str: return "dxtrade"
    @property
    def display_name(self) -> str: return "DXtrade"
    @property
    def icon(self) -> str: return "dxtrade"
    @property
    def required_credentials(self) -> list[str]: return ["api_key", "api_secret", "base_url"]

    async def connect(self, credentials: dict[str, Any], config: dict[str, Any] | None = None) -> bool:
        self._credentials = credentials
        self._config = config or {}
        try:
            logger.info("DXtrade: Connecting to %s", credentials.get("base_url"))
            self._connected = True
            return True
        except Exception as e:
            logger.error("DXtrade connection failed: %s", e)
            self._connected = False
            return False

    async def disconnect(self) -> bool:
        self._connected = False
        return True

    async def get_accounts(self) -> list[ProviderAccount]:
        return [ProviderAccount(external_id="dx-1", name="DXtrade Live", account_type="live", currency="USD", balance=30000.0, equity=30150.0)]

    async def get_balance(self, account_id: str) -> float: return 30000.0
    async def get_equity(self, account_id: str) -> float: return 30150.0

    async def get_open_positions(self, account_id: str) -> list[ProviderPosition]: return []
    async def get_closed_trades(self, account_id: str, since: datetime | None = None) -> list[ProviderTrade]: return []
    async def get_pending_orders(self, account_id: str) -> list[ProviderOrder]: return []
    async def get_trade_history(self, account_id: str, since: datetime | None = None) -> list[ProviderTrade]: return []

    async def check_health(self) -> ProviderHealth:
        return ProviderHealth(is_reachable=self._connected, latency_ms=20.0)

    async def get_server_time(self) -> datetime | None:
        return datetime.utcnow()

from datetime import datetime
from typing import Any
from src.broker.providers.base import (
    BrokerProviderBase, ProviderAccount, ProviderTrade,
    ProviderPosition, ProviderOrder, ProviderHealth,
)
from src.core.logging import get_logger

logger = get_logger(__name__)


class InteractiveBrokersProvider(BrokerProviderBase):
    def __init__(self):
        self._connected = False
        self._credentials: dict = {}
        self._config: dict = {}

    @property
    def provider_name(self) -> str: return "interactive_brokers"
    @property
    def display_name(self) -> str: return "Interactive Brokers"
    @property
    def icon(self) -> str: return "ibkr"
    @property
    def required_credentials(self) -> list[str]: return ["account_id", "api_key"]
    @property
    def optional_credentials(self) -> list[str]: return ["endpoint", "paper_trading"]
    @property
    def supports_streaming(self) -> bool: return True

    async def connect(self, credentials: dict[str, Any], config: dict[str, Any] | None = None) -> bool:
        self._credentials = credentials
        self._config = config or {}
        try:
            logger.info("IBKR: Connecting to account %s", credentials.get("account_id"))
            self._connected = True
            return True
        except Exception as e:
            logger.error("IBKR connection failed: %s", e)
            self._connected = False
            return False

    async def disconnect(self) -> bool:
        self._connected = False
        return True

    async def get_accounts(self) -> list[ProviderAccount]:
        return [ProviderAccount(external_id=self._credentials.get("account_id", "ib-1"), name="IBKR Account", account_type="live", currency="USD", balance=100000.0, equity=100500.0)]

    async def get_balance(self, account_id: str) -> float: return 100000.0
    async def get_equity(self, account_id: str) -> float: return 100500.0

    async def get_open_positions(self, account_id: str) -> list[ProviderPosition]: return []
    async def get_closed_trades(self, account_id: str, since: datetime | None = None) -> list[ProviderTrade]: return []
    async def get_pending_orders(self, account_id: str) -> list[ProviderOrder]: return []
    async def get_trade_history(self, account_id: str, since: datetime | None = None) -> list[ProviderTrade]: return []

    async def check_health(self) -> ProviderHealth:
        return ProviderHealth(is_reachable=self._connected, latency_ms=25.0)

    async def get_server_time(self) -> datetime | None:
        return datetime.utcnow()

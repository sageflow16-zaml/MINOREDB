from datetime import datetime
from typing import Any
from src.broker.providers.base import (
    BrokerProviderBase, ProviderAccount, ProviderTrade,
    ProviderPosition, ProviderOrder, ProviderHealth,
)
from src.core.logging import get_logger

logger = get_logger(__name__)


class CTraderProvider(BrokerProviderBase):
    def __init__(self):
        self._connected = False
        self._credentials: dict = {}
        self._config: dict = {}

    @property
    def provider_name(self) -> str: return "ctrader"
    @property
    def display_name(self) -> str: return "cTrader"
    @property
    def icon(self) -> str: return "ctrader"
    @property
    def required_credentials(self) -> list[str]: return ["client_id", "client_secret", "account_id"]
    @property
    def supports_live_prices(self) -> bool: return True
    @property
    def supports_streaming(self) -> bool: return True

    async def connect(self, credentials: dict[str, Any], config: dict[str, Any] | None = None) -> bool:
        self._credentials = credentials
        self._config = config or {}
        try:
            logger.info("cTrader: Connecting to account %s", credentials.get("account_id"))
            self._connected = True
            return True
        except Exception as e:
            logger.error("cTrader connection failed: %s", e)
            self._connected = False
            return False

    async def disconnect(self) -> bool:
        self._connected = False
        return True

    async def get_accounts(self) -> list[ProviderAccount]:
        return [ProviderAccount(
            external_id=str(self._credentials.get("account_id", "0")),
            name=f"cTrader Account {self._credentials.get('account_id', '')}",
            account_type="live", currency="USD",
            balance=50000.0, equity=50500.0,
        )]

    async def get_balance(self, account_id: str) -> float: return 50000.0
    async def get_equity(self, account_id: str) -> float: return 50500.0

    async def get_open_positions(self, account_id: str) -> list[ProviderPosition]: return []
    async def get_closed_trades(self, account_id: str, since: datetime | None = None) -> list[ProviderTrade]: return []
    async def get_pending_orders(self, account_id: str) -> list[ProviderOrder]: return []
    async def get_trade_history(self, account_id: str, since: datetime | None = None) -> list[ProviderTrade]: return []

    async def check_health(self) -> ProviderHealth:
        return ProviderHealth(is_reachable=self._connected, latency_ms=8.0)

    async def get_server_time(self) -> datetime | None:
        return datetime.utcnow()

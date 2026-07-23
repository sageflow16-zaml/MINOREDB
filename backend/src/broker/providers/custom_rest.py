from datetime import datetime
from typing import Any
from src.broker.providers.base import (
    BrokerProviderBase, ProviderAccount, ProviderTrade,
    ProviderPosition, ProviderOrder, ProviderHealth,
)
from src.core.logging import get_logger

logger = get_logger(__name__)


class CustomRESTProvider(BrokerProviderBase):
    def __init__(self):
        self._connected = False
        self._credentials: dict = {}
        self._config: dict = {}
        self._client: Any = None

    @property
    def provider_name(self) -> str: return "custom_rest"
    @property
    def display_name(self) -> str: return "Custom REST API"
    @property
    def icon(self) -> str: return "api"
    @property
    def required_credentials(self) -> list[str]: return ["base_url", "api_key"]
    @property
    def optional_credentials(self) -> list[str]: return ["api_secret", "headers"]

    async def connect(self, credentials: dict[str, Any], config: dict[str, Any] | None = None) -> bool:
        import httpx
        self._credentials = credentials
        self._config = config or {}
        try:
            headers = {"Authorization": f"Bearer {credentials.get('api_key', '')}"}
            extra_headers = credentials.get("headers", {})
            if isinstance(extra_headers, dict):
                headers.update(extra_headers)
            self._client = httpx.AsyncClient(base_url=credentials.get("base_url", ""), headers=headers, timeout=30)
            logger.info("CustomREST: Connecting to %s", credentials.get("base_url"))
            self._connected = True
            return True
        except Exception as e:
            logger.error("CustomREST connection failed: %s", e)
            self._connected = False
            return False

    async def disconnect(self) -> bool:
        if self._client:
            await self._client.aclose()
        self._connected = False
        return True

    async def get_accounts(self) -> list[ProviderAccount]:
        if not self._client: return []
        try:
            resp = await self._client.get("/accounts")
            data = resp.json()
            accounts = data if isinstance(data, list) else data.get("accounts", [])
            return [ProviderAccount(
                external_id=a.get("id", ""),
                name=a.get("name", "Account"),
                account_type=a.get("type", "live"),
                currency=a.get("currency", "USD"),
                balance=float(a.get("balance", 0)),
                equity=float(a.get("equity", 0)),
            ) for a in accounts]
        except Exception as e:
            logger.error("CustomREST get_accounts failed: %s", e)
            return []

    async def get_balance(self, account_id: str) -> float:
        return 0.0

    async def get_equity(self, account_id: str) -> float:
        return 0.0

    async def get_open_positions(self, account_id: str) -> list[ProviderPosition]:
        if not self._client: return []
        try:
            resp = await self._client.get(f"/accounts/{account_id}/positions")
            data = resp.json()
            positions = data if isinstance(data, list) else data.get("positions", [])
            return [ProviderPosition(
                external_id=p.get("id", ""),
                symbol=p.get("symbol", ""),
                position_type=p.get("type", "buy"),
                volume=float(p.get("volume", 0)),
                open_price=float(p.get("openPrice", 0)),
                current_price=float(p.get("currentPrice", 0)) if p.get("currentPrice") else None,
                profit=float(p.get("profit", 0)),
            ) for p in positions]
        except Exception as e:
            logger.error("CustomREST get_open_positions failed: %s", e)
            return []

    async def get_closed_trades(self, account_id: str, since: datetime | None = None) -> list[ProviderTrade]:
        if not self._client: return []
        try:
            params = {}
            if since: params["since"] = since.isoformat()
            resp = await self._client.get(f"/accounts/{account_id}/trades", params=params)
            data = resp.json()
            trades = data if isinstance(data, list) else data.get("trades", [])
            return [ProviderTrade(
                external_id=t.get("id", ""),
                symbol=t.get("symbol", ""),
                trade_type=t.get("type", "buy"),
                volume=float(t.get("volume", 0)),
                open_price=float(t.get("openPrice", 0)) if t.get("openPrice") else None,
                close_price=float(t.get("closePrice", 0)) if t.get("closePrice") else None,
                profit=float(t.get("profit", 0)),
                commission=float(t.get("commission", 0)),
                swap=float(t.get("swap", 0)),
            ) for t in trades]
        except Exception as e:
            logger.error("CustomREST get_closed_trades failed: %s", e)
            return []

    async def get_pending_orders(self, account_id: str) -> list[ProviderOrder]:
        if not self._client: return []
        try:
            resp = await self._client.get(f"/accounts/{account_id}/orders")
            data = resp.json()
            orders = data if isinstance(data, list) else data.get("orders", [])
            return [ProviderOrder(
                external_id=o.get("id", ""),
                symbol=o.get("symbol", ""),
                order_type=o.get("type", "limit"),
                volume=float(o.get("volume", 0)),
                price=float(o.get("price", 0)) if o.get("price") else None,
                order_status=o.get("status", "pending"),
            ) for o in orders]
        except Exception as e:
            logger.error("CustomREST get_pending_orders failed: %s", e)
            return []

    async def get_trade_history(self, account_id: str, since: datetime | None = None) -> list[ProviderTrade]:
        return await self.get_closed_trades(account_id, since)

    async def check_health(self) -> ProviderHealth:
        if not self._client:
            return ProviderHealth(is_reachable=False, error_message="Not connected")
        try:
            start = datetime.utcnow()
            resp = await self._client.get("/health", timeout=5)
            elapsed = (datetime.utcnow() - start).total_seconds() * 1000
            return ProviderHealth(is_reachable=resp.status_code < 500, latency_ms=elapsed)
        except Exception as e:
            return ProviderHealth(is_reachable=False, error_message=str(e))

    async def get_server_time(self) -> datetime | None:
        return datetime.utcnow()

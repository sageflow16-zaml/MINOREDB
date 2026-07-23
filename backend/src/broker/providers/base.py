from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class ProviderAccount:
    external_id: str
    name: str
    account_type: str | None = None
    currency: str = "USD"
    leverage: int | None = None
    balance: float = 0.0
    equity: float = 0.0
    open_pl: float = 0.0
    used_margin: float = 0.0
    free_margin: float = 0.0
    margin_level: float | None = None


@dataclass
class ProviderTrade:
    external_id: str
    symbol: str
    trade_type: str
    volume: float = 0.0
    open_price: float | None = None
    close_price: float | None = None
    open_time: datetime | None = None
    close_time: datetime | None = None
    profit: float = 0.0
    commission: float = 0.0
    swap: float = 0.0
    magic_number: int | None = None
    comment: str | None = None
    stop_loss: float | None = None
    take_profit: float | None = None
    raw_data: dict | None = None


@dataclass
class ProviderPosition:
    external_id: str
    symbol: str
    position_type: str
    volume: float = 0.0
    open_price: float = 0.0
    current_price: float | None = None
    open_time: datetime | None = None
    profit: float = 0.0
    commission: float = 0.0
    swap: float = 0.0
    stop_loss: float | None = None
    take_profit: float | None = None
    magic_number: int | None = None
    comment: str | None = None
    raw_data: dict | None = None


@dataclass
class ProviderOrder:
    external_id: str
    symbol: str
    order_type: str
    volume: float = 0.0
    price: float | None = None
    stop_price: float | None = None
    order_status: str = "pending"
    created_time: datetime | None = None
    expiration: datetime | None = None
    comment: str | None = None
    raw_data: dict | None = None


@dataclass
class ProviderHealth:
    is_reachable: bool = True
    latency_ms: float | None = None
    error_message: str | None = None
    details: dict | None = None


class BrokerProviderBase(ABC):
    """Abstract base class for all broker providers."""

    @abstractmethod
    async def connect(self, credentials: dict[str, Any], config: dict[str, Any] | None = None) -> bool:
        """Establish connection to the broker."""

    @abstractmethod
    async def disconnect(self) -> bool:
        """Close the connection."""

    @abstractmethod
    async def get_accounts(self) -> list[ProviderAccount]:
        """Fetch all trading accounts."""

    @abstractmethod
    async def get_balance(self, account_id: str) -> float:
        """Get current balance for an account."""

    @abstractmethod
    async def get_equity(self, account_id: str) -> float:
        """Get current equity for an account."""

    @abstractmethod
    async def get_open_positions(self, account_id: str) -> list[ProviderPosition]:
        """Fetch open positions."""

    @abstractmethod
    async def get_closed_trades(self, account_id: str, since: datetime | None = None) -> list[ProviderTrade]:
        """Fetch closed/historical trades."""

    @abstractmethod
    async def get_pending_orders(self, account_id: str) -> list[ProviderOrder]:
        """Fetch pending orders."""

    @abstractmethod
    async def get_trade_history(self, account_id: str, since: datetime | None = None) -> list[ProviderTrade]:
        """Fetch complete trade history."""

    @abstractmethod
    async def check_health(self) -> ProviderHealth:
        """Check if the broker is reachable and responsive."""

    @abstractmethod
    async def get_server_time(self) -> datetime | None:
        """Get the broker server time."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Unique provider identifier."""

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable provider name."""

    @property
    @abstractmethod
    def icon(self) -> str:
        """Provider icon identifier."""

    @property
    def required_credentials(self) -> list[str]:
        """List of required credential field names."""
        return []

    @property
    def optional_credentials(self) -> list[str]:
        """List of optional credential field names."""
        return []

    @property
    def supports_live_prices(self) -> bool:
        return False

    @property
    def supports_streaming(self) -> bool:
        return False

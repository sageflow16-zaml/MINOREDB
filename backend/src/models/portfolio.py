from datetime import datetime
from uuid import UUID, uuid4
from decimal import Decimal
from sqlalchemy import String, Float, DateTime, Boolean, Integer, Text, Numeric, text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from src.db.session import Base
import enum


class AccountType(str, enum.Enum):
    PERSONAL = "personal"
    PROP_FIRM = "prop_firm"
    EVALUATION = "evaluation"
    LIVE = "live"
    DEMO = "demo"


class AccountStatus(str, enum.Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    CLOSED = "closed"
    SUSPENDED = "suspended"
    PENDING = "pending"


class BrokerPlatform(str, enum.Enum):
    MT4 = "mt4"
    MT5 = "mt5"
    CTRADER = "ctrader"
    TRADINGVIEW = "tradingview"
    NINJATRADER = "ninjatrader"
    TRADESTATION = "tradestation"
    IBKR = "ibkr"
    CUSTOM = "custom"


class ExecutionModel(str, enum.Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    DMA = "dma"
    STP = "stp"
    ECN = "ecn"


class CommissionModel(str, enum.Enum):
    PER_LOT = "per_lot"
    PER_TRADE = "per_trade"
    PER_SHARE = "per_share"
    PER_CONTRACT = "per_contract"
    NONE = "none"


class AllocationType(str, enum.Enum):
    FIXED = "fixed"
    PERCENTAGE = "percentage"
    TARGET = "target"
    RISK_BUDGET = "risk_budget"


class TransferType(str, enum.Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"
    FUNDING = "funding"
    WITHDRAWAL = "withdrawal"


class GoalStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    AT_RISK = "at_risk"
    FAILED = "failed"
    PAUSED = "paused"


class GoalMetric(str, enum.Enum):
    PORTFOLIO_GROWTH = "portfolio_growth"
    ACCOUNT_GROWTH = "account_growth"
    MONTHLY_PROFIT = "monthly_profit"
    ANNUAL_RETURN = "annual_return"
    MAX_DRAWDOWN = "max_drawdown"
    RISK_CONSISTENCY = "risk_consistency"
    WIN_RATE = "win_rate"
    PROFIT_FACTOR = "profit_factor"
    EXPECTANCY = "expectancy"


class RuleSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# ── Broker Profile ──

class BrokerProfile(Base):
    __tablename__ = "broker_profile"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    broker_name: Mapped[str] = mapped_column(String, nullable=False)
    server: Mapped[str | None] = mapped_column(String, nullable=True)
    platform: Mapped[BrokerPlatform] = mapped_column(SAEnum(BrokerPlatform, values_callable=lambda x: [e.value for e in x]), nullable=False)
    account_number: Mapped[str | None] = mapped_column(String, nullable=True)
    base_currency: Mapped[str] = mapped_column(String, default="USD")

    spread_profile: Mapped[str | None] = mapped_column(String, nullable=True)
    commission_model: Mapped[CommissionModel] = mapped_column(SAEnum(CommissionModel, values_callable=lambda x: [e.value for e in x]), default=CommissionModel.NONE)
    commission_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    swap_long: Mapped[float | None] = mapped_column(Float, nullable=True)
    swap_short: Mapped[float | None] = mapped_column(Float, nullable=True)
    execution_model: Mapped[ExecutionModel] = mapped_column(SAEnum(ExecutionModel, values_callable=lambda x: [e.value for e in x]), default=ExecutionModel.MARKET)

    trading_costs: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


# ── Account ──

class Account(Base):
    __tablename__ = "account"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    broker_profile_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("broker_profile.id", ondelete="SET NULL"), nullable=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    account_number: Mapped[str | None] = mapped_column(String, nullable=True)
    account_type: Mapped[AccountType] = mapped_column(SAEnum(AccountType, values_callable=lambda x: [e.value for e in x]), default=AccountType.PERSONAL)
    status: Mapped[AccountStatus] = mapped_column(SAEnum(AccountStatus, values_callable=lambda x: [e.value for e in x]), default=AccountStatus.ACTIVE)

    currency: Mapped[str] = mapped_column(String, default="USD")
    leverage: Mapped[int | None] = mapped_column(Integer, nullable=True)
    initial_balance: Mapped[float] = mapped_column(Float, default=0.0)
    current_balance: Mapped[float] = mapped_column(Float, default=0.0)
    current_equity: Mapped[float] = mapped_column(Float, default=0.0)
    open_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    used_margin: Mapped[float] = mapped_column(Float, default=0.0)
    free_margin: Mapped[float] = mapped_column(Float, default=0.0)
    margin_level: Mapped[float | None] = mapped_column(Float, nullable=True)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)


class AccountGroup(Base):
    __tablename__ = "account_group"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str | None] = mapped_column(String, nullable=True)
    account_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)


# ── Funding / Balance / Equity History ──

class FundingHistory(Base):
    __tablename__ = "funding_history"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("account.id", ondelete="CASCADE"), nullable=False)

    event_type: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String, default="USD")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reference: Mapped[str | None] = mapped_column(String, nullable=True)
    balance_after: Mapped[float | None] = mapped_column(Float, nullable=True)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)


class BalanceHistory(Base):
    __tablename__ = "balance_history"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("account.id", ondelete="CASCADE"), nullable=False)

    balance: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str | None] = mapped_column(String, nullable=True)


class EquityHistory(Base):
    __tablename__ = "equity_history"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("account.id", ondelete="CASCADE"), nullable=False)

    equity: Mapped[float] = mapped_column(Float, nullable=False)
    balance: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str | None] = mapped_column(String, nullable=True)


# ── Portfolio Allocation ──

class PortfolioAllocation(Base):
    __tablename__ = "portfolio_allocation"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    allocation_type: Mapped[AllocationType] = mapped_column(SAEnum(AllocationType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    entity_type: Mapped[str] = mapped_column(String, nullable=False)
    entity_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    entity_name: Mapped[str | None] = mapped_column(String, nullable=True)

    target_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_amount: Mapped[float | None] = mapped_column(Float, nullable=True)

    risk_budget: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_allocation: Mapped[float | None] = mapped_column(Float, nullable=True)
    min_allocation: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    rebalance_frequency: Mapped[str | None] = mapped_column(String, nullable=True)
    last_rebalanced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


# ── Transfers ──

class Transfer(Base):
    __tablename__ = "transfer"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    transfer_type: Mapped[TransferType] = mapped_column(SAEnum(TransferType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    from_account_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("account.id", ondelete="SET NULL"), nullable=True)
    to_account_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("account.id", ondelete="SET NULL"), nullable=True)

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String, default="USD")
    converted_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    exchange_rate: Mapped[float | None] = mapped_column(Float, nullable=True)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reference: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="completed")
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)


# ── Goals ──

class Goal(Base):
    __tablename__ = "portfolio_goal"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("account.id", ondelete="CASCADE"), nullable=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    metric: Mapped[GoalMetric] = mapped_column(SAEnum(GoalMetric, values_callable=lambda x: [e.value for e in x]), nullable=False)
    target_value: Mapped[float] = mapped_column(Float, nullable=False)
    current_value: Mapped[float] = mapped_column(Float, default=0.0)
    start_value: Mapped[float] = mapped_column(Float, default=0.0)

    status: Mapped[GoalStatus] = mapped_column(SAEnum(GoalStatus, values_callable=lambda x: [e.value for e in x]), default=GoalStatus.ACTIVE)
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    progress: Mapped[float] = mapped_column(Float, default=0.0)

    category: Mapped[str | None] = mapped_column(String, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)

    is_portfolio_goal: Mapped[bool] = mapped_column(Boolean, default=False)


# ── Account Health ──

class AccountHealth(Base):
    __tablename__ = "account_health"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("account.id", ondelete="CASCADE"), nullable=False)

    margin_usage: Mapped[float | None] = mapped_column(Float, nullable=True)
    drawdown_current: Mapped[float | None] = mapped_column(Float, nullable=True)
    drawdown_limit: Mapped[float | None] = mapped_column(Float, nullable=True)
    daily_loss_current: Mapped[float | None] = mapped_column(Float, nullable=True)
    daily_loss_limit: Mapped[float | None] = mapped_column(Float, nullable=True)
    trailing_drawdown: Mapped[float | None] = mapped_column(Float, nullable=True)
    trailing_drawdown_limit: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_loss: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_loss_limit: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_daily_loss: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_daily_loss_limit: Mapped[float | None] = mapped_column(Float, nullable=True)
    violation_count: Mapped[int] = mapped_column(Integer, default=0)
    last_violation_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    health_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)


# ── Account Rules (Prop Firm / Custom) ──

class AccountRule(Base):
    __tablename__ = "account_rule"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("account.id", ondelete="CASCADE"), nullable=False)

    rule_type: Mapped[str] = mapped_column(String, nullable=False)
    rule_name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[RuleSeverity] = mapped_column(SAEnum(RuleSeverity, values_callable=lambda x: [e.value for e in x]), default=RuleSeverity.MEDIUM)
    threshold_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_violated: Mapped[bool] = mapped_column(Boolean, default=False)
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)


# ── Account Notes ──

class AccountNote(Base):
    __tablename__ = "account_note"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("account.id", ondelete="CASCADE"), nullable=False)

    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)


# ── Portfolio Snapshot ──

class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshot"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    total_balance: Mapped[float] = mapped_column(Float, nullable=False)
    total_equity: Mapped[float] = mapped_column(Float, nullable=False)
    total_open_pnl: Mapped[float] = mapped_column(Float, nullable=False)
    total_used_margin: Mapped[float] = mapped_column(Float, nullable=False)
    total_free_margin: Mapped[float] = mapped_column(Float, nullable=False)
    daily_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    weekly_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    monthly_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    total_deposits: Mapped[float] = mapped_column(Float, default=0.0)
    total_withdrawals: Mapped[float] = mapped_column(Float, default=0.0)
    account_count: Mapped[int] = mapped_column(Integer, default=0)
    active_account_count: Mapped[int] = mapped_column(Integer, default=0)

    snapshot_breakdown: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)

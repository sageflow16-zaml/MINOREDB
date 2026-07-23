from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional


class StrategyBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    market: Optional[str] = None
    instrument_types: Optional[list[str]] = None
    timeframes: Optional[list[str]] = None
    version: Optional[str] = "1.0.0"
    status: Optional[str] = "Draft"

    market_bias: Optional[str] = None
    entry_conditions: Optional[dict] = None
    confirmation_rules: Optional[list[str]] = None
    invalidation_rules: Optional[list[str]] = None
    exit_rules: Optional[dict] = None
    risk_rules: Optional[dict] = None

    entry_model: Optional[str] = None
    stop_loss_model: Optional[str] = None
    take_profit_model: Optional[str] = None
    partial_close_rules: Optional[list[str]] = None
    trade_management_rules: Optional[list[str]] = None

    preferred_sessions: Optional[list[str]] = None
    preferred_market_conditions: Optional[str] = None
    volatility_requirements: Optional[str] = None
    news_restrictions: Optional[str] = None

    required_mindset: Optional[str] = None
    discipline_rules: Optional[list[str]] = None
    common_mistakes: Optional[list[str]] = None
    things_to_avoid: Optional[list[str]] = None

    checklist_items: Optional[list[dict]] = None
    documentation: Optional[str] = None
    tags: Optional[list[str]] = None
    author: Optional[str] = None
    change_log: Optional[list[dict]] = None


class StrategyCreate(StrategyBase):
    name: str


class StrategyUpdate(StrategyBase):
    pass


class StrategyRead(StrategyBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    trades_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class StrategyVersionRead(BaseModel):
    id: UUID
    created_at: datetime
    strategy_id: UUID
    project_id: UUID
    version: Optional[str] = None
    change_log: Optional[str] = None
    snapshot: Optional[dict] = None
    author: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class StrategyVersionCreate(BaseModel):
    version: str
    change_log: Optional[str] = None
    author: Optional[str] = None


class StrategyAnalytics(BaseModel):
    strategy_id: UUID
    total_trades: int = 0
    wins: int = 0
    losses: int = 0
    breakevens: int = 0
    win_rate: float = 0.0
    total_pnl: float = 0.0
    avg_pnl: float = 0.0
    avg_win: float = 0.0
    avg_loss: float = 0.0
    avg_rr: float = 0.0
    expectancy: float = 0.0
    profit_factor: float = 0.0
    max_drawdown: float = 0.0
    sharpe_ratio: float = 0.0
    avg_holding_time: Optional[int] = None
    best_session: Optional[str] = None
    worst_session: Optional[str] = None
    best_pair: Optional[str] = None
    worst_pair: Optional[str] = None
    monthly_performance: Optional[dict] = None
    equity_curve: Optional[list[dict]] = None
    distribution: Optional[list[dict]] = None
    session_analysis: Optional[list[dict]] = None
    pair_analysis: Optional[list[dict]] = None

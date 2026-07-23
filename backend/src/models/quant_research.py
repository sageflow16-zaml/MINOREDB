from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, DateTime, Boolean, Integer, Text, text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base
import enum


class ExperimentStatus(str, enum.Enum):
    DRAFT = "draft"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class BacktestStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class HypothesisStatus(str, enum.Enum):
    PROPOSED = "proposed"
    TESTING = "testing"
    SUPPORTED = "supported"
    REJECTED = "rejected"
    INCONCLUSIVE = "inconclusive"


class Experiment(Base):
    __tablename__ = "quant_experiment"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ExperimentStatus] = mapped_column(SAEnum(ExperimentStatus, values_callable=lambda x: [e.value for e in x]), default=ExperimentStatus.DRAFT, nullable=False)
    hypothesis: Mapped[str | None] = mapped_column(Text, nullable=True)
    hypothesis_status: Mapped[HypothesisStatus | None] = mapped_column(SAEnum(HypothesisStatus, values_callable=lambda x: [e.value for e in x]), nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    config: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    results_summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    linked_strategy_ids: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    linked_trade_ids: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    linked_research_ids: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    parent_experiment_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    backtest_runs = relationship("BacktestRun", back_populates="experiment", cascade="all, delete-orphan")
    simulation_runs = relationship("SimulationRun", back_populates="experiment", cascade="all, delete-orphan")
    optimization_runs = relationship("OptimizationRun", back_populates="experiment", cascade="all, delete-orphan")
    walkforward_runs = relationship("WalkForwardRun", back_populates="experiment", cascade="all, delete-orphan")
    edge_health_snapshots = relationship("EdgeHealthSnapshot", back_populates="experiment", cascade="all, delete-orphan")
    notebook_entries = relationship("ResearchNotebook", back_populates="experiment", cascade="all, delete-orphan")


class BacktestRun(Base):
    __tablename__ = "quant_backtest_run"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    experiment_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("quant_experiment.id", ondelete="CASCADE"), nullable=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[BacktestStatus] = mapped_column(SAEnum(BacktestStatus, values_callable=lambda x: [e.value for e in x]), default=BacktestStatus.PENDING, nullable=False)
    strategy_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    backtest_type: Mapped[str] = mapped_column(String, nullable=False, default="single")  # single, multi, portfolio, multi_asset, multi_timeframe

    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    filters: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    costs: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)

    start_date: Mapped[str] = mapped_column(String, nullable=False)
    end_date: Mapped[str] = mapped_column(String, nullable=False)
    symbols: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    timeframes: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    total_trades: Mapped[int | None] = mapped_column(Integer, nullable=True)
    win_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    profit_factor: Mapped[float | None] = mapped_column(Float, nullable=True)
    net_profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    gross_profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    gross_loss: Mapped[float | None] = mapped_column(Float, nullable=True)
    sharpe_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    sortino_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    calmar_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_drawdown: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_drawdown_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_drawdown: Mapped[float | None] = mapped_column(Float, nullable=True)
    recovery_factor: Mapped[float | None] = mapped_column(Float, nullable=True)
    expectancy: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_rr: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_win: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_loss: Mapped[float | None] = mapped_column(Float, nullable=True)
    largest_win: Mapped[float | None] = mapped_column(Float, nullable=True)
    largest_loss: Mapped[float | None] = mapped_column(Float, nullable=True)
    std_dev: Mapped[float | None] = mapped_column(Float, nullable=True)
    variance: Mapped[float | None] = mapped_column(Float, nullable=True)
    z_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_interval: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    p_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    sample_size_adequacy: Mapped[float | None] = mapped_column(Float, nullable=True)
    edge_stability: Mapped[float | None] = mapped_column(Float, nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    equity_curve: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    drawdown_curve: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    monthly_returns: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    trade_distribution: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    regime_performance: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    rolling_metrics: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    parameters_used: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)

    experiment = relationship("Experiment", back_populates="backtest_runs")
    trades = relationship("BacktestTrade", back_populates="backtest_run", cascade="all, delete-orphan")
    regime_performances = relationship("RegimePerformance", back_populates="backtest_run", cascade="all, delete-orphan")


class BacktestTrade(Base):
    __tablename__ = "quant_backtest_trade"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    backtest_run_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("quant_backtest_run.id", ondelete="CASCADE"), nullable=False)

    entry_date: Mapped[str] = mapped_column(String, nullable=False)
    exit_date: Mapped[str | None] = mapped_column(String, nullable=True)
    symbol: Mapped[str] = mapped_column(String, nullable=False)
    direction: Mapped[str] = mapped_column(String, nullable=False)  # long, short
    entry_price: Mapped[float] = mapped_column(Float, nullable=False)
    exit_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    pnl: Mapped[float | None] = mapped_column(Float, nullable=True)
    pnl_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    rr: Mapped[float | None] = mapped_column(Float, nullable=True)
    fees: Mapped[float] = mapped_column(Float, default=0.0)
    slippage: Mapped[float] = mapped_column(Float, default=0.0)
    exit_reason: Mapped[str | None] = mapped_column(String, nullable=True)  # tp, sl, exit_signal, trailing_stop
    regime_at_entry: Mapped[str | None] = mapped_column(String, nullable=True)
    regime_at_exit: Mapped[str | None] = mapped_column(String, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)

    backtest_run = relationship("BacktestRun", back_populates="trades")


class SimulationRun(Base):
    __tablename__ = "quant_simulation_run"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    experiment_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("quant_experiment.id", ondelete="CASCADE"), nullable=True)
    backtest_run_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("quant_backtest_run.id", ondelete="SET NULL"), nullable=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    simulation_type: Mapped[str] = mapped_column(String, nullable=False)  # monte_carlo, bootstrap, trade_randomization, risk_randomization, execution_randomization, slippage, spread, capital
    status: Mapped[BacktestStatus] = mapped_column(SAEnum(BacktestStatus, values_callable=lambda x: [e.value for e in x]), default=BacktestStatus.PENDING, nullable=False)

    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    num_simulations: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    random_seed: Mapped[int | None] = mapped_column(Integer, nullable=True)

    results: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    percentiles: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    confidence_intervals: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    equity_curves: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    distribution: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    experiment = relationship("Experiment", back_populates="simulation_runs")


class WalkForwardRun(Base):
    __tablename__ = "quant_walk_forward_run"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    experiment_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("quant_experiment.id", ondelete="CASCADE"), nullable=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[BacktestStatus] = mapped_column(SAEnum(BacktestStatus, values_callable=lambda x: [e.value for e in x]), default=BacktestStatus.PENDING, nullable=False)

    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    training_window: Mapped[int] = mapped_column(Integer, nullable=False)
    validation_window: Mapped[int] = mapped_column(Integer, nullable=False)
    step_size: Mapped[int] = mapped_column(Integer, nullable=False)

    windows: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    aggregate_metrics: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    stability_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    oos_performance: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    parameter_stability: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    experiment = relationship("Experiment", back_populates="walkforward_runs")


class OptimizationRun(Base):
    __tablename__ = "quant_optimization_run"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    experiment_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("quant_experiment.id", ondelete="CASCADE"), nullable=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    optimization_type: Mapped[str] = mapped_column(String, nullable=False)  # grid, random, bayesian, multi_objective
    status: Mapped[BacktestStatus] = mapped_column(SAEnum(BacktestStatus, values_callable=lambda x: [e.value for e in x]), default=BacktestStatus.PENDING, nullable=False)

    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    parameters: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    constraints: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    objective: Mapped[str] = mapped_column(String, nullable=False, default="sharpe_ratio")
    maximize: Mapped[bool] = mapped_column(Boolean, default=True)

    total_combinations: Mapped[int | None] = mapped_column(Integer, nullable=True)
    results: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    best_result: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    heatmap_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    convergence_curve: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    experiment = relationship("Experiment", back_populates="optimization_runs")


class EdgeHealthSnapshot(Base):
    __tablename__ = "quant_edge_health_snapshot"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    experiment_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("quant_experiment.id", ondelete="CASCADE"), nullable=True)

    snapshot_date: Mapped[str] = mapped_column(String, nullable=False)
    edge_stability: Mapped[float | None] = mapped_column(Float, nullable=True)
    performance_drift: Mapped[float | None] = mapped_column(Float, nullable=True)
    parameter_drift: Mapped[float | None] = mapped_column(Float, nullable=True)
    strategy_degradation: Mapped[float | None] = mapped_column(Float, nullable=True)
    drawdown_severity: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_decay: Mapped[float | None] = mapped_column(Float, nullable=True)
    overall_health: Mapped[float | None] = mapped_column(Float, nullable=True)
    metrics: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    signals: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    recommendations: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    experiment = relationship("Experiment", back_populates="edge_health_snapshots")


class RegimePerformance(Base):
    __tablename__ = "quant_regime_performance"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    backtest_run_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("quant_backtest_run.id", ondelete="CASCADE"), nullable=False)

    regime: Mapped[str] = mapped_column(String, nullable=False)
    num_trades: Mapped[int] = mapped_column(Integer, default=0)
    win_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    profit_factor: Mapped[float | None] = mapped_column(Float, nullable=True)
    net_profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_rr: Mapped[float | None] = mapped_column(Float, nullable=True)
    sharpe_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_drawdown: Mapped[float | None] = mapped_column(Float, nullable=True)
    expectancy: Mapped[float | None] = mapped_column(Float, nullable=True)

    backtest_run = relationship("BacktestRun", back_populates="regime_performances")


class ResearchNotebook(Base):
    __tablename__ = "quant_research_notebook"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    experiment_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("quant_experiment.id", ondelete="CASCADE"), nullable=True)

    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_type: Mapped[str] = mapped_column(String, nullable=False, default="markdown")  # markdown, chart, table, code, observation, conclusion
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    attachments: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    linked_run_ids: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    experiment = relationship("Experiment", back_populates="notebook_entries")


class HypothesisTestResult(Base):
    __tablename__ = "quant_hypothesis_test"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    experiment_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("quant_experiment.id", ondelete="CASCADE"), nullable=True)

    hypothesis: Mapped[str] = mapped_column(Text, nullable=False)
    test_type: Mapped[str] = mapped_column(String, nullable=False, default="backtest")  # backtest, simulation, statistical, walk_forward, optimization
    result: Mapped[str] = mapped_column(String, nullable=False, default="inconclusive")  # supported, rejected, inconclusive
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    test_statistics: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    supporting_evidence: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    experiment = relationship("Experiment")

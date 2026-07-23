from datetime import datetime, timezone
from uuid import UUID, uuid4
from sqlalchemy import String, Float, DateTime, Boolean, JSON, ForeignKey, Integer, Text, Enum as SAEnum
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from src.db.session import Base as BrainBase
import enum

# BrainBase reuses the main Base so ForeignKey references (e.g. "project.id") resolve correctly


class MemoryType(str, enum.Enum):
    trade = "trade"
    journal = "journal"
    strategy = "strategy"
    replay = "replay"
    research = "research"
    psychology = "psychology"
    lesson = "lesson"
    conversation = "conversation"
    learning = "learning"


class MemoryImportance(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class ReasoningStep(str, enum.Enum):
    market_regime = "market_regime"
    ict_structure = "ict_structure"
    liquidity = "liquidity"
    session = "session"
    economic_calendar = "economic_calendar"
    dxy = "dxy"
    bonds = "bonds"
    similar_trades = "similar_trades"
    strategy_rules = "strategy_rules"
    journal = "journal"
    replay = "replay"
    psychology = "psychology"
    risk_rules = "risk_rules"
    statistics = "statistics"
    research = "research"
    knowledge_graph = "knowledge_graph"
    dna = "dna"
    learning = "learning"
    coaching = "coaching"


class DecisionVerdict(str, enum.Enum):
    strong_buy = "strong_buy"
    buy = "buy"
    neutral = "neutral"
    sell = "sell"
    strong_sell = "strong_sell"
    wait = "wait"
    skip = "skip"


class InsightCategory(str, enum.Enum):
    behavior = "behavior"
    psychology = "psychology"
    execution = "execution"
    risk = "risk"
    session = "session"
    strategy = "strategy"
    learning = "learning"
    performance = "performance"
    discipline = "discipline"


class CoachingType(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    execution = "execution"
    psychology = "psychology"
    risk = "risk"


# ── Trader DNA ──


class TraderDNA(BrainBase):
    __tablename__ = "trader_dna"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    # Trading Style
    trading_style: Mapped[str | None] = mapped_column(String, default=None)
    preferred_session: Mapped[str | None] = mapped_column(String, default=None)
    preferred_markets: Mapped[dict | None] = mapped_column(JSON, default=list)
    preferred_rr: Mapped[float | None] = mapped_column(Float, default=None)
    preferred_timeframes: Mapped[dict | None] = mapped_column(JSON, default=list)

    # Best/Worst Models
    best_models: Mapped[dict | None] = mapped_column(JSON, default=list)
    worst_models: Mapped[dict | None] = mapped_column(JSON, default=list)
    best_timeframe: Mapped[str | None] = mapped_column(String, default=None)
    worst_timeframe: Mapped[str | None] = mapped_column(String, default=None)
    best_holding_time: Mapped[int | None] = mapped_column(Integer, default=None)
    best_execution_window: Mapped[str | None] = mapped_column(String, default=None)

    # Behavior
    risk_behavior: Mapped[str | None] = mapped_column(String, default=None)
    discipline_score: Mapped[float | None] = mapped_column(Float, default=50.0)
    psychology_score: Mapped[float | None] = mapped_column(Float, default=50.0)
    patience_index: Mapped[float | None] = mapped_column(Float, default=50.0)

    # Learning
    learning_progress: Mapped[dict | None] = mapped_column(JSON, default=dict)
    mistake_frequency: Mapped[float | None] = mapped_column(Float, default=0.0)
    mistake_trend: Mapped[dict | None] = mapped_column(JSON, default=list)
    improvement_timeline: Mapped[dict | None] = mapped_column(JSON, default=list)

    # DNA Summary
    dna_summary: Mapped[dict | None] = mapped_column(JSON, default=dict)
    raw_insights: Mapped[dict | None] = mapped_column(JSON, default=list)

    total_trades_analyzed: Mapped[int] = mapped_column(Integer, default=0)
    last_updated: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── Brain Memory ──


class BrainMemory(BrainBase):
    __tablename__ = "brain_memories"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    memory_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    key: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str | None] = mapped_column(String, default=None)
    content: Mapped[dict | None] = mapped_column(JSON, default=None)
    text_content: Mapped[str | None] = mapped_column(Text, default=None)
    importance: Mapped[str] = mapped_column(String, default="medium")
    tags: Mapped[dict | None] = mapped_column(JSON, default=list)
    source_entity_type: Mapped[str | None] = mapped_column(String, default=None)
    source_entity_id: Mapped[str | None] = mapped_column(String, default=None)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


# ── Decision Timeline ──


class DecisionRecord(BrainBase):
    __tablename__ = "brain_decisions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    context_snapshot: Mapped[dict | None] = mapped_column(JSON, default=dict)
    reasoning_steps: Mapped[dict | None] = mapped_column(JSON, default=list)
    evidence_sources: Mapped[dict | None] = mapped_column(JSON, default=list)
    scores: Mapped[dict | None] = mapped_column(JSON, default=dict)
    verdict: Mapped[str | None] = mapped_column(String, default=None)
    confidence_score: Mapped[float | None] = mapped_column(Float, default=None)
    recommendation: Mapped[str | None] = mapped_column(Text, default=None)
    reasoning: Mapped[str | None] = mapped_column(Text, default=None)

    # Feedback
    actual_outcome: Mapped[str | None] = mapped_column(String, default=None)
    user_feedback: Mapped[str | None] = mapped_column(Text, default=None)
    learning_result: Mapped[str | None] = mapped_column(Text, default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── Learning Observation ──


class LearningObservation(BrainBase):
    __tablename__ = "brain_observations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    observation_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, default=None)
    category: Mapped[str | None] = mapped_column(String, default=None)
    severity: Mapped[str | None] = mapped_column(String, default="info")
    confidence: Mapped[float | None] = mapped_column(Float, default=0.0)
    evidence: Mapped[dict | None] = mapped_column(JSON, default=dict)
    related_entities: Mapped[dict | None] = mapped_column(JSON, default=list)
    is_actionable: Mapped[bool] = mapped_column(Boolean, default=False)
    is_dismissed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── Personal Insight ──


class PersonalInsight(BrainBase):
    __tablename__ = "brain_insights"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, default=None)
    impact: Mapped[str | None] = mapped_column(String, default="positive")
    confidence: Mapped[float | None] = mapped_column(Float, default=0.0)
    supporting_data: Mapped[dict | None] = mapped_column(JSON, default=dict)
    source: Mapped[str | None] = mapped_column(String, default=None)
    is_dismissed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── Brain Coaching Session ──


class BrainCoaching(BrainBase):
    __tablename__ = "brain_coaching"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    coaching_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, default=None)
    strengths: Mapped[dict | None] = mapped_column(JSON, default=list)
    weaknesses: Mapped[dict | None] = mapped_column(JSON, default=list)
    observations: Mapped[dict | None] = mapped_column(JSON, default=list)
    action_items: Mapped[dict | None] = mapped_column(JSON, default=list)
    metrics_snapshot: Mapped[dict | None] = mapped_column(JSON, default=dict)
    score: Mapped[float | None] = mapped_column(Float, default=None)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, DateTime, Boolean, Integer, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base


class AIProfile(Base):
    """Trader Intelligence Profile — aggregated trader archetype."""
    __tablename__ = "ai_profile"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    project: Mapped["Project"] = relationship("Project")

    # Trading Style
    trading_style: Mapped[str | None] = mapped_column(String, nullable=True)          # scalper, day, swing, position
    preferred_sessions: Mapped[list | None] = mapped_column(JSONB, nullable=True)      # [london, newyork, asian]
    preferred_markets: Mapped[list | None] = mapped_column(JSONB, nullable=True)       # [forex, crypto, stocks, futures]
    preferred_timeframes: Mapped[list | None] = mapped_column(JSONB, nullable=True)    # [M5, M15, H1, H4, D1]
    preferred_pairs: Mapped[list | None] = mapped_column(JSONB, nullable=True)         # [EURUSD, GBPUSD, ...]

    # Risk Profile
    risk_profile: Mapped[str | None] = mapped_column(String, nullable=True)            # conservative, moderate, aggressive
    avg_rr: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_holding_time_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_risk_per_trade: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_drawdown_pct: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Conditions
    best_conditions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)         # {sessions:[], pairs:[], setups:[], market_regime:[]}
    worst_conditions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Psychology
    psychological_patterns: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # [{pattern, frequency, impact}]
    most_common_mistakes: Mapped[list | None] = mapped_column(JSONB, nullable=True)    # [{mistake, count, avg_pnl_impact}]
    most_successful_behaviors: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Learning Progress
    learning_progress: Mapped[dict | None] = mapped_column(JSONB, nullable=True)       # {level, topics_mastered, streak_days, total_reviews}
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True)          # 0-100 composite score

    # Metadata
    total_trades_analyzed: Mapped[int] = mapped_column(Integer, default=0)
    last_analyzed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class TradeEvaluation(Base):
    """Decision Support Engine — per-trade evaluation scores."""
    __tablename__ = "trade_evaluation"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    trade_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("trade.id", ondelete="CASCADE"), nullable=False)
    trade: Mapped["Trade"] = relationship("Trade")

    # Scores (0-100)
    strength_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    execution_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    psychology_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    discipline_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    strategy_alignment: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    overall_quality: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Structured critique
    critique: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # {what_went_well:[], what_went_wrong:[], rule_violations:[],
    #  execution_quality:str, risk_quality:str, entry_quality:str,
    #  exit_quality:str, psychology_observations:[], improvement_suggestions:[]}

    # Provider metadata
    provider: Mapped[str | None] = mapped_column(String, nullable=True)  # openai, anthropic, local, rule_based
    evaluated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class KnowledgeLink(Base):
    """Knowledge Engine — links between any two knowledge entities."""
    __tablename__ = "knowledge_link"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    source_type: Mapped[str] = mapped_column(String, nullable=False)    # trade, strategy, journal, replay, mistake, lesson, goal, risk_event, research
    source_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    target_type: Mapped[str] = mapped_column(String, nullable=False)
    target_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    relationship: Mapped[str] = mapped_column(String, nullable=False)   # caused_by, improved_by, related_to, contradicts, supports
    strength: Mapped[float] = mapped_column(Float, default=1.0)         # 0.0 - 1.0
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class DetectedPattern(Base):
    """Pattern Detection — recurring patterns found in trading data."""
    __tablename__ = "detected_pattern"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    pattern_type: Mapped[str] = mapped_column(String, nullable=False)   # session, weekday, strategy, mistake, strength, emotion, execution
    pattern_key: Mapped[str] = mapped_column(String, nullable=False)    # e.g. "london", "monday", "strategy_abc"
    pattern_value: Mapped[str | None] = mapped_column(String, nullable=True)  # e.g. "winning", "losing", "high_risk"
    confidence: Mapped[float] = mapped_column(Float, default=0.0)       # 0.0 - 1.0
    sample_size: Mapped[int] = mapped_column(Integer, default=0)
    avg_pnl: Mapped[float | None] = mapped_column(Float, nullable=True)
    win_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_positive: Mapped[bool] = mapped_column(Boolean, default=True)   # winning vs losing pattern
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_detected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CoachingSession(Base):
    """Coaching System — structured coaching sessions."""
    __tablename__ = "coaching_session"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    session_type: Mapped[str] = mapped_column(String, nullable=False)   # daily, weekly, monthly, psychology, risk, strategy, execution
    session_date: Mapped[str] = mapped_column(String, nullable=False)
    period_start: Mapped[str | None] = mapped_column(String, nullable=True)
    period_end: Mapped[str | None] = mapped_column(String, nullable=True)

    # Content
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_findings: Mapped[list | None] = mapped_column(JSONB, nullable=True)      # [{finding, category, impact}]
    action_items: Mapped[list | None] = mapped_column(JSONB, nullable=True)      # [{action, priority, deadline, completed}]
    strengths: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    weaknesses: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)            # 0-100

    # Context snapshot
    metrics_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # {win_rate, pnl, trades_count, ...}

    is_read: Mapped[bool] = mapped_column(Boolean, default=False)


class AIInsight(Base):
    """Personalized Insights — generated trading insights."""
    __tablename__ = "ai_insight"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    insight_type: Mapped[str] = mapped_column(String, nullable=False)   # session, strategy, risk, psychology, execution, timing
    category: Mapped[str] = mapped_column(String, nullable=True)        # positive, negative, neutral, warning
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)    # supporting evidence
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    is_dismissed: Mapped[bool] = mapped_column(Boolean, default=False)


class AIRecommendation(Base):
    """Recommendation Engine — actionable trading recommendations."""
    __tablename__ = "ai_recommendation"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    recommendation_type: Mapped[str] = mapped_column(String, nullable=False)  # risk, session, timing, strategy, psychology, review, study
    priority: Mapped[str] = mapped_column(String, nullable=False, default="medium")  # low, medium, high, critical
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    action_url: Mapped[str | None] = mapped_column(String, nullable=True)    # deep link to relevant page
    related_entity_type: Mapped[str | None] = mapped_column(String, nullable=True)
    related_entity_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    is_dismissed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)


class AISummary(Base):
    """AI Memory Layer — structured summaries for model-agnostic consumption."""
    __tablename__ = "ai_summary"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    summary_type: Mapped[str] = mapped_column(String, nullable=False)   # trade, journal, strategy, replay, performance, psychology, learning
    entity_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)  # linked entity
    period: Mapped[str | None] = mapped_column(String, nullable=True)   # daily, weekly, monthly, all_time

    content: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # structured summary
    text_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    keywords: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    sentiment: Mapped[str | None] = mapped_column(String, nullable=True)  # positive, negative, neutral
    importance: Mapped[float] = mapped_column(Float, default=0.5)        # 0.0 - 1.0


class AIContextSnapshot(Base):
    """Context Builder — snapshots of full trading context at a point in time."""
    __tablename__ = "ai_context_snapshot"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    snapshot_type: Mapped[str] = mapped_column(String, nullable=False)  # pre_trade, post_trade, daily, on_demand
    trade_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)

    context: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # {performance: {...}, recent_trades: [...], active_strategies: [...],
    #  risk_metrics: {...}, journal_notes: [...], planning_data: {...},
    #  goals: [...], psychology: {...}, patterns: [...]}


class AIProviderConfig(Base):
    """AI Provider Architecture — provider-agnostic configuration."""
    __tablename__ = "ai_provider_config"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    provider_name: Mapped[str] = mapped_column(String, nullable=False, unique=True)  # openai, anthropic, gemini, ollama, local
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    model_name: Mapped[str | None] = mapped_column(String, nullable=True)
    api_endpoint: Mapped[str | None] = mapped_column(String, nullable=True)
    config_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # {temperature, max_tokens, ...}
    capabilities: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # [evaluation, critique, coaching, insight]

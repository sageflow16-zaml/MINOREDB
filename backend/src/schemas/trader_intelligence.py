from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


# --- TradeDebrief ---

class TradeDebriefBase(BaseModel):
    entry_review: Optional[str] = None
    execution_review: Optional[str] = None
    exit_review: Optional[str] = None
    psychology_review: Optional[str] = None
    lessons_learned: Optional[list[str]] = None
    strengths: Optional[list[str]] = None
    weaknesses: Optional[list[str]] = None
    mistakes: Optional[list[str]] = None
    improvements: Optional[list[str]] = None
    overall_rating: Optional[int] = Field(None, ge=1, le=10)
    summary: Optional[str] = None

class TradeDebriefCreate(TradeDebriefBase):
    trade_id: UUID
    project_id: UUID

class TradeDebriefUpdate(BaseModel):
    entry_review: Optional[str] = None
    execution_review: Optional[str] = None
    exit_review: Optional[str] = None
    psychology_review: Optional[str] = None
    lessons_learned: Optional[list[str]] = None
    strengths: Optional[list[str]] = None
    weaknesses: Optional[list[str]] = None
    mistakes: Optional[list[str]] = None
    improvements: Optional[list[str]] = None
    overall_rating: Optional[int] = Field(None, ge=1, le=10)
    summary: Optional[str] = None

class TradeDebriefRead(TradeDebriefBase):
    id: UUID
    project_id: UUID
    trade_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class GenerateDebriefRequest(BaseModel):
    trade_id: UUID

class GenerateDebriefResponse(BaseModel):
    debrief: TradeDebriefRead
    message: str


# --- PersonalPattern ---

class PersonalPatternBase(BaseModel):
    name: str
    category: str
    signature: Optional[dict] = None
    description: Optional[str] = None
    occurrence_count: int = 0
    win_count: int = 0
    loss_count: int = 0
    total_pnl: Optional[float] = None
    avg_rr: Optional[float] = None
    confidence: Optional[float] = Field(None, ge=0, le=100)
    active: bool = True

class PersonalPatternCreate(PersonalPatternBase):
    project_id: UUID
    trade_ids: Optional[list[str]] = None

class PersonalPatternUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    signature: Optional[dict] = None
    description: Optional[str] = None
    trade_ids: Optional[list[str]] = None
    occurrence_count: Optional[int] = None
    win_count: Optional[int] = None
    loss_count: Optional[int] = None
    total_pnl: Optional[float] = None
    avg_rr: Optional[float] = None
    confidence: Optional[float] = None
    active: Optional[bool] = None

class PersonalPatternRead(PersonalPatternBase):
    id: UUID
    project_id: UUID
    trade_ids: Optional[list] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DetectPatternsRequest(BaseModel):
    limit: int = 50


# --- PersonalRule ---

class PersonalRuleBase(BaseModel):
    title: str
    category: str
    description: Optional[str] = None
    evidence: Optional[dict] = None
    supporting_stats: Optional[dict] = None

class PersonalRuleCreate(PersonalRuleBase):
    project_id: UUID

class PersonalRuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    evidence: Optional[dict] = None
    supporting_stats: Optional[dict] = None

class PersonalRuleRead(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    description: Optional[str] = None
    category: str
    status: str
    version: int
    evidence: Optional[dict] = None
    supporting_stats: Optional[dict] = None
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ApproveRuleRequest(BaseModel):
    notes: Optional[str] = None

class RejectRuleRequest(BaseModel):
    reason: str

class GenerateRulesResponse(BaseModel):
    rules: list[PersonalRuleRead]
    message: str


# --- TraderProfile ---

class TraderProfileRead(BaseModel):
    id: UUID
    project_id: UUID
    strengths: Optional[list] = None
    weaknesses: Optional[list] = None
    trading_habits: Optional[dict] = None
    discipline_score: Optional[float] = None
    rule_adherence: Optional[dict] = None
    performance_trends: Optional[dict] = None
    total_trades_analyzed: int = 0
    total_debriefs: int = 0
    active_patterns: int = 0
    approved_rules: int = 0
    improvement_suggestions: Optional[list] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TraderProfileSnapshotRead(BaseModel):
    id: UUID
    project_id: UUID
    snapshot_date: datetime
    strengths: Optional[list] = None
    weaknesses: Optional[list] = None
    discipline_score: Optional[float] = None
    rule_adherence: Optional[dict] = None
    total_trades_analyzed: int
    total_debriefs: int
    active_patterns: int
    approved_rules: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DashboardResponse(BaseModel):
    debrief_count: int
    pattern_count: int
    rule_count: int
    approved_rule_count: int
    profile: Optional[TraderProfileRead] = None
    recent_debriefs: list[TradeDebriefRead]

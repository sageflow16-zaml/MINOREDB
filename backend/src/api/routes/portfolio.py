from uuid import UUID
from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services.portfolio import PortfolioManager
from src.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Portfolio error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def _now_iso():
    return datetime.utcnow().isoformat()


# ── Schemas ──

class AccountCreate(BaseModel):
    name: str
    account_number: str | None = None
    account_type: str = "personal"
    status: str = "active"
    broker_profile_id: str | None = None
    currency: str = "USD"
    leverage: int | None = None
    initial_balance: float = 0.0
    description: str | None = None
    tags: list[str] | None = None

class AccountUpdate(BaseModel):
    name: str | None = None
    account_number: str | None = None
    account_type: str | None = None
    status: str | None = None
    broker_profile_id: str | None = None
    currency: str | None = None
    leverage: int | None = None
    description: str | None = None
    tags: list[str] | None = None
    current_balance: float | None = None
    current_equity: float | None = None
    open_pnl: float | None = None
    used_margin: float | None = None
    margin_level: float | None = None

class BrokerCreate(BaseModel):
    broker_name: str
    server: str | None = None
    platform: str = "custom"
    account_number: str | None = None
    base_currency: str = "USD"
    spread_profile: str | None = None
    commission_model: str = "none"
    commission_rate: float | None = None
    swap_long: float | None = None
    swap_short: float | None = None
    execution_model: str = "market"
    trading_costs: dict[str, Any] | None = None

class BrokerUpdate(BaseModel):
    broker_name: str | None = None
    server: str | None = None
    platform: str | None = None
    account_number: str | None = None
    base_currency: str | None = None
    spread_profile: str | None = None
    commission_model: str | None = None
    commission_rate: float | None = None
    swap_long: float | None = None
    swap_short: float | None = None
    execution_model: str | None = None
    trading_costs: dict[str, Any] | None = None

class GroupCreate(BaseModel):
    name: str
    description: str | None = None
    color: str | None = None
    account_ids: list[str] | None = None

class GroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    account_ids: list[str] | None = None

class NoteCreate(BaseModel):
    account_id: str
    title: str
    content: str | None = None
    category: str | None = None
    pinned: bool = False

class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    category: str | None = None
    pinned: bool | None = None

class HealthUpdate(BaseModel):
    margin_usage: float | None = None
    drawdown_current: float | None = None
    drawdown_limit: float | None = None
    daily_loss_current: float | None = None
    daily_loss_limit: float | None = None
    trailing_drawdown: float | None = None
    trailing_drawdown_limit: float | None = None
    max_loss: float | None = None
    max_loss_limit: float | None = None
    max_daily_loss: float | None = None
    max_daily_loss_limit: float | None = None
    violation_count: int | None = None
    health_score: float | None = None

class RuleCreate(BaseModel):
    account_id: str
    rule_type: str
    rule_name: str
    description: str | None = None
    severity: str = "medium"
    threshold_value: float | None = None
    current_value: float | None = None
    is_active: bool = True

class RuleUpdate(BaseModel):
    rule_name: str | None = None
    description: str | None = None
    severity: str | None = None
    threshold_value: float | None = None
    current_value: float | None = None
    is_active: bool | None = None

class AllocationCreate(BaseModel):
    allocation_type: str
    entity_type: str
    entity_id: str
    entity_name: str | None = None
    target_percentage: float | None = None
    current_percentage: float | None = None
    target_amount: float | None = None
    current_amount: float | None = None
    risk_budget: float | None = None
    max_allocation: float | None = None
    min_allocation: float | None = None
    is_active: bool = True
    rebalance_frequency: str | None = None

class AllocationUpdate(BaseModel):
    target_percentage: float | None = None
    current_percentage: float | None = None
    target_amount: float | None = None
    current_amount: float | None = None
    risk_budget: float | None = None
    max_allocation: float | None = None
    min_allocation: float | None = None
    is_active: bool | None = None
    rebalance_frequency: str | None = None

class TransferCreate(BaseModel):
    transfer_type: str = "internal"
    from_account_id: str | None = None
    to_account_id: str | None = None
    amount: float
    currency: str = "USD"
    description: str | None = None
    reference: str | None = None

class GoalCreate(BaseModel):
    name: str
    description: str | None = None
    metric: str
    target_value: float
    current_value: float = 0.0
    start_value: float = 0.0
    account_id: str | None = None
    deadline: str | None = None
    category: str | None = None
    is_portfolio_goal: bool = False

class GoalUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    metric: str | None = None
    target_value: float | None = None
    current_value: float | None = None
    start_value: float | None = None
    status: str | None = None
    deadline: str | None = None
    category: str | None = None

class FundingCreate(BaseModel):
    account_id: str
    event_type: str
    amount: float
    currency: str = "USD"
    description: str | None = None
    reference: str | None = None

class AIQuestion(BaseModel):
    question: str

class MetricsUpdate(BaseModel):
    balance: float | None = None
    equity: float | None = None
    open_pnl: float | None = None
    used_margin: float | None = None
    margin_level: float | None = None


# ── Dashboard ──

@router.get("/dashboard")
def get_portfolio_dashboard(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return {
        "summary": _safe(pm.portfolio.get_portfolio_summary),
        "risk": _safe(pm.risk.get_portfolio_risk),
        "allocations": _safe(pm.portfolio.get_allocation_summary),
        "account_breakdown": _safe(pm.portfolio.get_account_breakdown),
        "history": _safe(pm.portfolio.get_portfolio_history, 90),
    }


# ── Brokers ──

@router.get("/brokers")
def list_brokers(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.brokers.list_brokers)

@router.post("/brokers")
def create_broker(project_id: UUID, data: BrokerCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.brokers.create_broker, data.model_dump())

@router.get("/brokers/{broker_id}")
def get_broker(project_id: UUID, broker_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.brokers.get_broker, broker_id)

@router.put("/brokers/{broker_id}")
def update_broker(project_id: UUID, broker_id: UUID, data: BrokerUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.brokers.update_broker, broker_id, data.model_dump(exclude_unset=True))

@router.delete("/brokers/{broker_id}")
def delete_broker(project_id: UUID, broker_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    _safe(pm.brokers.delete_broker, broker_id)
    return {"status": "deleted"}

@router.get("/brokers/{broker_id}/accounts")
def get_broker_accounts(project_id: UUID, broker_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.brokers.get_broker_accounts, broker_id)


# ── Accounts ──

@router.get("/accounts")
def list_accounts(
    project_id: UUID,
    account_type: str | None = Query(None),
    status: str | None = Query(None),
    broker_id: UUID | None = Query(None),
    search: str | None = Query(None),
    group_id: UUID | None = Query(None),
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.list_accounts, account_type, status, broker_id, search, group_id)

@router.post("/accounts")
def create_account(project_id: UUID, data: AccountCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.create_account, data.model_dump())

@router.get("/accounts/{account_id}")
def get_account(project_id: UUID, account_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.get_account, account_id)

@router.put("/accounts/{account_id}")
def update_account(project_id: UUID, account_id: UUID, data: AccountUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.update_account, account_id, data.model_dump(exclude_unset=True))

@router.delete("/accounts/{account_id}")
def delete_account(project_id: UUID, account_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    _safe(pm.accounts.delete_account, account_id)
    return {"status": "deleted"}

@router.post("/accounts/{account_id}/archive")
def archive_account(project_id: UUID, account_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.archive_account, account_id)

@router.put("/accounts/{account_id}/metrics")
def update_account_metrics(project_id: UUID, account_id: UUID, data: MetricsUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.update_account_metrics, account_id, data.balance, data.equity, data.open_pnl, data.used_margin, data.margin_level)

# ── Balance / Equity History ──

@router.get("/accounts/{account_id}/balance-history")
def get_balance_history(project_id: UUID, account_id: UUID, days: int = Query(30), project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.get_balance_history, account_id, days)

@router.get("/accounts/{account_id}/equity-history")
def get_equity_history(project_id: UUID, account_id: UUID, days: int = Query(30), project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.get_equity_history, account_id, days)


# ── Funding ──

@router.get("/funding")
def list_funding(project_id: UUID, account_id: UUID | None = Query(None), project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.list_funding, account_id)

@router.post("/funding")
def add_funding(project_id: UUID, data: FundingCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.add_funding, data.model_dump())


# ── Groups ──

@router.get("/groups")
def list_groups(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.list_groups)

@router.post("/groups")
def create_group(project_id: UUID, data: GroupCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.create_group, data.model_dump())

@router.put("/groups/{group_id}")
def update_group(project_id: UUID, group_id: UUID, data: GroupUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.update_group, group_id, data.model_dump(exclude_unset=True))

@router.delete("/groups/{group_id}")
def delete_group(project_id: UUID, group_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    _safe(pm.accounts.delete_group, group_id)
    return {"status": "deleted"}


# ── Notes ──

@router.get("/accounts/{account_id}/notes")
def list_notes(project_id: UUID, account_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.list_notes, account_id)

@router.post("/notes")
def create_note(project_id: UUID, data: NoteCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.create_note, data.model_dump())

@router.put("/notes/{note_id}")
def update_note(project_id: UUID, note_id: UUID, data: NoteUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.update_note, note_id, data.model_dump(exclude_unset=True))

@router.delete("/notes/{note_id}")
def delete_note(project_id: UUID, note_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    _safe(pm.accounts.delete_note, note_id)
    return {"status": "deleted"}


# ── Health & Rules ──

@router.get("/accounts/{account_id}/health")
def get_account_health(project_id: UUID, account_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.get_account_health, account_id)

@router.put("/accounts/{account_id}/health")
def update_account_health(project_id: UUID, account_id: UUID, data: HealthUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.upsert_account_health, account_id, data.model_dump(exclude_unset=True))

@router.get("/accounts/{account_id}/rules")
def list_account_rules(project_id: UUID, account_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.list_account_rules, account_id)

@router.post("/rules")
def create_account_rule(project_id: UUID, data: RuleCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.create_account_rule, data.model_dump())

@router.put("/rules/{rule_id}")
def update_account_rule(project_id: UUID, rule_id: UUID, data: RuleUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.accounts.update_account_rule, rule_id, data.model_dump(exclude_unset=True))

@router.delete("/rules/{rule_id}")
def delete_account_rule(project_id: UUID, rule_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    _safe(pm.accounts.delete_account_rule, rule_id)
    return {"status": "deleted"}

@router.post("/accounts/{account_id}/rules/check")
def check_prop_firm_rules(project_id: UUID, account_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.risk.check_prop_firm_rules, account_id)


# ── Risk ──

@router.get("/risk")
def get_portfolio_risk(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.risk.get_portfolio_risk)

@router.get("/accounts/{account_id}/risk")
def get_account_risk(project_id: UUID, account_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.risk.get_account_risk, account_id)


# ── Allocations ──

@router.get("/allocations")
def list_allocations(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.allocations.list_allocations)

@router.post("/allocations")
def create_allocation(project_id: UUID, data: AllocationCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.allocations.create_allocation, data.model_dump())

@router.put("/allocations/{allocation_id}")
def update_allocation(project_id: UUID, allocation_id: UUID, data: AllocationUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.allocations.update_allocation, allocation_id, data.model_dump(exclude_unset=True))

@router.delete("/allocations/{allocation_id}")
def delete_allocation(project_id: UUID, allocation_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    _safe(pm.allocations.delete_allocation, allocation_id)
    return {"status": "deleted"}

@router.get("/allocations/rebalance-suggestions")
def get_rebalance_suggestions(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.allocations.get_rebalance_suggestions)

@router.get("/allocations/compute-from-equity")
def compute_allocations_from_equity(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.allocations.compute_allocations_from_equity)


# ── Transfers ──

@router.get("/transfers")
def list_transfers(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.transfers.list_transfers)

@router.post("/transfers")
def create_transfer(project_id: UUID, data: TransferCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.transfers.create_transfer, data.model_dump())


# ── Goals ──

@router.get("/goals")
def list_goals(project_id: UUID, status: str | None = Query(None), project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.goals.list_goals, status)

@router.post("/goals")
def create_goal(project_id: UUID, data: GoalCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.goals.create_goal, data.model_dump())

@router.put("/goals/{goal_id}")
def update_goal(project_id: UUID, goal_id: UUID, data: GoalUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.goals.update_goal, goal_id, data.model_dump(exclude_unset=True))

@router.delete("/goals/{goal_id}")
def delete_goal(project_id: UUID, goal_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    _safe(pm.goals.delete_goal, goal_id)
    return {"status": "deleted"}


# ── Analytics / Comparison ──

@router.get("/analytics/compare-accounts")
def compare_accounts(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.analytics.compare_accounts)

@router.get("/analytics/compare-brokers")
def compare_brokers(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.analytics.compare_brokers)


# ── AI ──

@router.post("/ai/ask")
def ai_ask(project_id: UUID, data: AIQuestion, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.ai.answer_question, data.question)

@router.post("/ai/best-account")
def ai_best_account(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.ai.best_performing_account)

@router.post("/ai/worst-account")
def ai_worst_account(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.ai.worst_performing_account)

@router.post("/ai/rebalancing")
def ai_rebalancing(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.ai.rebalancing_recommendation)

@router.post("/ai/broker-analysis")
def ai_broker_analysis(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.ai.broker_cost_analysis)

@router.post("/ai/risk-assessment")
def ai_risk_assessment(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.ai.risk_assessment)


# ── Reports ──

@router.get("/reports/portfolio")
def get_portfolio_report(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.reports.generate_portfolio_report)

@router.get("/reports/risk")
def get_risk_report(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.reports.generate_risk_report)

@router.get("/reports/allocation")
def get_allocation_report(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.reports.generate_allocation_report)

@router.get("/performance")
def portfolio_performance(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    try:
        return _safe(pm.reports.generate_performance_comparison)
    except Exception:
        return {"total_return": 0.0, "sharpe_ratio": 0.0, "max_drawdown": 0.0, "win_rate": 0.0, "profit_factor": 0.0}

@router.get("/reports/performance-comparison")
def get_performance_comparison(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.reports.generate_performance_comparison)

@router.get("/reports/account/{account_id}")
def get_account_report(project_id: UUID, account_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.reports.generate_account_report, account_id)

@router.post("/reports/ai/generate")
def ai_generate_report(project_id: UUID, report_type: str = Query("portfolio"), project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return {"report": _safe(pm.ai.generate_report, report_type)}


# ── Portfolio History / Snapshots ──

@router.get("/history")
def get_portfolio_history(project_id: UUID, days: int = Query(90), project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.portfolio.get_portfolio_history, days)

@router.post("/snapshot")
def record_snapshot(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    pm = PortfolioManager(db, project_id)
    return _safe(pm.portfolio.record_snapshot)

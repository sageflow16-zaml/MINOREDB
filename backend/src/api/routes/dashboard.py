from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.crud import (
    source, claim, concept, interpretation, 
    conflict, research_question, hypothesis,
    trade, market_structure, collector,
)
from src.services import statistics

router = APIRouter()

@router.get("/")
def get_dashboard_stats(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    total_trades = trade.count(db, project_id=project_id)
    wins = trade.count_by_result(db, project_id=project_id, result="WIN")
    open_trades = trade.count_by_status(db, project_id=project_id, status="OPEN")
    win_rate = round((wins / total_trades * 100), 1) if total_trades > 0 else 0.0
    avg_rr = trade.avg_rr(db, project_id=project_id)

    bullish_bias = market_structure.count_by_field(
        db, project_id=project_id, field="weekly_bias", value="BULLISH"
    ) + market_structure.count_by_field(
        db, project_id=project_id, field="daily_bias", value="BULLISH"
    )
    bearish_bias = market_structure.count_by_field(
        db, project_id=project_id, field="weekly_bias", value="BEARISH"
    ) + market_structure.count_by_field(
        db, project_id=project_id, field="daily_bias", value="BEARISH"
    )

    collector_statuses = collector.get_statuses(db, project_id=project_id)
    total_collectors = len(collector_statuses)
    active_collectors = sum(1 for c in collector_statuses if c.enabled)
    collector_errors = sum(c.errors for c in collector_statuses)
    collector_records = sum(c.records_collected for c in collector_statuses)

    # Get statistics overview
    stats_overview = statistics.get_statistics_overview(db, project_id=project_id)
    overview = stats_overview.get("overview", {})
    risk = stats_overview.get("risk", {})

    return {
        "sources": source.count(db, project_id=project_id),
        "claims": claim.count(db, project_id=project_id),
        "concepts": concept.count(db, project_id=project_id),
        "interpretations": interpretation.count(db, project_id=project_id),
        "conflicts": conflict.count(db, project_id=project_id),
        "questions": research_question.count(db, project_id=project_id),
        "hypotheses": hypothesis.count(db, project_id=project_id),
        "total_trades": total_trades,
        "win_rate": win_rate,
        "avg_rr": avg_rr,
        "open_trades": open_trades,
        "bullish_bias": bullish_bias,
        "bearish_bias": bearish_bias,
        "current_market_phase": "—",
        "current_trend": "—",
        "total_collectors": total_collectors,
        "active_collectors": active_collectors,
        "collector_errors": collector_errors,
        "collector_records": collector_records,
        "expectancy": overview.get("expectancy"),
        "total_pnl": overview.get("total_pnl"),
        "avg_win": overview.get("avg_win"),
        "avg_loss": overview.get("avg_loss"),
        "max_drawdown": risk.get("max_drawdown"),
        "profit_factor": risk.get("profit_factor"),
        "sharpe_ratio": risk.get("sharpe_ratio"),
        "recovery_factor": risk.get("recovery_factor"),
    }

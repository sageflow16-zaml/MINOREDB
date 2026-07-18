"""Deterministic evidence retrievers. Every function returns structured dicts only."""

from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload
from src.models.trade import Trade
from src.models.trade_memory import TradeMemory
from src.models.knowledge_rule import KnowledgeRule
from src.models.knowledge_graph import KnowledgeNode, KnowledgeEdge, KnowledgeGraphSnapshot
from src.models.pattern import Pattern
from src.models.learning import LearningEvent, KnowledgeSnapshot
from src.models.macro import MacroEvent
from src.models.learning import LearningEvent, KnowledgeSnapshot
from src.crud import trade as trade_crud
from src.crud import knowledge_rule as rule_crud
from src.crud import knowledge_graph as graph_crud
from src.services.knowledge_library import get_institutional_knowledge as _get_institutional
from src.models.trader_intelligence import TradeDebrief, PersonalPattern, PersonalRule, TraderProfile


def get_trade_memories(db: Session, project_id: UUID, limit: int = 10) -> list[dict]:
    memories = db.scalars(
        select(TradeMemory)
        .where(TradeMemory.project_id == project_id)
        .order_by(TradeMemory.created_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "id": str(m.id),
            "pair": m.pair,
            "direction": m.direction,
            "session": m.session,
            "weekly_bias": m.weekly_bias,
            "daily_bias": m.daily_bias,
            "market_phase": m.market_phase,
            "market_trend": m.market_trend,
            "entry_model": m.entry_model,
            "liquidity_type": m.liquidity_type,
            "execution_model": m.execution_model,
            "risk_percent": m.risk_percent,
            "rr": m.rr,
            "pnl": m.pnl,
            "result": m.result,
            "strengths": m.strengths,
            "weaknesses": m.weaknesses,
            "mistakes": m.mistakes,
            "lessons": m.lessons,
            "tags": m.tags,
            "confidence": m.confidence,
            "similarity_score": m.similarity_score,
            "summary": m.summary,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in memories
    ]


def get_similar_trades(
    db: Session, project_id: UUID, trade_id: UUID | None = None, limit: int = 5
) -> list[dict]:
    from src.services.similarity import compare_trade

    if trade_id:
        result = compare_trade(db, project_id, trade_id)
        return result.get("matches", [])[:limit]

    memories = db.scalars(
        select(TradeMemory)
        .where(TradeMemory.project_id == project_id)
        .order_by(TradeMemory.created_at.desc())
        .limit(1)
    ).first()
    if memories:
        from src.services.similarity import compare_trade
        result = compare_trade(db, project_id, memories.trade_id)
        return result.get("matches", [])[:limit]
    return []


def get_statistics(db: Session, project_id: UUID) -> dict:
    from src.services.statistics import get_statistics_overview
    return get_statistics_overview(db, project_id)


def get_patterns(db: Session, project_id: UUID, limit: int = 10) -> list[dict]:
    patterns = db.scalars(
        select(Pattern)
        .where(Pattern.project_id == project_id)
        .order_by(Pattern.confidence_score.desc().nullslast())
        .limit(limit)
    ).all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "description": p.description,
            "win_rate": p.win_rate,
            "average_rr": p.average_rr,
            "expectancy": p.expectancy,
            "profit_factor": p.profit_factor,
            "total_occurrences": p.total_occurrences,
            "confidence_score": p.confidence_score,
        }
        for p in patterns
    ]


def get_knowledge_rules(db: Session, project_id: UUID, limit: int = 10) -> list[dict]:
    rules = rule_crud.get_multi(db, project_id=project_id, skip=0, limit=limit)
    return [
        {
            "id": str(r.id),
            "title": r.title,
            "description": r.description,
            "category": r.category,
            "rule_type": r.rule_type,
            "confidence": r.confidence,
            "occurrences": r.occurrences,
            "wins": r.wins,
            "losses": r.losses,
            "win_rate": r.win_rate,
            "avg_rr": r.avg_rr,
            "expectancy": r.expectancy,
        }
        for r in rules
    ]


def get_graph(db: Session, project_id: UUID) -> dict:
    nodes = graph_crud.get_all_nodes(db, project_id)
    edges = graph_crud.get_all_edges(db, project_id)
    snapshot = graph_crud.get_snapshot(db, project_id)
    return {
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "nodes": [
            {"type": n.type, "name": n.name, "category": n.category, "occurrences": n.occurrences}
            for n in nodes[:50]
        ],
        "edges": [
            {
                "source": str(e.source_node_id),
                "target": str(e.target_node_id),
                "relationship": e.relationship,
                "strength": e.strength,
                "confidence": e.confidence,
            }
            for e in edges[:100]
        ],
        "snapshot": {
            "most_connected_type": snapshot.most_connected_type if snapshot else None,
            "summary": snapshot.summary if snapshot else None,
        } if snapshot else None,
    }


def get_macro(db: Session, project_id: UUID, limit: int = 10) -> dict:
    events = db.scalars(
        select(MacroEvent)
        .order_by(MacroEvent.release_time.desc().nullslast())
        .limit(limit)
    ).all()
    return {
        "recent_events": [
            {
                "event_name": e.event_name,
                "country": e.country,
                "category": e.category,
                "importance": e.importance,
                "actual": e.actual,
                "forecast": e.forecast,
                "previous": e.previous,
                "release_time": e.release_time.isoformat() if e.release_time else None,
            }
            for e in events
        ],
    }


def get_recent_learning(db: Session, project_id: UUID, limit: int = 5) -> dict:
    events = db.scalars(
        select(LearningEvent)
        .where(LearningEvent.project_id == project_id)
        .order_by(LearningEvent.created_at.desc())
        .limit(limit)
    ).all()
    snapshots = db.scalars(
        select(KnowledgeSnapshot)
        .where(KnowledgeSnapshot.project_id == project_id)
        .order_by(KnowledgeSnapshot.created_at.desc())
        .limit(1)
    ).all()
    latest_snapshot = None
    if snapshots:
        s = snapshots[0]
        latest_snapshot = {
            "total_trades": s.total_trades,
            "win_rate": s.win_rate,
            "avg_rr": s.avg_rr,
            "expectancy": s.expectancy,
            "knowledge_growth": s.knowledge_growth,
        }
    return {
        "events": [
            {
                "event_type": e.event_type,
                "entity_type": e.entity_type,
                "status": e.status,
                "summary": e.summary,
                "duration_ms": e.duration_ms,
            }
            for e in events
        ],
        "latest_snapshot": latest_snapshot,
    }


def get_trade_debriefs(db: Session, project_id: UUID, limit: int = 10) -> list[dict]:
    debriefs = db.scalars(
        select(TradeDebrief)
        .where(TradeDebrief.project_id == project_id)
        .order_by(TradeDebrief.created_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "id": str(d.id),
            "trade_id": str(d.trade_id),
            "entry_review": d.entry_review,
            "execution_review": d.execution_review,
            "exit_review": d.exit_review,
            "psychology_review": d.psychology_review,
            "lessons_learned": d.lessons_learned,
            "strengths": d.strengths,
            "weaknesses": d.weaknesses,
            "mistakes": d.mistakes,
            "improvements": d.improvements,
            "overall_rating": d.overall_rating,
            "summary": d.summary,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in debriefs
    ]


def get_personal_patterns(db: Session, project_id: UUID, limit: int = 10) -> list[dict]:
    patterns = db.scalars(
        select(PersonalPattern)
        .where(PersonalPattern.project_id == project_id, PersonalPattern.active == True)
        .order_by(PersonalPattern.confidence.desc().nullslast())
        .limit(limit)
    ).all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "category": p.category,
            "description": p.description,
            "occurrence_count": p.occurrence_count,
            "win_count": p.win_count,
            "loss_count": p.loss_count,
            "total_pnl": p.total_pnl,
            "avg_rr": p.avg_rr,
            "confidence": p.confidence,
        }
        for p in patterns
    ]


def get_personal_rules(db: Session, project_id: UUID, limit: int = 10) -> list[dict]:
    rules = db.scalars(
        select(PersonalRule)
        .where(PersonalRule.project_id == project_id)
        .order_by(PersonalRule.created_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "id": str(r.id),
            "title": r.title,
            "description": r.description,
            "category": r.category,
            "status": r.status,
            "version": r.version,
            "evidence": r.evidence,
            "supporting_stats": r.supporting_stats,
            "approved_at": r.approved_at.isoformat() if r.approved_at else None,
            "rejected_at": r.rejected_at.isoformat() if r.rejected_at else None,
            "rejection_reason": r.rejection_reason,
        }
        for r in rules
    ]


def get_trader_profile(db: Session, project_id: UUID) -> dict | None:
    profile = db.scalars(
        select(TraderProfile)
        .where(TraderProfile.project_id == project_id)
    ).first()
    if not profile:
        return None
    return {
        "id": str(profile.id),
        "strengths": profile.strengths,
        "weaknesses": profile.weaknesses,
        "trading_habits": profile.trading_habits,
        "discipline_score": profile.discipline_score,
        "rule_adherence": profile.rule_adherence,
        "performance_trends": profile.performance_trends,
        "total_trades_analyzed": profile.total_trades_analyzed,
        "total_debriefs": profile.total_debriefs,
        "active_patterns": profile.active_patterns,
        "approved_rules": profile.approved_rules,
        "improvement_suggestions": profile.improvement_suggestions,
        "notes": profile.notes,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
    }


RETRIEVERS: dict[str, callable] = {
    "trade_memory": get_trade_memories,
    "similarity": get_similar_trades,
    "statistics": get_statistics,
    "patterns": get_patterns,
    "knowledge_rules": get_knowledge_rules,
    "knowledge_graph": get_graph,
    "macro": get_macro,
    "learning": get_recent_learning,
    "trade_debrief": get_trade_debriefs,
    "personal_pattern": get_personal_patterns,
    "personal_rule": get_personal_rules,
    "trader_profile": get_trader_profile,
    "institutional_knowledge": lambda db, project_id, **kw: _get_institutional(db, project_id, question=kw.get("question"), limit=kw.get("limit", 10)),
}

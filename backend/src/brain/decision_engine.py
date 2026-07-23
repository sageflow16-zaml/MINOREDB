from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.trade import Trade
from src.services import similarity as sim_service
from src.services import decision_support
from src.brain.models import DecisionRecord, TraderDNA
from src.brain.reasoning_engine import build_pipeline_context, generate_reasoning
from src.brain.similarity_engine import search_similar


def ask(
    db: Session,
    project_id: UUID,
    question: str,
    context: dict | None = None,
    include_steps: list[str] | None = None,
    skip_steps: list[str] | None = None,
) -> dict:
    steps_run = []
    evidence = []
    ctx = build_pipeline_context(db, project_id, question)

    if context:
        ctx.update(context)

    # Step 1: Market Regime
    regime = ctx.get("market_regime", {})
    steps_run.append({"step": "market_regime", "status": "completed", "data": regime})

    # Step 2: Session
    session_info = ctx.get("session_info", {})
    steps_run.append({"step": "session", "status": "completed", "data": session_info})

    # Step 3: Statistics
    stats = ctx.get("statistics", {})
    steps_run.append({"step": "statistics", "status": "completed", "data": {
        "win_rate": stats.get("overview", {}).get("win_rate"),
        "total_trades": stats.get("overview", {}).get("closed_trades"),
        "avg_rr": stats.get("overview", {}).get("avg_rr"),
    }})

    # Step 4: Patterns
    patterns = ctx.get("patterns", [])
    steps_run.append({"step": "patterns", "status": "completed" if patterns else "no_data", "data": {"count": len(patterns)}})

    # Step 5: Risk Rules
    rules = ctx.get("rules", [])
    steps_run.append({"step": "risk_rules", "status": "completed" if rules else "no_data", "data": {"count": len(rules)}})

    # Step 6: Psychology
    psychology = ctx.get("psychology", {})
    steps_run.append({"step": "psychology", "status": "completed" if psychology.get("recent_emotions") else "no_data", "data": psychology})

    # Step 7: Similar Trades
    pair = (context or {}).get("pair") or (ctx.get("recent_trades", [{}])[0].get("pair") if ctx.get("recent_trades") else None)
    similar = []
    if pair:
        try:
            sim_result = search_similar(db, project_id, pair=pair, limit=10)
            similar = sim_result.get("matches", [])
            steps_run.append({"step": "similar_trades", "status": "completed" if similar else "no_data", "data": {"found": len(similar)}})
        except Exception as e:
            steps_run.append({"step": "similar_trades", "status": "error", "error": str(e)})

    # Step 8: DNA Profile
    dna = db.query(TraderDNA).filter(TraderDNA.project_id == project_id).first()
    dna_data = None
    if dna:
        dna_data = {
            "style": dna.trading_style,
            "best_session": dna.preferred_session,
            "discipline": dna.discipline_score,
            "risk_behavior": dna.risk_behavior,
        }
    steps_run.append({"step": "dna", "status": "completed" if dna_data else "no_data", "data": dna_data})

    # Compute scores
    scores = _compute_scores(ctx, similar, dna_data)

    # Generate verdict
    verdict = _generate_verdict(scores)

    # Generate reasoning text
    reasoning_text = generate_reasoning(ctx, scores, similar)

    # Build recommendation
    recommendation = _build_recommendation(verdict, scores, ctx)

    # Evidence sources
    evidence = _build_evidence(ctx, similar, dna_data)

    # Store decision record
    decision = DecisionRecord(
        project_id=project_id,
        question=question,
        context_snapshot={
            "market_regime": regime.get("summary"),
            "recent_trades": len(ctx.get("recent_trades", [])),
            "total_patterns": len(patterns),
            "similar_trades_found": len(similar),
        },
        reasoning_steps=steps_run,
        evidence_sources=evidence,
        scores=scores,
        verdict=verdict.get("action"),
        confidence_score=scores.get("overall", 0),
        recommendation=recommendation,
        reasoning=reasoning_text,
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)

    return {
        "decision_id": decision.id,
        "question": question,
        "verdict": verdict.get("action"),
        "confidence_score": scores.get("overall", 0),
        "recommendation": recommendation,
        "reasoning": reasoning_text,
        "scores": scores,
        "reasoning_steps": steps_run,
        "evidence_sources": evidence,
    }


def _compute_scores(ctx: dict, similar: list, dna_data: dict | None) -> dict:
    stats = ctx.get("statistics", {}).get("overview", {})
    wr = stats.get("win_rate", 0) or 0
    rr = stats.get("avg_rr", 0) or 0
    total = stats.get("closed_trades", 0) or 0

    historical_score = min(100, wr * 0.5 + rr * 15 + min(total, 200) * 0.1)
    structure_score = 50.0
    regime = ctx.get("market_regime", {})
    if regime.get("trend"):
        structure_score += 20
    if regime.get("weekly_bias"):
        structure_score += 10
    if regime.get("daily_bias"):
        structure_score += 10

    session_score = 50.0
    sessions = ctx.get("session_info", {}).get("active_sessions", [])
    session_score += len(sessions) * 15

    psychology_score = 50.0
    psych = ctx.get("psychology", {})
    emotions = psych.get("recent_emotions", [])
    if any(e in str(emotions).lower() for e in ["calm", "confident", "focused"]):
        psychology_score += 20
    if any(e in str(emotions).lower() for e in ["fear", "greed", "revenge", "fomo"]):
        psychology_score -= 20

    discipline_score = dna_data.get("discipline", 50) if dna_data else 50.0
    if ctx.get("rules"):
        discipline_score += min(20, len(ctx["rules"]) * 2)

    similarity_score = 0
    if similar:
        win_rate = sum(1 for t in similar if t.get("trade_result") == "WIN") / max(len(similar), 1) * 100
        similarity_score = win_rate

    pattern_score = 0
    patterns = ctx.get("patterns", [])
    if patterns:
        top_conf = patterns[0].get("confidence", 0) or 0
        pattern_score = top_conf

    dna_score = dna_data.get("discipline", 50) if dna_data else 50

    overall = (
        historical_score * 0.15 +
        structure_score * 0.15 +
        session_score * 0.10 +
        psychology_score * 0.10 +
        discipline_score * 0.10 +
        similarity_score * 0.15 +
        pattern_score * 0.10 +
        dna_score * 0.15
    )
    overall = round(min(100, max(0, overall)), 1)

    return {
        "historical": round(historical_score, 1),
        "structure": round(structure_score, 1),
        "session": round(session_score, 1),
        "psychology": round(psychology_score, 1),
        "discipline": round(discipline_score, 1),
        "similarity": round(similarity_score, 1),
        "pattern_match": round(pattern_score, 1),
        "dna_alignment": round(dna_score, 1),
        "overall": overall,
    }


def _generate_verdict(scores: dict) -> dict:
    overall = scores.get("overall", 0)
    if overall >= 80:
        return {"action": "strong_buy", "label": "Strong Buy", "color": "green"}
    elif overall >= 65:
        return {"action": "buy", "label": "Buy", "color": "green"}
    elif overall >= 50:
        return {"action": "neutral", "label": "Neutral / Wait", "color": "yellow"}
    elif overall >= 35:
        return {"action": "sell", "label": "Sell / Avoid", "color": "red"}
    else:
        return {"action": "strong_sell", "label": "Strong Sell / Skip", "color": "red"}


def _build_recommendation(verdict: dict, scores: dict, ctx: dict) -> str:
    lines = [f"Recommendation: {verdict['label']}"]
    if scores.get("overall", 0) >= 65:
        lines.append("Conditions are favorable based on historical alignment.")
    elif scores.get("overall", 0) >= 50:
        lines.append("Mixed signals — proceed with caution.")
    else:
        lines.append("Conditions are unfavorable or data is insufficient.")
    return " | ".join(lines)


def _build_evidence(ctx: dict, similar: list, dna_data: dict | None) -> list[dict]:
    evidence = []
    stats = ctx.get("statistics", {}).get("overview", {})
    if stats:
        evidence.append({"source": "statistics", "data": {
            "win_rate": stats.get("win_rate"),
            "total_trades": stats.get("closed_trades"),
            "avg_rr": stats.get("avg_rr"),
        }})
    if similar:
        evidence.append({"source": "similar_trades", "data": {"count": len(similar), "matches": similar[:5]}})
    if dna_data:
        evidence.append({"source": "trader_dna", "data": dna_data})
    patterns = ctx.get("patterns", [])
    if patterns:
        evidence.append({"source": "personal_patterns", "data": patterns[:3]})
    rules = ctx.get("rules", [])
    if rules:
        evidence.append({"source": "rules", "data": {"count": len(rules), "titles": [r["title"] for r in rules[:5]]}})
    return evidence


def get_decision_history(db: Session, project_id: UUID, limit: int = 50) -> list[dict]:
    decisions = db.query(DecisionRecord).filter(
        DecisionRecord.project_id == project_id
    ).order_by(DecisionRecord.created_at.desc()).limit(limit).all()
    return [_decision_to_dict(d) for d in decisions]


def get_decision(db: Session, decision_id: str) -> dict | None:
    d = db.query(DecisionRecord).filter(DecisionRecord.id == decision_id).first()
    return _decision_to_dict(d) if d else None


def track_outcome(db: Session, decision_id: str, outcome: str, feedback: str | None = None) -> bool:
    d = db.query(DecisionRecord).filter(DecisionRecord.id == decision_id).first()
    if not d:
        return False
    d.actual_outcome = outcome
    if feedback:
        d.user_feedback = feedback
    db.commit()
    return True


def _decision_to_dict(d: DecisionRecord) -> dict:
    return {
        "id": d.id,
        "project_id": d.project_id,
        "question": d.question,
        "context_snapshot": d.context_snapshot,
        "reasoning_steps": d.reasoning_steps,
        "evidence_sources": d.evidence_sources,
        "scores": d.scores,
        "verdict": d.verdict,
        "confidence_score": d.confidence_score,
        "recommendation": d.recommendation,
        "reasoning": d.reasoning,
        "actual_outcome": d.actual_outcome,
        "user_feedback": d.user_feedback,
        "learning_result": d.learning_result,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }

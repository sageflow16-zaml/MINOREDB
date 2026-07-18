from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.trade import Trade
from src.models.market_structure import MarketStructure
from src.models.trader_intelligence import TradeDebrief, PersonalPattern, PersonalRule, TraderProfile
from src.schemas.trader_intelligence import (
    TradeDebriefCreate, TradeDebriefUpdate,
    PersonalPatternCreate, PersonalPatternUpdate,
    PersonalRuleCreate,
)
from src.crud import trader_intelligence as crud


# ============================================================
# TRADE DEBRIEF ENGINE
# ============================================================

def _review_entry(trade: Trade, ms: MarketStructure | None) -> str:
    parts = []
    if trade.weekly_bias:
        parts.append(f"Weekly bias: {trade.weekly_bias}")
    if trade.daily_bias:
        parts.append(f"Daily bias: {trade.daily_bias}")
    if ms and ms.market_phase:
        parts.append(f"Market phase at entry: {ms.market_phase}")
    if ms and ms.trend:
        parts.append(f"Market trend: {ms.trend}")
    if getattr(trade, "order_block", None):
        parts.append("Order block identified")
    if getattr(trade, "fvg", None):
        parts.append("Fair value gap identified")
    if getattr(trade, "bos", None):
        parts.append("Break of structure confirmed")
    if getattr(trade, "mss", None):
        parts.append("Market structure shift confirmed")
    if getattr(trade, "liquidity_sweep", None):
        parts.append(f"Liquidity sweep: {trade.liquidity_sweep}")
    if trade.entry_price:
        parts.append(f"Entry price: {trade.entry_price}")
    return " | ".join(parts) if parts else "No detailed entry context recorded."

def _review_execution(trade: Trade) -> str:
    parts = []
    if trade.position_size:
        parts.append(f"Position size: {trade.position_size}")
    if trade.risk_percent:
        parts.append(f"Risk: {trade.risk_percent}%")
    if trade.stop_loss:
        parts.append(f"Stop loss: {trade.stop_loss}")
    if trade.take_profit:
        parts.append(f"Take profit: {trade.take_profit}")
    if trade.rr:
        parts.append(f"R:R ratio: {trade.rr}")
    parts.append(f"Direction: {trade.direction or 'N/A'}")
    return " | ".join(parts) if parts else "No execution details recorded."

def _review_exit(trade: Trade) -> str:
    parts = []
    if trade.exit_price:
        parts.append(f"Exit price: {trade.exit_price}")
    if trade.pnl:
        parts.append(f"P&L: {trade.pnl}")
    if trade.result:
        parts.append(f"Result: {trade.result}")
    if trade.result == "WIN":
        parts.append("Trade hit target")
    elif trade.result == "LOSS":
        parts.append("Trade hit stop loss")
    if trade.status:
        parts.append(f"Status: {trade.status}")
    return " | ".join(parts) if parts else "No exit details recorded."

def _review_psychology(trade: Trade) -> str:
    parts = []
    if trade.result == "WIN":
        parts.append("Maintained discipline during winning trade")
    elif trade.result == "LOSS":
        if trade.risk_percent and trade.risk_percent > 2.0:
            parts.append("Risk exceeded comfortable threshold")
        if trade.rr and trade.rr < 1.0:
            parts.append("Took trade with unfavorable risk-to-reward")
        parts.append("Losses are part of trading — review for improvement")
    if trade.direction == "BUY":
        parts.append("Exhibited bullish conviction")
    elif trade.direction == "SELL":
        parts.append("Exhibited bearish conviction")
    return " | ".join(parts) if parts else "Psychology review: Standard trade execution."

def _generate_lessons(trade: Trade, strengths: list[str], weaknesses: list[str], mistakes: list[str]) -> list[str]:
    lessons = []
    if trade.result == "WIN":
        if trade.rr and trade.rr >= 2.0:
            lessons.append("High RR setups are profitable — continue screening for these")
        if trade.weekly_bias or trade.daily_bias:
            lessons.append("Higher timeframe alignment contributed to success")
        if getattr(trade, "mss", None) or getattr(trade, "bos", None):
            lessons.append("Structure-based entries lead to wins")
    else:
        if not trade.weekly_bias:
            lessons.append("Define higher timeframe bias before entering trades")
        if trade.rr and trade.rr < 1.0:
            lessons.append("Reject setups below 1:1 risk-to-reward")
        if not getattr(trade, "mss", None):
            lessons.append("Wait for market structure shift confirmation")
    for m in mistakes:
        lessons.append(f"Action item: Address '{m}' in future trades")
    return lessons

def generate_debrief_from_trade(db: Session, trade_id: UUID) -> TradeDebrief:
    trade = db.scalar(select(Trade).where(Trade.id == trade_id))
    if not trade:
        raise ValueError(f"Trade {trade_id} not found")
    ms = db.get(MarketStructure, trade.market_structure_id) if trade.market_structure_id else None

    entry_review = _review_entry(trade, ms)
    execution_review = _review_execution(trade)
    exit_review = _review_exit(trade)
    psychology_review = _review_psychology(trade)

    strengths = []
    if trade.result == "WIN":
        strengths.append("Profitable outcome")
    if trade.rr and trade.rr >= 2.0:
        strengths.append("Strong risk-to-reward management")
    elif trade.rr and trade.rr >= 1.5:
        strengths.append("Decent risk-to-reward management")
    if getattr(trade, "mss", None):
        strengths.append("Proper structure analysis before entry")
    if getattr(trade, "bos", None):
        strengths.append("Recognized break of structure")
    if trade.weekly_bias or trade.daily_bias:
        strengths.append("Incorporated higher timeframe analysis")

    weaknesses = []
    if trade.result == "LOSS":
        weaknesses.append("Trade resulted in loss")
    if trade.rr is not None and trade.rr < 1.0:
        weaknesses.append("Below breakeven risk-to-reward")
    if not trade.weekly_bias:
        weaknesses.append("No higher timeframe bias defined")

    mistakes = []
    if trade.result == "LOSS":
        if not getattr(trade, "mss", None):
            mistakes.append("Entered without MSS confirmation")
        if not getattr(trade, "bos", None):
            mistakes.append("No BOS confirmation before entry")
        if trade.rr and trade.rr < 1.0:
            mistakes.append("Accepted unfavorable risk-to-reward")
    if trade.result == "WIN" and trade.rr and trade.rr < 1.5:
        mistakes.append("Exited too early")
    if trade.risk_percent and trade.risk_percent > 2.0:
        mistakes.append("Risk exceeded 2% threshold")

    lessons = _generate_lessons(trade, strengths, weaknesses, mistakes)

    improvements = []
    if not trade.weekly_bias:
        improvements.append("Define weekly and daily bias before each trade")
    if not getattr(trade, "mss", None):
        improvements.append("Confirm market structure shift before entry")
    if trade.rr and trade.rr < 1.5:
        improvements.append("Target setups with at least 1:5 risk-to-reward")
    if trade.risk_percent and trade.risk_percent > 2.0:
        improvements.append("Reduce position size to keep risk under 2%")

    overall_rating = 7 if trade.result == "WIN" else 4
    if trade.rr and trade.rr >= 2.0:
        overall_rating += 1
    if trade.weekly_bias:
        overall_rating += 1
    overall_rating = max(1, min(10, overall_rating))

    summary_parts = [
        f"Debrief for {trade.pair or 'Unknown'} {trade.direction or 'N/A'} trade.",
        f"Outcome: {trade.result or 'Unknown'}.",
        f"Rating: {overall_rating}/10.",
        f"Key strengths: {', '.join(strengths[:3]) if strengths else 'None recorded'}.",
        f"Key improvements: {', '.join(improvements[:3]) if improvements else 'Continue current approach'}.",
    ]

    existing = crud.get_debrief_by_trade(db, trade_id=trade.id, project_id=trade.project_id)
    if existing:
        update_data = TradeDebriefUpdate(
            entry_review=entry_review, execution_review=execution_review,
            exit_review=exit_review, psychology_review=psychology_review,
            lessons_learned=lessons, strengths=strengths, weaknesses=weaknesses,
            mistakes=mistakes, improvements=improvements,
            overall_rating=overall_rating, summary=" ".join(summary_parts),
        )
        return crud.update_debrief(db, db_obj=existing, obj_in=update_data)

    debrief_in = TradeDebriefCreate(
        project_id=trade.project_id, trade_id=trade.id,
        entry_review=entry_review, execution_review=execution_review,
        exit_review=exit_review, psychology_review=psychology_review,
        lessons_learned=lessons, strengths=strengths, weaknesses=weaknesses,
        mistakes=mistakes, improvements=improvements,
        overall_rating=overall_rating, summary=" ".join(summary_parts),
    )
    return crud.create_debrief(db, obj_in=debrief_in)


# ============================================================
# PERSONAL PATTERN ENGINE
# ============================================================

def detect_personal_patterns(db: Session, project_id: UUID, limit: int = 50) -> list[PersonalPattern]:
    trades = db.scalars(
        select(Trade).where(Trade.project_id == project_id)
        .order_by(Trade.created_at.desc()).limit(limit)
    ).all()

    if not trades:
        return []

    session_map: dict[str, list[Trade]] = {}
    pair_map: dict[str, list[Trade]] = {}
    direction_map: dict[str, list[Trade]] = {}
    risk_map: dict[str, list[Trade]] = {}
    result_map: dict[str, list[Trade]] = {}

    for t in trades:
        session = _get_session(t)
        session_map.setdefault(session, []).append(t)
        if t.pair:
            pair_map.setdefault(t.pair, []).append(t)
        if t.direction:
            direction_map.setdefault(t.direction.upper(), []).append(t)
        risk = "HIGH" if (t.risk_percent or 0) > 2.0 else "STANDARD"
        risk_map.setdefault(risk, []).append(t)
        if t.result:
            result_map.setdefault(t.result, []).append(t)

    detected: list[PersonalPattern] = []

    patterns_config = [
        ("session", session_map),
        ("pair", pair_map),
        ("direction", direction_map),
        ("risk", risk_map),
        ("result", result_map),
    ]

    for category, data_map in patterns_config:
        for key, group in data_map.items():
            if len(group) < 2:
                continue
            wins = sum(1 for t in group if t.result == "WIN")
            losses = sum(1 for t in group if t.result == "LOSS")
            total_pnl = sum(t.pnl or 0 for t in group)
            avg_rr = (
                sum(t.rr or 0 for t in group if t.rr) / max(sum(1 for t in group if t.rr), 1)
            )
            total = wins + losses
            win_rate = wins / max(total, 1)
            confidence = round(win_rate * 100 * min(1.0, total / 10.0), 2)

            name = f"{key}_{category}" if category != "result" else f"{key}_outcome"
            pattern_in = PersonalPatternCreate(
                project_id=project_id,
                name=name.upper(),
                category=category,
                signature={"type": category, "value": key},
                description=f"{len(group)} trades with {key} ({category}): {wins}W/{losses}L, {win_rate:.0%} win rate.",
                trade_ids=[str(t.id) for t in group],
                occurrence_count=total,
                win_count=wins,
                loss_count=losses,
                total_pnl=round(total_pnl, 2),
                avg_rr=round(avg_rr, 2),
                confidence=confidence,
            )
            existing = db.scalars(
                select(PersonalPattern).where(
                    PersonalPattern.project_id == project_id,
                    PersonalPattern.name == pattern_in.name.upper(),
                )
            ).first()
            if existing:
                crud.update_pattern(db, db_obj=existing, obj_in=PersonalPatternUpdate(
                    occurrence_count=pattern_in.occurrence_count,
                    win_count=pattern_in.win_count,
                    loss_count=pattern_in.loss_count,
                    total_pnl=pattern_in.total_pnl,
                    avg_rr=pattern_in.avg_rr,
                    confidence=pattern_in.confidence,
                    description=pattern_in.description,
                    trade_ids=pattern_in.trade_ids,
                ))
                detected.append(existing)
            else:
                created = crud.create_pattern(db, obj_in=pattern_in)
                detected.append(created)

    return detected

def _get_session(trade: Trade) -> str:
    sessions = []
    if getattr(trade, "asian_session", None): sessions.append("ASIAN")
    if getattr(trade, "london_session", None): sessions.append("LONDON")
    if getattr(trade, "newyork_session", None): sessions.append("NEWYORK")
    return "_".join(sorted(sessions)) if sessions else "NONE"


# ============================================================
# PERSONAL RULE ENGINE
# ============================================================

def generate_proposed_rules(db: Session, project_id: UUID) -> list[PersonalRule]:
    patterns = crud.get_patterns(db, project_id=project_id, limit=100)
    debriefs = crud.get_debriefs(db, project_id=project_id, limit=100)

    rules: list[PersonalRule] = []
    seen_titles: set[str] = set()

    for pattern in patterns:
        if pattern.confidence and pattern.confidence >= 40.0:
            if pattern.win_count > pattern.loss_count:
                title = f"Prioritize {pattern.category}:{pattern.name}"
                if title not in seen_titles:
                    seen_titles.add(title)
                    description = (
                        f"Based on {pattern.occurrence_count} trades, {pattern.name} pattern "
                        f"shows {pattern.win_count}W/{pattern.loss_count}L "
                        f"({pattern.confidence:.0f}% confidence)."
                    )
                    support = {
                        "occurrence_count": pattern.occurrence_count,
                        "win_count": pattern.win_count,
                        "loss_count": pattern.loss_count,
                        "win_rate": round(pattern.win_count / max(pattern.occurrence_count, 1), 2),
                        "total_pnl": pattern.total_pnl,
                        "avg_rr": pattern.avg_rr,
                        "confidence": pattern.confidence,
                    }
                    rule_in = PersonalRuleCreate(
                        project_id=project_id, title=title,
                        category=f"pattern_{pattern.category}",
                        description=description,
                        evidence={"source": "personal_pattern", "pattern_id": str(pattern.id)},
                        supporting_stats=support,
                    )
                    existing = db.scalars(
                        select(PersonalRule).where(
                            PersonalRule.project_id == project_id,
                            PersonalRule.title == title,
                        )
                    ).first()
                    if existing:
                        rules.append(existing)
                    else:
                        rules.append(crud.create_rule(db, obj_in=rule_in))

    weakness_fixes = {
        "no higher timeframe bias defined": "Always define weekly and daily bias before entering any trade",
        "no market structure shift confirmation": "Wait for MSS confirmation before entry",
        "no bos confirmation before entry": "Confirm break of structure before entry",
    }

    for debrief in debriefs:
        if debrief.mistakes:
            for mistake in debrief.mistakes:
                for key, fix in weakness_fixes.items():
                    if key in mistake.lower():
                        title = f"Rule: {fix[:80]}"
                        if title not in seen_titles:
                            seen_titles.add(title)
                            existing = db.scalars(
                                select(PersonalRule).where(
                                    PersonalRule.project_id == project_id,
                                    PersonalRule.title == title,
                                )
                            ).first()
                            if not existing:
                                rule_in = PersonalRuleCreate(
                                    project_id=project_id, title=title,
                                    category="corrective",
                                    description=f"Generated from debrief mistake: '{mistake}'. {fix}.",
                                    evidence={"source": "trade_debrief", "mistake": mistake},
                                )
                                rules.append(crud.create_rule(db, obj_in=rule_in))
                            else:
                                rules.append(existing)

    return rules


# ============================================================
# TRADER PROFILE ENGINE
# ============================================================

def build_or_update_profile(db: Session, project_id: UUID) -> TraderProfile:
    profile = crud.get_or_create_profile(db, project_id)
    debriefs = crud.get_debriefs(db, project_id=project_id, limit=200)
    patterns = crud.get_patterns(db, project_id=project_id, limit=100)
    rules = crud.get_rules(db, project_id=project_id, limit=100)

    all_strengths: list[str] = []
    all_weaknesses: list[str] = []
    for d in debriefs:
        if d.strengths:
            all_strengths.extend(d.strengths)
        if d.weaknesses:
            all_weaknesses.extend(d.weaknesses)

    from collections import Counter
    top_strengths = [s for s, _ in Counter(all_strengths).most_common(10)] if all_strengths else []
    top_weaknesses = [w for w, _ in Counter(all_weaknesses).most_common(10)] if all_weaknesses else []

    active_patterns = [p for p in patterns if p.active]
    approved_rules = [r for r in rules if r.status == "approved"]
    draft_rules = [r for r in rules if r.status == "draft"]

    discipline_score = 50.0
    if approved_rules:
        discipline_score += min(20.0, len(approved_rules) * 2.0)
    if debriefs:
        avg_rating = sum(d.overall_rating or 5 for d in debriefs) / len(debriefs)
        discipline_score += (avg_rating - 5) * 3.0
    discipline_score = round(max(0.0, min(100.0, discipline_score)), 2)

    rule_adherence = {
        "total_rules": len(rules),
        "approved": len(approved_rules),
        "draft": len(draft_rules),
        "adherence_rate": round(len(approved_rules) / max(len(rules), 1) * 100, 2),
    }

    performance_trends = {}
    if patterns:
        avg_conf = sum(p.confidence or 0 for p in patterns) / max(len(patterns), 1)
        performance_trends["avg_pattern_confidence"] = round(avg_conf, 2)
        performance_trends["total_patterns"] = len(patterns)
        performance_trends["active_patterns"] = len(active_patterns)
    if debriefs:
        avg_r = sum(d.overall_rating or 5 for d in debriefs) / max(len(debriefs), 1)
        performance_trends["avg_debrief_rating"] = round(avg_r, 2)

    improvements: list[str] = []
    if all_weaknesses:
        improvements.append(f"Work on reducing: {', '.join(top_weaknesses[:3])}")
    if not approved_rules:
        improvements.append("Review and approve draft rules to build discipline")
    if active_patterns:
        improvements.append("Continue reinforcing identified patterns")
    if discipline_score < 60:
        improvements.append("Focus on discipline — follow your trading plan consistently")

    crud.update_profile(
        db, db_obj=profile,
        strengths=top_strengths, weaknesses=top_weaknesses,
        discipline_score=discipline_score, rule_adherence=rule_adherence,
        performance_trends=performance_trends,
        total_trades_analyzed=len(debriefs),
        total_debriefs=len(debriefs),
        active_patterns=len(active_patterns),
        approved_rules=len(approved_rules),
        improvement_suggestions=improvements,
    )

    crud.create_snapshot(
        db, project_id=project_id, snapshot_date=datetime.now(timezone.utc),
        strengths=top_strengths, weaknesses=top_weaknesses,
        discipline_score=discipline_score, rule_adherence=rule_adherence,
        total_trades_analyzed=len(debriefs), total_debriefs=len(debriefs),
        active_patterns=len(active_patterns), approved_rules=len(approved_rules),
    )

    return profile

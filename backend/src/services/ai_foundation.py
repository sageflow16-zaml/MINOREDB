"""
AI Foundation Services — Decision Engine, Pattern Detection, Knowledge,
Insights, Coaching, Memory, Context Builder, Provider Router.
"""
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from src.models.trade import Trade
from src.models.strategy import Strategy
from src.models.risk import RiskRule, RiskSnapshot
from src.models.planning import TradingPlan, DailyReview, Goal, Reminder, ChecklistExecution
from src.models.learning import LearningEvent
from src.models.ai_foundation import (
    AIProfile, TradeEvaluation, KnowledgeLink, DetectedPattern,
    CoachingSession, AIInsight, AIRecommendation, AISummary,
    AIContextSnapshot, AIProviderConfig,
)


# ═══════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════

def _dict(obj):
    if obj is None:
        return None
    return {attr.key: getattr(obj, attr.key) for attr in obj.__mapper__.attrs if hasattr(attr, 'columns')}


def _now():
    return datetime.utcnow()


def _today():
    return _now().strftime("%Y-%m-%d")


def _safe_score(val, default=50.0):
    if val is None:
        return default
    return max(0.0, min(100.0, float(val)))


# ═══════════════════════════════════════════════════════
# AI PROFILE
# ═══════════════════════════════════════════════════════

def get_or_create_profile(db: Session, project_id: UUID) -> dict:
    p = db.query(AIProfile).filter(AIProfile.project_id == project_id).first()
    if not p:
        p = AIProfile(project_id=project_id)
        db.add(p)
        db.commit()
        db.refresh(p)
    return _dict(p)


def update_profile(db: Session, project_id: UUID, data: dict) -> dict:
    p = db.query(AIProfile).filter(AIProfile.project_id == project_id).first()
    if not p:
        p = AIProfile(project_id=project_id)
        db.add(p)
    for k, v in data.items():
        if v is not None and hasattr(p, k):
            setattr(p, k, v)
    p.updated_at = _now()
    db.commit()
    db.refresh(p)
    return _dict(p)


def analyze_trader_profile(db: Session, project_id: UUID) -> dict:
    """Auto-generate profile from trade history."""
    trades = (
        db.query(Trade)
        .filter(Trade.project_id == project_id, Trade.status.in_(["closed", "win", "loss", "breakeven"]))
        .order_by(Trade.created_at.desc())
        .limit(200)
        .all()
    )
    if not trades:
        return get_or_create_profile(db, project_id)

    wins = [t for t in trades if (t.pnl or 0) > 0]
    losses = [t for t in trades if (t.pnl or 0) < 0]
    total = len(trades)
    win_rate = len(wins) / total * 100 if total else 0

    avg_rr = sum(t.rr or 0 for t in trades) / total if total else 0
    avg_risk = sum(abs(t.risk_percent or 0) for t in trades) / total if total else 0
    avg_pnl = sum(t.pnl or 0 for t in trades) / total if total else 0

    # Session analysis
    session_counts = {}
    session_pnl = {}
    for t in trades:
        for sess in ["london", "newyork", "asian"]:
            val = getattr(t, f"{sess}_session", None)
            if val and val.lower() in ("yes", "true", "1", "active"):
                session_counts[sess] = session_counts.get(sess, 0) + 1
                session_pnl[sess] = session_pnl.get(sess, 0) + (t.pnl or 0)

    best_session = max(session_pnl, key=session_pnl.get) if session_pnl else None
    preferred_sessions = sorted(session_counts, key=session_counts.get, reverse=True)[:3] if session_counts else []

    # Pair analysis
    pair_counts = {}
    pair_pnl = {}
    for t in trades:
        p = t.pair or "unknown"
        pair_counts[p] = pair_counts.get(p, 0) + 1
        pair_pnl[p] = pair_pnl.get(p, 0) + (t.pnl or 0)

    preferred_pairs = sorted(pair_counts, key=pair_counts.get, reverse=True)[:5]

    # Emotion analysis
    emotions = {}
    for t in trades:
        e = t.emotion or "unknown"
        if e not in emotions:
            emotions[e] = {"count": 0, "pnl": 0, "wins": 0}
        emotions[e]["count"] += 1
        emotions[e]["pnl"] += t.pnl or 0
        if (t.pnl or 0) > 0:
            emotions[e]["wins"] += 1

    # Style detection
    avg_holding = 0
    style = "day"
    if avg_rr > 3:
        style = "swing"
    elif avg_rr < 1:
        style = "scalper"

    # Risk profile
    risk = "moderate"
    if avg_risk < 0.5:
        risk = "conservative"
    elif avg_risk > 2.0:
        risk = "aggressive"

    # Compute max drawdown
    running = 0
    peak = 0
    max_dd = 0
    for t in reversed(trades):
        running += t.pnl or 0
        peak = max(peak, running)
        dd = (peak - running) / peak * 100 if peak > 0 else 0
        max_dd = max(max_dd, dd)

    # Psychological patterns
    psych_patterns = []
    for emotion, data in sorted(emotions.items(), key=lambda x: x[1]["count"], reverse=True):
        wr = data["wins"] / data["count"] * 100 if data["count"] else 0
        psych_patterns.append({
            "pattern": f"{emotion} trades",
            "frequency": data["count"],
            "impact": "positive" if wr > win_rate else "negative",
            "win_rate": round(wr, 1),
        })

    # Common mistakes
    mistakes = []
    if losses:
        for t in losses[:10]:
            if t.notes:
                mistakes.append({"trade_id": str(t.id), "note": t.notes[:200], "pnl": t.pnl})

    # Best/worst conditions
    best = {"sessions": [best_session] if best_session else [], "pairs": preferred_pairs[:2]}
    worst_sessions = [s for s in session_pnl if session_pnl[s] < 0]
    worst = {"sessions": worst_sessions, "pairs": []}

    # Overall score
    overall = (win_rate * 0.3) + (_safe_score(50 + avg_rr * 10) * 0.3) + (max(0, 100 - max_dd) * 0.2) + (min(100, total * 2) * 0.2)

    profile_data = {
        "trading_style": style,
        "preferred_sessions": preferred_sessions,
        "preferred_timeframes": ["M15", "H1", "H4"],
        "preferred_pairs": preferred_pairs,
        "risk_profile": risk,
        "avg_rr": round(avg_rr, 2),
        "avg_holding_time_min": round(avg_holding, 1),
        "avg_risk_per_trade": round(avg_risk, 2),
        "max_drawdown_pct": round(max_dd, 2),
        "best_conditions": best,
        "worst_conditions": worst,
        "psychological_patterns": psych_patterns,
        "most_common_mistakes": mistakes[:5],
        "most_successful_behaviors": [
            {"behavior": f"Trading {best_session}", "win_rate": round(session_pnl.get(best_session, 0), 2)}
        ] if best_session else [],
        "learning_progress": {"level": "intermediate" if total > 50 else "beginner", "total_reviews": total},
        "overall_score": round(overall, 1),
        "total_trades_analyzed": total,
        "last_analyzed_at": _now().isoformat(),
    }

    return update_profile(db, project_id, profile_data)


# ═══════════════════════════════════════════════════════
# DECISION SUPPORT ENGINE
# ═══════════════════════════════════════════════════════

def evaluate_trade(db: Session, project_id: UUID, trade_id: UUID) -> dict:
    """Rule-based trade evaluation — no LLM required."""
    trade = db.query(Trade).filter(Trade.id == trade_id, Trade.project_id == project_id).first()
    if not trade:
        return None

    # ── Strength Score ──
    strength = 50.0
    if trade.rr and trade.rr >= 2: strength += 15
    if trade.rr and trade.rr >= 3: strength += 10
    if trade.pnl and trade.pnl > 0: strength += 10
    if trade.liquidity_sweep and trade.liquidity_sweep.lower() in ("yes", "true"): strength += 5
    if trade.bos and trade.bos.lower() in ("yes", "true"): strength += 5
    if trade.order_block and trade.order_block.lower() in ("yes", "true"): strength += 5

    # ── Risk Score (lower is better — invert for display) ──
    risk = 100.0
    rp = abs(trade.risk_percent or 0)
    if rp > 3: risk -= 30
    elif rp > 2: risk -= 15
    elif rp > 1: risk -= 5
    if trade.stop_loss and trade.entry_price:
        sl_dist = abs(trade.entry_price - trade.stop_loss) / trade.entry_price * 100
        if sl_dist > 2: risk -= 15
        elif sl_dist > 1: risk -= 5

    # ── Execution Score ──
    execution = 50.0
    if trade.entry_price and trade.exit_price and trade.stop_loss:
        execution += 10
    if trade.position_size and trade.position_size > 0:
        execution += 10
    if trade.status in ("closed", "win", "loss") and trade.exit_price:
        execution += 15
    if trade.notes and len(trade.notes) > 20:
        execution += 5  # documented

    # ── Psychology Score ──
    psychology = 50.0
    positive_emotions = ["confident", "calm", "focused", "disciplined", "patient"]
    negative_emotions = ["fear", "greed", "revenge", "fomo", "anxious", "overconfident"]
    if trade.emotion:
        e = trade.emotion.lower()
        if any(p in e for p in positive_emotions): psychology += 20
        elif any(n in e for n in negative_emotions): psychology -= 15

    # ── Discipline Score ──
    discipline = 60.0
    if trade.risk_percent and trade.risk_percent <= 1.0: discipline += 15
    if trade.stop_loss: discipline += 10
    if trade.take_profit: discipline += 5
    if trade.rr and trade.rr >= 1.5: discipline += 5

    # ── Strategy Alignment ──
    alignment = 50.0
    if trade.strategy_id:
        strategy = db.query(Strategy).filter(Strategy.id == trade.strategy_id).first()
        if strategy:
            alignment += 20
            if trade.result == "win": alignment += 15

    # ── Confidence Score ──
    confidence = 50.0
    confirmed_count = sum(1 for x in [trade.bos, trade.mss, trade.order_block, trade.fvg, trade.liquidity_sweep]
                         if x and x.lower() in ("yes", "true"))
    confidence += confirmed_count * 8

    # ── Overall Quality ──
    overall = (strength * 0.2 + (100 - risk) * 0.15 + execution * 0.15 + psychology * 0.15 +
               discipline * 0.15 + alignment * 0.1 + confidence * 0.1)

    # ── Critique ──
    critique = _build_critique(trade, strength, risk, execution, psychology, discipline)

    evaluation = {
        "trade_id": trade_id,
        "strength_score": round(min(100, strength), 1),
        "risk_score": round(min(100, risk), 1),
        "execution_score": round(min(100, execution), 1),
        "psychology_score": round(min(100, psychology), 1),
        "discipline_score": round(min(100, discipline), 1),
        "strategy_alignment": round(min(100, alignment), 1),
        "confidence_score": round(min(100, confidence), 1),
        "overall_quality": round(min(100, overall), 1),
        "critique": critique,
        "provider": "rule_based",
        "evaluated_at": _now().isoformat(),
    }

    # Save
    existing = db.query(TradeEvaluation).filter(TradeEvaluation.trade_id == trade_id).first()
    if existing:
        for k, v in evaluation.items():
            if k != "trade_id" and v is not None:
                setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return _dict(existing)
    else:
        ev = TradeEvaluation(project_id=project_id, **evaluation)
        db.add(ev)
        db.commit()
        db.refresh(ev)
        return _dict(ev)


def _build_critique(trade, strength, risk, execution, psychology, discipline):
    what_well = []
    what_wrong = []
    violations = []
    suggestions = []

    if trade.rr and trade.rr >= 2:
        what_well.append(f"Good R:R ratio of {trade.rr}")
    if trade.stop_loss:
        what_well.append("Stop loss defined")
    else:
        what_wrong.append("No stop loss set")
        violations.append("Missing stop loss")
        suggestions.append("Always set a stop loss before entering")
    if trade.take_profit:
        what_well.append("Take profit target defined")
    if trade.position_size:
        what_well.append("Position size calculated")
    if trade.emotion:
        neg = ["fear", "greed", "revenge", "fomo"]
        if any(n in trade.emotion.lower() for n in neg):
            what_wrong.append(f"Negative emotion detected: {trade.emotion}")
            suggestions.append("Practice emotional awareness before trading")

    if trade.risk_percent and trade.risk_percent > 2:
        what_wrong.append(f"High risk per trade: {trade.risk_percent}%")
        violations.append("Risk exceeds 2% guideline")
        suggestions.append("Reduce risk per trade to 1-2%")

    if trade.notes and len(trade.notes) > 20:
        what_well.append("Trade well-documented")
    else:
        suggestions.append("Add more detailed notes for review")

    return {
        "what_went_well": what_well,
        "what_went_wrong": what_wrong,
        "rule_violations": violations,
        "execution_quality": "good" if execution > 65 else "needs_improvement",
        "risk_quality": "good" if risk > 60 else "needs_improvement",
        "entry_quality": "good" if trade.entry_price else "missing_data",
        "exit_quality": "good" if trade.exit_price else "pending",
        "psychology_observations": [f"Emotion: {trade.emotion}"] if trade.emotion else [],
        "improvement_suggestions": suggestions,
    }


def get_trade_evaluations(db: Session, project_id: UUID, limit: int = 50) -> list[dict]:
    evs = (
        db.query(TradeEvaluation)
        .filter(TradeEvaluation.project_id == project_id)
        .order_by(TradeEvaluation.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_dict(e) for e in evs]


# ═══════════════════════════════════════════════════════
# PATTERN DETECTION
# ═══════════════════════════════════════════════════════

def detect_patterns(db: Session, project_id: UUID) -> list[dict]:
    """Scan trade history for recurring patterns."""
    trades = (
        db.query(Trade)
        .filter(Trade.project_id == project_id, Trade.status.in_(["closed", "win", "loss", "breakeven"]))
        .order_by(Trade.created_at.desc())
        .limit(500)
        .all()
    )
    if not trades:
        return []

    # Deactivate old patterns
    db.query(DetectedPattern).filter(DetectedPattern.project_id == project_id).update({"is_active": False})

    patterns = []

    # ── Session Patterns ──
    for sess in ["london", "newyork", "asian"]:
        sess_trades = [t for t in trades if getattr(t, f"{sess}_session", None)
                       and getattr(t, f"{sess}_session", "").lower() in ("yes", "true", "1", "active")]
        if len(sess_trades) >= 5:
            wins = [t for t in sess_trades if (t.pnl or 0) > 0]
            wr = len(wins) / len(sess_trades) * 100
            avg_pnl = sum(t.pnl or 0 for t in sess_trades) / len(sess_trades)
            is_win = wr > 50
            patterns.append({
                "pattern_type": "session", "pattern_key": sess,
                "pattern_value": "winning" if is_win else "losing",
                "confidence": min(1.0, len(sess_trades) / 50),
                "sample_size": len(sess_trades),
                "avg_pnl": round(avg_pnl, 2), "win_rate": round(wr, 1),
                "description": f"{'Winning' if is_win else 'Losing'} session: {sess} ({len(sess_trades)} trades, {wr:.0f}% WR)",
                "is_positive": is_win,
            })

    # ── Weekday Patterns ──
    day_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for i, day in enumerate(day_names):
        day_trades = [t for t in trades if t.created_at and t.created_at.weekday() == i]
        if len(day_trades) >= 5:
            wins = [t for t in day_trades if (t.pnl or 0) > 0]
            wr = len(wins) / len(day_trades) * 100
            avg_pnl = sum(t.pnl or 0 for t in day_trades) / len(day_trades)
            is_win = wr > 50
            patterns.append({
                "pattern_type": "weekday", "pattern_key": day,
                "pattern_value": "winning" if is_win else "losing",
                "confidence": min(1.0, len(day_trades) / 30),
                "sample_size": len(day_trades),
                "avg_pnl": round(avg_pnl, 2), "win_rate": round(wr, 1),
                "description": f"{'Winning' if is_win else 'Losing'} on {day} ({len(day_trades)} trades, {wr:.0f}% WR)",
                "is_positive": is_win,
            })

    # ── Strategy Patterns ──
    strat_map = {}
    for t in trades:
        sid = str(t.strategy_id) if t.strategy_id else "none"
        if sid not in strat_map:
            strat_map[sid] = []
        strat_map[sid].append(t)
    for sid, strades in strat_map.items():
        if len(strades) >= 5:
            wins = [t for t in strades if (t.pnl or 0) > 0]
            wr = len(wins) / len(strades) * 100
            avg_pnl = sum(t.pnl or 0 for t in strades) / len(strades)
            is_win = wr > 50
            patterns.append({
                "pattern_type": "strategy", "pattern_key": sid,
                "pattern_value": "winning" if is_win else "losing",
                "confidence": min(1.0, len(strades) / 30),
                "sample_size": len(strades),
                "avg_pnl": round(avg_pnl, 2), "win_rate": round(wr, 1),
                "description": f"Strategy {sid}: {'winning' if is_win else 'losing'} ({wr:.0f}% WR)",
                "is_positive": is_win,
            })

    # ── Emotion Patterns ──
    emotion_map = {}
    for t in trades:
        e = t.emotion or "unknown"
        if e not in emotion_map:
            emotion_map[e] = []
        emotion_map[e].append(t)
    for emotion, etrades in emotion_map.items():
        if len(etrades) >= 3:
            wins = [t for t in etrades if (t.pnl or 0) > 0]
            wr = len(wins) / len(etrades) * 100
            avg_pnl = sum(t.pnl or 0 for t in etrades) / len(etrades)
            patterns.append({
                "pattern_type": "emotion", "pattern_key": emotion,
                "pattern_value": "positive" if wr > 50 else "negative",
                "confidence": min(1.0, len(etrades) / 20),
                "sample_size": len(etrades),
                "avg_pnl": round(avg_pnl, 2), "win_rate": round(wr, 1),
                "description": f"Trading with {emotion}: {wr:.0f}% WR ({len(etrades)} trades)",
                "is_positive": wr > 50,
            })

    # ── Pair Patterns ──
    pair_map = {}
    for t in trades:
        p = t.pair or "unknown"
        if p not in pair_map:
            pair_map[p] = []
        pair_map[p].append(t)
    for pair, ptrades in pair_map.items():
        if len(ptrades) >= 5:
            wins = [t for t in ptrades if (t.pnl or 0) > 0]
            wr = len(wins) / len(ptrades) * 100
            avg_pnl = sum(t.pnl or 0 for t in ptrades) / len(ptrades)
            is_win = wr > 50
            patterns.append({
                "pattern_type": "pair", "pattern_key": pair,
                "pattern_value": "winning" if is_win else "losing",
                "confidence": min(1.0, len(ptrades) / 30),
                "sample_size": len(ptrades),
                "avg_pnl": round(avg_pnl, 2), "win_rate": round(wr, 1),
                "description": f"{pair}: {'winning' if is_win else 'losing'} ({wr:.0f}% WR)",
                "is_positive": is_win,
            })

    # ── Persist ──
    for p in patterns:
        dp = DetectedPattern(project_id=project_id, last_detected_at=_now(), **p)
        db.add(dp)
    db.commit()

    return [_dict(dp) for dp in db.query(DetectedPattern).filter(
        DetectedPattern.project_id == project_id, DetectedPattern.is_active == True
    ).order_by(DetectedPattern.confidence.desc()).all()]


def get_patterns(db: Session, project_id: UUID, pattern_type: str = None) -> list[dict]:
    q = db.query(DetectedPattern).filter(DetectedPattern.project_id == project_id, DetectedPattern.is_active == True)
    if pattern_type:
        q = q.filter(DetectedPattern.pattern_type == pattern_type)
    return [_dict(p) for p in q.order_by(DetectedPattern.confidence.desc()).all()]


# ═══════════════════════════════════════════════════════
# KNOWLEDGE ENGINE
# ═══════════════════════════════════════════════════════

def create_link(db: Session, project_id: UUID, data: dict) -> dict:
    link = KnowledgeLink(project_id=project_id, **data)
    db.add(link)
    db.commit()
    db.refresh(link)
    return _dict(link)


def get_links(db: Session, project_id: UUID, entity_type: str = None, entity_id: UUID = None) -> list[dict]:
    q = db.query(KnowledgeLink).filter(KnowledgeLink.project_id == project_id)
    if entity_type and entity_id:
        q = q.filter(
            or_(
                and_(KnowledgeLink.source_type == entity_type, KnowledgeLink.source_id == entity_id),
                and_(KnowledgeLink.target_type == entity_type, KnowledgeLink.target_id == entity_id),
            )
        )
    return [_dict(l) for l in q.order_by(KnowledgeLink.created_at.desc()).limit(100).all()]


def delete_link(db: Session, link_id: UUID) -> bool:
    link = db.query(KnowledgeLink).filter(KnowledgeLink.id == link_id).first()
    if not link:
        return False
    db.delete(link)
    db.commit()
    return True


def auto_link_trades(db: Session, project_id: UUID) -> int:
    """Auto-link trades to strategies, journals, and risk events."""
    trades = db.query(Trade).filter(Trade.project_id == project_id).all()
    count = 0
    for t in trades:
        # Link trade to strategy
        if t.strategy_id:
            exists = db.query(KnowledgeLink).filter(
                KnowledgeLink.project_id == project_id,
                KnowledgeLink.source_type == "trade", KnowledgeLink.source_id == t.id,
                KnowledgeLink.target_type == "strategy", KnowledgeLink.target_id == t.strategy_id,
            ).first()
            if not exists:
                db.add(KnowledgeLink(
                    project_id=project_id,
                    source_type="trade", source_id=t.id,
                    target_type="strategy", target_id=t.strategy_id,
                    relationship="follows_strategy",
                ))
                count += 1
    db.commit()
    return count


# ═══════════════════════════════════════════════════════
# INSIGHTS
# ═══════════════════════════════════════════════════════

def generate_insights(db: Session, project_id: UUID) -> list[dict]:
    """Generate personalized trading insights from data analysis."""
    trades = (
        db.query(Trade)
        .filter(Trade.project_id == project_id, Trade.status.in_(["closed", "win", "loss", "breakeven"]))
        .order_by(Trade.created_at.desc())
        .limit(200)
        .all()
    )
    if not trades:
        return []

    insights = []
    total = len(trades)
    wins = [t for t in trades if (t.pnl or 0) > 0]
    win_rate = len(wins) / total * 100 if total else 0

    # Session insights
    for sess in ["london", "newyork", "asian"]:
        st = [t for t in trades if getattr(t, f"{sess}_session", None)
              and getattr(t, f"{sess}_session", "").lower() in ("yes", "true", "1", "active")]
        if len(st) >= 5:
            sw = [t for t in st if (t.pnl or 0) > 0]
            swr = len(sw) / len(st) * 100
            if swr > win_rate + 5:
                insights.append({
                    "insight_type": "session", "category": "positive",
                    "title": f"Your win rate increases during {sess.title()}",
                    "description": f"{swr:.0f}% win rate in {sess} vs {win_rate:.0f}% overall",
                    "confidence": min(1.0, len(st) / 30),
                })
            elif swr < win_rate - 10:
                insights.append({
                    "insight_type": "session", "category": "negative",
                    "title": f"Consider avoiding {sess.title()} sessions",
                    "description": f"Only {swr:.0f}% win rate in {sess} vs {win_rate:.0f}% overall",
                    "confidence": min(1.0, len(st) / 30),
                })

    # Friday insight
    fri_trades = [t for t in trades if t.created_at and t.created_at.weekday() == 4]
    if len(fri_trades) >= 5:
        fri_wins = [t for t in fri_trades if (t.pnl or 0) > 0]
        fri_wr = len(fri_wins) / len(fri_trades) * 100
        if fri_wr < win_rate - 10:
            insights.append({
                "insight_type": "timing", "category": "warning",
                "title": "You overtrade on Fridays",
                "description": f"Friday win rate: {fri_wr:.0f}% vs overall {win_rate:.0f}%",
                "confidence": min(1.0, len(fri_trades) / 20),
            })

    # Consecutive loss insight
    max_consec_loss = 0
    curr = 0
    for t in reversed(trades):
        if (t.pnl or 0) < 0:
            curr += 1
            max_consec_loss = max(max_consec_loss, curr)
        else:
            curr = 0
    if max_consec_loss >= 4:
        insights.append({
            "insight_type": "psychology", "category": "warning",
            "title": f"You had {max_consec_loss} consecutive losses",
            "description": "Consider reducing size or pausing after 3 consecutive losses",
            "confidence": 0.8,
        })

    # Risk insight
    high_risk = [t for t in trades if (t.risk_percent or 0) > 2]
    if high_risk:
        hr_wr = len([t for t in high_risk if (t.pnl or 0) > 0]) / len(high_risk) * 100
        if hr_wr < win_rate:
            insights.append({
                "insight_type": "risk", "category": "negative",
                "title": "High-risk trades underperform",
                "description": f"Trades >2% risk: {hr_wr:.0f}% WR vs {win_rate:.0f}% overall",
                "confidence": min(1.0, len(high_risk) / 10),
            })

    # Best strategy insight
    strat_map = {}
    for t in trades:
        sid = str(t.strategy_id) if t.strategy_id else None
        if sid:
            if sid not in strat_map:
                strat_map[sid] = {"wins": 0, "total": 0, "pnl": 0}
            strat_map[sid]["total"] += 1
            strat_map[sid]["pnl"] += t.pnl or 0
            if (t.pnl or 0) > 0:
                strat_map[sid]["wins"] += 1
    for sid, sd in strat_map.items():
        if sd["total"] >= 5:
            sd["wr"] = sd["wins"] / sd["total"] * 100
    if strat_map:
        best = max(strat_map.items(), key=lambda x: x[1].get("wr", 0))
        if best[1]["wr"] > win_rate + 10:
            insights.append({
                "insight_type": "strategy", "category": "positive",
                "title": f"Most profitable strategy: {best[0][:8]}",
                "description": f"{best[1]['wr']:.0f}% win rate over {best[1]['total']} trades",
                "confidence": min(1.0, best[1]["total"] / 20),
            })

    # Early exit insight
    early_exits = [t for t in trades if t.rr and t.rr < 0.5 and (t.pnl or 0) > 0]
    if len(early_exits) >= 3:
        insights.append({
            "insight_type": "execution", "category": "warning",
            "title": "You exit winners too early",
            "description": f"{len(early_exits)} trades closed with R:R < 0.5 despite being profitable",
            "confidence": min(1.0, len(early_exits) / 10),
        })

    # Persist insights
    db.query(AIInsight).filter(AIInsight.project_id == project_id).delete()
    for ins in insights:
        db.add(AIInsight(project_id=project_id, **ins))
    db.commit()

    return [_dict(i) for i in db.query(AIInsight).filter(AIInsight.project_id == project_id).order_by(AIInsight.confidence.desc()).all()]


def get_insights(db: Session, project_id: UUID) -> list[dict]:
    return [_dict(i) for i in db.query(AIInsight).filter(
        AIInsight.project_id == project_id, AIInsight.is_dismissed == False
    ).order_by(AIInsight.confidence.desc()).all()]


def dismiss_insight(db: Session, insight_id: UUID) -> bool:
    ins = db.query(AIInsight).filter(AIInsight.id == insight_id).first()
    if not ins:
        return False
    ins.is_dismissed = True
    db.commit()
    return True


# ═══════════════════════════════════════════════════════
# RECOMMENDATIONS
# ═══════════════════════════════════════════════════════

def generate_recommendations(db: Session, project_id: UUID) -> list[dict]:
    """Generate actionable recommendations based on trade analysis."""
    trades = (
        db.query(Trade)
        .filter(Trade.project_id == project_id, Trade.status.in_(["closed", "win", "loss", "breakeven"]))
        .order_by(Trade.created_at.desc())
        .limit(200)
        .all()
    )
    recommendations = []
    if not trades:
        return recommendations

    total = len(trades)
    wins = [t for t in trades if (t.pnl or 0) > 0]
    win_rate = len(wins) / total * 100

    # Risk recommendations
    high_risk = [t for t in trades if (t.risk_percent or 0) > 2]
    if high_risk and len(high_risk) > total * 0.2:
        recommendations.append({
            "recommendation_type": "risk", "priority": "high",
            "title": "Reduce risk per trade",
            "description": f"{len(high_risk)} trades exceeded 2% risk. Reduce to 1-2% max.",
            "rationale": "High-risk trades historically underperform for your profile",
        })

    # Session recommendations
    for sess in ["london", "newyork", "asian"]:
        st = [t for t in trades if getattr(t, f"{sess}_session", None)
              and getattr(t, f"{sess}_session", "").lower() in ("yes", "true", "1", "active")]
        if len(st) >= 5:
            sw = [t for t in st if (t.pnl or 0) > 0]
            swr = len(sw) / len(st) * 100
            if swr > win_rate + 10:
                recommendations.append({
                    "recommendation_type": "session", "priority": "medium",
                    "title": f"Trade more during {sess.title()}",
                    "description": f"Your {sess} win rate is {swr:.0f}%, significantly above average",
                    "rationale": "Focus on your strongest session for better results",
                })

    # Friday recommendation
    fri = [t for t in trades if t.created_at and t.created_at.weekday() == 4]
    if len(fri) >= 5:
        fri_wr = len([t for t in fri if (t.pnl or 0) > 0]) / len(fri) * 100
        if fri_wr < win_rate - 10:
            recommendations.append({
                "recommendation_type": "timing", "priority": "medium",
                "title": "Avoid Friday trading",
                "description": f"Friday win rate: {fri_wr:.0f}%. Consider taking Fridays off.",
                "rationale": "Friday trades consistently underperform",
            })

    # Review recommendation
    if total > 10:
        recent_evals = db.query(TradeEvaluation).filter(TradeEvaluation.project_id == project_id).count()
        if recent_evals < total * 0.3:
            recommendations.append({
                "recommendation_type": "review", "priority": "low",
                "title": "Review your recent trades",
                "description": f"{total - recent_evals} trades haven't been evaluated yet",
                "rationale": "Regular review improves self-awareness and pattern recognition",
            })

    # Psychology recommendation
    neg_emo = [t for t in trades if t.emotion and any(n in t.emotion.lower() for n in ["revenge", "fomo", "greed"])]
    if neg_emo and len(neg_emo) > 3:
        recommendations.append({
            "recommendation_type": "psychology", "priority": "high",
            "title": "Work on emotional discipline",
            "description": f"{len(neg_emo)} trades driven by revenge/FOMO/greed emotions",
            "rationale": "Emotional trading is the #1 destroyer of accounts",
        })

    # Consecutive loss
    max_consec = 0
    curr = 0
    for t in reversed(trades):
        if (t.pnl or 0) < 0:
            curr += 1
            max_consec = max(max_consec, curr)
        else:
            curr = 0
    if max_consec >= 5:
        recommendations.append({
            "recommendation_type": "risk", "priority": "critical",
            "title": "Implement max consecutive loss rule",
            "description": f"You had {max_consec} consecutive losses. Stop after 3-4 losses.",
            "rationale": "Consecutive losses compound psychological damage",
        })

    # Persist
    db.query(AIRecommendation).filter(AIRecommendation.project_id == project_id).delete()
    for rec in recommendations:
        db.add(AIRecommendation(project_id=project_id, **rec))
    db.commit()

    return [_dict(r) for r in db.query(AIRecommendation).filter(
        AIRecommendation.project_id == project_id, AIRecommendation.is_dismissed == False
    ).order_by(
        func.case(
            (AIRecommendation.priority == "critical", 0),
            (AIRecommendation.priority == "high", 1),
            (AIRecommendation.priority == "medium", 2),
            else_=3,
        )
    ).all()]


def get_recommendations(db: Session, project_id: UUID) -> list[dict]:
    return [_dict(r) for r in db.query(AIRecommendation).filter(
        AIRecommendation.project_id == project_id, AIRecommendation.is_dismissed == False
    ).all()]


def dismiss_recommendation(db: Session, rec_id: UUID) -> bool:
    r = db.query(AIRecommendation).filter(AIRecommendation.id == rec_id).first()
    if not r:
        return False
    r.is_dismissed = True
    db.commit()
    return True


# ═══════════════════════════════════════════════════════
# COACHING SYSTEM
# ═══════════════════════════════════════════════════════

def generate_coaching(db: Session, project_id: UUID, session_type: str, date: str = None) -> dict:
    """Generate a coaching session based on recent trading data."""
    if not date:
        date = _today()

    now = datetime.strptime(date, "%Y-%m-%d")

    # Determine period
    if session_type == "daily":
        start = date
        end = date
    elif session_type == "weekly":
        start = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
        end = date
    elif session_type == "monthly":
        start = now.replace(day=1).strftime("%Y-%m-%d")
        end = date
    else:
        start = date
        end = date

    trades = (
        db.query(Trade)
        .filter(
            Trade.project_id == project_id,
            Trade.status.in_(["closed", "win", "loss", "breakeven"]),
            func.date(Trade.created_at) >= start,
            func.date(Trade.created_at) <= end,
        )
        .all()
    )

    total = len(trades)
    wins = [t for t in trades if (t.pnl or 0) > 0]
    losses = [t for t in trades if (t.pnl or 0) < 0]
    total_pnl = sum(t.pnl or 0 for t in trades)
    win_rate = len(wins) / total * 100 if total else 0
    avg_rr = sum(t.rr or 0 for t in trades) / total if total else 0

    # Strengths
    strengths = []
    if win_rate > 50: strengths.append(f"Win rate of {win_rate:.0f}% above 50%")
    if avg_rr > 1.5: strengths.append(f"Average R:R of {avg_rr:.1f} is solid")
    if total > 0 and total_pnl > 0: strengths.append(f"Net profitable: ${total_pnl:.2f}")

    # Weaknesses
    weaknesses = []
    if win_rate < 40: weaknesses.append(f"Win rate at {win_rate:.0f}% needs improvement")
    if avg_rr < 1: weaknesses.append(f"Average R:R of {avg_rr:.1f} below 1:1")
    if total_pnl < 0: weaknesses.append(f"Net loss of ${total_pnl:.2f}")

    # Key findings
    findings = []
    if total > 0:
        best_trade = max(trades, key=lambda t: t.pnl or 0)
        worst_trade = min(trades, key=lambda t: t.pnl or 0)
        findings.append({"finding": f"Best trade: ${best_trade.pnl:.2f}", "category": "performance", "impact": "positive"})
        findings.append({"finding": f"Worst trade: ${worst_trade.pnl:.2f}", "category": "performance", "impact": "negative"})

    # Action items
    actions = []
    if win_rate < 50:
        actions.append({"action": "Focus on A+ setups only", "priority": "high", "deadline": end, "completed": False})
    if avg_rr < 1.5:
        actions.append({"action": "Improve target placement for better R:R", "priority": "medium", "deadline": end, "completed": False})

    # Score
    score = (win_rate * 0.4 + min(100, avg_rr * 30) * 0.3 + min(100, max(0, 50 + total_pnl / 10)) * 0.3)

    metrics = {
        "total_trades": total, "win_rate": round(win_rate, 1),
        "total_pnl": round(total_pnl, 2), "avg_rr": round(avg_rr, 2),
        "wins": len(wins), "losses": len(losses),
    }

    coaching = CoachingSession(
        project_id=project_id,
        session_type=session_type,
        session_date=date,
        period_start=start,
        period_end=end,
        summary=f"{'Daily' if session_type == 'daily' else session_type.title()} review: {total} trades, {win_rate:.0f}% WR, ${total_pnl:.2f} P&L",
        key_findings=findings,
        action_items=actions,
        strengths=strengths,
        weaknesses=weaknesses,
        score=round(score, 1),
        metrics_snapshot=metrics,
    )
    db.add(coaching)
    db.commit()
    db.refresh(coaching)
    return _dict(coaching)


def get_coaching_sessions(db: Session, project_id: UUID, session_type: str = None) -> list[dict]:
    q = db.query(CoachingSession).filter(CoachingSession.project_id == project_id)
    if session_type:
        q = q.filter(CoachingSession.session_type == session_type)
    return [_dict(c) for c in q.order_by(CoachingSession.created_at.desc()).limit(50).all()]


# ═══════════════════════════════════════════════════════
# AI MEMORY / SUMMARIES
# ═══════════════════════════════════════════════════════

def create_summary(db: Session, project_id: UUID, data: dict) -> dict:
    s = AISummary(project_id=project_id, **data)
    db.add(s)
    db.commit()
    db.refresh(s)
    return _dict(s)


def get_summaries(db: Session, project_id: UUID, summary_type: str = None, period: str = None) -> list[dict]:
    q = db.query(AISummary).filter(AISummary.project_id == project_id)
    if summary_type:
        q = q.filter(AISummary.summary_type == summary_type)
    if period:
        q = q.filter(AISummary.period == period)
    return [_dict(s) for s in q.order_by(AISummary.created_at.desc()).limit(100).all()]


def generate_performance_summary(db: Session, project_id: UUID) -> dict:
    """Generate a performance summary snapshot."""
    trades = (
        db.query(Trade)
        .filter(Trade.project_id == project_id, Trade.status.in_(["closed", "win", "loss", "breakeven"]))
        .order_by(Trade.created_at.desc())
        .limit(200)
        .all()
    )
    total = len(trades)
    wins = [t for t in trades if (t.pnl or 0) > 0]
    total_pnl = sum(t.pnl or 0 for t in trades)

    content = {
        "total_trades": total,
        "win_rate": round(len(wins) / total * 100, 1) if total else 0,
        "total_pnl": round(total_pnl, 2),
        "avg_pnl": round(total_pnl / total, 2) if total else 0,
        "avg_rr": round(sum(t.rr or 0 for t in trades) / total, 2) if total else 0,
        "best_trade": round(max((t.pnl or 0) for t in trades), 2) if trades else 0,
        "worst_trade": round(min((t.pnl or 0) for t in trades), 2) if trades else 0,
    }

    data = {
        "summary_type": "performance",
        "period": "all_time",
        "content": content,
        "text_summary": f"{total} trades, {content['win_rate']}% WR, ${total_pnl:.2f} total P&L",
        "sentiment": "positive" if total_pnl > 0 else "negative",
        "importance": 0.8,
    }

    # Upsert
    existing = db.query(AISummary).filter(
        AISummary.project_id == project_id, AISummary.summary_type == "performance", AISummary.period == "all_time"
    ).first()
    if existing:
        for k, v in data.items():
            setattr(existing, k, v)
        existing.updated_at = _now()
        db.commit()
        db.refresh(existing)
        return _dict(existing)
    else:
        return create_summary(db, project_id, data)


# ═══════════════════════════════════════════════════════
# CONTEXT BUILDER
# ═══════════════════════════════════════════════════════

def build_context(db: Session, project_id: UUID, trade_id: UUID = None, options: dict = None) -> dict:
    """Aggregate all relevant context for AI consumption."""
    opts = options or {}
    ctx = {}

    if opts.get("include_performance", True):
        trades = (
            db.query(Trade)
            .filter(Trade.project_id == project_id, Trade.status.in_(["closed", "win", "loss", "breakeven"]))
            .order_by(Trade.created_at.desc()).limit(200).all()
        )
        total = len(trades)
        wins = [t for t in trades if (t.pnl or 0) > 0]
        ctx["performance"] = {
            "total_trades": total,
            "win_rate": round(len(wins) / total * 100, 1) if total else 0,
            "total_pnl": round(sum(t.pnl or 0 for t in trades), 2),
            "avg_rr": round(sum(t.rr or 0 for t in trades) / total, 2) if total else 0,
        }

    if opts.get("include_recent_trades", True):
        recent = (
            db.query(Trade)
            .filter(Trade.project_id == project_id)
            .order_by(Trade.created_at.desc())
            .limit(opts.get("max_recent_trades", 20))
            .all()
        )
        ctx["recent_trades"] = [
            {"id": str(t.id), "pair": t.pair, "direction": t.direction,
             "pnl": t.pnl, "result": t.result, "emotion": t.emotion,
             "rr": t.rr, "risk_percent": t.risk_percent}
            for t in recent
        ]

    if opts.get("include_strategies", True):
        strats = db.query(Strategy).filter(Strategy.project_id == project_id).all()
        ctx["active_strategies"] = [{"id": str(s.id), "name": s.name} for s in strats]

    if opts.get("include_risk", True):
        rules = db.query(RiskRule).filter(RiskRule.project_id == project_id, RiskRule.is_active == True).all()
        ctx["risk_rules"] = [{"name": r.name, "rule_type": r.rule_type, "limit_value": r.limit_value} for r in rules]

    if opts.get("include_planning", True):
        today = _today()
        plan = db.query(TradingPlan).filter(TradingPlan.project_id == project_id, TradingPlan.plan_date == today).first()
        if plan:
            ctx["planning"] = {"market_bias": plan.market_bias, "key_levels": plan.key_levels, "notes": plan.notes}

    if opts.get("include_goals", True):
        goals = db.query(Goal).filter(Goal.project_id == project_id, Goal.status == "active").all()
        ctx["goals"] = [{"title": g.title, "target": g.target_value, "current": g.current_value, "unit": g.unit} for g in goals]

    if opts.get("include_patterns", True):
        patterns = db.query(DetectedPattern).filter(
            DetectedPattern.project_id == project_id, DetectedPattern.is_active == True
        ).order_by(DetectedPattern.confidence.desc()).limit(10).all()
        ctx["patterns"] = [{"type": p.pattern_type, "key": p.pattern_key, "value": p.pattern_value,
                            "win_rate": p.win_rate, "confidence": p.confidence} for p in patterns]

    if opts.get("include_psychology", True):
        profile = db.query(AIProfile).filter(AIProfile.project_id == project_id).first()
        if profile:
            ctx["psychology"] = {
                "patterns": profile.psychological_patterns,
                "mistakes": profile.most_common_mistakes,
                "behaviors": profile.most_successful_behaviors,
            }

    # Save snapshot
    snap = AIContextSnapshot(
        project_id=project_id,
        snapshot_type="on_demand" if not trade_id else "pre_trade",
        trade_id=trade_id,
        context=ctx,
    )
    db.add(snap)
    db.commit()

    return ctx


# ═══════════════════════════════════════════════════════
# AI PROVIDER ROUTER
# ═══════════════════════════════════════════════════════

def get_providers(db: Session) -> list[dict]:
    return [_dict(p) for p in db.query(AIProviderConfig).order_by(AIProviderConfig.provider_name).all()]


def get_default_provider(db: Session) -> dict | None:
    p = db.query(AIProviderConfig).filter(AIProviderConfig.is_default == True, AIProviderConfig.is_enabled == True).first()
    return _dict(p) if p else None


def create_provider(db: Session, data: dict) -> dict:
    if data.get("is_default"):
        db.query(AIProviderConfig).update({"is_default": False})
    p = AIProviderConfig(**data)
    db.add(p)
    db.commit()
    db.refresh(p)
    return _dict(p)


def update_provider(db: Session, provider_id: UUID, data: dict) -> dict | None:
    p = db.query(AIProviderConfig).filter(AIProviderConfig.id == provider_id).first()
    if not p:
        return None
    if data.get("is_default"):
        db.query(AIProviderConfig).update({"is_default": False})
    for k, v in data.items():
        if v is not None:
            setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return _dict(p)


def delete_provider(db: Session, provider_id: UUID) -> bool:
    p = db.query(AIProviderConfig).filter(AIProviderConfig.id == provider_id).first()
    if not p:
        return False
    db.delete(p)
    db.commit()
    return True


# ═══════════════════════════════════════════════════════
# AI DASHBOARD
# ═══════════════════════════════════════════════════════

def get_ai_dashboard(db: Session, project_id: UUID) -> dict:
    """Aggregate all AI data for the dashboard."""
    profile = db.query(AIProfile).filter(AIProfile.project_id == project_id).first()
    insights = get_insights(db, project_id)[:5]
    recommendations = get_recommendations(db, project_id)[:5]
    coaching = get_coaching_sessions(db, project_id)[:3]
    patterns = get_patterns(db, project_id)[:5]

    # Learning progress from profile
    learning = profile.learning_progress if profile else None

    # Recent improvements (positive insights)
    improvements = [i["title"] for i in insights if i.get("category") == "positive"][:5]

    # Areas to improve
    areas = [i["title"] for i in insights if i.get("category") in ("negative", "warning")][:5]

    return {
        "profile": _dict(profile) if profile else None,
        "latest_insights": insights,
        "coaching_cards": coaching,
        "recommendations": recommendations,
        "detected_patterns": patterns,
        "learning_progress": learning,
        "recent_improvements": improvements,
        "areas_to_improve": areas,
        "overall_score": profile.overall_score if profile else None,
    }


# ═══════════════════════════════════════════════════════
# KNOWLEDGE LINKS CRUD
# ═══════════════════════════════════════════════════════

def get_all_links(db: Session, project_id: UUID) -> list[dict]:
    return [_dict(l) for l in db.query(KnowledgeLink).filter(
        KnowledgeLink.project_id == project_id
    ).order_by(KnowledgeLink.created_at.desc()).limit(200).all()]


def get_link_graph(db: Session, project_id: UUID, entity_type: str = None, entity_id: UUID = None) -> dict:
    """Return nodes + edges for graph visualization."""
    links = get_links(db, project_id, entity_type, entity_id) if entity_type else get_all_links(db, project_id)

    nodes = {}
    edges = []
    for l in links:
        src_key = f"{l['source_type']}:{l['source_id']}"
        tgt_key = f"{l['target_type']}:{l['target_id']}"
        if src_key not in nodes:
            nodes[src_key] = {"id": src_key, "type": l["source_type"], "entity_id": str(l["source_id"])}
        if tgt_key not in nodes:
            nodes[tgt_key] = {"id": tgt_key, "type": l["target_type"], "entity_id": str(l["target_id"])}
        edges.append({"source": src_key, "target": tgt_key, "relationship": l["relationship"], "strength": l["strength"]})

    return {"nodes": list(nodes.values()), "edges": edges}

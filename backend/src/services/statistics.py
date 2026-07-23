from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from sqlalchemy import select, func, and_, case
from sqlalchemy.orm import Session
from src.models.trade import Trade
from src.models.market_structure import MarketStructure
from src.models.strategy import Strategy


def get_statistics_overview(
    db: Session,
    project_id: UUID,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> dict:
    """Compute all statistics for a project."""
    base_query = select(Trade).where(Trade.project_id == project_id)
    
    if start_date:
        base_query = base_query.where(Trade.created_at >= start_date)
    if end_date:
        base_query = base_query.where(Trade.created_at <= end_date)

    # Get all closed trades for calculations
    closed_query = base_query.where(Trade.status == "CLOSED")
    closed_trades = db.scalars(closed_query).all()

    # Get all trades for counts
    all_trades = db.scalars(base_query).all()

    # Basic counts
    total_trades = len(all_trades)
    closed_count = len(closed_trades)
    wins = len([t for t in closed_trades if t.result == "WIN"])
    losses = len([t for t in closed_trades if t.result == "LOSS"])
    breakevens = len([t for t in closed_trades if t.result == "BE"])
    open_count = len([t for t in all_trades if t.status == "OPEN"])

    # Win rate
    win_rate = round((wins / closed_count * 100), 1) if closed_count > 0 else 0.0

    # Average R:R
    avg_rr = 0.0
    if closed_count > 0:
        rr_values = [t.rr for t in closed_trades if t.rr is not None]
        avg_rr = round(sum(rr_values) / len(rr_values), 2) if rr_values else 0.0

    # Total P&L
    total_pnl = round(sum([t.pnl for t in closed_trades if t.pnl is not None]), 2)

    # Expectancy
    avg_win = 0.0
    avg_loss = 0.0
    if wins > 0:
        win_pnls = [t.pnl for t in closed_trades if t.result == "WIN" and t.pnl is not None]
        avg_win = sum(win_pnls) / len(win_pnls) if win_pnls else 0.0
    if losses > 0:
        loss_pnls = [t.pnl for t in closed_trades if t.result == "LOSS" and t.pnl is not None]
        avg_loss = sum(loss_pnls) / len(loss_pnls) if loss_pnls else 0.0
    
    expectancy = 0.0
    if closed_count > 0:
        expectancy = round((win_rate / 100 * avg_win) + ((100 - win_rate) / 100 * avg_loss), 2)

    # Risk metrics
    max_drawdown = compute_max_drawdown(closed_trades)
    profit_factor = compute_profit_factor(closed_trades)
    sharpe_ratio = compute_sharpe_ratio(closed_trades)
    recovery_factor = compute_recovery_factor(closed_trades, max_drawdown)

    # By Pair
    by_pair = compute_by_field(closed_trades, "pair")

    # By Direction
    by_direction = compute_by_field(closed_trades, "direction")

    # By Result
    by_result = {"WIN": wins, "LOSS": losses, "BE": breakevens}

    # By Bias
    by_bias = compute_bias_breakdown(closed_trades)

    # By Session
    by_session = compute_session_breakdown(closed_trades)

    # By Market Phase
    by_market_phase = compute_by_field(closed_trades, "market_phase")

    # By Trend
    by_trend = compute_by_field(closed_trades, "trend")

    # NEW: By Strategy
    by_strategy = compute_by_strategy(db, closed_trades, project_id)

    # NEW: By Weekday
    by_weekday = compute_by_weekday(closed_trades)

    # NEW: By Timeframe
    by_timeframe = compute_by_field(closed_trades, "timeframe")

    # NEW: By Market Condition
    by_market_condition = compute_by_field(closed_trades, "market_condition")

    # NEW: By Volatility
    by_volatility = compute_by_field(closed_trades, "volatility")

    # NEW: By News Days
    by_news = compute_by_news(closed_trades)

    # NEW: By Setup Type
    by_setup = compute_by_field(closed_trades, "setup_type")

    # Monthly returns
    monthly_returns = compute_monthly_returns(closed_trades)

    # NEW: Weekly returns
    weekly_returns = compute_weekly_returns(closed_trades)

    # NEW: Yearly returns
    yearly_returns = compute_yearly_returns(closed_trades)

    # Rolling windows
    rolling_10 = compute_rolling_window(closed_trades, 10)
    rolling_50 = compute_rolling_window(closed_trades, 50)

    # NEW: Risk Analytics
    risk_analytics = compute_risk_analytics(closed_trades)

    # NEW: Psychology/Behavior Analytics
    psychology_analytics = compute_psychology_analytics(closed_trades)

    # NEW: Calendar Heatmap Data
    calendar_heatmap = compute_calendar_heatmap(closed_trades)

    # NEW: Scatter Plot Data
    scatter_data = compute_scatter_data(closed_trades)

    return {
        "overview": {
            "total_trades": total_trades,
            "closed_trades": closed_count,
            "wins": wins,
            "losses": losses,
            "breakevens": breakevens,
            "open_trades": open_count,
            "win_rate": win_rate,
            "avg_rr": avg_rr,
            "total_pnl": total_pnl,
            "expectancy": expectancy,
            "avg_win": round(avg_win, 2),
            "avg_loss": round(avg_loss, 2),
        },
        "risk": {
            "max_drawdown": round(max_drawdown, 2),
            "profit_factor": round(profit_factor, 2),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "recovery_factor": round(recovery_factor, 2),
        },
        "by_pair": by_pair,
        "by_direction": by_direction,
        "by_result": by_result,
        "by_bias": by_bias,
        "by_session": by_session,
        "by_market_phase": by_market_phase,
        "by_trend": by_trend,
        "by_strategy": by_strategy,
        "by_weekday": by_weekday,
        "by_timeframe": by_timeframe,
        "by_market_condition": by_market_condition,
        "by_volatility": by_volatility,
        "by_news": by_news,
        "by_setup": by_setup,
        "monthly_returns": monthly_returns,
        "weekly_returns": weekly_returns,
        "yearly_returns": yearly_returns,
        "rolling_10": rolling_10,
        "rolling_50": rolling_50,
        "risk_analytics": risk_analytics,
        "psychology_analytics": psychology_analytics,
        "calendar_heatmap": calendar_heatmap,
        "scatter_data": scatter_data,
    }


def compute_by_field(trades: list[Trade], field: str) -> dict:
    """Compute statistics grouped by a field."""
    result = {}
    for trade in trades:
        value = getattr(trade, field, None) or "Unknown"
        if value not in result:
            result[value] = {"trades": 0, "wins": 0, "losses": 0, "pnl": 0.0, "win_rate": 0.0}
        result[value]["trades"] += 1
        if trade.result == "WIN":
            result[value]["wins"] += 1
        elif trade.result == "LOSS":
            result[value]["losses"] += 1
        if trade.pnl is not None:
            result[value]["pnl"] = round(result[value]["pnl"] + trade.pnl, 2)
    
    for key in result:
        t = result[key]["trades"]
        w = result[key]["wins"]
        result[key]["win_rate"] = round((w / t * 100), 1) if t > 0 else 0.0
    
    return result


def compute_bias_breakdown(trades: list[Trade]) -> dict:
    """Compute statistics by bias combination."""
    result = {}
    for trade in trades:
        bias_key = f"{trade.weekly_bias or 'N/A'}/{trade.daily_bias or 'N/A'}/{trade.h4_bias or 'N/A'}"
        if bias_key not in result:
            result[bias_key] = {"trades": 0, "wins": 0, "losses": 0, "pnl": 0.0, "win_rate": 0.0}
        result[bias_key]["trades"] += 1
        if trade.result == "WIN":
            result[bias_key]["wins"] += 1
        elif trade.result == "LOSS":
            result[bias_key]["losses"] += 1
        if trade.pnl is not None:
            result[bias_key]["pnl"] = round(result[bias_key]["pnl"] + trade.pnl, 2)
    
    for key in result:
        t = result[key]["trades"]
        w = result[key]["wins"]
        result[key]["win_rate"] = round((w / t * 100), 1) if t > 0 else 0.0
    
    return result


def compute_session_breakdown(trades: list[Trade]) -> dict:
    """Compute statistics by trading session."""
    sessions = ["asian_session", "london_session", "newyork_session"]
    result = {}
    for trade in trades:
        for session in sessions:
            value = getattr(trade, session, None) or "N/A"
            if value not in result:
                result[value] = {"trades": 0, "wins": 0, "losses": 0, "pnl": 0.0, "win_rate": 0.0}
            result[value]["trades"] += 1
            if trade.result == "WIN":
                result[value]["wins"] += 1
            elif trade.result == "LOSS":
                result[value]["losses"] += 1
            if trade.pnl is not None:
                result[value]["pnl"] = round(result[value]["pnl"] + trade.pnl, 2)
    
    for key in result:
        t = result[key]["trades"]
        w = result[key]["wins"]
        result[key]["win_rate"] = round((w / t * 100), 1) if t > 0 else 0.0
    
    return result


def compute_monthly_returns(trades: list[Trade]) -> list[dict]:
    """Compute monthly P&L returns."""
    monthly = {}
    for trade in trades:
        if trade.created_at and trade.pnl is not None:
            month_key = trade.created_at.strftime("%Y-%m")
            if month_key not in monthly:
                monthly[month_key] = {"pnl": 0.0, "trades": 0, "wins": 0, "losses": 0}
            monthly[month_key]["pnl"] = round(monthly[month_key]["pnl"] + trade.pnl, 2)
            monthly[month_key]["trades"] += 1
            if trade.result == "WIN":
                monthly[month_key]["wins"] += 1
            elif trade.result == "LOSS":
                monthly[month_key]["losses"] += 1
    
    return [
        {"month": k, "pnl": v["pnl"], "trades": v["trades"], "wins": v["wins"], "losses": v["losses"]}
        for k, v in sorted(monthly.items())
    ]


def compute_rolling_window(trades: list[Trade], window: int) -> dict:
    """Compute rolling statistics over a window of trades."""
    sorted_trades = sorted(trades, key=lambda t: t.created_at or datetime.min)
    if len(sorted_trades) < window:
        return {"available": False, "trades_needed": window - len(sorted_trades)}
    
    recent = sorted_trades[-window:]
    wins = len([t for t in recent if t.result == "WIN"])
    losses = len([t for t in recent if t.result == "LOSS"])
    total = len(recent)
    pnl = sum([t.pnl for t in recent if t.pnl is not None])
    win_rate = round((wins / total * 100), 1) if total > 0 else 0.0
    
    return {
        "available": True,
        "window": window,
        "trades": total,
        "wins": wins,
        "losses": losses,
        "win_rate": win_rate,
        "pnl": round(pnl, 2),
    }


def compute_max_drawdown(trades: list[Trade]) -> float:
    """Compute maximum drawdown from peak equity."""
    sorted_trades = sorted(trades, key=lambda t: t.created_at or datetime.min)
    equity = 0.0
    peak = 0.0
    max_dd = 0.0
    
    for trade in sorted_trades:
        if trade.pnl is not None:
            equity += trade.pnl
            if equity > peak:
                peak = equity
            dd = peak - equity
            if dd > max_dd:
                max_dd = dd
    
    return max_dd


def compute_profit_factor(trades: list[Trade]) -> float:
    """Compute profit factor (gross profit / gross loss)."""
    gross_profit = sum([t.pnl for t in trades if t.pnl is not None and t.pnl > 0])
    gross_loss = abs(sum([t.pnl for t in trades if t.pnl is not None and t.pnl < 0]))
    return gross_profit / gross_loss if gross_loss > 0 else 0.0


def compute_sharpe_ratio(trades: list[Trade]) -> float:
    """Compute simplified Sharpe ratio."""
    pnls = [t.pnl for t in trades if t.pnl is not None]
    if len(pnls) < 2:
        return 0.0
    import statistics
    mean = statistics.mean(pnls)
    stdev = statistics.stdev(pnls) if len(pnls) > 1 else 0
    return mean / stdev if stdev > 0 else 0.0


def compute_recovery_factor(trades: list[Trade], max_drawdown: float) -> float:
    """Compute recovery factor (net profit / max drawdown)."""
    total_profit = sum([t.pnl for t in trades if t.pnl is not None])
    return total_profit / max_drawdown if max_drawdown > 0 else 0.0


def get_equity_curve(db: Session, project_id: UUID) -> list[dict]:
    """Get equity curve data points."""
    trades = db.scalars(
        select(Trade)
        .where(Trade.project_id == project_id)
        .where(Trade.status == "CLOSED")
        .where(Trade.pnl.is_not(None))
        .order_by(Trade.created_at)
    ).all()
    
    equity = 0.0
    points = []
    for trade in trades:
        equity += trade.pnl
        points.append({
            "date": trade.created_at.isoformat() if trade.created_at else None,
            "equity": round(equity, 2),
            "trade_id": str(trade.id),
            "pnl": trade.pnl,
        })
    
    return points


def get_pnl_distribution(db: Session, project_id: UUID) -> dict:
    """Get P&L distribution histogram data."""
    pnls = db.scalars(
        select(Trade.pnl)
        .where(Trade.project_id == project_id)
        .where(Trade.status == "CLOSED")
        .where(Trade.pnl.is_not(None))
    ).all()
    
    if not pnls:
        return {"bins": [], "counts": []}
    
    try:
        import numpy as np
        counts, bins = np.histogram(pnls, bins=20)
        return {
            "bins": [round(b, 2) for b in bins.tolist()],
            "counts": counts.tolist(),
        }
    except ImportError:
        return {"bins": [], "counts": [], "error": "numpy not installed"}


def get_rr_distribution(db: Session, project_id: UUID) -> dict:
    """Get R:R distribution histogram data."""
    rrs = db.scalars(
        select(Trade.rr)
        .where(Trade.project_id == project_id)
        .where(Trade.status == "CLOSED")
        .where(Trade.rr.is_not(None))
    ).all()
    
    if not rrs:
        return {"bins": [], "counts": []}
    
    try:
        import numpy as np
        counts, bins = np.histogram(rrs, bins=20)
        return {
            "bins": [round(b, 2) for b in bins.tolist()],
            "counts": counts.tolist(),
        }
    except ImportError:
        return {"bins": [], "counts": [], "error": "numpy not installed"}


# ──────────────────────────────────────────────────────────────────────
# NEW: Phase 2.5 - Performance Intelligence Extensions
# ──────────────────────────────────────────────────────────────────────

def compute_by_strategy(db: Session, trades: list[Trade], project_id: UUID) -> dict:
    """Compute statistics grouped by strategy."""
    # Get strategy names for the project
    strategies = db.scalars(
        select(Strategy).where(Strategy.project_id == project_id)
    ).all()
    strategy_map = {str(s.id): s.name for s in strategies}
    
    result = {}
    for trade in trades:
        strategy_id = str(trade.strategy_id) if trade.strategy_id else None
        strategy_name = strategy_map.get(strategy_id, "No Strategy") if strategy_id else "No Strategy"
        if strategy_name not in result:
            result[strategy_name] = {"trades": 0, "wins": 0, "losses": 0, "pnl": 0.0, "win_rate": 0.0, "avg_rr": 0.0, "expectancy": 0.0}
        result[strategy_name]["trades"] += 1
        if trade.result == "WIN":
            result[strategy_name]["wins"] += 1
        elif trade.result == "LOSS":
            result[strategy_name]["losses"] += 1
        if trade.pnl is not None:
            result[strategy_name]["pnl"] = round(result[strategy_name]["pnl"] + trade.pnl, 2)
        if trade.rr is not None:
            # Accumulate RR for average
            current_avg = result[strategy_name].get("avg_rr", 0)
            current_count = result[strategy_name].get("rr_count", 0)
            result[strategy_name]["avg_rr"] = round((current_avg * current_count + trade.rr) / (current_count + 1), 2)
            result[strategy_name]["rr_count"] = current_count + 1
    
    for key in result:
        t = result[key]["trades"]
        w = result[key]["wins"]
        result[key]["win_rate"] = round((w / t * 100), 1) if t > 0 else 0.0
        result[key].pop("rr_count", None)
        if t > 0:
            strategy_ids_for_key = [k for k, v in strategy_map.items() if v == key]
            if strategy_ids_for_key:
                avg_win = sum([tr.pnl for tr in trades if tr.strategy_id and str(tr.strategy_id) in [str(s) for s in strategy_ids_for_key] and tr.result == "WIN" and tr.pnl is not None], 0.0) / max(w, 1) if w > 0 else 0
                avg_loss = sum([tr.pnl for tr in trades if tr.strategy_id and str(tr.strategy_id) in [str(s) for s in strategy_ids_for_key] and tr.result == "LOSS" and tr.pnl is not None], 0.0) / max(t - w, 1) if t > w else 0
            else:
                avg_win = 0
                avg_loss = 0
            result[key]["expectancy"] = round((w / t * avg_win) + ((t - w) / t * avg_loss), 2) if t > 0 else 0.0
    
    return result


def compute_by_weekday(trades: list[Trade]) -> dict:
    """Compute statistics by day of week."""
    weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    result = {}
    for trade in trades:
        if trade.created_at:
            weekday = trade.created_at.strftime("%A")
            if weekday not in result:
                result[weekday] = {"trades": 0, "wins": 0, "losses": 0, "pnl": 0.0, "win_rate": 0.0}
            result[weekday]["trades"] += 1
            if trade.result == "WIN":
                result[weekday]["wins"] += 1
            elif trade.result == "LOSS":
                result[weekday]["losses"] += 1
            if trade.pnl is not None:
                result[weekday]["pnl"] = round(result[weekday]["pnl"] + trade.pnl, 2)
    
    for key in result:
        t = result[key]["trades"]
        w = result[key]["wins"]
        result[key]["win_rate"] = round((w / t * 100), 1) if t > 0 else 0.0
    
    # Ensure all weekdays present in order
    ordered = {}
    for day in weekdays:
        if day in result:
            ordered[day] = result[day]
        else:
            ordered[day] = {"trades": 0, "wins": 0, "losses": 0, "pnl": 0.0, "win_rate": 0.0}
    
    return ordered


def compute_weekly_returns(trades: list[Trade]) -> list[dict]:
    """Compute weekly P&L returns."""
    weekly = {}
    for trade in trades:
        if trade.created_at and trade.pnl is not None:
            year, week, _ = trade.created_at.isocalendar()
            week_key = f"{year}-W{week:02d}"
            if week_key not in weekly:
                weekly[week_key] = {"pnl": 0.0, "trades": 0, "wins": 0, "losses": 0}
            weekly[week_key]["pnl"] = round(weekly[week_key]["pnl"] + trade.pnl, 2)
            weekly[week_key]["trades"] += 1
            if trade.result == "WIN":
                weekly[week_key]["wins"] += 1
            elif trade.result == "LOSS":
                weekly[week_key]["losses"] += 1
    
    return [
        {"week": k, "pnl": v["pnl"], "trades": v["trades"], "wins": v["wins"], "losses": v["losses"]}
        for k, v in sorted(weekly.items())
    ]


def compute_yearly_returns(trades: list[Trade]) -> list[dict]:
    """Compute yearly P&L returns."""
    yearly = {}
    for trade in trades:
        if trade.created_at and trade.pnl is not None:
            year_key = str(trade.created_at.year)
            if year_key not in yearly:
                yearly[year_key] = {"pnl": 0.0, "trades": 0, "wins": 0, "losses": 0, "win_rate": 0.0}
            yearly[year_key]["pnl"] = round(yearly[year_key]["pnl"] + trade.pnl, 2)
            yearly[year_key]["trades"] += 1
            if trade.result == "WIN":
                yearly[year_key]["wins"] += 1
            elif trade.result == "LOSS":
                yearly[year_key]["losses"] += 1
    
    for key in yearly:
        t = yearly[key]["trades"]
        w = yearly[key]["wins"]
        yearly[key]["win_rate"] = round((w / t * 100), 1) if t > 0 else 0.0
    
    return [
        {"year": k, "pnl": v["pnl"], "trades": v["trades"], "wins": v["wins"], "losses": v["losses"], "win_rate": v["win_rate"]}
        for k, v in sorted(yearly.items())
    ]


def compute_by_news(trades: list[Trade]) -> dict:
    """Compute statistics by news event presence."""
    result = {"News Day": {"trades": 0, "wins": 0, "losses": 0, "pnl": 0.0, "win_rate": 0.0},
              "No News": {"trades": 0, "wins": 0, "losses": 0, "pnl": 0.0, "win_rate": 0.0}}
    
    for trade in trades:
        has_news = bool(trade.news_event and trade.news_event.strip())
        key = "News Day" if has_news else "No News"
        result[key]["trades"] += 1
        if trade.result == "WIN":
            result[key]["wins"] += 1
        elif trade.result == "LOSS":
            result[key]["losses"] += 1
        if trade.pnl is not None:
            result[key]["pnl"] = round(result[key]["pnl"] + trade.pnl, 2)
    
    for key in result:
        t = result[key]["trades"]
        w = result[key]["wins"]
        result[key]["win_rate"] = round((w / t * 100), 1) if t > 0 else 0.0
    
    return result


def compute_risk_analytics(trades: list[Trade]) -> dict:
    """Compute detailed risk analytics."""
    if not trades:
        return {
            "avg_risk_percent": 0.0,
            "avg_position_size": 0.0,
            "total_exposure": 0.0,
            "max_position_size": 0.0,
            "rr_distribution": {"bins": [], "counts": []},
            "drawdown_analysis": {"max_dd": 0.0, "avg_dd": 0.0, "dd_duration": 0},
            "risk_usage": {"current": 0.0, "max": 0.0, "avg": 0.0},
            "rule_violations": 0,
        }
    
    # Average risk %
    risks = [t.risk_percent for t in trades if t.risk_percent is not None]
    avg_risk = round(sum(risks) / len(risks), 2) if risks else 0.0
    
    # Average position size
    sizes = [t.position_size for t in trades if t.position_size is not None]
    avg_size = round(sum(sizes) / len(sizes), 4) if sizes else 0.0
    max_size = round(max(sizes), 4) if sizes else 0.0
    
    # Total exposure (sum of position sizes for open trades, or recent)
    total_exposure = round(sum(sizes), 2)
    
    # RR Distribution
    rrs = [t.rr for t in trades if t.rr is not None]
    rr_dist = {"bins": [], "counts": []}
    if rrs:
        try:
            import numpy as np
            counts, bins = np.histogram(rrs, bins=15)
            rr_dist = {
                "bins": [round(b, 2) for b in bins.tolist()],
                "counts": counts.tolist(),
            }
        except ImportError:
            pass
    
    # Drawdown Analysis
    sorted_trades = sorted(trades, key=lambda t: t.created_at or datetime.min)
    equity = 0.0
    peak = 0.0
    drawdowns = []
    dd_start = None
    
    for trade in sorted_trades:
        if trade.pnl is not None:
            equity += trade.pnl
            if equity > peak:
                peak = equity
                if dd_start:
                    drawdowns.append({
                        "start": dd_start,
                        "end": trade.created_at,
                        "depth": peak - equity,
                        "duration_days": (trade.created_at - dd_start).days if dd_start and trade.created_at else 0
                    })
                    dd_start = None
            else:
                if not dd_start:
                    dd_start = trade.created_at
    
    max_dd = max([d["depth"] for d in drawdowns], default=0.0)
    avg_dd = round(sum([d["depth"] for d in drawdowns]) / len(drawdowns), 2) if drawdowns else 0.0
    avg_dd_duration = round(sum([d["duration_days"] for d in drawdowns]) / len(drawdowns), 1) if drawdowns else 0
    
    # Risk Usage (simplified - could be enhanced with account size)
    risk_usage = {
        "current": avg_risk,
        "max": max(risks) if risks else 0.0,
        "avg": avg_risk,
    }
    
    # Rule Violations - count trades that exceeded risk parameters
    rule_violations = 0
    for trade in trades:
        if trade.risk_percent and trade.risk_percent > 2.0:  # Example: >2% risk
            rule_violations += 1
    
    return {
        "avg_risk_percent": avg_risk,
        "avg_position_size": avg_size,
        "max_position_size": max_size,
        "total_exposure": total_exposure,
        "rr_distribution": rr_dist,
        "drawdown_analysis": {
            "max_dd": round(max_dd, 2),
            "avg_dd": avg_dd,
            "avg_dd_duration_days": avg_dd_duration,
            "num_drawdowns": len(drawdowns),
        },
        "risk_usage": risk_usage,
        "rule_violations": rule_violations,
    }


def compute_psychology_analytics(trades: list[Trade]) -> dict:
    """Compute psychology/behavior analytics from trade data."""
    if not trades:
        return {
            "fomo_frequency": 0,
            "revenge_trades": 0,
            "early_exits": 0,
            "late_entries": 0,
            "rule_violations": 0,
            "missed_setups": 0,
            "overtrading_days": 0,
            "confidence_vs_results": [],
            "emotion_breakdown": {},
            "psychology_trend": [],
        }
    
    # FOMO: trades with low confidence but taken anyway, or chasing moves
    fomo_trades = [t for t in trades if getattr(t, 'confidence', None) is not None and getattr(t, 'confidence', 100) < 50 and t.direction in ["BUY", "SELL"]]
    fomo_frequency = len(fomo_trades)
    
    # Revenge trades: trades after a loss with higher risk
    revenge_trades = 0
    sorted_trades = sorted(trades, key=lambda t: t.created_at or datetime.min)
    for i in range(1, len(sorted_trades)):
        prev = sorted_trades[i-1]
        curr = sorted_trades[i]
        if prev.result == "LOSS" and curr.risk_percent and prev.risk_percent:
            if curr.risk_percent > prev.risk_percent * 1.2:  # Risk increased >20% after loss
                revenge_trades += 1
    
    # Early exits: closed before TP with profit (could be tracked via notes or result vs RR)
    early_exits = len([t for t in trades if t.result == "WIN" and t.rr and t.rr < 1.0])
    
    # Late entries: could be inferred from notes or market structure
    late_entries = len([t for t in trades if "late" in (t.notes or "").lower()])
    
    # Rule violations
    rule_violations = len([t for t in trades if t.risk_percent and t.risk_percent > 2.0])
    
    # Overtrading: days with >5 trades
    trades_by_day = {}
    for t in trades:
        if t.created_at:
            day = t.created_at.date()
            trades_by_day[day] = trades_by_day.get(day, 0) + 1
    overtrading_days = len([d for d, count in trades_by_day.items() if count > 5])
    
    # Confidence vs Results
    confidence_bins = {}
    for t in trades:
        c = getattr(t, 'confidence', None)
        if c is not None:
            bin_key = f"{(int(c) // 10) * 10}-{(int(c) // 10) * 10 + 10}"
            if bin_key not in confidence_bins:
                confidence_bins[bin_key] = {"trades": 0, "wins": 0, "avg_pnl": 0.0}
            confidence_bins[bin_key]["trades"] += 1
            if t.result == "WIN":
                confidence_bins[bin_key]["wins"] += 1
            if t.pnl is not None:
                confidence_bins[bin_key]["avg_pnl"] = (confidence_bins[bin_key]["avg_pnl"] * (confidence_bins[bin_key]["trades"] - 1) + t.pnl) / confidence_bins[bin_key]["trades"]
    
    confidence_vs_results = [
        {"confidence_range": k, "trades": v["trades"], "win_rate": round(v["wins"]/v["trades"]*100,1) if v["trades"] > 0 else 0, "avg_pnl": round(v["avg_pnl"], 2)}
        for k, v in sorted(confidence_bins.items())
    ]
    
    # Emotion breakdown
    emotions = {}
    for t in trades:
        if t.emotion:
            if t.emotion not in emotions:
                emotions[t.emotion] = {"trades": 0, "wins": 0, "pnl": 0.0}
            emotions[t.emotion]["trades"] += 1
            if t.result == "WIN":
                emotions[t.emotion]["wins"] += 1
            if t.pnl:
                emotions[t.emotion]["pnl"] = round(emotions[t.emotion]["pnl"] + t.pnl, 2)
    
    for e in emotions:
        emotions[e]["win_rate"] = round(emotions[e]["wins"] / emotions[e]["trades"] * 100, 1) if emotions[e]["trades"] > 0 else 0.0
    
    # Psychology trend (monthly average confidence)
    monthly_conf = {}
    for t in trades:
        c = getattr(t, 'confidence', None)
        if t.created_at and c is not None:
            month = t.created_at.strftime("%Y-%m")
            if month not in monthly_conf:
                monthly_conf[month] = []
            monthly_conf[month].append(c)
    
    psychology_trend = [
        {"month": k, "avg_confidence": round(sum(v)/len(v), 1)}
        for k, v in sorted(monthly_conf.items())
    ]
    
    return {
        "fomo_frequency": fomo_frequency,
        "revenge_trades": revenge_trades,
        "early_exits": early_exits,
        "late_entries": late_entries,
        "rule_violations": rule_violations,
        "missed_setups": 0,  # Would need separate tracking
        "overtrading_days": overtrading_days,
        "confidence_vs_results": confidence_vs_results,
        "emotion_breakdown": emotions,
        "psychology_trend": psychology_trend,
    }


def compute_calendar_heatmap(trades: list[Trade]) -> dict:
    """Compute daily P&L data for calendar heatmap."""
    daily_pnl = {}
    for trade in trades:
        if trade.created_at and trade.pnl is not None:
            day_key = trade.created_at.strftime("%Y-%m-%d")
            if day_key not in daily_pnl:
                daily_pnl[day_key] = 0.0
            daily_pnl[day_key] = round(daily_pnl[day_key] + trade.pnl, 2)
    
    # Also include days with no trades but zero P&L
    if daily_pnl:
        dates = [datetime.strptime(k, "%Y-%m-%d").date() for k in daily_pnl.keys()]
        min_date = min(dates)
        max_date = max(dates)
        current = min_date
        while current <= max_date:
            key = current.strftime("%Y-%m-%d")
            if key not in daily_pnl:
                daily_pnl[key] = 0.0
            current += timedelta(days=1)
    
    return {
        "daily_pnl": daily_pnl,
        "min_date": min(daily_pnl.keys()) if daily_pnl else None,
        "max_date": max(daily_pnl.keys()) if daily_pnl else None,
    }


def compute_scatter_data(trades: list[Trade]) -> dict:
    """Compute data for scatter plots."""
    if not trades:
        return {
            "pnl_vs_rr": [],
            "pnl_vs_hold_time": [],
            "win_loss_scatter": [],
            "confidence_vs_pnl": [],
        }
    
    pnl_vs_rr = []
    pnl_vs_hold_time = []
    win_loss_scatter = []
    confidence_vs_pnl = []
    
    for trade in trades:
        if trade.pnl is not None and trade.rr is not None:
            pnl_vs_rr.append({
                "rr": round(trade.rr, 2),
                "pnl": round(trade.pnl, 2),
                "result": trade.result or "UNKNOWN",
                "pair": trade.pair or "N/A",
            })
        
        if trade.pnl is not None and trade.created_at and trade.exit_price is not None:
            # Estimate hold time (would need entry/exit timestamps)
            pnl_vs_hold_time.append({
                "pnl": round(trade.pnl, 2),
                "hold_time_hours": 0,  # Placeholder
                "result": trade.result or "UNKNOWN",
            })
        
        if trade.pnl is not None:
            win_loss_scatter.append({
                "x": round(trade.rr, 2) if trade.rr else 0,
                "y": round(trade.pnl, 2),
                "result": trade.result or "UNKNOWN",
                "pair": trade.pair or "N/A",
            })
        
        c = getattr(trade, 'confidence', None)
        if c is not None and trade.pnl is not None:
            confidence_vs_pnl.append({
                "confidence": c,
                "pnl": round(trade.pnl, 2),
                "result": trade.result or "UNKNOWN",
            })
    
    return {
        "pnl_vs_rr": pnl_vs_rr,
        "pnl_vs_hold_time": pnl_vs_hold_time,
        "win_loss_scatter": win_loss_scatter,
        "confidence_vs_pnl": confidence_vs_pnl,
    }
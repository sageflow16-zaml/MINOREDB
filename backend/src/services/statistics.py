from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from sqlalchemy import select, func, and_, case
from sqlalchemy.orm import Session
from src.models.trade import Trade
from src.models.market_structure import MarketStructure


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

    # Monthly returns
    monthly_returns = compute_monthly_returns(closed_trades)

    # Rolling windows
    rolling_10 = compute_rolling_window(closed_trades, 10)
    rolling_50 = compute_rolling_window(closed_trades, 50)

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
        "monthly_returns": monthly_returns,
        "rolling_10": rolling_10,
        "rolling_50": rolling_50,
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
    
    import numpy as np
    counts, bins = np.histogram(pnls, bins=20)
    return {
        "bins": [round(b, 2) for b in bins.tolist()],
        "counts": counts.tolist(),
    }


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
    
    import numpy as np
    counts, bins = np.histogram(rrs, bins=20)
    return {
        "bins": [round(b, 2) for b in bins.tolist()],
        "counts": counts.tolist(),
    }
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from src.models.trade import Trade
from src.models.risk import RiskRule, RiskAlert, RiskSnapshot, TradeValidation


def get_risk_dashboard(db: Session, project_id: UUID) -> dict:
    """Compute full risk dashboard from trades + rules + snapshots."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    closed_trades = (
        db.query(Trade)
        .filter(
            Trade.project_id == project_id,
            Trade.status.in_(["closed", "win", "loss", "breakeven"]),
        )
        .all()
    )
    open_trades = (
        db.query(Trade)
        .filter(Trade.project_id == project_id, Trade.status == "open")
        .all()
    )

    total_pnl = sum(t.pnl or 0 for t in closed_trades)
    latest_balance = 10000 + total_pnl

    daily_pnl = sum(
        t.pnl or 0
        for t in closed_trades
        if t.updated_at and t.updated_at >= today_start
    )
    weekly_pnl = sum(
        t.pnl or 0
        for t in closed_trades
        if t.updated_at and t.updated_at >= week_start
    )
    monthly_pnl = sum(
        t.pnl or 0
        for t in closed_trades
        if t.updated_at and t.updated_at >= month_start
    )

    open_risk = sum(abs(t.risk_percent or 0) for t in open_trades)
    closed_risk = sum(abs(t.risk_percent or 0) for t in closed_trades[-20:])
    daily_risk_limit = 5.0
    daily_risk_remaining = max(0, daily_risk_limit - open_risk)

    running_eq = 10000
    peak_eq = 10000
    max_dd = 0
    current_dd = 0
    for t in closed_trades:
        running_eq += t.pnl or 0
        peak_eq = max(peak_eq, running_eq)
        dd = ((peak_eq - running_eq) / peak_eq) * 100 if peak_eq > 0 else 0
        max_dd = max(max_dd, dd)
    current_dd = ((peak_eq - running_eq) / peak_eq) * 100 if peak_eq > 0 else 0
    recovery = (1 - current_dd / max_dd) * 100 if max_dd > 0 else 100

    by_pair: dict[str, dict] = {}
    by_direction: dict[str, dict] = {}
    by_strategy: dict[str, dict] = {}
    for t in open_trades:
        p = t.pair or "Unknown"
        by_pair.setdefault(p, {"exposure": 0, "count": 0, "risk": 0})
        by_pair[p]["count"] += 1
        by_pair[p]["risk"] += abs(t.risk_percent or 0)
        d = t.direction or "Unknown"
        by_direction.setdefault(d, {"exposure": 0, "count": 0, "risk": 0})
        by_direction[d]["count"] += 1
        by_direction[d]["risk"] += abs(t.risk_percent or 0)

    exposure = {
        "total_exposure": open_risk,
        "open_positions": len(open_trades),
        "by_pair": [{"name": k, "exposure": v["risk"], "count": v["count"], "risk": v["risk"]} for k, v in by_pair.items()],
        "by_direction": [{"name": k, "exposure": v["risk"], "count": v["count"], "risk": v["risk"]} for k, v in by_direction.items()],
        "by_strategy": [{"name": k, "exposure": v["risk"], "count": v["count"], "risk": v["risk"]} for k, v in by_strategy.values()] if by_strategy else [],
        "correlation_risk": 0.0,
        "max_single_exposure": max((abs(t.risk_percent or 0) for t in open_trades), default=0),
    }

    active_alerts = (
        db.query(RiskAlert)
        .filter(RiskAlert.project_id == project_id, RiskAlert.is_dismissed == False)
        .count()
    )

    rules = (
        db.query(RiskRule)
        .filter(RiskRule.project_id == project_id, RiskRule.is_active == True)
        .all()
    )
    violations = sum(r.violation_count for r in rules)

    return {
        "account_balance": latest_balance,
        "equity": running_eq,
        "daily_pnl": daily_pnl,
        "weekly_pnl": weekly_pnl,
        "monthly_pnl": monthly_pnl,
        "current_risk_percent": open_risk,
        "open_risk": open_risk,
        "closed_risk": closed_risk,
        "available_risk": max(0, 10 - open_risk),
        "daily_risk_remaining": daily_risk_remaining,
        "max_drawdown": max_dd,
        "current_drawdown": current_dd,
        "recovery_progress": recovery,
        "open_positions": len(open_trades),
        "total_exposure": open_risk,
        "active_alerts": active_alerts,
        "rule_violations": violations,
        "exposure": exposure,
    }


def get_drawdown_timeline(db: Session, project_id: UUID) -> list[dict]:
    """Return daily drawdown points."""
    trades = (
        db.query(Trade)
        .filter(
            Trade.project_id == project_id,
            Trade.status.in_(["closed", "win", "loss", "breakeven"]),
        )
        .order_by(Trade.created_at)
        .all()
    )
    if not trades:
        return []

    running_eq = 10000
    peak_eq = 10000
    points = []
    for t in trades:
        running_eq += t.pnl or 0
        peak_eq = max(peak_eq, running_eq)
        dd = ((peak_eq - running_eq) / peak_eq) * 100 if peak_eq > 0 else 0
        points.append({
            "date": t.created_at.strftime("%Y-%m-%d") if t.created_at else "",
            "drawdown": round(dd, 2),
            "equity": round(running_eq, 2),
        })
    return points


def get_risk_history(db: Session, project_id: UUID, days: int = 30) -> list[dict]:
    """Return daily risk snapshots."""
    now = datetime.utcnow()
    start = now - timedelta(days=days)
    trades = (
        db.query(Trade)
        .filter(
            Trade.project_id == project_id,
            Trade.created_at >= start,
        )
        .order_by(Trade.created_at)
        .all()
    )

    daily: dict[str, dict] = {}
    for t in trades:
        day = t.created_at.strftime("%Y-%m-%d") if t.created_at else "unknown"
        if day not in daily:
            daily[day] = {"daily_pnl": 0, "count": 0, "risk_sum": 0}
        daily[day]["daily_pnl"] += t.pnl or 0
        daily[day]["count"] += 1
        daily[day]["risk_sum"] += abs(t.risk_percent or 0)

    running_eq = 10000
    peak_eq = 10000
    result = []
    for day_str in sorted(daily.keys()):
        d = daily[day_str]
        running_eq += d["daily_pnl"]
        peak_eq = max(peak_eq, running_eq)
        dd = ((peak_eq - running_eq) / peak_eq) * 100 if peak_eq > 0 else 0
        result.append({
            "date": day_str,
            "daily_pnl": round(d["daily_pnl"], 2),
            "weekly_pnl": 0,
            "monthly_pnl": 0,
            "drawdown": round(dd, 2),
            "risk_percent": round(d["risk_sum"] / max(d["count"], 1), 2),
            "exposure": round(d["risk_sum"], 2),
        })
    return result


def get_rules(db: Session, project_id: UUID) -> list[dict]:
    """Return all risk rules for a project."""
    rules = (
        db.query(RiskRule)
        .filter(RiskRule.project_id == project_id)
        .order_by(RiskRule.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(r.id),
            "created_at": r.created_at.isoformat() if r.created_at else "",
            "updated_at": r.updated_at.isoformat() if r.updated_at else "",
            "project_id": str(r.project_id),
            "name": r.name,
            "rule_type": r.rule_type,
            "description": r.description,
            "limit_value": r.limit_value,
            "current_value": r.current_value,
            "is_active": r.is_active,
            "severity": r.severity,
            "rule_config": r.rule_config,
            "last_triggered_at": r.last_triggered_at.isoformat() if r.last_triggered_at else None,
            "violation_count": r.violation_count,
        }
        for r in rules
    ]


def create_rule(db: Session, project_id: UUID, data: dict) -> dict:
    """Create a new risk rule."""
    rule = RiskRule(
        project_id=project_id,
        name=data["name"],
        rule_type=data["rule_type"],
        description=data.get("description"),
        limit_value=data["limit_value"],
        is_active=data.get("is_active", True),
        severity=data.get("severity", "warning"),
        rule_config=data.get("rule_config"),
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return {
        "id": str(rule.id),
        "name": rule.name,
        "rule_type": rule.rule_type,
        "description": rule.description,
        "limit_value": rule.limit_value,
        "current_value": rule.current_value,
        "is_active": rule.is_active,
        "severity": rule.severity,
        "rule_config": rule.rule_config,
        "violation_count": rule.violation_count,
    }


def update_rule(db: Session, rule_id: UUID, data: dict) -> dict | None:
    """Update a risk rule."""
    rule = db.query(RiskRule).filter(RiskRule.id == rule_id).first()
    if not rule:
        return None
    for key, val in data.items():
        if val is not None and hasattr(rule, key):
            setattr(rule, key, val)
    db.commit()
    db.refresh(rule)
    return {
        "id": str(rule.id),
        "name": rule.name,
        "rule_type": rule.rule_type,
        "description": rule.description,
        "limit_value": rule.limit_value,
        "current_value": rule.current_value,
        "is_active": rule.is_active,
        "severity": rule.severity,
        "rule_config": rule.rule_config,
        "violation_count": rule.violation_count,
    }


def delete_rule(db: Session, rule_id: UUID) -> bool:
    """Delete a risk rule."""
    rule = db.query(RiskRule).filter(RiskRule.id == rule_id).first()
    if not rule:
        return False
    db.delete(rule)
    db.commit()
    return True


def get_alerts(db: Session, project_id: UUID) -> list[dict]:
    """Return all non-dismissed alerts."""
    alerts = (
        db.query(RiskAlert)
        .filter(RiskAlert.project_id == project_id, RiskAlert.is_dismissed == False)
        .order_by(RiskAlert.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(a.id),
            "created_at": a.created_at.isoformat() if a.created_at else "",
            "alert_type": a.alert_type,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "is_read": a.is_read,
            "is_dismissed": a.is_dismissed,
            "metadata_json": a.metadata_json,
        }
        for a in alerts
    ]


def create_alert(db: Session, project_id: UUID, data: dict) -> dict:
    """Create a risk alert."""
    alert = RiskAlert(
        project_id=project_id,
        alert_type=data["alert_type"],
        severity=data.get("severity", "warning"),
        title=data["title"],
        message=data["message"],
        metadata_json=data.get("metadata_json"),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return {
        "id": str(alert.id),
        "alert_type": alert.alert_type,
        "severity": alert.severity,
        "title": alert.title,
        "message": alert.message,
    }


def dismiss_alert(db: Session, alert_id: UUID) -> bool:
    """Dismiss an alert."""
    alert = db.query(RiskAlert).filter(RiskAlert.id == alert_id).first()
    if not alert:
        return False
    alert.is_dismissed = True
    db.commit()
    return True


def validate_trade(db: Session, project_id: UUID, data: dict) -> dict:
    """Validate a proposed trade against risk rules."""
    checks = []
    entry = data.get("entry_price", 0)
    sl = data.get("stop_loss", 0)
    pair = data.get("pair", "")
    risk_pct = data.get("risk_percent", 1.0)

    if sl == 0 or entry == 0:
        checks.append({
            "check_name": "Entry/SL Validation",
            "passed": False,
            "severity": "critical",
            "message": "Entry price and stop loss must be provided",
        })
    else:
        stop_dist = abs(entry - sl)
        if stop_dist == 0:
            checks.append({
                "check_name": "Stop Distance",
                "passed": False,
                "severity": "critical",
                "message": "Stop distance cannot be zero",
            })
        else:
            checks.append({
                "check_name": "Stop Distance",
                "passed": True,
                "severity": "info",
                "message": f"Stop distance: {stop_dist:.5f}",
            })

    rules = (
        db.query(RiskRule)
        .filter(RiskRule.project_id == project_id, RiskRule.is_active == True)
        .all()
    )
    for rule in rules:
        if rule.rule_type == "max_risk_per_trade" and risk_pct > rule.limit_value:
            checks.append({
                "check_name": rule.name,
                "passed": False,
                "severity": rule.severity,
                "message": f"Risk {risk_pct}% exceeds limit {rule.limit_value}%",
            })
        elif rule.rule_type == "max_daily_loss":
            pass
        elif rule.rule_type == "max_open_trades":
            open_count = (
                db.query(Trade)
                .filter(Trade.project_id == project_id, Trade.status == "open")
                .count()
            )
            if open_count >= int(rule.limit_value):
                checks.append({
                    "check_name": rule.name,
                    "passed": False,
                    "severity": rule.severity,
                    "message": f"Open trades ({open_count}) >= limit ({int(rule.limit_value)})",
                })
        else:
            checks.append({
                "check_name": rule.name,
                "passed": True,
                "severity": "info",
                "message": f"Rule '{rule.name}' passed",
            })

    if risk_pct > 2.0:
        checks.append({
            "check_name": "High Risk Warning",
            "passed": True,
            "severity": "warning",
            "message": f"Risk of {risk_pct}% is above recommended 1-2%",
        })

    passed = all(c["passed"] for c in checks)
    critical_fail = any(c["severity"] == "critical" and not c["passed"] for c in checks)

    if critical_fail:
        status_val = "rejected"
    elif not passed:
        status_val = "warning"
    else:
        status_val = "approved"

    risk_amount = 0
    potential_loss = 0
    potential_profit = 0
    rr_ratio = 0
    if entry and sl and entry != sl:
        stop_dist = abs(entry - sl)
        risk_amount = stop_dist * (data.get("position_size", 100000) / 10000)
        potential_loss = risk_amount
        tp = data.get("take_profit")
        if tp:
            reward_dist = abs(tp - entry)
            rr_ratio = reward_dist / stop_dist if stop_dist > 0 else 0
            potential_profit = reward_dist * (data.get("position_size", 100000) / 10000)

    return {
        "status": status_val,
        "checks": checks,
        "risk_amount": round(risk_amount, 2),
        "potential_loss": round(potential_loss, 2),
        "potential_profit": round(potential_profit, 2),
        "rr_ratio": round(rr_ratio, 2),
    }


def calculate_position_size(data: dict) -> dict:
    """Calculate position size from risk parameters."""
    account_balance = data.get("account_balance", 10000)
    risk_percent = data.get("risk_percent", 1.0)
    entry = data.get("entry_price", 0)
    stop_loss = data.get("stop_loss", 0)
    pip_value = data.get("pip_value", 10.0)

    dollar_risk = account_balance * (risk_percent / 100)
    stop_distance = abs(entry - stop_loss) if entry and stop_loss else 0
    stop_distance_pips = stop_distance * 10000 if stop_distance < 1 else stop_distance * 100

    risk_per_pip = dollar_risk / stop_distance_pips if stop_distance_pips > 0 else 0
    lot_size = risk_per_pip / pip_value if pip_value > 0 else 0
    position_size = lot_size * 100000

    rr_ratio = 0
    potential_profit = dollar_risk
    if data.get("take_profit"):
        reward_dist = abs(data["take_profit"] - entry)
        rr_ratio = reward_dist / stop_distance if stop_distance > 0 else 0
        potential_profit = dollar_risk * rr_ratio

    return {
        "position_size": round(position_size, 2),
        "lot_size": round(lot_size, 2),
        "dollar_risk": round(dollar_risk, 2),
        "expected_rr": round(rr_ratio, 2),
        "potential_profit": round(potential_profit, 2),
        "potential_loss": round(dollar_risk, 2),
        "risk_per_pip": round(risk_per_pip, 4),
        "stop_distance_pips": round(stop_distance_pips, 1),
    }


def get_rule_violations(db: Session, project_id: UUID) -> list[dict]:
    """Get all rule violations from trades."""
    rules = (
        db.query(RiskRule)
        .filter(RiskRule.project_id == project_id, RiskRule.violation_count > 0)
        .all()
    )
    violations = []
    for r in rules:
        violations.append({
            "rule_name": r.name,
            "rule_type": r.rule_type,
            "severity": r.severity,
            "limit_value": r.limit_value,
            "actual_value": r.current_value,
            "timestamp": r.last_triggered_at.isoformat() if r.last_triggered_at else "",
            "trade_id": None,
        })
    return violations

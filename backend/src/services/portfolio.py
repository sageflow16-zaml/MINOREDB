"""
Multi-Account & Portfolio Management Service — account management, portfolio
engine, risk engine, capital allocation, cross-account analytics, reporting.
"""
import json
import math
from uuid import UUID, uuid4
from datetime import datetime, timedelta, timezone
from typing import Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from src.models.portfolio import (
    Account, AccountType, AccountStatus, AccountGroup,
    BrokerProfile, BrokerPlatform, CommissionModel, ExecutionModel,
    FundingHistory, BalanceHistory, EquityHistory,
    PortfolioAllocation, AllocationType,
    Transfer, TransferType,
    Goal, GoalStatus, GoalMetric,
    AccountHealth, AccountRule, RuleSeverity,
    AccountNote, PortfolioSnapshot,
)
from src.models.trade import Trade
from src.services.ai.llm import generate_answer
from src.services.statistics import get_statistics_overview


def _dict(obj):
    if obj is None: return None
    return {attr.key: getattr(obj, attr.key) for attr in obj.__mapper__.attrs if hasattr(attr, 'columns')}


def _now(): return datetime.utcnow()


def _safe_float(v, default=0.0):
    if v is None: return default
    try: return float(v)
    except: return default


def _account_query(db: Session, project_id: UUID, **filters):
    q = db.query(Account).filter(Account.project_id == project_id)
    if filters.get("account_type"):
        q = q.filter(Account.account_type == filters["account_type"])
    if filters.get("status"):
        q = q.filter(Account.status == filters["status"])
    if filters.get("broker_profile_id"):
        q = q.filter(Account.broker_profile_id == filters["broker_profile_id"])
    if filters.get("search"):
        q = q.filter(Account.name.ilike(f"%{filters['search']}%"))
    return q.order_by(Account.created_at.desc())


# ═══════════════════════════════════════════════════════
# BROKER SERVICE
# ═══════════════════════════════════════════════════════

class BrokerService:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_brokers(self) -> list[dict]:
        q = self.db.query(BrokerProfile).filter(BrokerProfile.project_id == self.project_id).order_by(BrokerProfile.broker_name)
        return [_dict(b) for b in q.all()]

    def create_broker(self, data: dict) -> dict:
        broker = BrokerProfile(project_id=self.project_id, **{k: v for k, v in data.items() if hasattr(BrokerProfile, k) and v is not None})
        self.db.add(broker); self.db.commit(); self.db.refresh(broker)
        return _dict(broker)

    def get_broker(self, broker_id: UUID) -> dict:
        b = self.db.query(BrokerProfile).filter(BrokerProfile.id == broker_id, BrokerProfile.project_id == self.project_id).first()
        if not b: raise HTTPException(status_code=404, detail="Broker not found")
        return _dict(b)

    def update_broker(self, broker_id: UUID, data: dict) -> dict:
        b = self.db.query(BrokerProfile).filter(BrokerProfile.id == broker_id, BrokerProfile.project_id == self.project_id).first()
        if not b: raise HTTPException(status_code=404, detail="Broker not found")
        for k, v in data.items():
            if v is not None and hasattr(b, k): setattr(b, k, v)
        self.db.commit(); self.db.refresh(b)
        return _dict(b)

    def delete_broker(self, broker_id: UUID):
        b = self.db.query(BrokerProfile).filter(BrokerProfile.id == broker_id, BrokerProfile.project_id == self.project_id).first()
        if b: self.db.delete(b); self.db.commit()

    def get_broker_accounts(self, broker_id: UUID) -> list[dict]:
        accounts = self.db.query(Account).filter(Account.broker_profile_id == broker_id, Account.project_id == self.project_id).all()
        return [_dict(a) for a in accounts]


# ═══════════════════════════════════════════════════════
# ACCOUNT SERVICE
# ═══════════════════════════════════════════════════════

class AccountService:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_accounts(self, account_type: str | None = None, status: str | None = None,
                      broker_id: UUID | None = None, search: str | None = None,
                      group_id: UUID | None = None) -> list[dict]:
        if group_id:
            grp = self.db.query(AccountGroup).filter(AccountGroup.id == group_id, AccountGroup.project_id == self.project_id).first()
            if grp and grp.account_ids:
                accounts = self.db.query(Account).filter(Account.id.in_(grp.account_ids), Account.project_id == self.project_id).all()
                return [_dict(a) for a in accounts]
        q = _account_query(self.db, self.project_id, account_type=account_type, status=status, broker_profile_id=broker_id, search=search)
        return [_dict(a) for a in q.all()]

    def create_account(self, data: dict) -> dict:
        acc = Account(project_id=self.project_id)
        for k, v in data.items():
            if v is not None and hasattr(acc, k) and k not in ("id", "created_at", "updated_at", "project_id"):
                setattr(acc, k, v)
        if data.get("initial_balance"):
            acc.current_balance = data["initial_balance"]
            acc.current_equity = data["initial_balance"]
        self.db.add(acc); self.db.commit(); self.db.refresh(acc)
        self._record_balance_equity(acc.id, acc.current_balance, acc.current_equity, "account_created")
        return _dict(acc)

    def get_account(self, account_id: UUID) -> dict:
        a = self.db.query(Account).filter(Account.id == account_id, Account.project_id == self.project_id).first()
        if not a: raise HTTPException(status_code=404, detail="Account not found")
        return _dict(a)

    def update_account(self, account_id: UUID, data: dict) -> dict:
        a = self.db.query(Account).filter(Account.id == account_id, Account.project_id == self.project_id).first()
        if not a: raise HTTPException(status_code=404, detail="Account not found")
        for k, v in data.items():
            if v is not None and hasattr(a, k) and k not in ("id", "created_at", "project_id"):
                setattr(a, k, v)
        self.db.commit(); self.db.refresh(a)
        return _dict(a)

    def delete_account(self, account_id: UUID):
        a = self.db.query(Account).filter(Account.id == account_id, Account.project_id == self.project_id).first()
        if a: self.db.delete(a); self.db.commit()

    def archive_account(self, account_id: UUID) -> dict:
        a = self.db.query(Account).filter(Account.id == account_id, Account.project_id == self.project_id).first()
        if not a: raise HTTPException(status_code=404, detail="Account not found")
        a.status = AccountStatus.ARCHIVED
        self.db.commit(); self.db.refresh(a)
        return _dict(a)

    def update_account_metrics(self, account_id: UUID, balance: float | None = None,
                                equity: float | None = None, open_pnl: float | None = None,
                                used_margin: float | None = None, margin_level: float | None = None):
        a = self.db.query(Account).filter(Account.id == account_id, Account.project_id == self.project_id).first()
        if not a: return
        if balance is not None: a.current_balance = balance
        if equity is not None: a.current_equity = equity
        if open_pnl is not None: a.open_pnl = open_pnl
        if used_margin is not None: a.used_margin = used_margin
        if margin_level is not None: a.margin_level = margin_level
        if used_margin is not None and a.current_equity:
            a.free_margin = a.current_equity - used_margin
        self.db.commit()
        if balance is not None or equity is not None:
            self._record_balance_equity(account_id, balance or a.current_balance, equity or a.current_equity, "metrics_update")

    def _record_balance_equity(self, account_id: UUID, balance: float, equity: float, source: str = "manual"):
        now = _now()
        self.db.add(BalanceHistory(project_id=self.project_id, account_id=account_id, recorded_at=now, balance=balance, source=source))
        self.db.add(EquityHistory(project_id=self.project_id, account_id=account_id, recorded_at=now, equity=equity, balance=balance, source=source))
        self.db.commit()

    # ── Balance / Equity History ──

    def get_balance_history(self, account_id: UUID, days: int = 30) -> list[dict]:
        since = _now() - timedelta(days=days)
        q = self.db.query(BalanceHistory).filter(
            BalanceHistory.account_id == account_id,
            BalanceHistory.recorded_at >= since,
        ).order_by(BalanceHistory.recorded_at).all()
        return [_dict(b) for b in q]

    def get_equity_history(self, account_id: UUID, days: int = 30) -> list[dict]:
        since = _now() - timedelta(days=days)
        q = self.db.query(EquityHistory).filter(
            EquityHistory.account_id == account_id,
            EquityHistory.recorded_at >= since,
        ).order_by(EquityHistory.recorded_at).all()
        return [_dict(e) for e in q]

    # ── Funding History ──

    def list_funding(self, account_id: UUID | None = None) -> list[dict]:
        q = self.db.query(FundingHistory).filter(FundingHistory.project_id == self.project_id)
        if account_id: q = q.filter(FundingHistory.account_id == account_id)
        return [_dict(f) for f in q.order_by(FundingHistory.created_at.desc()).all()]

    def add_funding(self, data: dict) -> dict:
        f = FundingHistory(project_id=self.project_id, **{k: v for k, v in data.items() if hasattr(FundingHistory, k) and v is not None})
        self.db.add(f); self.db.commit(); self.db.refresh(f)
        if data.get("account_id") and data.get("amount"):
            self._adjust_balance(data["account_id"], data["amount"], data.get("event_type", "funding"))
        return _dict(f)

    def _adjust_balance(self, account_id: UUID, amount: float, event_type: str):
        a = self.db.query(Account).filter(Account.id == account_id, Account.project_id == self.project_id).first()
        if a:
            delta = amount if event_type in ("deposit", "funding") else -amount
            a.current_balance += delta
            a.current_equity += delta
            self.db.commit()
            self._record_balance_equity(account_id, a.current_balance, a.current_equity, event_type)

    # ── Groups ──

    def list_groups(self) -> list[dict]:
        return [_dict(g) for g in self.db.query(AccountGroup).filter(AccountGroup.project_id == self.project_id).all()]

    def create_group(self, data: dict) -> dict:
        g = AccountGroup(project_id=self.project_id, name=data.get("name", "Group"), description=data.get("description"), color=data.get("color"), account_ids=data.get("account_ids", []))
        self.db.add(g); self.db.commit(); self.db.refresh(g)
        return _dict(g)

    def update_group(self, group_id: UUID, data: dict) -> dict:
        g = self.db.query(AccountGroup).filter(AccountGroup.id == group_id, AccountGroup.project_id == self.project_id).first()
        if not g: raise HTTPException(status_code=404, detail="Group not found")
        for k, v in data.items():
            if v is not None and hasattr(g, k): setattr(g, k, v)
        self.db.commit(); self.db.refresh(g)
        return _dict(g)

    def delete_group(self, group_id: UUID):
        g = self.db.query(AccountGroup).filter(AccountGroup.id == group_id, AccountGroup.project_id == self.project_id).first()
        if g: self.db.delete(g); self.db.commit()

    # ── Notes ──

    def list_notes(self, account_id: UUID) -> list[dict]:
        q = self.db.query(AccountNote).filter(AccountNote.account_id == account_id).order_by(AccountNote.pinned.desc(), AccountNote.created_at.desc())
        return [_dict(n) for n in q.all()]

    def create_note(self, data: dict) -> dict:
        n = AccountNote(project_id=self.project_id, **{k: v for k, v in data.items() if hasattr(AccountNote, k) and v is not None})
        self.db.add(n); self.db.commit(); self.db.refresh(n)
        return _dict(n)

    def update_note(self, note_id: UUID, data: dict) -> dict:
        n = self.db.query(AccountNote).filter(AccountNote.id == note_id).first()
        if not n: raise HTTPException(status_code=404, detail="Note not found")
        for k, v in data.items():
            if v is not None and hasattr(n, k): setattr(n, k, v)
        self.db.commit(); self.db.refresh(n)
        return _dict(n)

    def delete_note(self, note_id: UUID):
        n = self.db.query(AccountNote).filter(AccountNote.id == note_id).first()
        if n: self.db.delete(n); self.db.commit()

    # ── Account Health & Rules ──

    def get_account_health(self, account_id: UUID) -> dict | None:
        h = self.db.query(AccountHealth).filter(AccountHealth.account_id == account_id).first()
        return _dict(h)

    def upsert_account_health(self, account_id: UUID, data: dict) -> dict:
        h = self.db.query(AccountHealth).filter(AccountHealth.account_id == account_id).first()
        if not h:
            h = AccountHealth(project_id=self.project_id, account_id=account_id)
            self.db.add(h)
        for k, v in data.items():
            if v is not None and hasattr(h, k): setattr(h, k, v)
        self.db.commit(); self.db.refresh(h)
        return _dict(h)

    def list_account_rules(self, account_id: UUID) -> list[dict]:
        return [_dict(r) for r in self.db.query(AccountRule).filter(AccountRule.account_id == account_id).order_by(AccountRule.severity).all()]

    def create_account_rule(self, data: dict) -> dict:
        r = AccountRule(project_id=self.project_id, **{k: v for k, v in data.items() if hasattr(AccountRule, k) and v is not None})
        self.db.add(r); self.db.commit(); self.db.refresh(r)
        return _dict(r)

    def update_account_rule(self, rule_id: UUID, data: dict) -> dict:
        r = self.db.query(AccountRule).filter(AccountRule.id == rule_id).first()
        if not r: raise HTTPException(status_code=404, detail="Rule not found")
        for k, v in data.items():
            if v is not None and hasattr(r, k): setattr(r, k, v)
        self.db.commit(); self.db.refresh(r)
        return _dict(r)

    def delete_account_rule(self, rule_id: UUID):
        r = self.db.query(AccountRule).filter(AccountRule.id == rule_id).first()
        if r: self.db.delete(r); self.db.commit()


# ═══════════════════════════════════════════════════════
# PORTFOLIO ENGINE
# ═══════════════════════════════════════════════════════

class PortfolioEngine:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def get_portfolio_summary(self) -> dict:
        accounts = self.db.query(Account).filter(Account.project_id == self.project_id).all()
        if not accounts:
            return self._empty_summary()

        total_balance = sum(_safe_float(a.current_balance) for a in accounts)
        total_equity = sum(_safe_float(a.current_equity) for a in accounts)
        total_open_pnl = sum(_safe_float(a.open_pnl) for a in accounts)
        total_margin = sum(_safe_float(a.used_margin) for a in accounts)
        total_free = sum(_safe_float(a.free_margin) for a in accounts)
        active_count = sum(1 for a in accounts if a.status == AccountStatus.ACTIVE)
        total_deposits = sum(_safe_float(a.initial_balance) for a in accounts)

        # Aggregate trades
        closed_trades = self.db.query(Trade).filter(
            Trade.project_id == self.project_id,
            Trade.status == "CLOSED",
        ).all()
        wins = sum(1 for t in closed_trades if t.result == "WIN")
        losses = sum(1 for t in closed_trades if t.result == "LOSS")
        closed_count = len(closed_trades)
        win_rate = round((wins / closed_count * 100), 1) if closed_count > 0 else 0.0
        total_pnl = sum(_safe_float(t.pnl) for t in closed_trades)
        gross_profit = sum(_safe_float(t.pnl) for t in closed_trades if t.pnl and t.pnl > 0)
        gross_loss = abs(sum(_safe_float(t.pnl) for t in closed_trades if t.pnl and t.pnl < 0))
        profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else 0.0
        avg_rr = 0.0
        rr_vals = [t.rr for t in closed_trades if t.rr is not None]
        if rr_vals: avg_rr = round(sum(rr_vals) / len(rr_vals), 2)

        # PnL by period
        today = _now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        daily_pnl = sum(_safe_float(t.pnl) for t in closed_trades if t.created_at and t.created_at.date() == today)
        weekly_pnl = sum(_safe_float(t.pnl) for t in closed_trades if t.created_at and t.created_at.date() >= week_start)
        monthly_pnl = sum(_safe_float(t.pnl) for t in closed_trades if t.created_at and t.created_at.date() >= month_start)

        # Drawdown
        max_dd = self._compute_portfolio_drawdown(closed_trades)

        return {
            "total_balance": round(total_balance, 2),
            "total_equity": round(total_equity, 2),
            "total_open_pnl": round(total_open_pnl, 2),
            "total_used_margin": round(total_margin, 2),
            "total_free_margin": round(total_free, 2),
            "daily_pnl": round(daily_pnl, 2),
            "weekly_pnl": round(weekly_pnl, 2),
            "monthly_pnl": round(monthly_pnl, 2),
            "total_deposits": round(total_deposits, 2),
            "total_withdrawals": 0.0,
            "account_count": len(accounts),
            "active_account_count": active_count,
            "total_trades": len(closed_trades),
            "win_count": wins,
            "loss_count": losses,
            "win_rate": win_rate,
            "total_pnl": round(total_pnl, 2),
            "profit_factor": profit_factor,
            "avg_rr": avg_rr,
            "max_drawdown_pct": round(max_dd, 2) if max_dd else 0.0,
        }

    def _empty_summary(self) -> dict:
        return {
            "total_balance": 0, "total_equity": 0, "total_open_pnl": 0,
            "total_used_margin": 0, "total_free_margin": 0,
            "daily_pnl": 0, "weekly_pnl": 0, "monthly_pnl": 0,
            "total_deposits": 0, "total_withdrawals": 0,
            "account_count": 0, "active_account_count": 0,
            "total_trades": 0, "win_count": 0, "loss_count": 0,
            "win_rate": 0, "total_pnl": 0, "profit_factor": 0,
            "avg_rr": 0, "max_drawdown_pct": 0,
        }

    def _compute_portfolio_drawdown(self, trades: list) -> float:
        sorted_trades = sorted([t for t in trades if t.created_at], key=lambda t: t.created_at)
        if not sorted_trades: return 0.0
        peak = 0.0
        max_dd = 0.0
        cumulative = 0.0
        for t in sorted_trades:
            cumulative += _safe_float(t.pnl)
            if cumulative > peak: peak = cumulative
            dd = (peak - cumulative) / peak * 100 if peak > 0 else 0
            if dd > max_dd: max_dd = dd
        return max_dd

    def get_portfolio_history(self, days: int = 90) -> dict:
        snapshots = self.db.query(PortfolioSnapshot).filter(
            PortfolioSnapshot.project_id == self.project_id,
            PortfolioSnapshot.recorded_at >= _now() - timedelta(days=days),
        ).order_by(PortfolioSnapshot.recorded_at).all()
        equity_points = [{"date": s.recorded_at.isoformat(), "equity": s.total_equity, "balance": s.total_balance} for s in snapshots]
        return {
            "equity_curve": equity_points,
            "snapshot_count": len(snapshots),
        }

    def get_account_breakdown(self) -> list[dict]:
        accounts = self.db.query(Account).filter(Account.project_id == self.project_id).all()
        results = []
        for a in accounts:
            trades = self.db.query(Trade).filter(Trade.project_id == self.project_id).filter(
                Trade.metadata["account_id"].astext.cast(type_=UUID) == a.id if hasattr(Trade, 'metadata') else False
            ).all() if False else []
            closed = [t for t in trades if t.status == "CLOSED"] if trades else []
            wins = sum(1 for t in closed if t.result == "WIN")
            results.append({
                **_dict(a),
                "trade_count": len(closed) if closed else 0,
                "win_rate": round(wins / len(closed) * 100, 1) if closed else 0.0,
                "pnl": round(sum(_safe_float(t.pnl) for t in closed), 2) if closed else 0.0,
            })
        return results

    def get_allocation_summary(self) -> dict:
        allocations = self.db.query(PortfolioAllocation).filter(
            PortfolioAllocation.project_id == self.project_id,
            PortfolioAllocation.is_active == True,
        ).all()
        total = sum(_safe_float(a.current_amount) for a in allocations)
        return {
            "total_allocated": round(total, 2),
            "allocations": [_dict(a) for a in allocations],
            "unallocated": 0.0,
        }

    def record_snapshot(self):
        summary = self.get_portfolio_summary()
        snap = PortfolioSnapshot(
            project_id=self.project_id, recorded_at=_now(),
            total_balance=summary["total_balance"],
            total_equity=summary["total_equity"],
            total_open_pnl=summary["total_open_pnl"],
            total_used_margin=summary["total_used_margin"],
            total_free_margin=summary["total_free_margin"],
            daily_pnl=summary["daily_pnl"],
            weekly_pnl=summary["weekly_pnl"],
            monthly_pnl=summary["monthly_pnl"],
            total_deposits=summary["total_deposits"],
            total_withdrawals=summary["total_withdrawals"],
            account_count=summary["account_count"],
            active_account_count=summary["active_account_count"],
        )
        self.db.add(snap); self.db.commit()
        return _dict(snap)


# ═══════════════════════════════════════════════════════
# RISK ENGINE
# ═══════════════════════════════════════════════════════

class RiskEngine:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def get_portfolio_risk(self) -> dict:
        accounts = self.db.query(Account).filter(Account.project_id == self.project_id).all()
        total_equity = sum(_safe_float(a.current_equity) for a in accounts)
        total_margin = sum(_safe_float(a.used_margin) for a in accounts)
        total_balance = sum(_safe_float(a.current_balance) for a in accounts)
        margin_ratio = round(total_margin / total_equity * 100, 2) if total_equity > 0 else 0

        trades = self.db.query(Trade).filter(Trade.project_id == self.project_id, Trade.status == "CLOSED").all()
        closed_count = len(trades)
        wins = sum(1 for t in trades if t.result == "WIN")
        losses = sum(1 for t in trades if t.result == "LOSS")
        win_rate = round(wins / closed_count * 100, 1) if closed_count > 0 else 0

        # Concentration
        total_pnl = sum(_safe_float(t.pnl) for t in trades)
        top5 = sorted(trades, key=lambda t: abs(_safe_float(t.pnl)), reverse=True)[:5]
        top5_pnl = sum(_safe_float(t.pnl) for t in top5)
        concentration = round(abs(top5_pnl) / abs(total_pnl) * 100, 2) if total_pnl != 0 else 0

        # Drawdown
        max_dd = self._compute_max_drawdown(trades)

        # Correlation risk (simplified — count of correlated asset pairs)
        symbols = {}
        for t in trades:
            sym = getattr(t, 'symbol', None) or getattr(t, 'pair', None) or "unknown"
            if sym not in symbols: symbols[sym] = []
            symbols[sym].append(t)
        max_sym_pnl = 0.0
        for sym, st in symbols.items():
            spnl = sum(_safe_float(t.pnl) for t in st)
            if abs(spnl) > abs(max_sym_pnl): max_sym_pnl = spnl

        return {
            "total_exposure": round(total_equity, 2),
            "used_margin": round(total_margin, 2),
            "free_margin": round(total_equity - total_margin, 2),
            "margin_ratio": margin_ratio,
            "margin_level": margin_ratio,
            "portfolio_drawdown": round(max_dd, 2),
            "win_rate": win_rate,
            "loss_count": losses,
            "concentration_risk": concentration,
            "max_symbol_exposure": round(max_sym_pnl, 2),
            "total_open_positions": sum(1 for a in accounts if a.open_pnl and a.open_pnl != 0),
            "risk_score": self._compute_risk_score(margin_ratio, max_dd, concentration, win_rate),
        }

    def _compute_max_drawdown(self, trades: list) -> float:
        sorted_t = sorted([t for t in trades if t.created_at], key=lambda t: t.created_at)
        if not sorted_t: return 0.0
        peak = 0.0; max_dd = 0.0; cumulative = 0.0
        for t in sorted_t:
            cumulative += _safe_float(t.pnl)
            if cumulative > peak: peak = cumulative
            dd = (peak - cumulative) / peak * 100 if peak > 0 else 0
            if dd > max_dd: max_dd = dd
        return max_dd

    def _compute_risk_score(self, margin: float, dd: float, concentration: float, win_rate: float) -> float:
        score = 100.0
        if margin > 80: score -= 30
        elif margin > 50: score -= 15
        if dd > 30: score -= 30
        elif dd > 15: score -= 15
        if concentration > 50: score -= 20
        elif concentration > 30: score -= 10
        if win_rate < 30: score -= 10
        elif win_rate < 20: score -= 20
        return max(0, round(score, 1))

    def get_account_risk(self, account_id: UUID) -> dict:
        a = self.db.query(Account).filter(Account.id == account_id, Account.project_id == self.project_id).first()
        if not a: raise HTTPException(status_code=404, detail="Account not found")
        margin_ratio = round(a.used_margin / a.current_equity * 100, 2) if a.current_equity > 0 else 0
        trades = self.db.query(Trade).filter(Trade.project_id == self.project_id, Trade.status == "CLOSED").all()
        max_dd = self._compute_max_drawdown(trades)
        health = self.db.query(AccountHealth).filter(AccountHealth.account_id == account_id).first()
        return {
            "account_id": str(account_id),
            "balance": a.current_balance,
            "equity": a.current_equity,
            "margin_ratio": margin_ratio,
            "drawdown": max_dd,
            "health_score": health.health_score if health else None,
            "violation_count": health.violation_count if health else 0,
            "daily_loss": health.daily_loss_current if health else None,
            "trailing_drawdown": health.trailing_drawdown if health else None,
        }

    def check_prop_firm_rules(self, account_id: UUID) -> list[dict]:
        rules = self.db.query(AccountRule).filter(
            AccountRule.account_id == account_id,
            AccountRule.is_active == True,
        ).all()
        results = []
        for rule in rules:
            violated = False
            if rule.threshold_value is not None and rule.current_value is not None:
                if rule.rule_type == "max_drawdown" and rule.current_value > rule.threshold_value:
                    violated = True
                elif rule.rule_type == "max_daily_loss" and rule.current_value > rule.threshold_value:
                    violated = True
                elif rule.rule_type == "min_trading_days" and rule.current_value < rule.threshold_value:
                    violated = True
                elif rule.rule_type == "profit_target" and rule.current_value < rule.threshold_value:
                    violated = True
            rule.is_violated = violated
            rule.last_checked_at = _now()
            self.db.commit()
            results.append({
                **_dict(rule),
                "is_violated": violated,
            })
        return results


# ═══════════════════════════════════════════════════════
# ALLOCATION ENGINE
# ═══════════════════════════════════════════════════════

class AllocationEngine:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_allocations(self) -> list[dict]:
        q = self.db.query(PortfolioAllocation).filter(
            PortfolioAllocation.project_id == self.project_id,
        ).order_by(PortfolioAllocation.created_at.desc())
        return [_dict(a) for a in q.all()]

    def create_allocation(self, data: dict) -> dict:
        a = PortfolioAllocation(project_id=self.project_id, **{k: v for k, v in data.items() if hasattr(PortfolioAllocation, k) and v is not None})
        self.db.add(a); self.db.commit(); self.db.refresh(a)
        return _dict(a)

    def update_allocation(self, allocation_id: UUID, data: dict) -> dict:
        a = self.db.query(PortfolioAllocation).filter(PortfolioAllocation.id == allocation_id, PortfolioAllocation.project_id == self.project_id).first()
        if not a: raise HTTPException(status_code=404, detail="Allocation not found")
        for k, v in data.items():
            if v is not None and hasattr(a, k): setattr(a, k, v)
        self.db.commit(); self.db.refresh(a)
        return _dict(a)

    def delete_allocation(self, allocation_id: UUID):
        a = self.db.query(PortfolioAllocation).filter(PortfolioAllocation.id == allocation_id, PortfolioAllocation.project_id == self.project_id).first()
        if a: self.db.delete(a); self.db.commit()

    def get_rebalance_suggestions(self) -> list[dict]:
        allocations = self.db.query(PortfolioAllocation).filter(
            PortfolioAllocation.project_id == self.project_id,
            PortfolioAllocation.is_active == True,
        ).all()
        suggestions = []
        for a in allocations:
            if a.target_percentage and a.current_percentage is not None:
                diff = a.current_percentage - a.target_percentage
                if abs(diff) > 5:
                    suggestions.append({
                        "allocation_id": str(a.id),
                        "entity_name": a.entity_name or a.entity_type,
                        "target_pct": a.target_percentage,
                        "current_pct": a.current_percentage,
                        "deviation": round(diff, 2),
                        "action": "reduce" if diff > 0 else "increase",
                        "priority": "high" if abs(diff) > 10 else "medium",
                    })
        return suggestions

    def compute_allocations_from_equity(self) -> list[dict]:
        accounts = self.db.query(Account).filter(Account.project_id == self.project_id).all()
        total_equity = sum(_safe_float(a.current_equity) for a in accounts)
        result = []
        for a in accounts:
            pct = round(_safe_float(a.current_equity) / total_equity * 100, 2) if total_equity > 0 else 0
            result.append({"account_id": str(a.id), "name": a.name, "equity": a.current_equity, "percentage": pct})
        return result


# ═══════════════════════════════════════════════════════
# TRANSFER SERVICE
# ═══════════════════════════════════════════════════════

class TransferService:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_transfers(self) -> list[dict]:
        q = self.db.query(Transfer).filter(Transfer.project_id == self.project_id).order_by(Transfer.created_at.desc())
        return [_dict(t) for t in q.all()]

    def create_transfer(self, data: dict) -> dict:
        t = Transfer(project_id=self.project_id, **{k: v for k, v in data.items() if hasattr(Transfer, k) and v is not None})
        if not t.completed_at: t.completed_at = _now()
        self.db.add(t); self.db.commit(); self.db.refresh(t)

        # Adjust balances
        amount = t.amount
        if t.from_account_id:
            self._adjust_balance(t.from_account_id, -amount, "transfer_out")
        if t.to_account_id:
            self._adjust_balance(t.to_account_id, amount, "transfer_in")
        return _dict(t)

    def _adjust_balance(self, account_id: UUID, delta: float, source: str):
        a = self.db.query(Account).filter(Account.id == account_id, Account.project_id == self.project_id).first()
        if a:
            a.current_balance += delta; a.current_equity += delta
            self.db.commit()
            now = _now()
            self.db.add(BalanceHistory(project_id=self.project_id, account_id=account_id, recorded_at=now, balance=a.current_balance, source=source))
            self.db.add(EquityHistory(project_id=self.project_id, account_id=account_id, recorded_at=now, equity=a.current_equity, balance=a.current_balance, source=source))
            self.db.commit()


# ═══════════════════════════════════════════════════════
# GOAL SERVICE
# ═══════════════════════════════════════════════════════

class GoalService:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_goals(self, status: str | None = None) -> list[dict]:
        q = self.db.query(Goal).filter(Goal.project_id == self.project_id)
        if status: q = q.filter(Goal.status == status)
        return [_dict(g) for g in q.order_by(Goal.created_at.desc()).all()]

    def create_goal(self, data: dict) -> dict:
        g = Goal(project_id=self.project_id, **{k: v for k, v in data.items() if hasattr(Goal, k) and v is not None})
        g.progress = self._compute_progress(g)
        if g.status == GoalStatus.ACTIVE and not g.started_at: g.started_at = _now()
        self.db.add(g); self.db.commit(); self.db.refresh(g)
        return _dict(g)

    def update_goal(self, goal_id: UUID, data: dict) -> dict:
        g = self.db.query(Goal).filter(Goal.id == goal_id, Goal.project_id == self.project_id).first()
        if not g: raise HTTPException(status_code=404, detail="Goal not found")
        for k, v in data.items():
            if v is not None and hasattr(g, k): setattr(g, k, v)
        g.progress = self._compute_progress(g)
        if g.progress >= 100 and g.status == GoalStatus.ACTIVE:
            g.status = GoalStatus.COMPLETED
            g.completed_at = _now()
        elif g.status == GoalStatus.AT_RISK and g.progress > 50:
            g.status = GoalStatus.ACTIVE
        self.db.commit(); self.db.refresh(g)
        return _dict(g)

    def delete_goal(self, goal_id: UUID):
        g = self.db.query(Goal).filter(Goal.id == goal_id, Goal.project_id == self.project_id).first()
        if g: self.db.delete(g); self.db.commit()

    def _compute_progress(self, goal: Goal) -> float:
        if goal.target_value == goal.start_value: return 0.0
        progress = (goal.current_value - goal.start_value) / (goal.target_value - goal.start_value) * 100
        return max(0, min(100, round(progress, 1)))


# ═══════════════════════════════════════════════════════
# CROSS-ACCOUNT ANALYTICS
# ═══════════════════════════════════════════════════════

class CrossAccountAnalytics:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def compare_accounts(self) -> list[dict]:
        accounts = self.db.query(Account).filter(Account.project_id == self.project_id).all()
        results = []
        trades = self.db.query(Trade).filter(Trade.project_id == self.project_id, Trade.status == "CLOSED").all()
        for a in accounts:
            closed = [t for t in trades]
            wins = sum(1 for t in closed if t.result == "WIN")
            losses = sum(1 for t in closed if t.result == "LOSS")
            cc = len(closed)
            pnl = sum(_safe_float(t.pnl) for t in closed)
            results.append({
                **_dict(a),
                "trade_count": cc,
                "win_rate": round(wins / cc * 100, 1) if cc > 0 else 0,
                "win_count": wins,
                "loss_count": losses,
                "total_pnl": round(pnl, 2),
                "avg_pnl": round(pnl / cc, 2) if cc > 0 else 0,
                "profit_factor": round(
                    sum(_safe_float(t.pnl) for t in closed if t.pnl and t.pnl > 0) /
                    abs(sum(_safe_float(t.pnl) for t in closed if t.pnl and t.pnl < 0)), 2
                ) if sum(_safe_float(t.pnl) for t in closed if t.pnl and t.pnl < 0) != 0 else 0,
            })
        return results

    def compare_brokers(self) -> list[dict]:
        brokers = self.db.query(BrokerProfile).filter(BrokerProfile.project_id == self.project_id).all()
        results = []
        for b in brokers:
            accounts = self.db.query(Account).filter(Account.broker_profile_id == b.id).all()
            total_pnl = 0
            for a in accounts:
                trades = self.db.query(Trade).filter(Trade.project_id == self.project_id, Trade.status == "CLOSED").all()
                total_pnl += sum(_safe_float(t.pnl) for t in trades)
            results.append({**_dict(b), "account_count": len(accounts), "total_pnl": round(total_pnl, 2)})
        return results


# ═══════════════════════════════════════════════════════
# REPORT SERVICE
# ═══════════════════════════════════════════════════════

class ReportService:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def generate_account_report(self, account_id: UUID) -> dict:
        a = self.db.query(Account).filter(Account.id == account_id, Account.project_id == self.project_id).first()
        if not a: raise HTTPException(status_code=404, detail="Account not found")
        trades = self.db.query(Trade).filter(Trade.project_id == self.project_id, Trade.status == "CLOSED").all()
        closed = trades
        wins = sum(1 for t in closed if t.result == "WIN")
        losses = sum(1 for t in closed if t.result == "LOSS")
        cc = len(closed)
        equity_history = self.db.query(EquityHistory).filter(EquityHistory.account_id == account_id).order_by(EquityHistory.recorded_at).all()
        return {
            "account": _dict(a),
            "summary": {
                "total_trades": cc,
                "win_rate": round(wins / cc * 100, 1) if cc > 0 else 0,
                "total_pnl": round(sum(_safe_float(t.pnl) for t in closed), 2),
                "profit_factor": round(
                    sum(_safe_float(t.pnl) for t in closed if t.pnl and t.pnl > 0) /
                    abs(sum(_safe_float(t.pnl) for t in closed if t.pnl and t.pnl < 0)), 2
                ) if sum(_safe_float(t.pnl) for t in closed if t.pnl and t.pnl < 0) != 0 else 0,
                "current_balance": a.current_balance,
                "current_equity": a.current_equity,
            },
            "equity_curve": [{"date": e.recorded_at.isoformat(), "equity": e.equity, "balance": e.balance} for e in equity_history],
        }

    def generate_portfolio_report(self) -> dict:
        engine = PortfolioEngine(self.db, self.project_id)
        summary = engine.get_portfolio_summary()
        accounts = self.db.query(Account).filter(Account.project_id == self.project_id).all()
        account_data = []
        for a in accounts:
            trades = self.db.query(Trade).filter(Trade.project_id == self.project_id, Trade.status == "CLOSED").all()
            closed = trades
            wins = sum(1 for t in closed if t.result == "WIN")
            account_data.append({
                "name": a.name,
                "type": a.account_type.value if hasattr(a.account_type, 'value') else a.account_type,
                "balance": a.current_balance,
                "equity": a.current_equity,
                "trade_count": len(closed),
                "win_rate": round(wins / len(closed) * 100, 1) if closed else 0,
                "pnl": round(sum(_safe_float(t.pnl) for t in closed), 2),
            })
        return {"summary": summary, "accounts": account_data}

    def generate_risk_report(self) -> dict:
        risk = RiskEngine(self.db, self.project_id).get_portfolio_risk()
        accounts = self.db.query(Account).filter(Account.project_id == self.project_id).all()
        account_risks = []
        for a in accounts:
            h = self.db.query(AccountHealth).filter(AccountHealth.account_id == a.id).first()
            account_risks.append({
                "name": a.name,
                "margin_ratio": round(a.used_margin / a.current_equity * 100, 2) if a.current_equity > 0 else 0,
                "drawdown": risk["portfolio_drawdown"],
                "health_score": h.health_score if h else None,
                "violations": h.violation_count if h else 0,
            })
        return {"portfolio_risk": risk, "account_risks": account_risks}

    def generate_allocation_report(self) -> dict:
        engine = PortfolioEngine(self.db, self.project_id)
        alloc = AllocationEngine(self.db, self.project_id)
        return {
            "summary": engine.get_allocation_summary(),
            "breakdown": alloc.compute_allocations_from_equity(),
            "rebalance_suggestions": alloc.get_rebalance_suggestions(),
        }

    def generate_performance_comparison(self) -> dict:
        analytics = CrossAccountAnalytics(self.db, self.project_id)
        return {
            "accounts": analytics.compare_accounts(),
            "brokers": analytics.compare_brokers(),
        }


# ═══════════════════════════════════════════════════════
# PORTFOLIO AI SERVICE
# ═══════════════════════════════════════════════════════

class PortfolioAIService:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def _portfolio_context(self) -> str:
        engine = PortfolioEngine(self.db, self.project_id)
        risk = RiskEngine(self.db, self.project_id)
        summary = engine.get_portfolio_summary()
        risk_data = risk.get_portfolio_risk()
        accounts = self.db.query(Account).filter(Account.project_id == self.project_id).all()
        lines = [
            "[PORTFOLIO SUMMARY]",
            f"Total Balance: ${summary['total_balance']}",
            f"Total Equity: ${summary['total_equity']}",
            f"Daily PnL: ${summary['daily_pnl']}",
            f"Weekly PnL: ${summary['weekly_pnl']}",
            f"Monthly PnL: ${summary['monthly_pnl']}",
            f"Win Rate: {summary['win_rate']}%",
            f"Profit Factor: {summary['profit_factor']}",
            f"Max Drawdown: {summary['max_drawdown_pct']}%",
            "",
            "[RISK SUMMARY]",
            f"Margin Ratio: {risk_data['margin_ratio']}%",
            f"Risk Score: {risk_data['risk_score']}/100",
            f"Concentration Risk: {risk_data['concentration_risk']}%",
            "",
            "[ACCOUNTS]",
        ]
        for a in accounts:
            lines.append(f"- {a.name} ({a.account_type.value if hasattr(a.account_type, 'value') else a.account_type}): Balance=${a.current_balance}, Equity=${a.current_equity}")
        return "\n".join(lines)

    def answer_question(self, question: str) -> dict:
        ctx = self._portfolio_context()
        context = f"{ctx}\n\n[QUESTION]\n{question}"
        result = generate_answer(context)
        return {
            "question": question,
            "answer": result.get("answer", ""),
            "confidence": result.get("confidence", 50),
            "sources": result.get("sources", []),
            "generated_at": _now().isoformat(),
        }

    def best_performing_account(self) -> dict:
        return self.answer_question("Which account performs best based on total PnL, win rate, and profit factor?")

    def worst_performing_account(self) -> dict:
        return self.answer_question("Which account is underperforming and should be reviewed?")

    def rebalancing_recommendation(self) -> dict:
        return self.answer_question("Should capital be reallocated between accounts? Which strategy should receive more capital?")

    def broker_cost_analysis(self) -> dict:
        return self.answer_question("Which broker has the lowest costs and best trading conditions?")

    def risk_assessment(self) -> dict:
        return self.answer_question("What is the current portfolio risk profile and are there any concerns?")

    def generate_report(self, report_type: str = "portfolio") -> str:
        engine = PortfolioEngine(self.db, self.project_id)
        summary = engine.get_portfolio_summary()
        ctx = self._portfolio_context()
        result = generate_answer(f"Generate a comprehensive {report_type} report:\n\n{ctx}")
        return f"""# {report_type.title()} Report
Generated: {_now().strftime('%Y-%m-%d %H:%M UTC')}

{result.get('answer', 'Report generated.')}

---
Portfolio Value: ${summary['total_equity']}
Accounts: {summary['active_account_count']} active / {summary['account_count']} total
Confidence: {result.get('confidence', 50)}/100
"""


# ═══════════════════════════════════════════════════════
# ORCHESTRATOR
# ═══════════════════════════════════════════════════════

class PortfolioManager:
    """Main orchestrator for the Multi-Account & Portfolio Management system."""

    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id
        self.accounts = AccountService(db, project_id)
        self.brokers = BrokerService(db, project_id)
        self.portfolio = PortfolioEngine(db, project_id)
        self.risk = RiskEngine(db, project_id)
        self.allocations = AllocationEngine(db, project_id)
        self.transfers = TransferService(db, project_id)
        self.goals = GoalService(db, project_id)
        self.analytics = CrossAccountAnalytics(db, project_id)
        self.reports = ReportService(db, project_id)
        self.ai = PortfolioAIService(db, project_id)

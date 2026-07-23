"""
Broker Integration Hub Service — provider abstraction, sync engine,
trade import, broker analytics, security, and AI integration.
"""
import hashlib
import json
from uuid import UUID, uuid4
from datetime import datetime, timedelta, timezone
from typing import Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from src.models.broker import (
    BrokerConnection, BrokerAccount, BrokerProvider, ConnectionStatus,
    SyncHistory, BrokerLog, BrokerHealth, ImportedTrade,
    BrokerPosition, BrokerOrder, BrokerAnalytics,
)
from src.broker import ProviderRegistry
from src.broker.providers.base import BrokerProviderBase
from src.services.ai.llm import generate_answer
from src.core.logging import get_logger

logger = get_logger(__name__)


def _dict(obj):
    if obj is None: return None
    return {attr.key: getattr(obj, attr.key) for attr in obj.__mapper__.attrs if hasattr(attr, 'columns')}


def _now(): return datetime.utcnow()


def _import_hash(trade: dict) -> str:
    raw = f"{trade.get('external_id', '')}{trade.get('symbol', '')}{trade.get('open_time', '')}{trade.get('close_time', '')}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _safe_float(v, default=0.0):
    if v is None: return default
    try: return float(v)
    except: return default


# ═══════════════════════════════════════════════════════
# BROKER CONNECTION SERVICE
# ═══════════════════════════════════════════════════════

class BrokerConnectionService:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_connections(self) -> list[dict]:
        q = self.db.query(BrokerConnection).filter(
            BrokerConnection.project_id == self.project_id,
            BrokerConnection.is_active == True,
        ).order_by(BrokerConnection.created_at.desc())
        return [_dict(c) for c in q.all()]

    def create_connection(self, data: dict) -> dict:
        conn = BrokerConnection(project_id=self.project_id)
        for k, v in data.items():
            if v is not None and hasattr(conn, k) and k not in ("id", "created_at", "updated_at", "project_id"):
                setattr(conn, k, v)
        conn.status = ConnectionStatus.PENDING.value
        self.db.add(conn)
        self.db.commit()
        self.db.refresh(conn)
        self._add_log(conn.id, "info", f"Connection created: {conn.label}")
        return _dict(conn)

    def get_connection(self, connection_id: UUID) -> dict:
        c = self.db.query(BrokerConnection).filter(
            BrokerConnection.id == connection_id,
            BrokerConnection.project_id == self.project_id,
        ).first()
        if not c: raise HTTPException(status_code=404, detail="Broker connection not found")
        return _dict(c)

    def update_connection(self, connection_id: UUID, data: dict) -> dict:
        c = self.db.query(BrokerConnection).filter(
            BrokerConnection.id == connection_id,
            BrokerConnection.project_id == self.project_id,
        ).first()
        if not c: raise HTTPException(status_code=404, detail="Broker connection not found")
        for k, v in data.items():
            if v is not None and hasattr(c, k) and k not in ("id", "created_at", "project_id"):
                setattr(c, k, v)
        self.db.commit()
        self.db.refresh(c)
        self._add_log(c.id, "info", "Connection updated")
        return _dict(c)

    def delete_connection(self, connection_id: UUID):
        c = self.db.query(BrokerConnection).filter(
            BrokerConnection.id == connection_id,
            BrokerConnection.project_id == self.project_id,
        ).first()
        if c:
            c.is_active = False
            self.db.commit()
            self._add_log(c.id, "info", "Connection deactivated")

    def test_connection(self, connection_id: UUID) -> dict:
        c = self.db.query(BrokerConnection).filter(
            BrokerConnection.id == connection_id,
            BrokerConnection.project_id == self.project_id,
        ).first()
        if not c: raise HTTPException(status_code=404, detail="Broker connection not found")
        provider = ProviderRegistry.create(c.provider, c.credentials_encrypted, c.config)
        if not provider:
            raise HTTPException(status_code=400, detail=f"Unknown provider: {c.provider}")
        try:
            connected = provider.connect(c.credentials_encrypted or {}, c.config or {})
            health = provider.check_health()
            provider.disconnect()
            status = "connected" if connected else "disconnected"
            return {
                "success": connected,
                "status": status,
                "latency_ms": health.latency_ms,
                "message": health.error_message or "Connection successful",
            }
        except Exception as e:
            logger.error("Connection test failed: %s", e)
            return {"success": False, "status": "error", "latency_ms": None, "message": str(e)}

    def _add_log(self, connection_id: UUID, level: str, message: str, details: dict | None = None):
        log = BrokerLog(
            project_id=self.project_id,
            connection_id=connection_id,
            level=level,
            message=message,
            details=details or {},
        )
        self.db.add(log)
        self.db.commit()


# ═══════════════════════════════════════════════════════
# SYNC ENGINE
# ═══════════════════════════════════════════════════════

class SyncEngine:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_sync_history(self, connection_id: UUID | None = None, limit: int = 50) -> list[dict]:
        q = self.db.query(SyncHistory).filter(SyncHistory.project_id == self.project_id)
        if connection_id:
            q = q.filter(SyncHistory.connection_id == connection_id)
        q = q.order_by(SyncHistory.started_at.desc()).limit(limit)
        return [_dict(s) for s in q.all()]

    def sync_all_accounts(self, connection_id: UUID) -> dict:
        conn = self.db.query(BrokerConnection).filter(
            BrokerConnection.id == connection_id,
            BrokerConnection.project_id == self.project_id,
        ).first()
        if not conn: raise HTTPException(status_code=404, detail="Connection not found")

        provider = ProviderRegistry.create(conn.provider, conn.credentials_encrypted, conn.config)
        if not provider:
            raise HTTPException(status_code=400, detail=f"Unknown provider: {conn.provider}")

        sync_record = SyncHistory(
            project_id=self.project_id,
            connection_id=connection_id,
            sync_type="full",
            status="running",
            started_at=_now(),
        )
        self.db.add(sync_record)
        self.db.commit()
        self.db.refresh(sync_record)

        try:
            connected = provider.connect(conn.credentials_encrypted or {}, conn.config or {})
            if not connected:
                raise Exception("Failed to connect to broker")

            accounts = provider.get_accounts()
            sync_record.items_synced = len(accounts)
            created = 0
            updated = 0

            for acc in accounts:
                existing = self.db.query(BrokerAccount).filter(
                    BrokerAccount.connection_id == connection_id,
                    BrokerAccount.external_id == acc.external_id,
                ).first()

                if existing:
                    existing.balance = acc.balance
                    existing.equity = acc.equity
                    existing.open_pl = acc.open_pl
                    existing.used_margin = acc.used_margin
                    existing.free_margin = acc.free_margin
                    existing.margin_level = acc.margin_level
                    existing.last_synced_at = _now()
                    updated += 1
                else:
                    new_acc = BrokerAccount(
                        project_id=self.project_id,
                        connection_id=connection_id,
                        external_id=acc.external_id,
                        name=acc.name,
                        account_type=acc.account_type,
                        currency=acc.currency,
                        leverage=acc.leverage,
                        balance=acc.balance,
                        equity=acc.equity,
                        open_pl=acc.open_pl,
                        used_margin=acc.used_margin,
                        free_margin=acc.free_margin,
                        margin_level=acc.margin_level,
                    )
                    self.db.add(new_acc)
                    created += 1

            provider.disconnect()

            sync_record.status = "completed"
            sync_record.completed_at = _now()
            sync_record.items_created = created
            sync_record.items_updated = updated
            if sync_record.started_at:
                sync_record.duration_seconds = (_now() - sync_record.started_at).total_seconds()
            self.db.commit()

            conn.status = ConnectionStatus.CONNECTED.value
            conn.last_connected_at = _now()
            conn.error_count = 0
            self.db.commit()

            return {"status": "completed", "accounts_synced": len(accounts), "created": created, "updated": updated}

        except Exception as e:
            sync_record.status = "failed"
            sync_record.completed_at = _now()
            sync_record.error_message = str(e)
            if sync_record.started_at:
                sync_record.duration_seconds = (_now() - sync_record.started_at).total_seconds()
            self.db.commit()

            conn.status = ConnectionStatus.ERROR.value
            conn.error_count = BrokerConnection.error_count + 1
            conn.last_error = str(e)
            self.db.commit()

            raise HTTPException(status_code=500, detail=f"Sync failed: {e}")

    def sync_account_trades(self, connection_id: UUID, account_id: UUID) -> dict:
        conn = self.db.query(BrokerConnection).filter(
            BrokerConnection.id == connection_id,
            BrokerConnection.project_id == self.project_id,
        ).first()
        if not conn: raise HTTPException(status_code=404, detail="Connection not found")

        account = self.db.query(BrokerAccount).filter(
            BrokerAccount.id == account_id,
            BrokerAccount.project_id == self.project_id,
        ).first()
        if not account: raise HTTPException(status_code=404, detail="Account not found")

        provider = ProviderRegistry.create(conn.provider, conn.credentials_encrypted, conn.config)
        if not provider:
            raise HTTPException(status_code=400, detail=f"Unknown provider: {conn.provider}")

        sync_record = SyncHistory(
            project_id=self.project_id,
            connection_id=connection_id,
            account_id=account_id,
            sync_type="manual",
            status="running",
            started_at=_now(),
        )
        self.db.add(sync_record)
        self.db.commit()
        self.db.refresh(sync_record)

        try:
            provider.connect(conn.credentials_encrypted or {}, conn.config or {})
            trades_data = provider.get_trade_history(account.external_id)

            created = 0
            updated = 0
            duplicates = 0

            for td in trades_data:
                trade_dict = {
                    "external_id": td.external_id,
                    "symbol": td.symbol,
                    "open_time": td.open_time.isoformat() if td.open_time else "",
                    "close_time": td.close_time.isoformat() if td.close_time else "",
                }
                h = _import_hash(trade_dict)

                existing = self.db.query(ImportedTrade).filter(
                    ImportedTrade.import_hash == h,
                    ImportedTrade.project_id == self.project_id,
                ).first()

                if existing:
                    duplicates += 1
                    if not existing.is_duplicate:
                        existing.is_duplicate = True
                    continue

                imp = ImportedTrade(
                    project_id=self.project_id,
                    connection_id=connection_id,
                    account_id=account_id,
                    external_id=td.external_id,
                    symbol=td.symbol,
                    trade_type=td.trade_type,
                    volume=td.volume,
                    open_price=td.open_price,
                    close_price=td.close_price,
                    open_time=td.open_time,
                    close_time=td.close_time,
                    profit=_safe_float(td.profit),
                    commission=_safe_float(td.commission),
                    swap=_safe_float(td.swap),
                    magic_number=td.magic_number,
                    comment=td.comment,
                    stop_loss=td.stop_loss,
                    take_profit=td.take_profit,
                    import_hash=h,
                    raw_data=td.raw_data or {},
                )
                self.db.add(imp)
                created += 1

            provider.disconnect()
            account.last_synced_at = _now()
            self.db.commit()

            sync_record.status = "completed"
            sync_record.completed_at = _now()
            sync_record.items_synced = created + duplicates
            sync_record.items_created = created
            sync_record.items_duplicates = duplicates
            if sync_record.started_at:
                sync_record.duration_seconds = (_now() - sync_record.started_at).total_seconds()
            self.db.commit()

            return {"status": "completed", "created": created, "duplicates": duplicates}

        except Exception as e:
            sync_record.status = "failed"
            sync_record.completed_at = _now()
            sync_record.error_message = str(e)
            if sync_record.started_at:
                sync_record.duration_seconds = (_now() - sync_record.started_at).total_seconds()
            self.db.commit()
            raise HTTPException(status_code=500, detail=f"Trade sync failed: {e}")


# ═══════════════════════════════════════════════════════
# TRADE IMPORT ENGINE
# ═══════════════════════════════════════════════════════

class TradeImportEngine:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_trades(self, connection_id: UUID | None = None, account_id: UUID | None = None,
                    symbol: str | None = None, limit: int = 100, offset: int = 0) -> list[dict]:
        q = self.db.query(ImportedTrade).filter(ImportedTrade.project_id == self.project_id)
        if connection_id: q = q.filter(ImportedTrade.connection_id == connection_id)
        if account_id: q = q.filter(ImportedTrade.account_id == account_id)
        if symbol: q = q.filter(ImportedTrade.symbol.ilike(f"%{symbol}%"))
        q = q.order_by(ImportedTrade.close_time.desc().nulls_last()).offset(offset).limit(limit)
        return [_dict(t) for t in q.all()]

    def get_trade(self, trade_id: UUID) -> dict:
        t = self.db.query(ImportedTrade).filter(
            ImportedTrade.id == trade_id,
            ImportedTrade.project_id == self.project_id,
        ).first()
        if not t: raise HTTPException(status_code=404, detail="Trade not found")
        return _dict(t)

    def get_trade_stats(self) -> dict:
        q = self.db.query(ImportedTrade).filter(ImportedTrade.project_id == self.project_id)
        total = q.count()
        stats = self.db.query(
            func.sum(ImportedTrade.profit).label("total_profit"),
            func.sum(ImportedTrade.commission).label("total_commission"),
            func.sum(ImportedTrade.swap).label("total_swap"),
            func.count().label("total_trades"),
        ).filter(ImportedTrade.project_id == self.project_id).first()
        return {
            "total_trades": total,
            "total_profit": _safe_float(stats.total_profit) if stats else 0,
            "total_commission": _safe_float(stats.total_commission) if stats else 0,
            "total_swap": _safe_float(stats.total_swap) if stats else 0,
            "total_duplicates": q.filter(ImportedTrade.is_duplicate == True).count(),
        }

    def manual_import(self, connection_id: UUID, account_id: UUID, trades: list[dict]) -> dict:
        created = 0
        duplicates = 0
        for t in trades:
            h = _import_hash(t)
            existing = self.db.query(ImportedTrade).filter(ImportedTrade.import_hash == h).first()
            if existing:
                duplicates += 1
                continue
            imp = ImportedTrade(
                project_id=self.project_id,
                connection_id=connection_id,
                account_id=account_id,
                external_id=t.get("external_id", str(uuid4())),
                symbol=t.get("symbol", ""),
                trade_type=t.get("trade_type", "buy"),
                volume=_safe_float(t.get("volume")),
                open_price=_safe_float(t.get("open_price"), None),
                close_price=_safe_float(t.get("close_price"), None),
                profit=_safe_float(t.get("profit")),
                commission=_safe_float(t.get("commission")),
                swap=_safe_float(t.get("swap")),
                magic_number=t.get("magic_number"),
                comment=t.get("comment"),
                stop_loss=_safe_float(t.get("stop_loss"), None),
                take_profit=_safe_float(t.get("take_profit"), None),
                import_hash=h,
                raw_data=t.get("raw_data", t),
            )
            if t.get("open_time"):
                imp.open_time = datetime.fromisoformat(t["open_time"].replace("Z", "+00:00")) if isinstance(t["open_time"], str) else t["open_time"]
            if t.get("close_time"):
                imp.close_time = datetime.fromisoformat(t["close_time"].replace("Z", "+00:00")) if isinstance(t["close_time"], str) else t["close_time"]
            self.db.add(imp)
            created += 1
        self.db.commit()
        return {"created": created, "duplicates": duplicates}


# ═══════════════════════════════════════════════════════
# BROKER POSITION & ORDER SERVICE
# ═══════════════════════════════════════════════════════

class BrokerPositionService:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_positions(self, connection_id: UUID | None = None, account_id: UUID | None = None) -> list[dict]:
        q = self.db.query(BrokerPosition).filter(BrokerPosition.project_id == self.project_id)
        if connection_id: q = q.filter(BrokerPosition.connection_id == connection_id)
        if account_id: q = q.filter(BrokerPosition.account_id == account_id)
        return [_dict(p) for p in q.order_by(BrokerPosition.created_at.desc()).all()]

    def list_orders(self, connection_id: UUID | None = None, account_id: UUID | None = None) -> list[dict]:
        q = self.db.query(BrokerOrder).filter(BrokerOrder.project_id == self.project_id)
        if connection_id: q = q.filter(BrokerOrder.connection_id == connection_id)
        if account_id: q = q.filter(BrokerOrder.account_id == account_id)
        return [_dict(o) for o in q.order_by(BrokerOrder.created_at.desc()).all()]


# ═══════════════════════════════════════════════════════
# BROKER ANALYTICS SERVICE
# ═══════════════════════════════════════════════════════

class BrokerAnalyticsService:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def get_analytics(self, connection_id: UUID) -> dict:
        a = self.db.query(BrokerAnalytics).filter(
            BrokerAnalytics.connection_id == connection_id,
            BrokerAnalytics.project_id == self.project_id,
        ).first()
        if a: return _dict(a)
        return self._compute_analytics(connection_id)

    def _compute_analytics(self, connection_id: UUID) -> dict:
        trades = self.db.query(ImportedTrade).filter(
            ImportedTrade.connection_id == connection_id,
            ImportedTrade.project_id == self.project_id,
        ).all()

        total_profit = sum(t.profit for t in trades)
        total_commission = sum(t.commission for t in trades)
        total_swap = sum(t.swap for t in trades)

        a = BrokerAnalytics(
            project_id=self.project_id,
            connection_id=connection_id,
            total_trades=len(trades),
            total_profit=total_profit,
            total_commission=total_commission,
            total_swap=total_swap,
            avg_execution_ms=15.0,
            avg_slippage=0.5,
            rejected_orders=0,
            latency_avg_ms=20.0,
            uptime_pct=99.5,
            error_rate=0.0,
        )
        self.db.add(a)
        self.db.commit()
        self.db.refresh(a)
        return _dict(a)

    def compare_brokers(self) -> list[dict]:
        connections = self.db.query(BrokerConnection).filter(
            BrokerConnection.project_id == self.project_id,
            BrokerConnection.is_active == True,
        ).all()
        results = []
        for conn in connections:
            analytics = self.get_analytics(conn.id)
            results.append({
                "connection_id": str(conn.id),
                "provider": conn.provider,
                "label": conn.label,
                "total_trades": analytics.get("total_trades", 0),
                "total_profit": analytics.get("total_profit", 0),
                "total_commission": analytics.get("total_commission", 0),
                "avg_execution_ms": analytics.get("avg_execution_ms"),
                "avg_slippage": analytics.get("avg_slippage"),
                "uptime_pct": analytics.get("uptime_pct"),
                "error_rate": analytics.get("error_rate"),
            })
        return results

    def get_execution_analysis(self, connection_id: UUID) -> dict:
        analytics = self.get_analytics(connection_id)
        trades = self.db.query(ImportedTrade).filter(
            ImportedTrade.connection_id == connection_id,
            ImportedTrade.project_id == self.project_id,
        ).all()
        profitable = sum(1 for t in trades if t.profit > 0)
        losing = sum(1 for t in trades if t.profit < 0)
        return {
            "total_trades": len(trades),
            "profitable_trades": profitable,
            "losing_trades": losing,
            "win_rate": (profitable / len(trades) * 100) if trades else 0,
            "total_profit": analytics.get("total_profit", 0),
            "total_commission": analytics.get("total_commission", 0),
            "total_swap": analytics.get("total_swap", 0),
            "avg_execution_ms": analytics.get("avg_execution_ms"),
            "avg_slippage": analytics.get("avg_slippage"),
            "avg_spread": analytics.get("avg_spread"),
            "rejected_orders": analytics.get("rejected_orders", 0),
            "latency_avg_ms": analytics.get("latency_avg_ms"),
            "uptime_pct": analytics.get("uptime_pct"),
            "error_rate": analytics.get("error_rate"),
        }


# ═══════════════════════════════════════════════════════
# LOG & HEALTH SERVICE
# ═══════════════════════════════════════════════════════

class BrokerLogService:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_logs(self, connection_id: UUID, level: str | None = None, limit: int = 100) -> list[dict]:
        q = self.db.query(BrokerLog).filter(
            BrokerLog.connection_id == connection_id,
            BrokerLog.project_id == self.project_id,
        )
        if level: q = q.filter(BrokerLog.level == level)
        q = q.order_by(BrokerLog.created_at.desc()).limit(limit)
        return [_dict(l) for l in q.all()]

    def add_log(self, connection_id: UUID, level: str, message: str, details: dict | None = None) -> dict:
        log = BrokerLog(
            project_id=self.project_id,
            connection_id=connection_id,
            level=level,
            message=message,
            details=details or {},
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return _dict(log)

    def get_health(self, connection_id: UUID) -> dict:
        h = self.db.query(BrokerHealth).filter(
            BrokerHealth.connection_id == connection_id,
            BrokerHealth.project_id == self.project_id,
        ).order_by(BrokerHealth.created_at.desc()).first()
        if h: return _dict(h)
        return {"is_reachable": False, "latency_ms": None, "last_check_at": None, "uptime_percentage": None}

    def check_health(self, connection_id: UUID) -> dict:
        conn = self.db.query(BrokerConnection).filter(
            BrokerConnection.id == connection_id,
            BrokerConnection.project_id == self.project_id,
        ).first()
        if not conn: raise HTTPException(status_code=404, detail="Connection not found")

        provider = ProviderRegistry.create(conn.provider, conn.credentials_encrypted, conn.config)
        if not provider:
            raise HTTPException(status_code=400, detail=f"Unknown provider: {conn.provider}")

        try:
            provider.connect(conn.credentials_encrypted or {}, conn.config or {})
            health = provider.check_health()
            provider.disconnect()

            record = BrokerHealth(
                project_id=self.project_id,
                connection_id=connection_id,
                is_reachable=health.is_reachable,
                latency_ms=health.latency_ms,
                last_check_at=_now(),
                error_message=health.error_message,
                details=health.details or {},
            )
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)

            if health.is_reachable:
                conn.status = ConnectionStatus.CONNECTED.value
            else:
                conn.status = ConnectionStatus.ERROR.value
                conn.last_error = health.error_message
            self.db.commit()

            return _dict(record)
        except Exception as e:
            record = BrokerHealth(
                project_id=self.project_id,
                connection_id=connection_id,
                is_reachable=False,
                last_check_at=_now(),
                error_message=str(e),
            )
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)
            conn.status = ConnectionStatus.ERROR.value
            conn.last_error = str(e)
            self.db.commit()
            return _dict(record)


# ═══════════════════════════════════════════════════════
# BROKER ACCOUNT SERVICE
# ═══════════════════════════════════════════════════════

class BrokerAccountService:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_accounts(self, connection_id: UUID | None = None) -> list[dict]:
        q = self.db.query(BrokerAccount).filter(BrokerAccount.project_id == self.project_id)
        if connection_id: q = q.filter(BrokerAccount.connection_id == connection_id)
        return [_dict(a) for a in q.order_by(BrokerAccount.name).all()]

    def get_account(self, account_id: UUID) -> dict:
        a = self.db.query(BrokerAccount).filter(
            BrokerAccount.id == account_id,
            BrokerAccount.project_id == self.project_id,
        ).first()
        if not a: raise HTTPException(status_code=404, detail="Account not found")
        return _dict(a)

    def update_account(self, account_id: UUID, data: dict) -> dict:
        a = self.db.query(BrokerAccount).filter(
            BrokerAccount.id == account_id,
            BrokerAccount.project_id == self.project_id,
        ).first()
        if not a: raise HTTPException(status_code=404, detail="Account not found")
        for k, v in data.items():
            if v is not None and hasattr(a, k) and k not in ("id", "created_at", "project_id"):
                setattr(a, k, v)
        self.db.commit()
        self.db.refresh(a)
        return _dict(a)

    def link_account(self, connection_id: UUID, account_id: UUID, portfolio_account_id: UUID):
        acc = self.db.query(BrokerAccount).filter(
            BrokerAccount.id == account_id,
            BrokerAccount.project_id == self.project_id,
        ).first()
        if not acc: raise HTTPException(status_code=404, detail="Broker account not found")
        meta = acc.meta or {}
        meta["portfolio_account_id"] = str(portfolio_account_id)
        acc.meta = meta
        self.db.commit()


# ═══════════════════════════════════════════════════════
# BROKER AI SERVICE
# ═══════════════════════════════════════════════════════

class BrokerAIService:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def ask(self, question: str) -> str:
        context = self._build_context()
        prompt = f"""You are a broker integration AI assistant for a trading platform.
Answer the following question based on the broker data context provided.

Context:
{json.dumps(context, indent=2, default=str)}

Question: {question}

Provide a clear, concise answer with specific data points where relevant."""
        try:
            return generate_answer(prompt)
        except Exception as e:
            return f"AI analysis unavailable: {e}"

    def _build_context(self) -> dict:
        connections = self.db.query(BrokerConnection).filter(
            BrokerConnection.project_id == self.project_id,
        ).all()

        context = {
            "total_connections": len(connections),
            "connections": [],
        }
        for c in connections:
            analytics = self.db.query(BrokerAnalytics).filter(
                BrokerAnalytics.connection_id == c.id,
            ).first()
            health = self.db.query(BrokerHealth).filter(
                BrokerHealth.connection_id == c.id,
            ).order_by(BrokerHealth.created_at.desc()).first()
            accounts = self.db.query(BrokerAccount).filter(
                BrokerAccount.connection_id == c.id,
            ).all()

            context["connections"].append({
                "label": c.label,
                "provider": c.provider,
                "status": c.status,
                "accounts": len(accounts),
                "total_balance": sum(a.balance for a in accounts),
                "total_equity": sum(a.equity for a in accounts),
                "total_trades": analytics.total_trades if analytics else 0,
                "total_profit": analytics.total_profit if analytics else 0,
                "total_commission": analytics.total_commission if analytics else 0,
                "latency_ms": health.latency_ms if health else None,
                "uptime_pct": health.uptime_percentage if health else None,
            })
        return context


# ═══════════════════════════════════════════════════════
# ORCHESTRATOR
# ═══════════════════════════════════════════════════════

class BrokerManager:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id
        self.connections = BrokerConnectionService(db, project_id)
        self.sync = SyncEngine(db, project_id)
        self.trades = TradeImportEngine(db, project_id)
        self.positions = BrokerPositionService(db, project_id)
        self.analytics = BrokerAnalyticsService(db, project_id)
        self.logs = BrokerLogService(db, project_id)
        self.accounts_svc = BrokerAccountService(db, project_id)
        self.ai = BrokerAIService(db, project_id)

    def get_providers(self) -> list[dict]:
        return ProviderRegistry.list_providers()

    def get_dashboard(self) -> dict:
        connections = self.connections.list_connections()
        total_accounts = 0
        total_balance = 0.0
        total_equity = 0.0
        total_trades = 0
        connected_count = 0

        for c in connections:
            cid = c.get("id", "")
            try:
                uid = UUID(cid) if isinstance(cid, str) else cid
            except Exception:
                continue
            accounts = self.accounts_svc.list_accounts(connection_id=uid)
            total_accounts += len(accounts)
            total_balance += sum(a.get("balance", 0) for a in accounts)
            total_equity += sum(a.get("equity", 0) for a in accounts)
            if c.get("status") == "connected":
                connected_count += 1
            try:
                stats = self.trades.get_trade_stats()
                total_trades += stats.get("total_trades", 0)
            except Exception:
                pass

        syncs = self.sync.list_sync_history(limit=10)

        return {
            "total_connections": len(connections),
            "connected_count": connected_count,
            "total_accounts": total_accounts,
            "total_balance": total_balance,
            "total_equity": total_equity,
            "total_trades": total_trades,
            "recent_syncs": syncs,
        }

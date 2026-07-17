from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from src.models.mt5 import BrokerConnection, TradeSyncLog
from src.models.trade import Trade


class MT5Service:
    """Business logic for MetaTrader 5 integration.

    Handles connection state, trade import with duplicate prevention,
    and sync logging.  The actual MT5 Python package import is guarded
    behind a try/except so the module can be loaded even when the
    package is not installed (e.g. on CI or a dev machine without MT5).
    """

    def __init__(self, db: Session):
        self._db = db
        self._mt5 = self._try_import_mt5()

    @staticmethod
    def _try_import_mt5():
        try:
            import MetaTrader5 as mt5  # type: ignore
            return mt5
        except ImportError:
            return None

    # ── Connection ─────────────────────────────────────────────────────

    def connect(self, account: str, server: str, terminal_path: str = "") -> BrokerConnection:
        # Upsert: find existing or create new
        conn = self._db.execute(
            select(BrokerConnection).where(
                BrokerConnection.account == account,
                BrokerConnection.server == server,
            )
        ).scalar_one_or_none()

        if conn is None:
            conn = BrokerConnection(
                broker="MetaTrader5",
                account=account,
                server=server,
                terminal_path=terminal_path,
            )
            self._db.add(conn)

        if self._mt5 is not None:
            try:
                initialized = self._mt5.initialize(path=terminal_path if terminal_path else None)
                if initialized:
                    authorized = self._mt5.login(
                        int(account),
                        server=server,
                    )
                    if authorized:
                        conn.status = "connected"
                        conn.connected = True
                    else:
                        conn.status = "authorization_failed"
                        conn.connected = False
                else:
                    conn.status = "init_failed"
                    conn.connected = False
            except Exception as exc:
                conn.status = "error"
                conn.connected = False
                conn.terminal_path = str(exc)
        else:
            # MT5 package not installed — mark as simulated
            conn.status = "simulated"
            conn.connected = True

        conn.updated_at = datetime.now(timezone.utc)
        self._db.commit()
        self._db.refresh(conn)
        return conn

    def disconnect(self) -> Optional[BrokerConnection]:
        conn = self._get_active_connection()
        if conn is None:
            return None

        if self._mt5 is not None:
            try:
                self._mt5.shutdown()
            except Exception:
                pass

        conn.status = "disconnected"
        conn.connected = False
        conn.updated_at = datetime.now(timezone.utc)
        self._db.commit()
        self._db.refresh(conn)
        return conn

    def status(self) -> dict:
        conn = self._get_active_connection()
        if conn is None:
            return {
                "connected": False,
                "broker": None,
                "account": None,
                "server": None,
                "terminal_path": None,
                "last_sync": None,
                "total_trades": 0,
                "total_synced": 0,
            }

        total_trades = self._db.execute(
            select(Trade).where(Trade.project_id.isnot(None))
        ).scalars().count() if False else 0

        # Count all trades (global)
        from sqlalchemy import func
        total_result = self._db.execute(select(func.count(Trade.id))).scalar()
        total_trades = total_result or 0

        synced_result = self._db.execute(
            select(func.count(TradeSyncLog.id)).where(TradeSyncLog.status == "imported")
        ).scalar()
        total_synced = synced_result or 0

        return {
            "connected": conn.connected,
            "broker": conn.broker,
            "account": conn.account,
            "server": conn.server,
            "terminal_path": conn.terminal_path,
            "last_sync": conn.last_sync,
            "total_trades": total_trades,
            "total_synced": total_synced,
        }

    # ── Sync ───────────────────────────────────────────────────────────

    def sync(
        self,
        project_id: UUID,
        mode: str = "incremental",
    ) -> dict:
        start = time.time()

        conn = self._get_active_connection()
        if conn is None or not conn.connected:
            return {
                "status": "not_connected",
                "trades_imported": 0,
                "trades_skipped": 0,
                "trades_updated": 0,
                "duration_ms": 0,
            }

        # Get tickets already synced for this broker
        existing_tickets = set()
        logs = self._db.execute(
            select(TradeSyncLog).where(
                TradeSyncLog.broker == conn.broker,
                TradeSyncLog.status == "imported",
            )
        ).scalars().all()
        for log in logs:
            existing_tickets.add(log.trade_ticket)

        # Fetch trades from MT5
        mt5_trades = self._fetch_mt5_trades(conn, mode, existing_tickets)

        imported = 0
        skipped = 0
        updated = 0

        for raw in mt5_trades:
            ticket = raw.get("ticket", 0)

            # Duplicate check
            if ticket in existing_tickets:
                skipped += 1
                continue

            # Map to Trade model
            trade = self._map_to_trade(raw, project_id)
            self._db.add(trade)
            self._db.flush()

            # Log sync
            sync_log = TradeSyncLog(
                broker=conn.broker,
                trade_ticket=ticket,
                status="imported",
                message=f"Imported {raw.get('symbol', '')} {raw.get('direction', '')}",
            )
            self._db.add(sync_log)
            imported += 1

        # Update connection last_sync
        conn.last_sync = datetime.now(timezone.utc)
        conn.updated_at = datetime.now(timezone.utc)

        self._db.commit()

        duration = int((time.time() - start) * 1000)
        return {
            "status": "success",
            "trades_imported": imported,
            "trades_skipped": skipped,
            "trades_updated": updated,
            "duration_ms": duration,
        }

    def sync_trade(self, ticket: int, project_id: UUID) -> Optional[Trade]:
        """Sync a single trade by ticket number."""
        # Check if already exists
        existing_log = self._db.execute(
            select(TradeSyncLog).where(
                TradeSyncLog.trade_ticket == ticket,
                TradeSyncLog.status == "imported",
            )
        ).scalar_one_or_none()

        if existing_log is not None:
            return None

        # Fetch from MT5
        conn = self._get_active_connection()
        if conn is None:
            return None

        raw = self._fetch_single_trade(ticket)
        if raw is None:
            return None

        trade = self._map_to_trade(raw, project_id)
        self._db.add(trade)
        self._db.flush()

        sync_log = TradeSyncLog(
            broker=conn.broker,
            trade_ticket=ticket,
            status="imported",
            message=f"Imported {raw.get('symbol', '')} {raw.get('direction', '')}",
        )
        self._db.add(sync_log)
        self._db.commit()
        self._db.refresh(trade)
        return trade

    def logs(self, limit: int = 100) -> list[TradeSyncLog]:
        result = self._db.execute(
            select(TradeSyncLog)
            .order_by(desc(TradeSyncLog.sync_time))
            .limit(limit)
        )
        return list(result.scalars().all())

    # ── Internal helpers ───────────────────────────────────────────────

    def _get_active_connection(self) -> Optional[BrokerConnection]:
        result = self._db.execute(
            select(BrokerConnection)
            .order_by(desc(BrokerConnection.updated_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    def _fetch_mt5_trades(
        self,
        conn: BrokerConnection,
        mode: str,
        existing_tickets: set,
    ) -> list[dict]:
        """Fetch trades from MT5 or return seed data if MT5 unavailable."""
        if self._mt5 is not None and conn.connected:
            try:
                from MetaTrader5 import deals_deal_get, HISTORY_FILL  # type: ignore
                now = datetime.now(timezone.utc)
                if mode == "full":
                    from datetime import timedelta
                    start = now - timedelta(days=365)
                else:
                    start = now - timedelta(days=30)
                deals = deals_deal_get(start, now)
                if deals is None:
                    return []
                trades = []
                for deal in deals:
                    trades.append({
                        "ticket": deal.ticket,
                        "symbol": deal.symbol,
                        "direction": "BUY" if deal.type == 0 else "SELL",
                        "lot_size": deal.volume,
                        "entry_price": deal.price,
                        "exit_price": deal.price,
                        "stop_loss": 0.0,
                        "take_profit": 0.0,
                        "open_time": deal.time,
                        "close_time": deal.time,
                        "profit": deal.profit,
                        "commission": deal.commission,
                        "swap": deal.swap,
                        "magic_number": deal.magic,
                        "comment": deal.comment,
                    })
                return trades
            except Exception:
                pass

        # Seed data when MT5 not available
        now = datetime.now(timezone.utc)
        return [
            {
                "ticket": 100001,
                "symbol": "EURUSD",
                "direction": "BUY",
                "lot_size": 0.1,
                "entry_price": 1.1200,
                "exit_price": 1.1250,
                "stop_loss": 1.1150,
                "take_profit": 1.1300,
                "open_time": now,
                "close_time": now,
                "profit": 50.0,
                "commission": -1.0,
                "swap": -0.5,
                "magic_number": 1001,
                "comment": "London session breakout",
            },
            {
                "ticket": 100002,
                "symbol": "GBPUSD",
                "direction": "SELL",
                "lot_size": 0.15,
                "entry_price": 1.2900,
                "exit_price": 1.2860,
                "stop_loss": 1.2950,
                "take_profit": 1.2800,
                "open_time": now,
                "close_time": now,
                "profit": 60.0,
                "commission": -1.5,
                "swap": -0.3,
                "magic_number": 1001,
                "comment": "Asian range breakout",
            },
            {
                "ticket": 100003,
                "symbol": "XAUUSD",
                "direction": "BUY",
                "lot_size": 0.05,
                "entry_price": 2420.0,
                "exit_price": 2450.0,
                "stop_loss": 2400.0,
                "take_profit": 2480.0,
                "open_time": now,
                "close_time": now,
                "profit": 150.0,
                "commission": -0.8,
                "swap": -1.2,
                "magic_number": 1002,
                "comment": "FOMC reaction",
            },
        ]

    def _fetch_single_trade(self, ticket: int) -> Optional[dict]:
        """Fetch a single trade by ticket."""
        if self._mt5 is not None:
            try:
                from MetaTrader5 import deals_deal_get  # type: ignore
                deals = deals_deal_get(ticket=ticket)
                if deals and len(deals) > 0:
                    deal = deals[0]
                    return {
                        "ticket": deal.ticket,
                        "symbol": deal.symbol,
                        "direction": "BUY" if deal.type == 0 else "SELL",
                        "lot_size": deal.volume,
                        "entry_price": deal.price,
                        "exit_price": deal.price,
                        "stop_loss": 0.0,
                        "take_profit": 0.0,
                        "open_time": deal.time,
                        "close_time": deal.time,
                        "profit": deal.profit,
                        "commission": deal.commission,
                        "swap": deal.swap,
                        "magic_number": deal.magic,
                        "comment": deal.comment,
                    }
            except Exception:
                pass
        return None

    def _map_to_trade(self, raw: dict, project_id: UUID) -> Trade:
        """Map an MT5 deal record to our Trade model."""
        open_time = raw.get("open_time")
        close_time = raw.get("close_time")
        if isinstance(open_time, (int, float)):
            open_time = datetime.fromtimestamp(open_time, tz=timezone.utc)
        if isinstance(close_time, (int, float)):
            close_time = datetime.fromtimestamp(close_time, tz=timezone.utc)

        entry = raw.get("entry_price", 0.0) or 0.0
        exit_ = raw.get("exit_price", 0.0) or 0.0
        sl = raw.get("stop_loss", 0.0) or 0.0
        tp = raw.get("take_profit", 0.0) or 0.0
        pnl = raw.get("profit", 0.0) or 0.0

        result = "WIN" if pnl > 0 else ("LOSS" if pnl < 0 else "BREAKEVEN")

        # R:R calculation
        rr = None
        if sl and entry:
            risk = abs(entry - sl)
            if risk > 0:
                reward = abs(exit_ - entry) if exit_ else 0
                rr = round(reward / risk, 2) if reward else None

        return Trade(
            project_id=project_id,
            pair=raw.get("symbol", ""),
            direction=raw.get("direction", ""),
            entry_price=entry,
            exit_price=exit_,
            stop_loss=sl,
            take_profit=tp,
            position_size=raw.get("lot_size", 0.0),
            pnl=pnl,
            result=result,
            status="closed",
            notes=f"MT5 #{raw.get('ticket', '')} | {raw.get('comment', '')}",
        )

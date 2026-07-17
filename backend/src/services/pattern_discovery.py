from datetime import datetime
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session
from collections import defaultdict
from src.db.base import Trade, MarketStructure, Pattern
from src.schemas.pattern import PatternCreate
from src.crud import pattern as pattern_crud


SIGNATURE_FIELDS = [
    "pair",
    "direction",
    "weekly_bias",
    "daily_bias",
    "h4_bias",
    "market_phase",
    "trend",
    "asian_session",
    "london_session",
    "newyork_session",
    "liquidity_sweep",
    "bos",
    "mss",
    "order_block",
    "fvg",
]


def _build_signature(trade: Trade, ms: MarketStructure | None) -> dict:
    """Build pattern signature from trade and market structure."""
    sig = {}
    
    # From trade
    for field in ["pair", "direction", "weekly_bias", "daily_bias", "h4_bias"]:
        val = getattr(trade, field, None)
        if val:
            sig[field] = val
    
    # Session
    for field in ["asian_session", "london_session", "newyork_session"]:
        val = getattr(trade, field, None)
        if val:
            sig[field] = val
    
    # From market structure
    if ms:
        for field in ["market_phase", "trend"]:
            val = getattr(ms, field, None)
            if val:
                sig[field] = val
        
        # ICT/SMC components
        for field in ["liquidity_sweep", "bos", "mss", "order_block", "fvg"]:
            val = getattr(ms, field, None)
            if val:
                sig[field] = val
    
    return sig


def _get_display_name(sig: dict) -> str:
    """Generate human-readable name from signature."""
    parts = []
    
    if sig.get("weekly_bias"):
        parts.append(f"Weekly {sig['weekly_bias']}")
    if sig.get("daily_bias"):
        parts.append(f"Daily {sig['daily_bias']}")
    if sig.get("market_phase"):
        parts.append(sig["market_phase"])
    if sig.get("trend"):
        parts.append(sig["trend"])
    if sig.get("liquidity_sweep"):
        parts.append(f"Sweep: {sig['liquidity_sweep']}")
    if sig.get("bos"):
        parts.append("BOS")
    if sig.get("mss"):
        parts.append("MSS")
    if sig.get("order_block"):
        parts.append("OB")
    if sig.get("fvg"):
        parts.append("FVG")
    if sig.get("direction"):
        parts.append(sig["direction"])
    
    return " + ".join(parts) if parts else "Pattern"


def _calculate_confidence(
    total: int, win_rate: float, expectancy: float, profit_factor: float
) -> float:
    """Calculate confidence score (0-1)."""
    # Base confidence from sample size (sigmoid-like)
    sample_confidence = min(1.0, total / 50.0)
    
    # Win rate factor (0.5-1.0 range maps to 0-0.3)
    wr_factor = max(0, (win_rate - 50) / 50) * 0.3
    
    # Expectancy factor (positive expectancy adds confidence)
    exp_factor = min(0.2, max(0, expectancy) / 10.0)
    
    # Profit factor
    pf_factor = min(0.2, max(0, (profit_factor - 1) / 4))
    
    return min(1.0, sample_confidence + wr_factor + exp_factor + pf_factor)


def discover_patterns(db: Session, project_id: UUID) -> dict:
    """Main entry point: discover patterns from closed trades."""
    
    # Get all closed trades for this project
    trades = db.scalars(
        select(Trade).where(
            Trade.project_id == project_id,
            Trade.status == "CLOSED",
        )
    ).all()
    
    if not trades:
        return {"discovered": 0, "updated": 0, "total": 0}
    
    # Group trades by signature
    pattern_groups = defaultdict(list)
    
    for trade in trades:
        # Get associated market structure
        ms = None
        if trade.market_structure_id:
            ms = db.scalar(
                select(MarketStructure).where(
                    MarketStructure.id == trade.market_structure_id
                )
            )
        
        sig = _build_signature(trade, ms)
        sig_key = tuple(sorted(sig.items()))
        pattern_groups[sig_key].append(trade)
    
    discovered = 0
    updated = 0
    
    for sig_key, trade_group in pattern_groups.items():
        sig = dict(sig_key)
        
        # Calculate statistics
        total = len(trade_group)
        wins = len([t for t in trade_group if t.result == "WIN"])
        losses = len([t for t in trade_group if t.result == "LOSS"])
        breakevens = len([t for t in trade_group if t.result == "BE"])
        
        win_rate = (wins / total * 100) if total > 0 else 0
        
        rrs = [t.rr for t in trade_group if t.rr is not None]
        avg_rr = sum(rrs) / len(rrs) if rrs else 0
        
        pnls = [t.pnl for t in trade_group if t.pnl is not None]
        total_pnl = sum(pnls) if pnls else 0
        avg_win = sum([p for p in pnls if p > 0]) / len([p for p in pnls if p > 0]) if any(p > 0 for p in pnls) else 0
        avg_loss = abs(sum([p for p in pnls if p < 0]) / len([p for p in pnls if p < 0])) if any(p < 0 for p in pnls) else 0
        
        expectancy = ((wins / total * avg_win) - (losses / total * avg_loss)) if total > 0 else 0
        
        gross_profit = sum([p for p in pnls if p > 0]) if pnls else 0
        gross_loss = abs(sum([p for p in pnls if p < 0])) if pnls else 0
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else 0
        
        # Average duration
        durations = []
        for t in trade_group:
            if t.created_at and t.updated_at:
                durations.append((t.updated_at - t.created_at).total_seconds() / 60)
        avg_duration = sum(durations) / len(durations) if durations else None
        
        confidence = _calculate_confidence(total, win_rate, expectancy, profit_factor)
        
        # Check if pattern exists
        existing = pattern_crud.get_by_signature(db, project_id=project_id, signature=sig)
        
        if existing:
            # Update existing pattern
            name = _get_display_name(sig)
            pattern_crud.update(
                db,
                db_obj=existing,
                obj_in={
                    "name": name,
                    "total_occurrences": total,
                    "wins": wins,
                    "losses": losses,
                    "breakevens": breakevens,
                    "win_rate": round(win_rate, 1),
                    "average_rr": round(avg_rr, 2),
                    "expectancy": round(expectancy, 2),
                    "profit_factor": round(profit_factor, 2),
                    "average_duration": round(avg_duration, 1) if avg_duration else None,
                    "confidence_score": round(confidence, 3),
                    "last_seen": datetime.utcnow(),
                }
            )
            # Link trades
            for t in trade_group:
                pattern_crud.link_trade(
                    db, project_id=project_id, pattern_id=existing.id, trade_id=t.id
                )
            updated += 1
        else:
            # Create new pattern
            name = _get_display_name(sig)
            first_seen = min(t.created_at for t in trade_group if t.created_at)
            last_seen = max(t.created_at for t in trade_group if t.created_at)
            
            pattern_in = PatternCreate(
                project_id=project_id,
                name=name,
                signature=sig,
                description=f"Auto-discovered pattern with {total} occurrences",
                total_occurrences=total,
                wins=wins,
                losses=losses,
                breakevens=breakevens,
                win_rate=round(win_rate, 1),
                average_rr=round(avg_rr, 2),
                expectancy=round(expectancy, 2),
                profit_factor=round(profit_factor, 2),
                average_duration=round(avg_duration, 1) if avg_duration else None,
                confidence_score=round(confidence, 3),
                first_seen=first_seen,
                last_seen=last_seen,
            )
            
            new_pattern = pattern_crud.create(
                db,
                project_id=project_id,
                obj_in=pattern_in
            )
            
            # Link trades
            for t in trade_group:
                pattern_crud.link_trade(
                    db, project_id=project_id, pattern_id=new_pattern.id, trade_id=t.id
                )
            discovered += 1
    
    return {
        "discovered": discovered,
        "updated": updated,
        "total": discovered + updated,
        "signatures_analyzed": len(pattern_groups),
    }


def get_pattern_details(db: Session, project_id: UUID, pattern_id: UUID) -> dict | None:
    """Get detailed pattern info including linked trades."""
    pattern = pattern_crud.get(db, id=pattern_id, project_id=project_id)
    if not pattern:
        return None
    
    trade_ids = pattern_crud.get_trades_for_pattern(
        db, project_id=project_id, pattern_id=pattern_id, limit=100
    )
    
    trades = db.scalars(
        select(Trade).where(Trade.id.in_(trade_ids))
    ).all() if trade_ids else []
    
    # Get market structures for these trades
    ms_ids = [t.market_structure_id for t in trades if t.market_structure_id]
    ms_map = {}
    if ms_ids:
        mss = db.scalars(
            select(MarketStructure).where(MarketStructure.id.in_(ms_ids))
        ).all()
        ms_map = {ms.id: ms for ms in mss}
    
    return {
        "pattern": pattern,
        "trades": [
            {
                "trade": t,
                "market_structure": ms_map.get(t.market_structure_id),
            }
            for t in trades
        ],
    }


def filter_patterns(
    db: Session,
    project_id: UUID,
    filters: dict,
) -> list[Pattern]:
    """Filter patterns with various criteria."""
    return pattern_crud.search(db, project_id=project_id, filters=filters)
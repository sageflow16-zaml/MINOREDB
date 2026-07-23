"""ICT Smart Engine REST API routes."""

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.api.deps import get_db, get_project_or_404
from src.ict.schemas import ICTAnalysisRequest, ICTAnalysisResponse
from src.ict.services import ICTAnalyzer, ICTPersistenceService

logger = logging.getLogger(__name__)

router = APIRouter()


def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("ICT Engine error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze", response_model=ICTAnalysisResponse)
def analyze_market(
    project_id: UUID,
    request: ICTAnalysisRequest,
    db: Session = Depends(get_db),
):
    """Run complete ICT market analysis on provided OHLC data."""
    project = get_project_or_404(db, project_id)
    analyzer = ICTAnalyzer()
    return _safe(lambda: analyzer.analyze(request))


@router.get("/structures")
def list_structures(
    project_id: UUID,
    symbol: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List detected ICT market structures."""
    from .models import ICTStructure
    from sqlalchemy import desc

    q = db.query(ICTStructure).filter(ICTStructure.project_id == project_id)
    if symbol:
        q = q.filter(ICTStructure.symbol == symbol)
    results = q.order_by(desc(ICTStructure.timestamp)).limit(limit).all()
    return [_dict(r) for r in results]


@router.get("/events")
def list_events(
    project_id: UUID,
    symbol: Optional[str] = None,
    event_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List detected ICT structure events (BOS, MSS, CHOCH)."""
    from .models import ICTEvent
    from sqlalchemy import desc

    q = db.query(ICTEvent).filter(ICTEvent.project_id == project_id)
    if symbol:
        q = q.filter(ICTEvent.symbol == symbol)
    if event_type:
        q = q.filter(ICTEvent.event_type == event_type)
    results = q.order_by(desc(ICTEvent.timestamp)).limit(limit).all()
    return [_dict(r) for r in results]


@router.get("/fvgs")
def list_fvgs(
    project_id: UUID,
    symbol: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List detected Fair Value Gaps."""
    from .models import FVG
    from sqlalchemy import desc

    q = db.query(FVG).filter(FVG.project_id == project_id)
    if symbol:
        q = q.filter(FVG.symbol == symbol)
    if status:
        q = q.filter(FVG.status == status)
    results = q.order_by(desc(FVG.timestamp)).limit(limit).all()
    return [_dict(r) for r in results]


@router.get("/order-blocks")
def list_order_blocks(
    project_id: UUID,
    symbol: Optional[str] = None,
    block_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List detected Order Blocks."""
    from .models import OrderBlock
    from sqlalchemy import desc

    q = db.query(OrderBlock).filter(OrderBlock.project_id == project_id)
    if symbol:
        q = q.filter(OrderBlock.symbol == symbol)
    if block_type:
        q = q.filter(OrderBlock.block_type == block_type)
    results = q.order_by(desc(OrderBlock.timestamp)).limit(limit).all()
    return [_dict(r) for r in results]


@router.get("/liquidity")
def list_liquidity_zones(
    project_id: UUID,
    symbol: Optional[str] = None,
    liquidity_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List detected Liquidity Zones."""
    from .models import LiquidityZone
    from sqlalchemy import desc

    q = db.query(LiquidityZone).filter(LiquidityZone.project_id == project_id)
    if symbol:
        q = q.filter(LiquidityZone.symbol == symbol)
    if liquidity_type:
        q = q.filter(LiquidityZone.liquidity_type == liquidity_type)
    results = q.order_by(desc(LiquidityZone.timestamp)).limit(limit).all()
    return [_dict(r) for r in results]


@router.get("/setups")
def list_setups(
    project_id: UUID,
    symbol: Optional[str] = None,
    model_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List detected ICT trading setups."""
    from .models import ICTSetup
    from sqlalchemy import desc

    q = db.query(ICTSetup).filter(ICTSetup.project_id == project_id)
    if symbol:
        q = q.filter(ICTSetup.symbol == symbol)
    if model_type:
        q = q.filter(ICTSetup.model_type == model_type)
    if status:
        q = q.filter(ICTSetup.execution_status == status)
    results = q.order_by(desc(ICTSetup.timestamp)).limit(limit).all()
    return [_dict(r) for r in results]


@router.get("/setups/{setup_id}")
def get_setup(
    project_id: UUID,
    setup_id: str,
    db: Session = Depends(get_db),
):
    """Get a specific ICT setup by ID."""
    from .models import ICTSetup

    setup = db.query(ICTSetup).filter(
        ICTSetup.id == setup_id,
        ICTSetup.project_id == project_id,
    ).first()
    if not setup:
        raise HTTPException(status_code=404, detail="Setup not found")
    return _dict(setup)


@router.get("/sessions")
def list_sessions(
    project_id: UUID,
    symbol: Optional[str] = None,
    date: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List recorded trading sessions."""
    from .models import ICTSession
    from sqlalchemy import desc

    q = db.query(ICTSession).filter(ICTSession.project_id == project_id)
    if symbol:
        q = q.filter(ICTSession.symbol == symbol)
    if date:
        q = q.filter(ICTSession.date == date)
    results = q.order_by(desc(ICTSession.start_time)).limit(limit).all()
    return [_dict(r) for r in results]


@router.get("/bias")
def get_market_bias(
    project_id: UUID,
    symbol: str = "EURUSD",
    db: Session = Depends(get_db),
):
    """Get latest multi-timeframe market bias for a symbol."""
    from .models import ICTMarketBias
    from sqlalchemy import desc

    bias = db.query(ICTMarketBias).filter(
        ICTMarketBias.project_id == project_id,
        ICTMarketBias.symbol == symbol,
    ).order_by(desc(ICTMarketBias.snapshot_time)).first()

    if not bias:
        return {
            "symbol": symbol,
            "message": "No bias data available. Run an analysis first.",
        }
    return _dict(bias)


@router.get("/signals")
def list_execution_signals(
    project_id: UUID,
    symbol: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List execution signals generated by the ICT engine."""
    from .models import ICTExecutionSignal
    from sqlalchemy import desc

    q = db.query(ICTExecutionSignal).filter(
        ICTExecutionSignal.project_id == project_id
    )
    if symbol:
        q = q.filter(ICTExecutionSignal.symbol == symbol)
    if status:
        q = q.filter(ICTExecutionSignal.status == status)
    results = q.order_by(desc(ICTExecutionSignal.timestamp)).limit(limit).all()
    return [_dict(r) for r in results]


@router.get("/ai-context")
def get_ai_market_context(
    project_id: UUID,
    symbol: str = "EURUSD",
    db: Session = Depends(get_db),
):
    """Get AI-ready market context for a symbol.

    Returns structured market information suitable for LLM consumption.
    """
    from .models import ICTMarketBias, ICTSetup, ICTExecutionSignal, ICTEvent
    from sqlalchemy import desc

    bias = db.query(ICTMarketBias).filter(
        ICTMarketBias.project_id == project_id,
        ICTMarketBias.symbol == symbol,
    ).order_by(desc(ICTMarketBias.snapshot_time)).first()

    best_setup = db.query(ICTSetup).filter(
        ICTSetup.project_id == project_id,
        ICTSetup.symbol == symbol,
        ICTSetup.execution_status == "ready",
    ).order_by(desc(ICTSetup.overall_quality)).first()

    recent_events = db.query(ICTEvent).filter(
        ICTEvent.project_id == project_id,
        ICTEvent.symbol == symbol,
    ).order_by(desc(ICTEvent.timestamp)).limit(5).all()

    signal = db.query(ICTExecutionSignal).filter(
        ICTExecutionSignal.project_id == project_id,
        ICTExecutionSignal.symbol == symbol,
        ICTExecutionSignal.executed == False,
    ).order_by(desc(ICTExecutionSignal.timestamp)).first()

    context = {
        "symbol": symbol,
        "bias": _dict(bias) if bias else None,
        "best_setup": _dict(best_setup) if best_setup else None,
        "recent_events": [_dict(e) for e in recent_events],
        "active_signal": _dict(signal) if signal else None,
        "summary": _build_ai_summary(bias, best_setup, signal),
    }

    return context


def _build_ai_summary(bias, setup, signal) -> str:
    """Build a human-readable market summary for AI consumption."""
    parts = []

    if bias:
        parts.append(f"HTF Bias: {bias.htf_bias or 'neutral'}")
        parts.append(f"LTF Confirmation: {bias.ltf_confirmation or 'neutral'}")
        parts.append(f"Premium/Discount: {bias.premium_discount_status or 'neutral'}")
        parts.append(f"Confluence Score: {bias.confluence_score:.1f}/10")

    if setup:
        parts.append(f"Best Setup: {setup.model_type} ({setup.direction})")
        parts.append(f"Quality Score: {setup.overall_quality:.1f}/10")
        if setup.entry_price_min and setup.entry_price_max:
            parts.append(f"Entry Zone: {setup.entry_price_min:.5f} - {setup.entry_price_max:.5f}")
        if setup.stop_loss:
            parts.append(f"Stop Loss: {setup.stop_loss:.5f}")
        if setup.take_profit:
            parts.append(f"Take Profit: {setup.take_profit:.5f}")
        if setup.risk_reward_ratio:
            parts.append(f"R:R Ratio: {setup.risk_reward_ratio:.2f}")

    if signal:
        parts.append(f"Execution: {signal.status}")
        if signal.reasoning:
            parts.append(f"Reasoning: {signal.reasoning}")

    return ". ".join(parts) if parts else "No data available. Run an ICT analysis first."


@router.get("/context")
def get_market_context(
    project_id: UUID,
    symbol: str = "EURUSD",
    db: Session = Depends(get_db),
):
    """Get full market context with all detected ICT structures."""
    from .models import (
        ICTStructure, ICTEvent, FVG, OrderBlock,
        LiquidityZone, ICTSetup, ICTMarketBias, ICTExecutionSignal,
    )
    from sqlalchemy import desc

    filters = {
        ICTStructure: ICTStructure.project_id == project_id,
        ICTEvent: ICTEvent.project_id == project_id,
        FVG: FVG.project_id == project_id,
        OrderBlock: OrderBlock.project_id == project_id,
        LiquidityZone: LiquidityZone.project_id == project_id,
        ICTSetup: ICTSetup.project_id == project_id,
        ICTMarketBias: ICTMarketBias.project_id == project_id,
        ICTExecutionSignal: ICTExecutionSignal.project_id == project_id,
    }

    context = {
        "structures": [_dict(r) for r in db.query(ICTStructure).filter(filters[ICTStructure], ICTStructure.symbol == symbol).order_by(desc(ICTStructure.timestamp)).limit(20).all()],
        "events": [_dict(r) for r in db.query(ICTEvent).filter(filters[ICTEvent], ICTEvent.symbol == symbol).order_by(desc(ICTEvent.timestamp)).limit(20).all()],
        "fvgs": [_dict(r) for r in db.query(FVG).filter(filters[FVG], FVG.symbol == symbol).order_by(desc(FVG.timestamp)).limit(20).all()],
        "order_blocks": [_dict(r) for r in db.query(OrderBlock).filter(filters[OrderBlock], OrderBlock.symbol == symbol).order_by(desc(OrderBlock.timestamp)).limit(20).all()],
        "liquidity": [_dict(r) for r in db.query(LiquidityZone).filter(filters[LiquidityZone], LiquidityZone.symbol == symbol).order_by(desc(LiquidityZone.timestamp)).limit(20).all()],
        "setups": [_dict(r) for r in db.query(ICTSetup).filter(filters[ICTSetup], ICTSetup.symbol == symbol).order_by(desc(ICTSetup.created_at)).limit(10).all()],
        "bias": {
            "current": _dict(db.query(ICTMarketBias).filter(filters[ICTMarketBias], ICTMarketBias.symbol == symbol).order_by(desc(ICTMarketBias.snapshot_time)).first()),
        },
        "signals": [_dict(r) for r in db.query(ICTExecutionSignal).filter(filters[ICTExecutionSignal], ICTExecutionSignal.symbol == symbol).order_by(desc(ICTExecutionSignal.timestamp)).limit(10).all()],
    }

    return context


# Helper imports
from src.ict.models import ICTStructure, ICTEvent, FVG, OrderBlock
from src.ict.models import LiquidityZone, ICTSetup, ICTSession, ICTMarketBias, ICTExecutionSignal


def _dict(obj):
    """Convert SQLAlchemy model to dict."""
    if obj is None:
        return None
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

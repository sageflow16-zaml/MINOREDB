import time
from uuid import UUID

from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.schemas.tradingview import (
    WebhookPayload,
    MarketEventRead,
    WebhookLogRead,
    WebhookResponse,
    WebhookStats,
)
from src.services.tradingview import TradingViewService

router = APIRouter()


@router.post("/webhook", response_model=WebhookResponse)
async def receive_webhook(request: Request, db: Session = Depends(get_db)):
    """Receive a TradingView webhook alert."""
    start = time.time()

    try:
        body = await request.json()
    except Exception:
        body = {}

    secret = request.headers.get("X-Webhook-Secret") or body.get("secret")
    svc = TradingViewService(db)

    # Validate
    is_valid, message = svc.validate(body, secret)
    if not is_valid:
        svc.log_webhook(body, status="rejected", message=message)
        raise HTTPException(status_code=400, detail=message)

    # Parse
    parsed = svc.parse(body)

    # Store
    event = svc.store(parsed)

    duration = int((time.time() - start) * 1000)
    svc.log_webhook(body, status="processed", message="Event stored", processing_time_ms=duration)

    return WebhookResponse(
        status="success",
        event_id=event.id,
        message="Market event recorded",
    )


@router.get("/events", response_model=list[MarketEventRead])
def get_events(
    limit: int = 50,
    symbol: str | None = None,
    timeframe: str | None = None,
    event_type: str | None = None,
    db: Session = Depends(get_db),
):
    svc = TradingViewService(db)
    return svc.history(limit=limit, symbol=symbol, timeframe=timeframe, event_type=event_type)


@router.get("/events/{event_id}", response_model=MarketEventRead)
def get_event(event_id: UUID, db: Session = Depends(get_db)):
    svc = TradingViewService(db)
    event = svc.get_event(event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/logs", response_model=list[WebhookLogRead])
def get_logs(limit: int = 100, db: Session = Depends(get_db)):
    svc = TradingViewService(db)
    return svc.logs(limit=limit)


@router.get("/stats", response_model=WebhookStats)
def get_stats(db: Session = Depends(get_db)):
    svc = TradingViewService(db)
    return svc.stats()

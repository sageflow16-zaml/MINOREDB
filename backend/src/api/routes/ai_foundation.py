from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services import ai_foundation
from src.schemas.ai_foundation import (
    AIProfileCreate, AIProfileUpdate,
    KnowledgeLinkCreate,
    AIProviderConfigCreate, AIProviderConfigUpdate,
    AIContextBuildRequest, CoachingSessionCreate,
)
from src.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception as exc:
        logger.error("AI Foundation query failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to load AI data")


# ── Profile ──

@router.get("/profile")
def get_profile(project_id: UUID, db: Session = Depends(get_db)):
    _safe(ai_foundation.get_or_create_profile, db, project_id)
    return _safe(ai_foundation.get_or_create_profile, db, project_id)


@router.put("/profile")
def update_profile(project_id: UUID, body: AIProfileUpdate, db: Session = Depends(get_db)):
    return _safe(ai_foundation.update_profile, db, project_id, body.model_dump(exclude_unset=True))


@router.post("/profile/analyze")
def analyze_profile(project_id: UUID, db: Session = Depends(get_db)):
    return _safe(ai_foundation.analyze_trader_profile, db, project_id)


# ── Evaluations ──

@router.post("/evaluate/{trade_id}")
def evaluate_trade(project_id: UUID, trade_id: UUID, db: Session = Depends(get_db)):
    result = _safe(ai_foundation.evaluate_trade, db, project_id, trade_id)
    if not result:
        raise HTTPException(status_code=404, detail="Trade not found")
    return result


@router.get("/evaluations")
def list_evaluations(project_id: UUID, limit: int = 50, db: Session = Depends(get_db)):
    return _safe(ai_foundation.get_trade_evaluations, db, project_id, limit)


# ── Patterns ──

@router.post("/patterns/detect")
def detect_patterns(project_id: UUID, db: Session = Depends(get_db)):
    return _safe(ai_foundation.detect_patterns, db, project_id)


@router.get("/patterns")
def list_patterns(project_id: UUID, pattern_type: str = None, db: Session = Depends(get_db)):
    return _safe(ai_foundation.get_patterns, db, project_id, pattern_type)


# ── Knowledge Links ──

@router.post("/knowledge/links")
def create_link(project_id: UUID, body: KnowledgeLinkCreate, db: Session = Depends(get_db)):
    return _safe(ai_foundation.create_link, db, project_id, body.model_dump())


@router.get("/knowledge/links")
def list_links(project_id: UUID, entity_type: str = None, entity_id: UUID = None, db: Session = Depends(get_db)):
    return _safe(ai_foundation.get_links, db, project_id, entity_type, entity_id)


@router.delete("/knowledge/links/{link_id}")
def delete_link(project_id: UUID, link_id: UUID, db: Session = Depends(get_db)):
    if not _safe(ai_foundation.delete_link, db, link_id):
        raise HTTPException(status_code=404, detail="Link not found")
    return {"ok": True}


@router.post("/knowledge/auto-link")
def auto_link(project_id: UUID, db: Session = Depends(get_db)):
    count = _safe(ai_foundation.auto_link_trades, db, project_id)
    return {"linked": count}


@router.get("/knowledge/graph")
def get_graph(project_id: UUID, entity_type: str = None, entity_id: UUID = None, db: Session = Depends(get_db)):
    return _safe(ai_foundation.get_link_graph, db, project_id, entity_type, entity_id)


# ── Insights ──

@router.post("/insights/generate")
def generate_insights(project_id: UUID, db: Session = Depends(get_db)):
    return _safe(ai_foundation.generate_insights, db, project_id)


@router.get("/insights")
def list_insights(project_id: UUID, db: Session = Depends(get_db)):
    return _safe(ai_foundation.get_insights, db, project_id)


@router.put("/insights/{insight_id}/dismiss")
def dismiss_insight(project_id: UUID, insight_id: UUID, db: Session = Depends(get_db)):
    if not _safe(ai_foundation.dismiss_insight, db, insight_id):
        raise HTTPException(status_code=404, detail="Insight not found")
    return {"ok": True}


# ── Recommendations ──

@router.post("/recommendations/generate")
def generate_recommendations(project_id: UUID, db: Session = Depends(get_db)):
    return _safe(ai_foundation.generate_recommendations, db, project_id)


@router.get("/recommendations")
def list_recommendations(project_id: UUID, db: Session = Depends(get_db)):
    return _safe(ai_foundation.get_recommendations, db, project_id)


@router.put("/recommendations/{rec_id}/dismiss")
def dismiss_recommendation(project_id: UUID, rec_id: UUID, db: Session = Depends(get_db)):
    if not _safe(ai_foundation.dismiss_recommendation, db, rec_id):
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return {"ok": True}


# ── Coaching ──

@router.post("/coaching/generate")
def generate_coaching(project_id: UUID, session_type: str = "daily", date: str = None, db: Session = Depends(get_db)):
    return _safe(ai_foundation.generate_coaching, db, project_id, session_type, date)


@router.get("/coaching")
def list_coaching(project_id: UUID, session_type: str = None, db: Session = Depends(get_db)):
    return _safe(ai_foundation.get_coaching_sessions, db, project_id, session_type)


# ── Summaries / Memory ──

@router.post("/summaries")
def create_summary(project_id: UUID, body: CoachingSessionCreate, db: Session = Depends(get_db)):
    return _safe(ai_foundation.create_summary, db, project_id, body.model_dump())


@router.get("/summaries")
def list_summaries(project_id: UUID, summary_type: str = None, period: str = None, db: Session = Depends(get_db)):
    return _safe(ai_foundation.get_summaries, db, project_id, summary_type, period)


@router.post("/summaries/performance")
def generate_performance_summary(project_id: UUID, db: Session = Depends(get_db)):
    return _safe(ai_foundation.generate_performance_summary, db, project_id)


# ── Context Builder ──

@router.post("/context")
def build_context(project_id: UUID, body: AIContextBuildRequest, db: Session = Depends(get_db)):
    return _safe(ai_foundation.build_context, db, project_id, body.trade_id, body.model_dump(exclude_unset=True))


# ── Providers ──

@router.get("/providers")
def list_providers(db: Session = Depends(get_db)):
    return _safe(ai_foundation.get_providers, db)


@router.get("/providers/default")
def get_default_provider(db: Session = Depends(get_db)):
    result = _safe(ai_foundation.get_default_provider, db)
    if not result:
        raise HTTPException(status_code=404, detail="No default provider configured")
    return result


@router.post("/providers")
def create_provider(body: AIProviderConfigCreate, db: Session = Depends(get_db)):
    return _safe(ai_foundation.create_provider, db, body.model_dump())


@router.put("/providers/{provider_id}")
def update_provider(provider_id: UUID, body: AIProviderConfigUpdate, db: Session = Depends(get_db)):
    result = _safe(ai_foundation.update_provider, db, provider_id, body.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Provider not found")
    return result


@router.delete("/providers/{provider_id}")
def delete_provider(provider_id: UUID, db: Session = Depends(get_db)):
    if not _safe(ai_foundation.delete_provider, db, provider_id):
        raise HTTPException(status_code=404, detail="Provider not found")
    return {"ok": True}


# ── Dashboard ──

@router.get("/dashboard")
def get_ai_dashboard(project_id: UUID, db: Session = Depends(get_db)):
    return _safe(ai_foundation.get_ai_dashboard, db, project_id)

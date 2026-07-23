from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.api.deps import get_db
from src.brain import brain_service as brain
from src.brain.schemas import (
    BrainAskRequest, BrainAskResponse, BrainMemoryCreate, BrainMemoryResponse,
    BrainMemorySearch, EvaluationRequest, EvaluationResponse,
    SimilaritySearchRequest, SimilaritySearchResponse,
    CoachingRequest, BrainCoachingResponse, TrackOutcomeRequest,
    DecisionRecordResponse, PersonalInsightResponse,
    LearningObservationResponse, TraderDNAResponse, BrainDashboardResponse,
)

router = APIRouter()


@router.post("/ask", response_model=BrainAskResponse)
def brain_ask(project_id: UUID, req: BrainAskRequest, db: Session = Depends(get_db)):
    result = brain.ask(
        db, project_id, req.question,
        context=req.context,
        include_steps=req.include_steps,
        skip_steps=req.skip_steps,
    )
    if not result:
        raise HTTPException(status_code=500, detail="Brain failed to process question")
    return result


@router.get("/dna", response_model=TraderDNAResponse)
def get_dna(project_id: UUID, db: Session = Depends(get_db)):
    from src.brain.dna_engine import build_or_update_dna
    dna = build_or_update_dna(db, project_id)
    if not dna:
        raise HTTPException(status_code=404, detail="No DNA profile found")
    return dna


@router.post("/dna/refresh", response_model=TraderDNAResponse)
def refresh_dna(project_id: UUID, db: Session = Depends(get_db)):
    from src.brain.dna_engine import build_or_update_dna
    dna = build_or_update_dna(db, project_id)
    return dna


@router.get("/dashboard", response_model=BrainDashboardResponse)
def get_brain_dashboard(project_id: UUID, db: Session = Depends(get_db)):
    try:
        return brain.get_brain_dashboard(db, project_id)
    except Exception:
        return {"dna": None, "recent_decisions": [], "top_insights": [], "active_observations": [], "latest_coaching": None, "memory_summary": {}, "today_intelligence": {}}


@router.post("/memories", response_model=BrainMemoryResponse)
def create_memory(project_id: UUID, req: BrainMemoryCreate, db: Session = Depends(get_db)):
    from src.brain.memory_engine import store_memory
    memory = store_memory(
        db, project_id, req.memory_type, req.key,
        title=req.title, content=req.content,
        text_content=req.text_content, importance=req.importance,
        tags=req.tags, source_entity_type=req.source_entity_type,
        source_entity_id=req.source_entity_id, expires_at=req.expires_at,
    )
    return memory


@router.get("/memories", response_model=list[BrainMemoryResponse])
def search_memories(
    project_id: UUID,
    query: str | None = None,
    memory_type: str | None = None,
    tags: str | None = None,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    from src.brain.memory_engine import search_memories
    tag_list = tags.split(",") if tags else None
    return search_memories(db, project_id, query, memory_type, tag_list, limit)


@router.delete("/memories/{memory_id}")
def delete_brain_memory(project_id: UUID, memory_id: str, db: Session = Depends(get_db)):
    from src.brain.memory_engine import delete_memory
    deleted = delete_memory(db, project_id, memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"deleted": True}


@router.get("/decisions", response_model=list[DecisionRecordResponse])
def list_decisions(project_id: UUID, limit: int = 50, db: Session = Depends(get_db)):
    from src.brain.decision_engine import get_decision_history
    return get_decision_history(db, project_id, limit)


@router.get("/decisions/{decision_id}", response_model=DecisionRecordResponse)
def get_decision_by_id(decision_id: str, db: Session = Depends(get_db)):
    from src.brain.decision_engine import get_decision
    decision = get_decision(db, decision_id)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


@router.post("/decisions/{decision_id}/outcome")
def track_decision_outcome(decision_id: str, req: TrackOutcomeRequest, db: Session = Depends(get_db)):
    from src.brain.decision_engine import track_outcome
    tracked = track_outcome(db, decision_id, req.outcome, req.feedback)
    if not tracked:
        raise HTTPException(status_code=404, detail="Decision not found")
    return {"tracked": True}


@router.post("/similarity", response_model=SimilaritySearchResponse)
def search_similarity(project_id: UUID, req: SimilaritySearchRequest, db: Session = Depends(get_db)):
    from src.brain.similarity_engine import search_similar
    result = search_similar(
        db, project_id,
        pair=req.pair, direction=req.direction,
        session=req.session, entry_model=req.entry_model,
        weekly_bias=req.weekly_bias, daily_bias=req.daily_bias,
        limit=req.limit,
    )
    return result


@router.get("/insights", response_model=list[PersonalInsightResponse])
def list_insights(project_id: UUID, limit: int = 20, db: Session = Depends(get_db)):
    try:
        from src.brain.insights_engine import get_insights
        return get_insights(db, project_id, limit)
    except Exception:
        return []


@router.post("/insights/generate", response_model=list[PersonalInsightResponse])
def generate_personal_insights(project_id: UUID, db: Session = Depends(get_db)):
    try:
        from src.brain.insights_engine import generate_insights
        return generate_insights(db, project_id)
    except Exception:
        return []


@router.post("/insights/{insight_id}/dismiss")
def dismiss_personal_insight(insight_id: str, db: Session = Depends(get_db)):
    from src.brain.insights_engine import dismiss_insight as di
    dismissed = di(db, insight_id)
    if not dismissed:
        raise HTTPException(status_code=404, detail="Insight not found")
    return {"dismissed": True}


@router.get("/observations", response_model=list[LearningObservationResponse])
def list_observations(project_id: UUID, db: Session = Depends(get_db)):
    try:
        from src.brain.learning_engine import _get_active_observations
        return _get_active_observations(db, project_id)
    except Exception:
        return []


@router.post("/observations/detect", response_model=list[LearningObservationResponse])
def detect_learning_observations(project_id: UUID, db: Session = Depends(get_db)):
    from src.brain.learning_engine import detect_observations
    return detect_observations(db, project_id)


@router.post("/observations/{observation_id}/dismiss")
def dismiss_observation_endpoint(observation_id: str, db: Session = Depends(get_db)):
    dismissed = dismiss_observation(db, observation_id)
    if not dismissed:
        raise HTTPException(status_code=404, detail="Observation not found")
    return {"dismissed": True}


@router.post("/coach", response_model=BrainCoachingResponse)
def generate_coaching_session(project_id: UUID, req: CoachingRequest, db: Session = Depends(get_db)):
    from src.brain.coaching_engine import generate_coaching
    return generate_coaching(
        db, project_id,
        coaching_type=req.coaching_type,
        period_start=req.period_start,
        period_end=req.period_end,
    )


@router.get("/coach", response_model=list[BrainCoachingResponse])
def list_coaching_sessions(
    project_id: UUID,
    coaching_type: str | None = None,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    from src.brain.coaching_engine import get_coaching_history
    return get_coaching_history(db, project_id, coaching_type, limit)


@router.get("/coach/latest", response_model=BrainCoachingResponse | None)
def latest_coaching_session(project_id: UUID, db: Session = Depends(get_db)):
    from src.brain.coaching_engine import get_latest_coaching
    return get_latest_coaching(db, project_id)

from uuid import UUID
from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services.quant_research import QuantResearchLab
from src.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Quant research error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ── Schemas ──

class ExperimentCreate(BaseModel):
    name: str
    description: str | None = None
    hypothesis: str | None = None
    tags: list[str] | None = None
    config: dict[str, Any] | None = None
    linked_strategy_ids: list[str] | None = None
    linked_trade_ids: list[str] | None = None
    linked_research_ids: list[str] | None = None
    parent_experiment_id: str | None = None

class ExperimentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    hypothesis: str | None = None
    hypothesis_status: str | None = None
    confidence_score: float | None = None
    tags: list[str] | None = None
    config: dict[str, Any] | None = None
    results_summary: dict[str, Any] | None = None
    linked_strategy_ids: list[str] | None = None
    linked_trade_ids: list[str] | None = None
    linked_research_ids: list[str] | None = None
    notes: str | None = None

class ExperimentRead(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    project_id: str
    name: str
    description: str | None
    status: str
    hypothesis: str | None
    hypothesis_status: str | None
    confidence_score: float | None
    tags: list | None
    config: dict | None
    results_summary: dict | None
    linked_strategy_ids: list | None
    linked_trade_ids: list | None
    linked_research_ids: list | None
    version: int
    parent_experiment_id: str | None
    notes: str | None
    model_config = {"from_attributes": True}

class BacktestRequest(BaseModel):
    name: str
    strategy_id: str | None = None
    backtest_type: str = "single"
    config: dict[str, Any] = {}
    filters: dict[str, Any] | None = None
    costs: dict[str, Any] | None = None
    start_date: str
    end_date: str
    symbols: list[str] | None = None
    timeframes: list[str] | None = None
    experiment_id: str | None = None

class SimulationRequest(BaseModel):
    name: str
    simulation_type: str = "monte_carlo"
    config: dict[str, Any] = {}
    num_simulations: int = 1000
    random_seed: int | None = None
    experiment_id: str | None = None
    backtest_run_id: str | None = None

class WalkForwardRequest(BaseModel):
    name: str
    config: dict[str, Any] = {}
    training_window: int = 252
    validation_window: int = 63
    step_size: int = 63
    experiment_id: str | None = None

class OptimizationRequest(BaseModel):
    name: str
    optimization_type: str = "grid"
    config: dict[str, Any] = {}
    parameters: dict[str, Any]
    constraints: dict[str, Any] | None = None
    objective: str = "sharpe_ratio"
    maximize: bool = True
    experiment_id: str | None = None

class NotebookCreate(BaseModel):
    title: str
    content: str | None = None
    content_type: str = "markdown"
    tags: list[str] | None = None
    experiment_id: str | None = None
    linked_run_ids: dict[str, Any] | None = None
    sort_order: int = 0

class NotebookUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    content_type: str | None = None
    tags: list[str] | None = None
    linked_run_ids: dict[str, Any] | None = None
    sort_order: int | None = None

class HypothesisTestRequest(BaseModel):
    hypothesis: str
    test_type: str = "backtest"
    experiment_id: str | None = None

class AIResearchRequest(BaseModel):
    experiment_id: str | None = None
    query: str
    context: dict[str, Any] | None = None

class ExportRequest(BaseModel):
    experiment_id: str | None = None
    backtest_run_id: str | None = None
    format: str = "pdf"


# ── Dashboard ──

@router.get("/dashboard")
def get_dashboard(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    result = lab.get_dashboard
    if isinstance(result, dict) and 'error' in result:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=result['error'])
    return result


# ── Experiments ──

@router.get("/experiments", response_model=list[ExperimentRead])
def list_experiments(
    project_id: UUID,
    status: str | None = Query(None),
    tags: str | None = Query(None),
    sort: str | None = Query("updated_at"),
    limit: int = Query(50),
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    lab = QuantResearchLab(db, project_id)
    tag_list = tags.split(",") if tags else None
    return _safe(lab.list_experiments, status, tag_list, sort, limit)

@router.post("/experiments", response_model=ExperimentRead)
def create_experiment(project_id: UUID, data: ExperimentCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.create_experiment, data.model_dump())

@router.get("/experiments/{experiment_id}", response_model=ExperimentRead)
def get_experiment(project_id: UUID, experiment_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.get_experiment, experiment_id)

@router.put("/experiments/{experiment_id}", response_model=ExperimentRead)
def update_experiment(project_id: UUID, experiment_id: UUID, data: ExperimentUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.update_experiment, experiment_id, data.model_dump(exclude_unset=True))

@router.delete("/experiments/{experiment_id}")
def delete_experiment(project_id: UUID, experiment_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    _safe(lab.delete_experiment, experiment_id)
    return {"status": "deleted"}

@router.post("/experiments/{experiment_id}/duplicate")
def duplicate_experiment(project_id: UUID, experiment_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.duplicate_experiment, experiment_id)

@router.get("/experiments/{experiment_id}/results")
def get_experiment_results(project_id: UUID, experiment_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.get_experiment_results, experiment_id)


# ── Backtesting ──

@router.get("/backtests")
def list_backtests(
    project_id: UUID,
    experiment_id: UUID | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(50),
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.list_backtests, experiment_id, status, limit)

@router.post("/backtests")
def run_backtest(project_id: UUID, data: BacktestRequest, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.run_backtest, data.model_dump())

@router.get("/backtests/{backtest_id}")
def get_backtest(project_id: UUID, backtest_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.get_backtest, backtest_id)

@router.delete("/backtests/{backtest_id}")
def delete_backtest(project_id: UUID, backtest_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    _safe(lab.delete_backtest, backtest_id)
    return {"status": "deleted"}

@router.get("/backtests/{backtest_id}/trades")
def get_backtest_trades(
    project_id: UUID, backtest_id: UUID,
    page: int = Query(1), per_page: int = Query(100),
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.get_backtest_trades, backtest_id, page, per_page)

@router.get("/backtests/{backtest_id}/equity-curve")
def get_equity_curve(project_id: UUID, backtest_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.get_equity_curve, backtest_id)

@router.get("/backtests/{backtest_id}/metrics")
def get_backtest_metrics(project_id: UUID, backtest_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.get_backtest_metrics, backtest_id)


# ── Simulations ──

@router.get("/simulations")
def list_simulations(
    project_id: UUID,
    experiment_id: UUID | None = Query(None),
    simulation_type: str | None = Query(None),
    limit: int = Query(50),
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.list_simulations, experiment_id, simulation_type, limit)

@router.post("/simulations")
def run_simulation(project_id: UUID, data: SimulationRequest, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.run_simulation, data.model_dump())

@router.get("/simulations/{simulation_id}")
def get_simulation(project_id: UUID, simulation_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.get_simulation, simulation_id)

@router.delete("/simulations/{simulation_id}")
def delete_simulation(project_id: UUID, simulation_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    _safe(lab.delete_simulation, simulation_id)
    return {"status": "deleted"}

@router.get("/simulations/{simulation_id}/distribution")
def get_simulation_distribution(project_id: UUID, simulation_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.get_simulation_distribution, simulation_id)


# ── Walk-Forward Analysis ──

@router.get("/walkforward")
def list_walkforward_runs(
    project_id: UUID,
    experiment_id: UUID | None = Query(None),
    limit: int = Query(50),
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.list_walkforward_runs, experiment_id, limit)

@router.post("/walkforward")
def run_walkforward(project_id: UUID, data: WalkForwardRequest, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.run_walkforward, data.model_dump())

@router.get("/walkforward/{wf_id}")
def get_walkforward_run(project_id: UUID, wf_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.get_walkforward_run, wf_id)

@router.delete("/walkforward/{wf_id}")
def delete_walkforward_run(project_id: UUID, wf_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    _safe(lab.delete_walkforward_run, wf_id)
    return {"status": "deleted"}


# ── Optimization ──

@router.get("/optimizations")
def list_optimizations(
    project_id: UUID,
    experiment_id: UUID | None = Query(None),
    optimization_type: str | None = Query(None),
    limit: int = Query(50),
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.list_optimizations, experiment_id, optimization_type, limit)

@router.post("/optimizations")
def run_optimization(project_id: UUID, data: OptimizationRequest, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.run_optimization, data.model_dump())

@router.get("/optimizations/{optimization_id}")
def get_optimization(project_id: UUID, optimization_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.get_optimization, optimization_id)

@router.delete("/optimizations/{optimization_id}")
def delete_optimization(project_id: UUID, optimization_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    _safe(lab.delete_optimization, optimization_id)
    return {"status": "deleted"}

@router.get("/optimizations/{optimization_id}/heatmap")
def get_optimization_heatmap(project_id: UUID, optimization_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.get_optimization_heatmap, optimization_id)


# ── Edge Health ──

@router.get("/edge-health")
def list_edge_health(
    project_id: UUID,
    experiment_id: UUID | None = Query(None),
    limit: int = Query(50),
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.list_edge_health, experiment_id, limit)

@router.post("/edge-health")
def create_edge_snapshot(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.create_edge_snapshot, data)

@router.get("/edge-health/current")
def get_current_edge_health(project_id: UUID, experiment_id: UUID | None = Query(None), project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.get_current_edge_health, experiment_id)

@router.delete("/edge-health/{snapshot_id}")
def delete_edge_snapshot(project_id: UUID, snapshot_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    _safe(lab.delete_edge_snapshot, snapshot_id)
    return {"status": "deleted"}


# ── Statistics ──

@router.get("/statistics/describe")
def describe_performance(
    project_id: UUID,
    backtest_run_id: UUID | None = Query(None),
    equity_curve: str | None = Query(None),
    trades: str | None = Query(None),
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.describe_performance, backtest_run_id, equity_curve, trades)


# ── AI Research Assistant ──

@router.post("/ai/research")
def ai_research(project_id: UUID, data: AIResearchRequest, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.ai_research, data.query, data.experiment_id, data.context)

@router.post("/ai/summarize")
def ai_summarize(project_id: UUID, experiment_id: UUID | None = Query(None), backtest_run_id: UUID | None = Query(None), project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.ai_summarize, experiment_id, backtest_run_id)

@router.post("/ai/improve")
def ai_suggest_improvements(project_id: UUID, experiment_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.ai_suggest_improvements, experiment_id)


# ── Research Notebook ──

@router.get("/notebooks")
def list_notebooks(
    project_id: UUID,
    experiment_id: UUID | None = Query(None),
    content_type: str | None = Query(None),
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.list_notebooks, experiment_id, content_type)

@router.post("/notebooks")
def create_notebook_entry(project_id: UUID, data: NotebookCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.create_notebook_entry, data.model_dump())

@router.get("/notebooks/{entry_id}")
def get_notebook_entry(project_id: UUID, entry_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.get_notebook_entry, entry_id)

@router.put("/notebooks/{entry_id}")
def update_notebook_entry(project_id: UUID, entry_id: UUID, data: NotebookUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.update_notebook_entry, entry_id, data.model_dump(exclude_unset=True))

@router.delete("/notebooks/{entry_id}")
def delete_notebook_entry(project_id: UUID, entry_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    _safe(lab.delete_notebook_entry, entry_id)
    return {"status": "deleted"}


# ── Hypothesis Testing ──

@router.get("/hypothesis-tests")
def list_hypothesis_tests(project_id: UUID, experiment_id: UUID | None = Query(None), limit: int = Query(50), project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.list_hypothesis_tests, experiment_id, limit)

@router.post("/hypothesis-tests")
def create_hypothesis_test(project_id: UUID, data: HypothesisTestRequest, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.create_hypothesis_test, data.model_dump())


# ── Export ──

@router.post("/export")
def export_data(project_id: UUID, data: ExportRequest, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    lab = QuantResearchLab(db, project_id)
    return _safe(lab.export_data, data.experiment_id, data.backtest_run_id, data.format)

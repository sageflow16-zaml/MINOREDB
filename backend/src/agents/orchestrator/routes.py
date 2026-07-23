from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.api.deps import get_db
from src.agents.orchestrator import engine as orchestrator
from src.agents.schemas import (
    AgentTaskCreate, AgentTaskResponse, AgentExecutionResponse,
    AgentStatusResponse, AgentDashboardResponse, RunTaskRequest,
    WorkflowChainCreate, AgentWorkflowResponse, RunWorkflowResponse,
    WorkflowStepResult,
)
from src.agents.core.registry import AgentRegistry

router = APIRouter()


@router.get("/dashboard", response_model=AgentDashboardResponse)
def get_dashboard(project_id: UUID, db: Session = Depends(get_db)):
    try:
        return orchestrator.get_agent_dashboard(db, project_id)
    except Exception:
        return {"agents": [], "pending_tasks": [], "recent_executions": [], "workflows": [], "total_tasks_today": 0, "total_discoveries": 0, "avg_confidence": None, "success_rate": None}


@router.get("/agents", response_model=list[AgentStatusResponse])
def list_agents(project_id: UUID, db: Session = Depends(get_db)):
    try:
        return orchestrator.get_agent_dashboard(db, project_id).agents
    except Exception:
        return []


@router.post("/tasks", response_model=AgentTaskResponse)
def create_agent_task(project_id: UUID, req: AgentTaskCreate, db: Session = Depends(get_db)):
    if not AgentRegistry.is_registered(req.agent_name):
        raise HTTPException(status_code=400, detail=f"Unknown agent: {req.agent_name}")
    task = orchestrator.create_task(
        db, project_id,
        agent_name=req.agent_name,
        task_type=req.task_type,
        title=req.title,
        description=req.description,
        input_data=req.input_data,
        priority=req.priority,
        scheduled_at=req.scheduled_at,
        workflow_id=req.workflow_id,
        workflow_step=req.workflow_step,
        depends_on=req.depends_on,
    )
    return task


@router.get("/tasks", response_model=list[AgentTaskResponse])
def list_agent_tasks(
    project_id: UUID,
    status: str | None = None,
    agent_name: str | None = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    try:
        return orchestrator.list_tasks(db, project_id, status, agent_name, limit)
    except Exception:
        return []


@router.get("/tasks/{task_id}", response_model=AgentTaskResponse)
def get_task(project_id: UUID, task_id: str, db: Session = Depends(get_db)):
    from src.agents.models import AgentTask
    task = db.query(AgentTask).filter(AgentTask.id == task_id, AgentTask.project_id == project_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/tasks/{task_id}/run", response_model=AgentExecutionResponse)
def run_agent_task(project_id: UUID, task_id: str, db: Session = Depends(get_db)):
    execution = orchestrator.run_task(db, project_id, task_id)
    if not execution:
        raise HTTPException(status_code=400, detail="Task not found or agent unavailable")
    return execution


@router.post("/tasks/{task_id}/cancel")
def cancel_agent_task(project_id: UUID, task_id: str, db: Session = Depends(get_db)):
    cancelled = orchestrator.cancel_task(db, project_id, task_id)
    if not cancelled:
        raise HTTPException(status_code=400, detail="Task not found or already completed")
    return {"cancelled": True}


@router.get("/executions", response_model=list[AgentExecutionResponse])
def list_agent_executions(
    project_id: UUID,
    agent_name: str | None = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    return orchestrator.list_executions(db, project_id, agent_name, limit)


@router.get("/executions/{execution_id}", response_model=AgentExecutionResponse)
def get_execution(project_id: UUID, execution_id: str, db: Session = Depends(get_db)):
    from src.agents.models import AgentExecution
    exec_ = db.query(AgentExecution).filter(AgentExecution.id == execution_id, AgentExecution.project_id == project_id).first()
    if not exec_:
        raise HTTPException(status_code=404, detail="Execution not found")
    return exec_


# ── Workflows ──


@router.post("/workflows", response_model=AgentWorkflowResponse)
def create_agent_workflow(project_id: UUID, req: WorkflowChainCreate, db: Session = Depends(get_db)):
    for step in req.steps:
        if not AgentRegistry.is_registered(step.get("agent_name", "")):
            raise HTTPException(status_code=400, detail=f"Unknown agent in step: {step.get('agent_name')}")
    workflow = orchestrator.create_workflow(
        db, project_id,
        name=req.name,
        description=req.description,
        steps=req.steps,
        trigger_type=req.trigger_type,
        trigger_config=req.trigger_config,
    )
    return workflow


@router.get("/workflows", response_model=list[AgentWorkflowResponse])
def list_agent_workflows(project_id: UUID, db: Session = Depends(get_db)):
    return orchestrator.list_workflows(db, project_id)


@router.get("/workflows/{workflow_id}", response_model=AgentWorkflowResponse)
def get_workflow(project_id: UUID, workflow_id: str, db: Session = Depends(get_db)):
    from src.agents.models import AgentWorkflow
    wf = db.query(AgentWorkflow).filter(AgentWorkflow.id == workflow_id, AgentWorkflow.project_id == project_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


@router.post("/workflows/{workflow_id}/run", response_model=RunWorkflowResponse)
def run_agent_workflow(project_id: UUID, workflow_id: str, db: Session = Depends(get_db)):
    result = orchestrator.run_workflow(db, project_id, workflow_id)
    if result["status"] == "not_found":
        raise HTTPException(status_code=404, detail="Workflow not found")
    return result

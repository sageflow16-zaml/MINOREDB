from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy.orm import Session
from src.agents.models import AgentTask, AgentExecution, AgentWorkflow
from src.agents.schemas import AgentStatusResponse, AgentDashboardResponse
from src.agents.core.registry import AgentRegistry


def create_task(
    db: Session,
    project_id: str,
    agent_name: str,
    task_type: str,
    title: str,
    description: str | None = None,
    input_data: dict | None = None,
    priority: int = 0,
    scheduled_at: datetime | None = None,
    workflow_id: str | None = None,
    workflow_step: int | None = None,
    depends_on: str | None = None,
) -> AgentTask:
    task = AgentTask(
        id=str(uuid4()),
        project_id=project_id,
        agent_name=agent_name,
        task_type=task_type,
        title=title,
        description=description,
        input_data=input_data or {},
        priority=priority,
        scheduled_at=scheduled_at,
        workflow_id=workflow_id,
        workflow_step=workflow_step,
        depends_on=depends_on,
        status="pending",
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def run_task(db: Session, project_id: str, task_id: str) -> AgentExecution | None:
    task = db.query(AgentTask).filter(AgentTask.id == task_id, AgentTask.project_id == project_id).first()
    if not task:
        return None

    agent = AgentRegistry.get(task.agent_name)
    if not agent:
        task.status = "failed"
        task.error_message = f"Unknown agent: {task.agent_name}"
        db.commit()
        return None

    execution = agent.run_task(db, project_id, task)
    db.commit()
    db.refresh(execution)
    return execution


def cancel_task(db: Session, project_id: str, task_id: str) -> bool:
    task = db.query(AgentTask).filter(AgentTask.id == task_id, AgentTask.project_id == project_id).first()
    if not task or task.status in ("completed", "failed", "cancelled"):
        return False
    task.status = "cancelled"
    task.completed_at = datetime.now(timezone.utc)
    db.commit()
    return True


def get_pending_tasks(db: Session, project_id: str) -> list[AgentTask]:
    return (
        db.query(AgentTask)
        .filter(AgentTask.project_id == project_id, AgentTask.status == "pending")
        .order_by(AgentTask.priority.desc(), AgentTask.created_at.asc())
        .all()
    )


def list_tasks(
    db: Session,
    project_id: str,
    status: str | None = None,
    agent_name: str | None = None,
    limit: int = 50,
) -> list[AgentTask]:
    q = db.query(AgentTask).filter(AgentTask.project_id == project_id)
    if status:
        q = q.filter(AgentTask.status == status)
    if agent_name:
        q = q.filter(AgentTask.agent_name == agent_name)
    return q.order_by(AgentTask.created_at.desc()).limit(limit).all()


def list_executions(
    db: Session,
    project_id: str,
    agent_name: str | None = None,
    limit: int = 50,
) -> list[AgentExecution]:
    q = db.query(AgentExecution).filter(AgentExecution.project_id == project_id)
    if agent_name:
        q = q.filter(AgentExecution.agent_name == agent_name)
    return q.order_by(AgentExecution.created_at.desc()).limit(limit).all()


# ── Workflow Management ──


def create_workflow(
    db: Session,
    project_id: str,
    name: str,
    description: str | None = None,
    steps: list | None = None,
    trigger_type: str | None = None,
    trigger_config: dict | None = None,
) -> AgentWorkflow:
    workflow = AgentWorkflow(
        id=str(uuid4()),
        project_id=project_id,
        name=name,
        description=description,
        steps=steps or [],
        trigger_type=trigger_type,
        trigger_config=trigger_config or {},
        status="draft",
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


def run_workflow(db: Session, project_id: str, workflow_id: str) -> dict:
    workflow = db.query(AgentWorkflow).filter(AgentWorkflow.id == workflow_id, AgentWorkflow.project_id == project_id).first()
    if not workflow:
        return {"workflow_id": workflow_id, "status": "not_found", "steps": []}

    step_results = []
    prev_output: dict | None = None

    for i, step in enumerate(workflow.steps or []):
        agent_name = step.get("agent_name")
        task_type = step.get("task_type", "analyze")
        title = step.get("title", f"{agent_name} - {task_type}")
        input_template = step.get("input_template", {})

        # Merge previous output into current input
        input_data = {**input_template}
        if prev_output:
            input_data["previous_step_output"] = prev_output

        task = create_task(
            db=db,
            project_id=project_id,
            agent_name=agent_name,
            task_type=task_type,
            title=title,
            input_data=input_data,
            workflow_id=workflow_id,
            workflow_step=i,
            depends_on=None,
        )

        execution = run_task(db, project_id, task.id)
        if execution:
            step_results.append({
                "step": i,
                "agent_name": agent_name,
                "task_type": task_type,
                "status": execution.status,
                "task_id": task.id,
                "execution_id": execution.id,
                "output_summary": execution.output_summary or "",
                "duration_ms": execution.duration_ms or 0,
                "error": execution.error_message,
            })
            prev_output = execution.output_data or {}
        else:
            step_results.append({
                "step": i,
                "agent_name": agent_name,
                "task_type": task_type,
                "status": "failed",
                "task_id": task.id,
                "execution_id": None,
                "output_summary": "",
                "duration_ms": 0,
                "error": "Agent not found or task failed",
            })
            break

    all_success = all(s["status"] == "completed" for s in step_results)
    workflow.total_runs += 1
    workflow.last_run_at = datetime.now(timezone.utc)
    workflow.last_run_status = "completed" if all_success else "failed"
    db.commit()

    return {
        "workflow_id": workflow_id,
        "status": "completed" if all_success else "failed",
        "steps": step_results,
    }


def list_workflows(db: Session, project_id: str) -> list[AgentWorkflow]:
    return (
        db.query(AgentWorkflow)
        .filter(AgentWorkflow.project_id == project_id)
        .order_by(AgentWorkflow.created_at.desc())
        .all()
    )


# ── Dashboard ──


def get_agent_dashboard(db: Session, project_id: str) -> AgentDashboardResponse:
    agents = AgentRegistry.list_agents()
    agents_status = []

    for agent in agents:
        last_exec = (
            db.query(AgentExecution)
            .filter(AgentExecution.project_id == project_id, AgentExecution.agent_name == agent.agent_name)
            .order_by(AgentExecution.created_at.desc())
            .first()
        )
        execs = (
            db.query(AgentExecution)
            .filter(AgentExecution.project_id == project_id, AgentExecution.agent_name == agent.agent_name)
            .all()
        )
        total = len(execs)
        completed = sum(1 for e in execs if e.status == "completed")
        avg_conf = (
            sum(e.confidence or 0 for e in execs if e.confidence is not None) / max(sum(1 for e in execs if e.confidence is not None), 1)
        )
        success_rate = (completed / max(total, 1)) * 100

        agents_status.append(AgentStatusResponse(
            agent_name=agent.agent_name,
            display_name=agent.display_name,
            description=agent.description,
            capabilities=agent.capabilities,
            is_available=True,
            total_tasks_run=total,
            last_execution=last_exec,
            avg_confidence=round(avg_conf, 2),
            success_rate=round(success_rate, 1),
        ))

    pending = get_pending_tasks(db, project_id)
    recent_execs = list_executions(db, project_id, limit=20)
    workflows = list_workflows(db, project_id)

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_tasks = (
        db.query(AgentExecution)
        .filter(
            AgentExecution.project_id == project_id,
            AgentExecution.created_at >= today_start,
        )
        .count()
    )
    total_discoveries = sum(len(e.discoveries or []) for e in recent_execs)

    all_confidence = [e.confidence for e in recent_execs if e.confidence is not None]
    all_success = sum(1 for e in recent_execs if e.status == "completed")
    all_total = len(recent_execs)

    return AgentDashboardResponse(
        agents=agents_status,
        pending_tasks=pending,
        recent_executions=recent_execs,
        workflows=workflows,
        total_tasks_today=today_tasks,
        total_discoveries=total_discoveries,
        avg_confidence=round(sum(all_confidence) / max(len(all_confidence), 1), 2) if all_confidence else None,
        success_rate=round((all_success / max(all_total, 1)) * 100, 1),
    )

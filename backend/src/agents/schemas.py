from datetime import datetime
from pydantic import BaseModel


class AgentTaskCreate(BaseModel):
    agent_name: str
    task_type: str
    title: str
    description: str | None = None
    input_data: dict | None = None
    priority: int = 0
    scheduled_at: datetime | None = None
    workflow_id: str | None = None
    workflow_step: int | None = None
    depends_on: str | None = None


class AgentTaskUpdate(BaseModel):
    status: str | None = None
    output_data: dict | None = None
    error_message: str | None = None


class AgentTaskResponse(BaseModel):
    id: str
    project_id: str
    agent_name: str
    task_type: str
    title: str
    description: str | None = None
    input_data: dict | None = None
    status: str = "pending"
    priority: int = 0
    scheduled_at: datetime | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    workflow_id: str | None = None
    workflow_step: int | None = None
    depends_on: str | None = None
    output_data: dict | None = None
    error_message: str | None = None
    execution_id: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class AgentExecutionResponse(BaseModel):
    id: str
    project_id: str
    task_id: str | None = None
    agent_name: str
    task_type: str
    status: str = "running"
    reasoning: str | None = None
    confidence: float | None = None
    discoveries: list | None = None
    evidence: list | None = None
    output_summary: str | None = None
    output_data: dict | None = None
    duration_ms: float | None = None
    sources_consulted: list | None = None
    memories_created: int = 0
    error_message: str | None = None
    created_at: datetime | None = None
    completed_at: datetime | None = None

    class Config:
        from_attributes = True


class RunTaskRequest(BaseModel):
    task_id: str


class WorkflowChainCreate(BaseModel):
    name: str
    description: str | None = None
    steps: list[dict]
    trigger_type: str | None = None
    trigger_config: dict | None = None


class WorkflowStepResult(BaseModel):
    step: int
    agent_name: str
    task_type: str
    status: str
    task_id: str | None = None
    execution_id: str | None = None
    output_summary: str | None = None
    duration_ms: float | None = None
    error: str | None = None


class RunWorkflowResponse(BaseModel):
    workflow_id: str
    status: str
    steps: list[WorkflowStepResult]


class AgentWorkflowResponse(BaseModel):
    id: str
    project_id: str
    name: str
    description: str | None = None
    status: str = "draft"
    steps: list | None = None
    trigger_type: str | None = None
    trigger_config: dict | None = None
    total_runs: int = 0
    last_run_at: datetime | None = None
    last_run_status: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class AgentStatusResponse(BaseModel):
    agent_name: str
    display_name: str
    description: str
    capabilities: list[str] = []
    is_available: bool = True
    total_tasks_run: int = 0
    last_execution: AgentExecutionResponse | None = None
    avg_confidence: float | None = None
    success_rate: float | None = None


class AgentDiscoveryResponse(BaseModel):
    agent_name: str
    display_name: str
    description: str
    capabilities: list[str] = []
    icon: str = "Bot"


class AgentDashboardResponse(BaseModel):
    agents: list[AgentStatusResponse]
    pending_tasks: list[AgentTaskResponse] = []
    recent_executions: list[AgentExecutionResponse] = []
    workflows: list[AgentWorkflowResponse] = []
    total_tasks_today: int = 0
    total_discoveries: int = 0
    avg_confidence: float | None = None
    success_rate: float | None = None

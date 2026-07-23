from abc import ABC, abstractmethod
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy.orm import Session
from src.agents.models import AgentTask, AgentExecution, AgentTaskStatus, AgentExecutionStatus


class BaseAgent(ABC):
    """Abstract base for all autonomous agents in the Minore intelligence system.

    Each agent is a stateless, rule-based service that:
    - Receives a task with context from the orchestrator
    - Processes data using its specialized logic
    - Returns structured results with reasoning, confidence, and evidence
    - Writes discoveries and observations to brain memory
    """

    agent_name: str = ""
    display_name: str = ""
    description: str = ""
    capabilities: list[str] = []

    @abstractmethod
    def execute(self, db: Session, project_id: str, task: AgentTask) -> AgentExecution:
        ...

    def run_task(self, db: Session, project_id: str, task: AgentTask) -> AgentExecution:
        """Run a task and return the execution record."""
        start = datetime.now(timezone.utc)

        task.status = AgentTaskStatus.running.value
        task.started_at = start
        db.flush()

        execution = AgentExecution(
            id=str(uuid4()),
            project_id=project_id,
            task_id=task.id,
            agent_name=self.agent_name,
            task_type=task.task_type,
            status=AgentExecutionStatus.running.value,
        )
        db.add(execution)
        db.flush()

        try:
            result = self.execute(db, project_id, task)

            execution.status = AgentExecutionStatus.completed.value
            execution.reasoning = result.reasoning
            execution.confidence = result.confidence
            execution.discoveries = result.discoveries
            execution.evidence = result.evidence
            execution.output_summary = result.output_summary
            execution.output_data = result.output_data
            execution.sources_consulted = result.sources_consulted
            execution.memories_created = result.memories_created
            execution.completed_at = datetime.now(timezone.utc)
            execution.duration_ms = (execution.completed_at - start).total_seconds() * 1000

            task.status = AgentTaskStatus.completed.value
            task.completed_at = execution.completed_at
            task.output_data = result.output_data
            task.execution_id = execution.id

        except Exception as e:
            execution.status = AgentExecutionStatus.failed.value
            execution.error_message = str(e)
            execution.completed_at = datetime.now(timezone.utc)
            execution.duration_ms = (execution.completed_at - start).total_seconds() * 1000

            task.status = AgentTaskStatus.failed.value
            task.completed_at = execution.completed_at
            task.error_message = str(e)
            task.execution_id = execution.id

        db.flush()
        return execution


class AgentResult:
    """Structured output from an agent execution."""

    def __init__(
        self,
        reasoning: str = "",
        confidence: float = 0.5,
        discoveries: list | None = None,
        evidence: list | None = None,
        output_summary: str = "",
        output_data: dict | None = None,
        sources_consulted: list | None = None,
        memories_created: int = 0,
    ):
        self.reasoning = reasoning
        self.confidence = confidence
        self.discoveries = discoveries or []
        self.evidence = evidence or []
        self.output_summary = output_summary
        self.output_data = output_data or {}
        self.sources_consulted = sources_consulted or []
        self.memories_created = memories_created

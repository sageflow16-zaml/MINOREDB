from sqlalchemy.orm import Session
from src.agents.core.base import BaseAgent, AgentResult
from src.agents.models import AgentTask
from src.models.research import ResearchSession, ResearchTask


class ResearcherAgent(BaseAgent):
    """Gathers and synthesizes research data from research engine."""

    agent_name = "researcher"
    display_name = "AI Researcher"
    description = "Gathers, synthesizes, and organizes research data and findings"
    capabilities = [
        "research_synthesis",
        "finding_extraction",
        "research_summarization",
        "knowledge_gap_analysis",
    ]

    def execute(self, db: Session, project_id: str, task: AgentTask) -> AgentResult:
        discoveries = []
        evidence = []
        sources = []

        # Count research sessions
        session_count = db.query(ResearchSession).filter(ResearchSession.project_id == project_id).count()
        sources.append(f"research_sessions:{session_count}")

        # Count research tasks
        task_count = db.query(ResearchTask).filter(ResearchTask.project_id == project_id).count()
        sources.append(f"research_tasks:{task_count}")

        # Recent tasks
        recent_tasks = (
            db.query(ResearchTask)
            .filter(ResearchTask.project_id == project_id)
            .order_by(ResearchTask.created_at.desc())
            .limit(10)
            .all()
        )

        completed_tasks = sum(1 for t in recent_tasks if t.status == "completed")
        pending_tasks = sum(1 for t in recent_tasks if t.status == "pending")
        failed_tasks = sum(1 for t in recent_tasks if t.status == "failed")

        if recent_tasks:
            discoveries.append({
                "type": "research_summary",
                "value": len(recent_tasks),
                "detail": f"Recent research: {completed_tasks} completed, {pending_tasks} pending, {failed_tasks} failed",
            })
            evidence.append({
                "source": "research",
                "total_sessions": session_count,
                "total_tasks": task_count,
                "recent_completed": completed_tasks,
                "recent_pending": pending_tasks,
            })

            # Topic extraction
            topics = []
            for t in recent_tasks:
                if t.title:
                    topics.append(t.title)
            if topics:
                discoveries.append({
                    "type": "research_topics",
                    "value": topics[:5],
                    "detail": f"Recent research topics: {', '.join(topics[:5])}",
                })

        # Knowledge gaps
        if failed_tasks > 2:
            discoveries.append({
                "type": "knowledge_gap",
                "value": failed_tasks,
                "detail": f"{failed_tasks} failed research tasks — potential knowledge gaps identified",
            })

        reasoning = (
            f"Research synthesis complete. "
            f"{session_count} sessions, {task_count} tasks. "
            f"{completed_tasks} completed, {pending_tasks} pending."
        )

        return AgentResult(
            reasoning=reasoning,
            confidence=round(0.5 + (session_count > 0) * 0.3, 2),
            discoveries=discoveries,
            evidence=evidence,
            output_summary=f"Synthesized {task_count} research findings from {session_count} sessions",
            output_data={
                "session_count": session_count,
                "task_count": task_count,
                "completed_tasks": completed_tasks,
                "pending_tasks": pending_tasks,
                "failed_tasks": failed_tasks,
            },
            sources_consulted=sources,
        )

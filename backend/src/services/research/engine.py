"""Research Engine — orchestrates the full research pipeline.

Architecture:
  Question → Planner → Task Executor → Evidence Collector → Validator → Report → Knowledge Update
"""

import time
from uuid import UUID, uuid4
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from src.models.research import ResearchSession, ResearchTask, ResearchReport
from src.services.research.planner import plan
from src.services.research.task_executor import execute
from src.services.research.evidence_collector import collect_tool


def run_research(project_id: UUID, question: str, db: Session) -> dict:
    """Run a full research session end-to-end.

    Creates session → plans tasks → executes each → validates → generates report.
    """
    session_id = uuid4()

    session = ResearchSession(
        id=session_id,
        project_id=project_id,
        question=question,
        status="planning",
    )
    db.add(session)
    db.flush()

    task_defs = plan(question)
    task_records = []
    for td in task_defs:
        task = ResearchTask(
            session_id=session_id,
            step=td.step,
            tool=td.tool,
            description=td.description,
            status="pending",
        )
        db.add(task)
        task_records.append(task)
    db.flush()

    session.status = "running"
    db.flush()

    accumulated_evidence: dict[str, object] = {}
    all_succeeded = True
    started_at = time.time()

    for task in task_records:
        task.status = "running"
        db.flush()

        if task.tool in (
            "trade_memory", "similarity", "statistics", "patterns",
            "knowledge_rules", "knowledge_graph", "macro", "learning",
            "trade_debrief", "personal_pattern", "personal_rule", "trader_profile",
            "institutional_knowledge",
        ):
            result = collect_tool(db, project_id, task.tool)
            if result:
                accumulated_evidence[task.tool] = result
            task.evidence_count = (
                len(result) if isinstance(result, list)
                else 1 if result else 0
            )
        elif task.tool == "validator":
            from src.services.research.validator import validate_evidence, build_findings
            validated = validate_evidence(accumulated_evidence)
            findings = build_findings(validated)
            accumulated_evidence["validator"] = {
                "findings": findings,
                "evidence_sources": list(validated.keys()),
            }
            task.evidence_count = len(findings)
        elif task.tool == "report":
            report_data = _generate_report(accumulated_evidence)
            report = ResearchReport(
                session_id=session_id,
                summary=report_data["summary"],
                findings=report_data["findings"],
                recommendations=report_data["recommendations"],
                limitations=report_data["limitations"],
                confidence=report_data["confidence"],
                sources=report_data["sources"],
            )
            db.add(report)
            task.evidence_count = (
                len(report_data["findings"]) + len(report_data["recommendations"])
            )

        task.status = "completed"
        db.flush()

    duration = time.time() - started_at
    session.status = "completed"
    session.completed_at = datetime.now(timezone.utc)
    session.duration = round(duration, 2)
    db.commit()

    return {
        "session_id": str(session_id),
        "status": "completed",
        "message": "Research completed successfully.",
    }


def get_session(db: Session, session_id: UUID) -> dict | None:
    """Retrieve a full research session with tasks and report."""
    session = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
    if not session:
        return None

    tasks = db.query(ResearchTask).filter(ResearchTask.session_id == session_id).order_by(ResearchTask.step).all()
    report = db.query(ResearchReport).filter(ResearchReport.session_id == session_id).first()

    return {
        "session": {
            "id": str(session.id),
            "project_id": str(session.project_id),
            "question": session.question,
            "status": session.status,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
            "duration": session.duration,
            "created_at": session.created_at.isoformat() if session.created_at else None,
        },
        "tasks": [
            {
                "id": str(t.id),
                "step": t.step,
                "tool": t.tool,
                "description": t.description,
                "status": t.status,
                "evidence_count": t.evidence_count,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tasks
        ],
        "report": {
            "id": str(report.id),
            "summary": report.summary,
            "findings": report.findings,
            "recommendations": report.recommendations,
            "limitations": report.limitations,
            "confidence": report.confidence,
            "sources": report.sources,
            "created_at": report.created_at.isoformat() if report.created_at else None,
        } if report else None,
    }


def get_history(db: Session, project_id: UUID, limit: int = 20) -> list["ResearchSession"]:
    """Retrieve research session history for a project."""
    return (
        db.query(ResearchSession)
        .filter(ResearchSession.project_id == project_id)
        .order_by(ResearchSession.created_at.desc())
        .limit(limit)
        .all()
    )


def _generate_report(evidence: dict[str, object]) -> dict:
    """Generate a deterministic research report from accumulated evidence."""
    from src.services.research.validator import (
        build_findings, build_recommendations, build_limitations, validate_evidence,
    )

    validated = validate_evidence(evidence)
    findings = build_findings(validated)
    recommendations = build_recommendations(validated)
    limitations = build_limitations(validated)

    total_items = sum(
        len(v) if isinstance(v, list) else 1 for v in validated.values() if v
    )
    confidence = min(100, total_items * 10)

    summary_parts = []
    stats = validated.get("statistics", {})
    if isinstance(stats, dict) and stats.get("overview", {}).get("total_trades"):
        o = stats["overview"]
        summary_parts.append(
            f"Analyzed {o['total_trades']} trades "
            f"({o.get('wins', 0)} wins, {o.get('losses', 0)} losses)."
        )

    rules = validated.get("knowledge_rules", [])
    if isinstance(rules, list) and rules:
        summary_parts.append(f"Found {len(rules)} knowledge rules.")

    graph = validated.get("knowledge_graph", {})
    if isinstance(graph, dict) and graph.get("total_nodes"):
        summary_parts.append(
            f"Knowledge graph contains {graph['total_nodes']} nodes "
            f"and {graph['total_edges']} edges."
        )

    debriefs = validated.get("trade_debrief", [])
    if isinstance(debriefs, list) and debriefs:
        summary_parts.append(f"{len(debriefs)} personal trade debriefs reviewed.")

    personal_rules = validated.get("personal_rule", [])
    if isinstance(personal_rules, list) and personal_rules:
        approved = [r for r in personal_rules if r.get("status") == "approved"]
        summary_parts.append(f"{len(approved)} approved personal rules available.")

    profile = validated.get("trader_profile", {})
    if isinstance(profile, dict) and profile.get("discipline_score") is not None:
        summary_parts.append(f"Trader discipline score: {profile['discipline_score']:.1f}/100.")

    if not summary_parts:
        summary_parts.append("No historical evidence available.")

    return {
        "summary": " ".join(summary_parts),
        "findings": findings,
        "recommendations": recommendations,
        "limitations": limitations,
        "confidence": confidence,
        "sources": list(validated.keys()),
    }

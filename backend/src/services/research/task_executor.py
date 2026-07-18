"""Task Executor — executes each research task independently.

Every task is self-contained. Never skips steps. Returns structured results.
"""

from uuid import UUID
from sqlalchemy.orm import Session
from src.services.research.evidence_collector import collect_tool
from src.services.research.validator import (
    build_findings,
    build_recommendations,
    build_limitations,
    validate_evidence,
)


def execute(
    db: Session, project_id: UUID, tool: str, accumulated_evidence: dict[str, object]
) -> tuple[object, int]:
    """Execute a single research task.

    Returns (result_data, evidence_count).
    """
    executor = _EXECUTORS.get(tool)
    if not executor:
        return None, 0
    return executor(db, project_id, accumulated_evidence)


def _execute_data_tool(
    db: Session, project_id: UUID, accumulated_evidence: dict[str, object]
) -> tuple[object, int]:
    tool_name = accumulated_evidence.get("_current_tool", "")
    result = collect_tool(db, project_id, tool_name)
    if not result:
        return None, 0
    if isinstance(result, dict):
        count = len(result)
    elif isinstance(result, list):
        count = len(result)
    else:
        count = 1
    return result, count


def _execute_validator(
    db: Session, project_id: UUID, accumulated_evidence: dict[str, object]
) -> tuple[object, int]:
    validated = validate_evidence(accumulated_evidence)
    findings = build_findings(validated)
    return {"findings": findings, "evidence_sources": list(validated.keys())}, len(findings)


def _execute_report(
    db: Session, project_id: UUID, accumulated_evidence: dict[str, object]
) -> tuple[object, int]:
    validated = validate_evidence(accumulated_evidence)
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

    if not summary_parts:
        summary_parts.append("No historical evidence available.")

    summary = " ".join(summary_parts)

    report = {
        "summary": summary,
        "findings": findings,
        "recommendations": recommendations,
        "limitations": limitations,
        "confidence": confidence,
        "sources": list(validated.keys()),
    }
    return report, len(findings) + len(recommendations)


_EXECUTORS: dict[str, callable] = {
    "trade_memory": _execute_data_tool,
    "similarity": _execute_data_tool,
    "statistics": _execute_data_tool,
    "patterns": _execute_data_tool,
    "knowledge_rules": _execute_data_tool,
    "knowledge_graph": _execute_data_tool,
    "macro": _execute_data_tool,
    "learning": _execute_data_tool,
    "trade_debrief": _execute_data_tool,
    "personal_pattern": _execute_data_tool,
    "personal_rule": _execute_data_tool,
    "trader_profile": _execute_data_tool,
    "validator": _execute_validator,
    "report": _execute_report,
}

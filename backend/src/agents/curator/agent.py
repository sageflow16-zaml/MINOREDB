from sqlalchemy.orm import Session
from src.agents.core.base import BaseAgent, AgentResult
from src.agents.models import AgentTask
from src.models.source import Source


class KnowledgeCuratorAgent(BaseAgent):
    """Curates and organizes knowledge from sources, claims, and research."""

    agent_name = "curator"
    display_name = "Knowledge Curator"
    description = "Curates and organizes knowledge from sources, claims, and research materials"
    capabilities = [
        "source_analysis",
        "claim_synthesis",
        "knowledge_organization",
        "research_summarization",
        "conflict_detection",
    ]

    def execute(self, db: Session, project_id: str, task: AgentTask) -> AgentResult:
        discoveries = []
        evidence = []
        sources = []

        # Analyze sources
        source_count = db.query(Source).filter(Source.project_id == project_id).count()
        sources.append(f"sources:{source_count} records")

        # Check claims
        from src.models.claim import Claim
        claim_count = db.query(Claim).filter(Claim.project_id == project_id).count()
        sources.append(f"claims:{claim_count} records")

        # Check concepts
        from src.models.concept import Concept
        concept_count = db.query(Concept).filter(Concept.project_id == project_id).count()
        sources.append(f"concepts:{concept_count} records")

        # Check conflicts
        from src.models.conflict import Conflict
        conflict_count = db.query(Conflict).filter(Conflict.project_id == project_id).count()
        sources.append(f"conflicts:{conflict_count} records")

        if source_count > 0:
            discoveries.append({
                "type": "source_count",
                "value": source_count,
                "detail": f"{source_count} sources available for knowledge extraction",
            })
        if claim_count > 0:
            discoveries.append({
                "type": "claim_count",
                "value": claim_count,
                "detail": f"{claim_count} claims extracted from sources",
            })
        if concept_count > 0:
            discoveries.append({
                "type": "concept_count",
                "value": concept_count,
                "detail": f"{concept_count} concepts identified",
            })
        if conflict_count > 0:
            discoveries.append({
                "type": "conflict_count",
                "value": conflict_count,
                "detail": f"{conflict_count} conflicts detected — review recommended",
            })

        # Knowledge coverage score
        total_entities = source_count + claim_count + concept_count
        coverage = min(total_entities / 50, 1.0) if total_entities > 0 else 0
        discoveries.append({
            "type": "knowledge_coverage",
            "value": round(coverage, 2),
            "detail": f"Knowledge coverage score: {round(coverage * 100, 0)}% ({total_entities} total entities)",
        })
        evidence.append({
            "source": "knowledge",
            "sources": source_count,
            "claims": claim_count,
            "concepts": concept_count,
            "conflicts": conflict_count,
        })

        reasoning = (
            f"Knowledge curation complete. "
            f"{source_count} sources, {claim_count} claims, {concept_count} concepts, {conflict_count} conflicts. "
            f"Coverage: {round(coverage * 100, 0)}%"
        )

        return AgentResult(
            reasoning=reasoning,
            confidence=round(0.5 + coverage * 0.4, 2),
            discoveries=discoveries,
            evidence=evidence,
            output_summary=f"Curated {total_entities} knowledge entities ({round(coverage * 100, 0)}% coverage)",
            output_data={
                "source_count": source_count,
                "claim_count": claim_count,
                "concept_count": concept_count,
                "conflict_count": conflict_count,
                "coverage_score": round(coverage, 2),
            },
            sources_consulted=sources,
        )

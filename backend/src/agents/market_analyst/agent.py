from sqlalchemy.orm import Session
from src.agents.core.base import BaseAgent, AgentResult
from src.agents.models import AgentTask


class MarketAnalystAgent(BaseAgent):
    """Analyzes market structure, ICT concepts, and macro conditions."""

    agent_name = "market_analyst"
    display_name = "Market Analyst"
    description = "Analyzes market structure, ICT concepts, liquidity, and macro conditions"
    capabilities = [
        "market_structure_analysis",
        "ict_concept_detection",
        "liquidity_analysis",
        "session_analysis",
        "macro_correlation",
    ]

    def execute(self, db: Session, project_id: str, task: AgentTask) -> AgentResult:
        input_data = task.input_data or {}
        analysis_type = task.task_type

        discoveries = []
        evidence = []
        sources = []

        if analysis_type == "market_structure" or analysis_type == "analyze":
            from src.models.market_structure import MarketStructure
            structures = (
                db.query(MarketStructure)
                .filter(MarketStructure.project_id == project_id)
                .order_by(MarketStructure.created_at.desc())
                .limit(20)
                .all()
            )
            sources.append(f"market_structure:{len(structures)} records")
            if structures:
                # Identify prevailing biases
                biases = {}
                for s in structures:
                    biases[s.bias] = biases.get(s.bias, 0) + 1
                prevailing = max(biases, key=biases.get) if biases else "unknown"

                discoveries.append({
                    "type": "prevailing_bias",
                    "value": prevailing,
                    "detail": f"Most common bias: {prevailing} ({biases.get(prevailing, 0)} occurrences)",
                })
                discoveries.append({
                    "type": "structure_count",
                    "value": len(structures),
                    "detail": f"Analyzed {len(structures)} market structures",
                })
                evidence.append({
                    "source": "market_structure",
                    "count": len(structures),
                    "biases": biases,
                })

        if analysis_type == "ict" or analysis_type == "analyze":
            from src.ict.models import ICTStructure
            ict_records = (
                db.query(ICTStructure)
                .filter(ICTStructure.project_id == project_id)
                .order_by(ICTStructure.created_at.desc())
                .limit(20)
                .all()
            )
            sources.append(f"ict:{len(ict_records)} records")
            if ict_records:
                concepts = {}
                for r in ict_records:
                    concepts[r.concept] = concepts.get(r.concept, 0) + 1
                top_concept = max(concepts, key=concepts.get) if concepts else None
                if top_concept:
                    discoveries.append({
                        "type": "top_ict_concept",
                        "value": top_concept,
                        "detail": f"Most frequent ICT concept: {top_concept}",
                    })
                evidence.append({
                    "source": "ict",
                    "count": len(ict_records),
                    "concepts": concepts,
                })

        reasoning = (
            f"Market Analyst analyzed {len(sources)} data sources. "
            f"Found {len(discoveries)} observations."
        )
        confidence = min(0.5 + len(discoveries) * 0.1, 0.95)

        return AgentResult(
            reasoning=reasoning,
            confidence=round(confidence, 2),
            discoveries=discoveries,
            evidence=evidence,
            output_summary=f"Market structure analysis complete: {len(discoveries)} findings",
            output_data={
                "discoveries": discoveries,
                "sources_analyzed": sources,
            },
            sources_consulted=sources,
        )

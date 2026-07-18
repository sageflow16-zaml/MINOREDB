from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.trade_memory import TradeMemory
from src.models.knowledge_graph import KnowledgeNode, KnowledgeEdge, KnowledgeGraphSnapshot
from src.schemas.knowledge_graph import (
    KnowledgeNodeCreate, KnowledgeEdgeCreate, GraphSnapshotCreate,
)
from src.crud import knowledge_graph as crud


NODE_CATEGORIES: dict[str, str] = {
    "session": "Session",
    "weekly_bias": "Bias",
    "daily_bias": "Bias",
    "h4_bias": "Bias",
    "market_phase": "Market Structure",
    "market_trend": "Market Structure",
    "entry_model": "Entry",
    "liquidity_type": "Liquidity",
    "execution_model": "Execution",
    "result": "Outcome",
    "pair": "Pair",
    "direction": "Direction",
    "confidence_level": "Confidence",
}


def _extract_nodes(memory: TradeMemory) -> list[dict]:
    nodes = []
    if memory.pair:
        nodes.append({"type": "pair", "name": memory.pair.upper()})
    if memory.direction:
        nodes.append({"type": "direction", "name": memory.direction.upper()})
    if memory.session and memory.session != "NONE":
        nodes.append({"type": "session", "name": memory.session})
    if memory.weekly_bias:
        nodes.append({"type": "weekly_bias", "name": memory.weekly_bias.upper()})
    if memory.daily_bias:
        nodes.append({"type": "daily_bias", "name": memory.daily_bias.upper()})
    if memory.h4_bias:
        nodes.append({"type": "h4_bias", "name": memory.h4_bias.upper()})
    if memory.market_phase:
        nodes.append({"type": "market_phase", "name": memory.market_phase.upper()})
    if memory.market_trend:
        nodes.append({"type": "market_trend", "name": memory.market_trend.upper()})
    if memory.entry_model:
        nodes.append({"type": "entry_model", "name": memory.entry_model.upper()})
    if memory.liquidity_type and memory.liquidity_type != "NONE":
        nodes.append({"type": "liquidity_type", "name": memory.liquidity_type.upper()})
    if memory.execution_model:
        nodes.append({"type": "execution_model", "name": memory.execution_model.upper()})
    if memory.result:
        nodes.append({"type": "result", "name": memory.result.upper()})
    if memory.confidence is not None:
        level = "HIGH" if memory.confidence >= 70 else "MEDIUM" if memory.confidence >= 40 else "LOW"
        nodes.append({"type": "confidence_level", "name": level})
    return nodes


def update_graph(project_id: UUID, db: Session) -> KnowledgeGraphSnapshot:
    memories = db.scalars(
        select(TradeMemory).where(TradeMemory.project_id == project_id)
        .order_by(TradeMemory.created_at.desc())
    ).all()

    if not memories:
        snapshot_in = GraphSnapshotCreate(
            project_id=project_id,
            total_nodes=0,
            total_edges=0,
            summary="No trade memories available for graph construction.",
        )
        return crud.create_snapshot(db, obj_in=snapshot_in)

    all_node_ids: list[UUID] = []

    for memory in memories:
        node_defs = _extract_nodes(memory)
        memory_node_ids = []

        for nd in node_defs:
            node_in = KnowledgeNodeCreate(
                project_id=project_id,
                type=nd["type"],
                name=nd["name"],
                category=NODE_CATEGORIES.get(nd["type"]),
            )
            node, is_new = crud.get_or_create_node(db, obj_in=node_in)
            if not is_new:
                crud.increment_node_occurrences(db, node)
            memory_node_ids.append(node.id)
            all_node_ids.append(node.id)

        for i in range(len(memory_node_ids)):
            for j in range(i + 1, len(memory_node_ids)):
                edge_in = KnowledgeEdgeCreate(
                    project_id=project_id,
                    source_node_id=memory_node_ids[i],
                    target_node_id=memory_node_ids[j],
                    relationship="CORRELATED",
                )
                edge = crud.get_or_create_edge(db, obj_in=edge_in)
                crud.increment_edge(db, edge)

    db.flush()

    total_nodes = db.scalar(
        select(func.count(KnowledgeNode.id))
        .where(KnowledgeNode.project_id == project_id)
    ) or 0
    total_edges = db.scalar(
        select(func.count(KnowledgeEdge.id))
        .where(KnowledgeEdge.project_id == project_id)
    ) or 0

    most_connected = db.scalar(
        select(KnowledgeNode.type)
        .where(KnowledgeNode.project_id == project_id)
        .group_by(KnowledgeNode.type)
        .order_by(func.sum(KnowledgeNode.occurrences).desc())
        .limit(1)
    )

    top_edge = db.scalar(
        select(KnowledgeEdge)
        .where(KnowledgeEdge.project_id == project_id)
        .order_by(KnowledgeEdge.confidence.desc().nullslast())
        .limit(1)
    )

    summary_parts = [
        f"Graph contains {total_nodes} nodes and {total_edges} edges.",
    ]
    if most_connected:
        summary_parts.append(f"Most connected type: {most_connected}.")
    if top_edge:
        summary_parts.append(f"Highest confidence edge: {top_edge.confidence:.2f}.")

    snapshot_in = GraphSnapshotCreate(
        project_id=project_id,
        total_nodes=total_nodes,
        total_edges=total_edges,
        most_connected_type=most_connected,
        highest_confidence_edge_id=top_edge.id if top_edge else None,
        summary=" ".join(summary_parts),
    )
    snapshot = crud.create_snapshot(db, obj_in=snapshot_in)
    db.commit()
    return snapshot

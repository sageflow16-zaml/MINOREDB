from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.knowledge_graph import KnowledgeNode, KnowledgeEdge, KnowledgeGraphSnapshot
from src.schemas.knowledge_graph import (
    KnowledgeNodeCreate, KnowledgeEdgeCreate, GraphSnapshotCreate,
)


def get_or_create_node(db: Session, *, obj_in: KnowledgeNodeCreate) -> tuple[KnowledgeNode, bool]:
    existing = db.scalar(
        select(KnowledgeNode).where(
            KnowledgeNode.project_id == obj_in.project_id,
            KnowledgeNode.type == obj_in.type,
            KnowledgeNode.name == obj_in.name,
        )
    )
    if existing:
        return existing, False
    db_obj = KnowledgeNode(**obj_in.model_dump())
    db.add(db_obj)
    db.flush()
    return db_obj, True


def increment_node_occurrences(db: Session, node: KnowledgeNode) -> None:
    node.occurrences = (node.occurrences or 0) + 1
    db.flush()


def get_or_create_edge(db: Session, *, obj_in: KnowledgeEdgeCreate) -> KnowledgeEdge:
    src, tgt = sorted([obj_in.source_node_id, obj_in.target_node_id])
    existing = db.scalar(
        select(KnowledgeEdge).where(
            KnowledgeEdge.source_node_id == src,
            KnowledgeEdge.target_node_id == tgt,
            KnowledgeEdge.relationship == obj_in.relationship,
        )
    )
    if existing:
        return existing
    # Ensure source < target for consistent ordering
    create_data = obj_in.model_dump()
    create_data["source_node_id"] = src
    create_data["target_node_id"] = tgt
    db_obj = KnowledgeEdge(**create_data)
    db.add(db_obj)
    db.flush()
    return db_obj


def increment_edge(db: Session, edge: KnowledgeEdge) -> None:
    edge.occurrences = (edge.occurrences or 0) + 1
    edge.strength = float(edge.occurrences)
    edge.confidence = min(1.0, (edge.occurrences or 0) / 10.0)
    db.flush()


def get_all_nodes(db: Session, project_id: UUID) -> list[KnowledgeNode]:
    return db.scalars(
        select(KnowledgeNode).where(KnowledgeNode.project_id == project_id)
        .order_by(KnowledgeNode.type, KnowledgeNode.name)
    ).all()


def get_all_edges(db: Session, project_id: UUID) -> list[KnowledgeEdge]:
    return db.scalars(
        select(KnowledgeEdge).where(KnowledgeEdge.project_id == project_id)
        .order_by(KnowledgeEdge.strength.desc().nullslast())
    ).all()


def get_nodes_by_type(db: Session, project_id: UUID, type: str) -> list[KnowledgeNode]:
    return db.scalars(
        select(KnowledgeNode).where(
            KnowledgeNode.project_id == project_id,
            KnowledgeNode.type == type,
        )
    ).all()


def get_snapshot(db: Session, project_id: UUID) -> KnowledgeGraphSnapshot | None:
    return db.scalar(
        select(KnowledgeGraphSnapshot).where(KnowledgeGraphSnapshot.project_id == project_id)
        .order_by(KnowledgeGraphSnapshot.created_at.desc()).limit(1)
    )


def create_snapshot(db: Session, *, obj_in: GraphSnapshotCreate) -> KnowledgeGraphSnapshot:
    db_obj = KnowledgeGraphSnapshot(**obj_in.model_dump())
    db.add(db_obj)
    db.flush()
    return db_obj

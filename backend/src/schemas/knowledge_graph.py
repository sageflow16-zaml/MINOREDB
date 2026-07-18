from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional


class KnowledgeNodeBase(BaseModel):
    type: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    weight: Optional[float] = None
    occurrences: Optional[int] = None


class KnowledgeNodeCreate(KnowledgeNodeBase):
    project_id: UUID
    type: str
    name: str


class KnowledgeNodeRead(KnowledgeNodeBase):
    id: UUID
    project_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class KnowledgeEdgeBase(BaseModel):
    relationship: Optional[str] = "CORRELATED"
    strength: Optional[float] = None
    occurrences: Optional[int] = None
    confidence: Optional[float] = None


class KnowledgeEdgeCreate(KnowledgeEdgeBase):
    project_id: UUID
    source_node_id: UUID
    target_node_id: UUID
    relationship: str = "CORRELATED"


class KnowledgeEdgeRead(KnowledgeEdgeBase):
    id: UUID
    project_id: UUID
    source_node_id: UUID
    target_node_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GraphSnapshotBase(BaseModel):
    total_nodes: Optional[int] = 0
    total_edges: Optional[int] = 0
    most_connected_type: Optional[str] = None
    highest_confidence_edge_id: Optional[UUID] = None
    summary: Optional[str] = None


class GraphSnapshotCreate(GraphSnapshotBase):
    project_id: UUID
    total_nodes: int = 0
    total_edges: int = 0


class GraphSnapshotRead(GraphSnapshotBase):
    id: UUID
    project_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GraphData(BaseModel):
    nodes: list[KnowledgeNodeRead]
    edges: list[KnowledgeEdgeRead]
    snapshot: Optional[GraphSnapshotRead] = None

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.knowledge_graph import (
    KnowledgeNodeRead, KnowledgeEdgeRead, GraphSnapshotRead, GraphData,
)
from src.crud import knowledge_graph as crud
from src.services.knowledge_graph import update_graph

router = APIRouter()


@router.get("/data", response_model=GraphData)
def read_graph_data(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    node_type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    if node_type:
        nodes = crud.get_nodes_by_type(db, project_id=project_id, type=node_type)
    else:
        nodes = crud.get_all_nodes(db, project_id=project_id)
    edges = crud.get_all_edges(db, project_id=project_id)
    snapshot = crud.get_snapshot(db, project_id=project_id)
    return GraphData(nodes=nodes, edges=edges, snapshot=snapshot)


@router.get("/nodes", response_model=list[KnowledgeNodeRead])
def read_graph_nodes(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    node_type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    if node_type:
        return crud.get_nodes_by_type(db, project_id=project_id, type=node_type)
    return crud.get_all_nodes(db, project_id=project_id)


@router.get("/edges", response_model=list[KnowledgeEdgeRead])
def read_graph_edges(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return crud.get_all_edges(db, project_id=project_id)


@router.get("/snapshot", response_model=GraphSnapshotRead | None)
def read_graph_snapshot(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return crud.get_snapshot(db, project_id=project_id)


@router.post("/refresh", response_model=GraphSnapshotRead)
def refresh_graph(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return update_graph(project_id, db)

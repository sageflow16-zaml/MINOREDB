from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.collector import (
    CollectorStatusRead,
    CollectorLogRead,
    CollectorRunResult,
)
from src.collectors.registry import list_collector_classes
from src.collectors.manager import CollectorManager
from src.crud import collector as collector_crud

router = APIRouter()


@router.get("/", response_model=list[CollectorStatusRead])
def list_collectors(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    collector_crud.create_default_schedules(db, project_id=project_id)
    manager = CollectorManager(project_id, db)
    return manager.list_statuses()


@router.get("/status", response_model=list[CollectorStatusRead])
def collector_statuses(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    manager = CollectorManager(project_id, db)
    return manager.list_statuses()


@router.post("/run/{collector_name}", response_model=CollectorRunResult)
def run_collector(
    project_id: UUID,
    collector_name: str,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    available = list_collector_classes()
    if collector_name not in available:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collector '{collector_name}' not found. Available: {', '.join(available.keys())}",
        )

    manager = CollectorManager(project_id, db)
    result = manager.execute(collector_name)
    return CollectorRunResult(
        collector_name=collector_name,
        status=result.status,
        records_collected=result.records_collected,
        errors_count=result.errors_count,
        error_message=result.error_message,
        duration_ms=result.duration_ms,
    )


@router.put("/{collector_name}/toggle", response_model=CollectorStatusRead)
def toggle_collector(
    project_id: UUID,
    collector_name: str,
    enabled: bool,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    manager = CollectorManager(project_id, db)
    updated = manager.update_enabled(collector_name, enabled)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collector '{collector_name}' not found",
        )
    return updated


@router.get("/logs", response_model=list[CollectorLogRead])
def collector_logs(
    project_id: UUID,
    limit: int = 50,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    manager = CollectorManager(project_id, db)
    return manager.get_logs(limit=limit)

from sqlalchemy.orm import Session
from src.models.project import Project
from src.schemas.project import ProjectCreate, ProjectUpdate
from uuid import UUID


def get_project(db: Session, project_id: UUID) -> Project | None:
    return db.query(Project).filter(Project.id == project_id).first()


def get_projects(db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> list[Project]:
    return (
        db.query(Project)
        .filter(Project.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_project(db: Session, project_in: ProjectCreate, user_id: UUID) -> Project:
    project = Project(**project_in.model_dump(), user_id=user_id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project_id: UUID, project_in: ProjectUpdate) -> Project | None:
    project = get_project(db, project_id)
    if not project:
        return None
    for field, value in project_in.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: UUID) -> bool:
    project = get_project(db, project_id)
    if not project:
        return False
    db.delete(project)
    db.commit()
    return True

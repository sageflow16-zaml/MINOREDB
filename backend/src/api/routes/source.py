from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from src.api.deps import get_db, get_project_or_404
from src.schemas.source import SourceCreate, SourceUpdate, SourceRead
from src.crud import source as crud
from src.models.project import Project
from src.core.config import settings
from src.core.logging import get_logger
from src.services.text_normalizer import normalize_text
from src.services.claim_pipeline import extract_claims_from_source
from src.services.conflict_engine import process_source_conflicts
import json

logger = get_logger(__name__)

ALLOWED_UPLOAD_EXTENSIONS = {".txt"}
ALLOWED_UPLOAD_CONTENT_TYPES = {"text/plain"}

router = APIRouter()

@router.get("/", response_model=list[SourceRead])
def read_sources(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    return crud.get_multi(db, project_id=project_id, skip=skip, limit=limit)

@router.get("/{id}", response_model=SourceRead)
def read_source(
    project_id: UUID,
    id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    db_obj = crud.get(db, project_id=project_id, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return db_obj

@router.post("/", response_model=SourceRead, status_code=status.HTTP_201_CREATED)
def create_source(
    project_id: UUID,
    obj_in: SourceCreate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    return crud.create(db, project_id=project_id, obj_in=obj_in)

@router.put("/{id}", response_model=SourceRead)
def update_source(
    project_id: UUID,
    id: UUID,
    obj_in: SourceUpdate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    db_obj = crud.get(db, project_id=project_id, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return crud.update(db, db_obj=db_obj, obj_in=obj_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_source(
    project_id: UUID,
    id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    if not crud.remove(db, project_id=project_id, id=id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return None

@router.post("/{source_id}/extract-claims")
def extract_source_claims(
    project_id: UUID,
    source_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    # Need to verify source belongs to project
    db_obj = crud.get(db, project_id=project_id, id=source_id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")

    created_count = extract_claims_from_source(db, source_id=source_id)
    return {
        "source_id": source_id,
        "claims_created": created_count
    }

@router.post("/{source_id}/detect-conflicts")
def detect_source_conflicts(
    project_id: UUID,
    source_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    # Need to verify source belongs to project
    db_obj = crud.get(db, project_id=project_id, id=source_id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")

    created_count = process_source_conflicts(db, source_id=source_id)
    return {
        "source_id": source_id,
        "conflicts_created": created_count
    }

@router.post("/upload", response_model=SourceRead, status_code=status.HTTP_201_CREATED)
def upload_source(
    project_id: UUID,
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    # NOTE: declared as a synchronous `def` so FastAPI runs it in a threadpool.
    # The previous `async def` performed blocking SQLAlchemy commits directly on
    # the event loop, which could stall all other requests.
    content = ""

    if file:
        # Validate extension.
        filename = file.filename or ""
        if not any(filename.lower().endswith(ext) for ext in ALLOWED_UPLOAD_EXTENSIONS):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only .txt files are supported",
            )
        # Validate content type when provided by the client.
        if file.content_type and file.content_type not in ALLOWED_UPLOAD_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only text/plain uploads are supported",
            )

        # Enforce upload size limit by reading in bounded chunks.
        max_size = settings.MAX_UPLOAD_SIZE
        chunks: list[bytes] = []
        total = 0
        while True:
            chunk = file.file.read(65536)
            if not chunk:
                break
            total += len(chunk)
            if max_size and total > max_size:
                file.file.close()
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Uploaded file exceeds the maximum allowed size",
                )
            chunks.append(chunk)
        try:
            content = b"".join(chunks).decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is not valid UTF-8 text",
            )
    elif text:
        if settings.MAX_UPLOAD_SIZE and len(text.encode("utf-8")) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Provided text exceeds the maximum allowed size",
            )
        content = text
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either a .txt file or plain text must be provided"
        )

    # Parse optional metadata JSON
    meta_dict = {}
    if metadata:
        try:
            meta_dict = json.loads(metadata)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid metadata JSON"
            )

    # Store raw content and apply normalization
    source_data = SourceCreate(
        **meta_dict,
        raw_text=content,
        normalized_text=normalize_text(content)
    )

    return crud.create(db, project_id=project_id, obj_in=source_data)

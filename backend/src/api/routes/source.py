from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from src.api.deps import get_db
from src.schemas.source import SourceCreate, SourceUpdate, SourceRead, SourceUpload
from src.crud import source as crud
from src.services.text_normalizer import normalize_text
import json

router = APIRouter()

@router.get("/", response_model=list[SourceRead])
def read_sources(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=SourceRead)
def read_source(id: UUID, db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return db_obj

@router.post("/", response_model=SourceRead, status_code=status.HTTP_201_CREATED)
def create_source(obj_in: SourceCreate, db: Session = Depends(get_db)):
    return crud.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=SourceRead)
def update_source(id: UUID, obj_in: SourceUpdate, db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return crud.update(db, db_obj=db_obj, obj_in=obj_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_source(id: UUID, db: Session = Depends(get_db)):
    if not crud.remove(db, id=id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return None

@router.post("/upload", response_model=SourceRead, status_code=status.HTTP_201_CREATED)
async def upload_source(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None), 
    db: Session = Depends(get_db)
):
    content = ""
    
    if file:
        if not file.filename.endswith(".txt"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Only .txt files are supported"
            )
        content = (await file.read()).decode("utf-8")
    elif text:
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
    
    return crud.create(db, obj_in=source_data)

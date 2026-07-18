from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.api.deps import get_db
from src.schemas.knowledge import (
    KnowledgeCategoryCreate, KnowledgeCategoryUpdate, KnowledgeCategoryRead,
    KnowledgeTagCreate, KnowledgeTagUpdate, KnowledgeTagRead,
    KnowledgeConceptCreate, KnowledgeConceptUpdate, KnowledgeConceptRead, KnowledgeConceptDetail,
    KnowledgeRelationshipCreate, KnowledgeRelationshipUpdate, KnowledgeRelationshipRead,
    KnowledgeExampleCreate, KnowledgeExampleUpdate, KnowledgeExampleRead,
    KnowledgeReferenceCreate, KnowledgeReferenceUpdate, KnowledgeReferenceRead,
    KnowledgeSourceCreate, KnowledgeSourceUpdate, KnowledgeSourceRead,
    KnowledgeChunkRead, KnowledgeRevisionRead, KnowledgeRevisionCreate,
    KnowledgeSearchResult, KnowledgeExplorerResponse, KnowledgeExplorerNode, KnowledgeExplorerEdge,
)
from src.crud import knowledge as crud

router = APIRouter()


# --- Categories ---

@router.get("/categories", response_model=list[KnowledgeCategoryRead])
def read_categories(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000), db: Session = Depends(get_db)):
    return crud.get_categories(db, skip=skip, limit=limit)

@router.get("/categories/{id}", response_model=KnowledgeCategoryRead)
def read_category(id: UUID, db: Session = Depends(get_db)):
    obj = crud.get_category(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return obj

@router.get("/categories/slug/{slug}", response_model=KnowledgeCategoryRead)
def read_category_by_slug(slug: str, db: Session = Depends(get_db)):
    obj = crud.get_category_by_slug(db, slug)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return obj

@router.post("/categories", response_model=KnowledgeCategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(obj_in: KnowledgeCategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db, obj_in=obj_in)

@router.put("/categories/{id}", response_model=KnowledgeCategoryRead)
def update_category(id: UUID, obj_in: KnowledgeCategoryUpdate, db: Session = Depends(get_db)):
    obj = crud.get_category(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return crud.update_category(db, db_obj=obj, obj_in=obj_in)

@router.delete("/categories/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(id: UUID, db: Session = Depends(get_db)):
    obj = crud.get_category(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    crud.remove_category(db, id=id)


# --- Tags ---

@router.get("/tags", response_model=list[KnowledgeTagRead])
def read_tags(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000), db: Session = Depends(get_db)):
    return crud.get_tags(db, skip=skip, limit=limit)

@router.get("/tags/{id}", response_model=KnowledgeTagRead)
def read_tag(id: UUID, db: Session = Depends(get_db)):
    obj = crud.get_tag(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    return obj

@router.post("/tags", response_model=KnowledgeTagRead, status_code=status.HTTP_201_CREATED)
def create_tag(obj_in: KnowledgeTagCreate, db: Session = Depends(get_db)):
    return crud.create_tag(db, obj_in=obj_in)

@router.put("/tags/{id}", response_model=KnowledgeTagRead)
def update_tag(id: UUID, obj_in: KnowledgeTagUpdate, db: Session = Depends(get_db)):
    obj = crud.get_tag(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    return crud.update_tag(db, db_obj=obj, obj_in=obj_in)

@router.delete("/tags/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(id: UUID, db: Session = Depends(get_db)):
    obj = crud.get_tag(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    crud.remove_tag(db, id=id)


# --- Concepts ---

@router.get("/concepts", response_model=list[KnowledgeConceptRead])
def read_concepts(
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000),
    category_id: UUID | None = None, db: Session = Depends(get_db),
):
    return crud.get_concepts(db, skip=skip, limit=limit, category_id=category_id)

@router.get("/concepts/{id}", response_model=KnowledgeConceptDetail)
def read_concept(id: UUID, db: Session = Depends(get_db)):
    obj = crud.get_concept(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")
    return obj

@router.get("/concepts/slug/{category_id}/{slug}", response_model=KnowledgeConceptRead)
def read_concept_by_slug(category_id: UUID, slug: str, db: Session = Depends(get_db)):
    obj = crud.get_concept_by_slug(db, category_id, slug)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")
    return obj

@router.post("/concepts", response_model=KnowledgeConceptRead, status_code=status.HTTP_201_CREATED)
def create_concept(obj_in: KnowledgeConceptCreate, db: Session = Depends(get_db)):
    return crud.create_concept(db, obj_in=obj_in)

@router.put("/concepts/{id}", response_model=KnowledgeConceptRead)
def update_concept(id: UUID, obj_in: KnowledgeConceptUpdate, db: Session = Depends(get_db)):
    obj = crud.get_concept(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")
    return crud.update_concept(db, db_obj=obj, obj_in=obj_in)

@router.delete("/concepts/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_concept(id: UUID, db: Session = Depends(get_db)):
    obj = crud.get_concept(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")
    crud.remove_concept(db, id=id)


# --- Relationships ---

@router.get("/relationships", response_model=list[KnowledgeRelationshipRead])
def read_relationships(
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000),
    concept_id: UUID | None = None, db: Session = Depends(get_db),
):
    return crud.get_relationships(db, skip=skip, limit=limit, concept_id=concept_id)

@router.get("/relationships/{id}", response_model=KnowledgeRelationshipRead)
def read_relationship(id: UUID, db: Session = Depends(get_db)):
    obj = crud.get_relationship(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relationship not found")
    return obj

@router.post("/relationships", response_model=KnowledgeRelationshipRead, status_code=status.HTTP_201_CREATED)
def create_relationship(obj_in: KnowledgeRelationshipCreate, db: Session = Depends(get_db)):
    return crud.create_relationship(db, obj_in=obj_in)

@router.put("/relationships/{id}", response_model=KnowledgeRelationshipRead)
def update_relationship(id: UUID, obj_in: KnowledgeRelationshipUpdate, db: Session = Depends(get_db)):
    obj = crud.get_relationship(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relationship not found")
    return crud.update_relationship(db, db_obj=obj, obj_in=obj_in)

@router.delete("/relationships/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_relationship(id: UUID, db: Session = Depends(get_db)):
    obj = crud.get_relationship(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relationship not found")
    crud.remove_relationship(db, id=id)


# --- Examples ---

@router.get("/examples", response_model=list[KnowledgeExampleRead])
def read_examples(
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000),
    concept_id: UUID | None = None, db: Session = Depends(get_db),
):
    return crud.get_examples(db, skip=skip, limit=limit, concept_id=concept_id)

@router.get("/examples/{id}", response_model=KnowledgeExampleRead)
def read_example(id: UUID, db: Session = Depends(get_db)):
    obj = crud.get_example(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Example not found")
    return obj

@router.post("/examples", response_model=KnowledgeExampleRead, status_code=status.HTTP_201_CREATED)
def create_example(obj_in: KnowledgeExampleCreate, db: Session = Depends(get_db)):
    return crud.create_example(db, obj_in=obj_in)

@router.put("/examples/{id}", response_model=KnowledgeExampleRead)
def update_example(id: UUID, obj_in: KnowledgeExampleUpdate, db: Session = Depends(get_db)):
    obj = crud.get_example(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Example not found")
    return crud.update_example(db, db_obj=obj, obj_in=obj_in)

@router.delete("/examples/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_example(id: UUID, db: Session = Depends(get_db)):
    obj = crud.get_example(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Example not found")
    crud.remove_example(db, id=id)


# --- References ---

@router.get("/references", response_model=list[KnowledgeReferenceRead])
def read_references(
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000),
    concept_id: UUID | None = None, db: Session = Depends(get_db),
):
    return crud.get_references(db, skip=skip, limit=limit, concept_id=concept_id)

@router.get("/references/{id}", response_model=KnowledgeReferenceRead)
def read_reference(id: UUID, db: Session = Depends(get_db)):
    obj = crud.get_reference(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reference not found")
    return obj

@router.post("/references", response_model=KnowledgeReferenceRead, status_code=status.HTTP_201_CREATED)
def create_reference(obj_in: KnowledgeReferenceCreate, db: Session = Depends(get_db)):
    return crud.create_reference(db, obj_in=obj_in)

@router.put("/references/{id}", response_model=KnowledgeReferenceRead)
def update_reference(id: UUID, obj_in: KnowledgeReferenceUpdate, db: Session = Depends(get_db)):
    obj = crud.get_reference(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reference not found")
    return crud.update_reference(db, db_obj=obj, obj_in=obj_in)

@router.delete("/references/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reference(id: UUID, db: Session = Depends(get_db)):
    obj = crud.get_reference(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reference not found")
    crud.remove_reference(db, id=id)


# --- Sources ---

@router.get("/sources", response_model=list[KnowledgeSourceRead])
def read_sources(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000), db: Session = Depends(get_db)):
    return crud.get_sources(db, skip=skip, limit=limit)

@router.get("/sources/{id}", response_model=KnowledgeSourceRead)
def read_source(id: UUID, db: Session = Depends(get_db)):
    obj = crud.get_source(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return obj

@router.post("/sources", response_model=KnowledgeSourceRead, status_code=status.HTTP_201_CREATED)
def create_source(obj_in: KnowledgeSourceCreate, db: Session = Depends(get_db)):
    return crud.create_source(db, obj_in=obj_in)

@router.put("/sources/{id}", response_model=KnowledgeSourceRead)
def update_source(id: UUID, obj_in: KnowledgeSourceUpdate, db: Session = Depends(get_db)):
    obj = crud.get_source(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return crud.update_source(db, db_obj=obj, obj_in=obj_in)


# --- Search ---

@router.get("/search", response_model=list[KnowledgeSearchResult])
def search_knowledge(
    q: str = Query(..., min_length=1),
    category_id: UUID | None = None,
    tag_ids: str | None = None,
    difficulty: str | None = None,
    status: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    tag_uuid_list = None
    if tag_ids:
        try:
            tag_uuid_list = [UUID(t) for t in tag_ids.split(",")]
        except ValueError:
            pass
    return crud.search_concepts(
        db, q=q, category_id=category_id, tag_ids=tag_uuid_list,
        difficulty=difficulty, status=status, limit=limit, offset=offset,
    )


# --- Related Concepts ---

@router.get("/concepts/{id}/related", response_model=list[KnowledgeConceptRead])
def read_related_concepts(id: UUID, limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    return crud.get_related_concepts(db, id, limit=limit)


# --- Explorer (graph data) ---

@router.get("/explorer", response_model=KnowledgeExplorerResponse)
def read_explorer(concept_id: UUID | None = None, db: Session = Depends(get_db)):
    nodes, edges = crud.get_explorer_data(db, concept_id)
    return KnowledgeExplorerResponse(nodes=nodes, edges=edges)


# --- Revisions ---

@router.get("/revisions", response_model=list[KnowledgeRevisionRead])
def read_revisions(
    concept_id: UUID | None = None,
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return crud.get_revisions(db, concept_id=concept_id, skip=skip, limit=limit)

@router.post("/revisions", response_model=KnowledgeRevisionRead, status_code=status.HTTP_201_CREATED)
def create_revision(obj_in: KnowledgeRevisionCreate, db: Session = Depends(get_db)):
    return crud.create_revision(db, obj_in=obj_in)


# --- Dashboard Stats ---

@router.get("/stats")
def read_knowledge_stats(db: Session = Depends(get_db)):
    from sqlalchemy import select, func
    total_categories = db.scalar(select(func.count()).select_from(crud.KnowledgeCategory))
    total_concepts = db.scalar(select(func.count()).select_from(crud.KnowledgeConcept))
    total_relationships = db.scalar(select(func.count()).select_from(crud.KnowledgeRelationship))
    total_examples = db.scalar(select(func.count()).select_from(crud.KnowledgeExample))
    total_references = db.scalar(select(func.count()).select_from(crud.KnowledgeReference))
    return {
        "total_categories": total_categories or 0,
        "total_concepts": total_concepts or 0,
        "total_relationships": total_relationships or 0,
        "total_examples": total_examples or 0,
        "total_references": total_references or 0,
    }

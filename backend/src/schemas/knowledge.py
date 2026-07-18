from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional


class KnowledgeCategoryBase(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = 0

class KnowledgeCategoryCreate(KnowledgeCategoryBase):
    name: str
    slug: str

class KnowledgeCategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None

class KnowledgeCategoryRead(KnowledgeCategoryBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class KnowledgeTagBase(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

class KnowledgeTagCreate(KnowledgeTagBase):
    name: str

class KnowledgeTagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

class KnowledgeTagRead(KnowledgeTagBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class KnowledgeConceptBase(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    summary: Optional[str] = None
    definition: Optional[str] = None
    purpose: Optional[str] = None
    market_context: Optional[str] = None
    rules: Optional[dict] = None
    conditions: Optional[str] = None
    confirmations: Optional[str] = None
    invalidations: Optional[str] = None
    common_mistakes: Optional[str] = None
    best_practices: Optional[str] = None
    difficulty: Optional[str] = None
    confidence: Optional[float] = None
    status: Optional[str] = "draft"
    reviewed: Optional[bool] = False
    tag_ids: Optional[list[UUID]] = None

class KnowledgeConceptCreate(KnowledgeConceptBase):
    category_id: UUID
    title: str
    slug: str

class KnowledgeConceptUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    summary: Optional[str] = None
    definition: Optional[str] = None
    purpose: Optional[str] = None
    market_context: Optional[str] = None
    rules: Optional[dict] = None
    conditions: Optional[str] = None
    confirmations: Optional[str] = None
    invalidations: Optional[str] = None
    common_mistakes: Optional[str] = None
    best_practices: Optional[str] = None
    difficulty: Optional[str] = None
    confidence: Optional[float] = None
    status: Optional[str] = None
    reviewed: Optional[bool] = None
    tag_ids: Optional[list[UUID]] = None

class KnowledgeConceptRead(KnowledgeConceptBase):
    id: UUID
    category_id: UUID
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    tags: list[KnowledgeTagRead] = []
    model_config = ConfigDict(from_attributes=True)


class KnowledgeRelationshipBase(BaseModel):
    source_concept_id: Optional[UUID] = None
    target_concept_id: Optional[UUID] = None
    relationship_type: Optional[str] = None
    strength: Optional[float] = None
    confidence: Optional[float] = None
    description: Optional[str] = None

class KnowledgeRelationshipCreate(KnowledgeRelationshipBase):
    source_concept_id: UUID
    target_concept_id: UUID
    relationship_type: str

class KnowledgeRelationshipUpdate(BaseModel):
    relationship_type: Optional[str] = None
    strength: Optional[float] = None
    confidence: Optional[float] = None
    description: Optional[str] = None

class KnowledgeRelationshipRead(KnowledgeRelationshipBase):
    id: UUID
    created_at: datetime
    source_concept: Optional[KnowledgeConceptRead] = None
    target_concept: Optional[KnowledgeConceptRead] = None
    model_config = ConfigDict(from_attributes=True)


class KnowledgeExampleBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    market: Optional[str] = None
    pair: Optional[str] = None
    timeframe: Optional[str] = None
    image: Optional[str] = None
    notes: Optional[str] = None

class KnowledgeExampleCreate(KnowledgeExampleBase):
    concept_id: UUID
    title: str

class KnowledgeExampleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    market: Optional[str] = None
    pair: Optional[str] = None
    timeframe: Optional[str] = None
    image: Optional[str] = None
    notes: Optional[str] = None

class KnowledgeExampleRead(KnowledgeExampleBase):
    id: UUID
    concept_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class KnowledgeReferenceBase(BaseModel):
    source_type: Optional[str] = None
    title: Optional[str] = None
    author: Optional[str] = None
    publication: Optional[str] = None
    url: Optional[str] = None
    page_number: Optional[str] = None
    section: Optional[str] = None
    confidence: Optional[float] = None

class KnowledgeReferenceCreate(KnowledgeReferenceBase):
    concept_id: UUID
    source_type: str
    title: str

class KnowledgeReferenceUpdate(BaseModel):
    source_type: Optional[str] = None
    title: Optional[str] = None
    author: Optional[str] = None
    publication: Optional[str] = None
    url: Optional[str] = None
    page_number: Optional[str] = None
    section: Optional[str] = None
    confidence: Optional[float] = None

class KnowledgeReferenceRead(KnowledgeReferenceBase):
    id: UUID
    concept_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class KnowledgeSourceBase(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    path: Optional[str] = None
    checksum: Optional[str] = None

class KnowledgeSourceCreate(KnowledgeSourceBase):
    name: str
    type: str

class KnowledgeSourceUpdate(BaseModel):
    name: Optional[str] = None
    path: Optional[str] = None
    checksum: Optional[str] = None
    status: Optional[str] = None

class KnowledgeSourceRead(KnowledgeSourceBase):
    id: UUID
    status: str
    processed: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class KnowledgeChunkRead(BaseModel):
    id: UUID
    source_id: UUID
    chunk_index: int
    text: str
    token_count: Optional[int] = None
    processed: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class KnowledgeRevisionRead(BaseModel):
    id: UUID
    concept_id: UUID
    version: int
    changes: Optional[dict] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class KnowledgeRevisionCreate(BaseModel):
    concept_id: UUID
    version: int
    changes: Optional[dict] = None
    approved_by: Optional[str] = None


class KnowledgeSearchParams(BaseModel):
    q: str
    category_id: Optional[UUID] = None
    tag_ids: Optional[list[UUID]] = None
    difficulty: Optional[str] = None
    status: Optional[str] = None
    limit: int = 20
    offset: int = 0

class KnowledgeSearchResult(BaseModel):
    id: UUID
    title: str
    slug: str
    summary: Optional[str] = None
    category_name: Optional[str] = None
    difficulty: Optional[str] = None
    status: str
    match_type: str
    relevance: float


class KnowledgeExplorerNode(BaseModel):
    id: UUID
    title: str
    category_name: Optional[str] = None
    difficulty: Optional[str] = None

class KnowledgeExplorerEdge(BaseModel):
    source_id: UUID
    target_id: UUID
    relationship_type: str
    strength: Optional[float] = None

class KnowledgeExplorerResponse(BaseModel):
    nodes: list[KnowledgeExplorerNode]
    edges: list[KnowledgeExplorerEdge]

class KnowledgeConceptDetail(KnowledgeConceptRead):
    category: Optional[KnowledgeCategoryRead] = None
    relationships_outgoing: list[KnowledgeRelationshipRead] = []
    relationships_incoming: list[KnowledgeRelationshipRead] = []
    examples: list[KnowledgeExampleRead] = []
    references: list[KnowledgeReferenceRead] = []
    revisions: list[KnowledgeRevisionRead] = []

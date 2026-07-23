from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


# ── Vault ──

class VaultCreate(BaseModel):
    name: str
    path: str
    vault_type: str = "local"
    settings_json: dict | None = None
    api_key: str | None = None


class VaultUpdate(BaseModel):
    name: str | None = None
    path: str | None = None
    is_active: bool | None = None
    is_connected: bool | None = None
    settings_json: dict | None = None
    health_status: str | None = None
    health_message: str | None = None
    permission_level: str | None = None
    metadata_json: dict | None = None


class VaultRead(BaseModel):
    id: UUID
    created_at: datetime
    updated_at: datetime
    project_id: UUID
    name: str
    path: str
    vault_type: str
    is_active: bool
    is_connected: bool
    last_synced_at: datetime | None = None
    health_status: str
    health_message: str | None = None
    permission_level: str
    settings_json: dict | None = None
    metadata_json: dict | None = None
    model_config = {"from_attributes": True}


# ── Obsidian Note ──

class ObsidianNoteRead(BaseModel):
    id: UUID
    created_at: datetime
    updated_at: datetime
    vault_id: UUID
    project_id: UUID
    file_path: str
    file_name: str
    file_hash: str | None = None
    title: str | None = None
    content: str | None = None
    html_content: str | None = None
    frontmatter: dict | None = None
    tags: list | None = None
    aliases: list | None = None
    wiki_links: list | None = None
    backlinks: list | None = None
    embeds: list | None = None
    headings: list | None = None
    keywords: list | None = None
    concepts: list | None = None
    referenced_entities: list | None = None
    detected_dates: list | None = None
    detected_sessions: list | None = None
    detected_markets: list | None = None
    detected_pairs: list | None = None
    detected_timeframes: list | None = None
    sync_status: str
    sync_direction: str | None = None
    version: int
    is_deleted: bool
    last_synced_at: datetime | None = None
    note_type: str | None = None
    model_config = {"from_attributes": True}


class NoteImportRequest(BaseModel):
    vault_id: UUID
    file_paths: list[str] | None = None  # None = all files
    force: bool = False


class NoteExportRequest(BaseModel):
    vault_id: UUID
    note_ids: list[UUID] | None = None   # None = all notes
    folder_override: str | None = None


# ── Sync Log ──

class SyncLogRead(BaseModel):
    id: UUID
    created_at: datetime
    vault_id: UUID
    sync_type: str
    status: str
    direction: str
    files_processed: int
    files_imported: int
    files_exported: int
    files_conflicted: int
    files_skipped: int
    errors: list | None = None
    duration_ms: int | None = None
    trigger: str
    metadata_json: dict | None = None
    model_config = {"from_attributes": True}


# ── Sync Conflict ──

class SyncConflictRead(BaseModel):
    id: UUID
    created_at: datetime
    vault_id: UUID
    note_id: UUID | None = None
    file_path: str
    conflict_type: str
    local_version: int | None = None
    remote_version: int | None = None
    local_hash: str | None = None
    remote_hash: str | None = None
    local_content: str | None = None
    remote_content: str | None = None
    resolution: str | None = None
    resolved_at: datetime | None = None
    is_resolved: bool
    model_config = {"from_attributes": True}


class ConflictResolution(BaseModel):
    conflict_id: UUID
    resolution: str  # keep_local, keep_remote, merge, manual
    merged_content: str | None = None


# ── Sync Settings ──

class SyncSettingsUpdate(BaseModel):
    auto_sync: bool | None = None
    sync_frequency: str | None = None
    folder_mapping: dict | None = None
    ignored_folders: list | None = None
    ignored_files: list | None = None
    ignored_patterns: list | None = None
    conflict_policy: str | None = None
    backup_policy: str | None = None
    sync_attachments: bool | None = None
    sync_metadata: bool | None = None
    sync_templates: bool | None = None
    max_file_size_kb: int | None = None
    encrypt_sync: bool | None = None
    note_type_rules: dict | None = None


class SyncSettingsRead(BaseModel):
    id: UUID
    created_at: datetime
    updated_at: datetime
    vault_id: UUID
    auto_sync: bool
    sync_frequency: str
    folder_mapping: dict | None = None
    ignored_folders: list | None = None
    ignored_files: list | None = None
    ignored_patterns: list | None = None
    conflict_policy: str
    backup_policy: str
    sync_attachments: bool
    sync_metadata: bool
    sync_templates: bool
    max_file_size_kb: int
    encrypt_sync: bool
    note_type_rules: dict | None = None
    model_config = {"from_attributes": True}


# ── Vault Statistics ──

class VaultStatisticsRead(BaseModel):
    id: UUID
    created_at: datetime
    vault_id: UUID
    total_notes: int
    synced_notes: int
    pending_notes: int
    conflicted_notes: int
    deleted_notes: int
    total_size_kb: float
    total_tags: int
    total_wiki_links: int
    total_backlinks: int
    notes_by_type: dict | None = None
    notes_by_folder: dict | None = None
    top_tags: list | None = None
    last_full_sync: datetime | None = None
    last_incremental_sync: datetime | None = None
    model_config = {"from_attributes": True}


# ── Note Template ──

class NoteTemplateCreate(BaseModel):
    name: str
    template_type: str
    content: str
    description: str | None = None
    frontmatter_template: dict | None = None
    tags_template: list | None = None
    target_folder: str | None = None


class NoteTemplateRead(BaseModel):
    id: UUID
    created_at: datetime
    updated_at: datetime
    project_id: UUID
    name: str
    template_type: str
    content: str
    description: str | None = None
    frontmatter_template: dict | None = None
    tags_template: list | None = None
    is_active: bool
    use_count: int
    target_folder: str | None = None
    model_config = {"from_attributes": True}


# ── Aggregated ──

class SyncDashboardData(BaseModel):
    vaults: list[VaultRead] = []
    recent_syncs: list[SyncLogRead] = []
    active_conflicts: list[SyncConflictRead] = []
    total_notes: int = 0
    total_synced: int = 0
    total_pending: int = 0
    total_conflicts: int = 0


class VaultHealthCheck(BaseModel):
    vault_id: UUID
    is_connected: bool
    health_status: str
    health_message: str | None = None
    notes_count: int = 0
    last_sync: datetime | None = None


class SearchResult(BaseModel):
    result_type: str  # note, trade, strategy, journal, concept
    id: str
    title: str
    snippet: str | None = None
    source: str  # vault_name, "minore", etc.
    score: float = 0.0
    tags: list[str] = []
    path: str | None = None

from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, DateTime, Boolean, Integer, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base


class Vault(Base):
    """Obsidian vault registration and connection."""
    __tablename__ = "vault"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    project: Mapped["Project"] = relationship("Project")

    name: Mapped[str] = mapped_column(String, nullable=False)
    path: Mapped[str] = mapped_column(String, nullable=False)              # local filesystem path or vault ID
    vault_type: Mapped[str] = mapped_column(String, nullable=False, default="local")  # local, remote, cloud
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sync_token: Mapped[str | None] = mapped_column(String, nullable=True)  # incremental sync cursor
    settings_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # {auto_sync: bool, sync_freq: str, ignored_folders: [], ignored_files: [],
    #  conflict_policy: str, backup_policy: str, sync_attachments: bool, sync_metadata: bool}
    health_status: Mapped[str] = mapped_column(String, default="unknown")   # healthy, warning, error, unknown
    health_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    permission_level: Mapped[str] = mapped_column(String, default="read_write")  # read_only, read_write, admin
    api_key: Mapped[str | None] = mapped_column(String, nullable=True)      # for plugin auth
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class ObsidianNote(Base):
    """Individual Obsidian note synced from vault."""
    __tablename__ = "obsidian_note"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    vault_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("vault.id", ondelete="CASCADE"), nullable=False)
    vault: Mapped["Vault"] = relationship("Vault")
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    file_path: Mapped[str] = mapped_column(String, nullable=False)         # relative path in vault
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    file_hash: Mapped[str | None] = mapped_column(String, nullable=True)   # content hash for change detection
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)       # raw markdown
    html_content: Mapped[str | None] = mapped_column(Text, nullable=True)  # rendered HTML

    # Parsed metadata
    frontmatter: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True)        # ["tag1", "nested/tag2"]
    aliases: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    wiki_links: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # [{link_text, target_path}]
    backlinks: Mapped[list | None] = mapped_column(JSONB, nullable=True)   # [{source_path, link_text}]
    embeds: Mapped[list | None] = mapped_column(JSONB, nullable=True)      # [{type, path, alt}]

    # Smart index
    headings: Mapped[list | None] = mapped_column(JSONB, nullable=True)    # [{level, text}]
    keywords: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    concepts: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    referenced_entities: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # [{type, id, context}]
    detected_dates: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    detected_sessions: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    detected_markets: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    detected_pairs: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    detected_timeframes: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Sync state
    sync_status: Mapped[str] = mapped_column(String, default="synced")     # synced, pending, conflict, deleted
    sync_direction: Mapped[str | None] = mapped_column(String, nullable=True)  # import, export, bidirectional
    version: Mapped[int] = mapped_column(Integer, default=1)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    note_type: Mapped[str | None] = mapped_column(String, nullable=True)   # trade_review, journal, strategy, research, template


class SyncLog(Base):
    """Sync operation history."""
    __tablename__ = "sync_log"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    vault_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("vault.id", ondelete="CASCADE"), nullable=False)

    sync_type: Mapped[str] = mapped_column(String, nullable=False)         # import, export, full, incremental
    status: Mapped[str] = mapped_column(String, nullable=False, default="running")  # running, completed, failed, partial
    direction: Mapped[str] = mapped_column(String, nullable=False)         # inbound, outbound, bidirectional
    files_processed: Mapped[int] = mapped_column(Integer, default=0)
    files_imported: Mapped[int] = mapped_column(Integer, default=0)
    files_exported: Mapped[int] = mapped_column(Integer, default=0)
    files_conflicted: Mapped[int] = mapped_column(Integer, default=0)
    files_skipped: Mapped[int] = mapped_column(Integer, default=0)
    errors: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    trigger: Mapped[str] = mapped_column(String, default="manual")         # manual, auto, plugin
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class SyncConflict(Base):
    """Conflict resolution tracking."""
    __tablename__ = "sync_conflict"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    vault_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("vault.id", ondelete="CASCADE"), nullable=False)
    note_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("obsidian_note.id", ondelete="SET NULL"), nullable=True)

    file_path: Mapped[str] = mapped_column(String, nullable=False)
    conflict_type: Mapped[str] = mapped_column(String, nullable=False)     # content_mismatch, delete_modify, create_conflict
    local_version: Mapped[int] = mapped_column(Integer, nullable=True)
    remote_version: Mapped[int] = mapped_column(Integer, nullable=True)
    local_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    remote_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    local_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    remote_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolution: Mapped[str | None] = mapped_column(String, nullable=True)  # keep_local, keep_remote, merge, manual
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)


class SyncSettings(Base):
    """Per-vault sync configuration."""
    __tablename__ = "sync_settings"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    vault_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("vault.id", ondelete="CASCADE"), nullable=False, unique=True)

    auto_sync: Mapped[bool] = mapped_column(Boolean, default=True)
    sync_frequency: Mapped[str] = mapped_column(String, default="realtime")  # realtime, hourly, daily, manual
    folder_mapping: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # {trades: "Trading/Trades", journals: "Journal", strategies: "Strategies", ...}
    ignored_folders: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    ignored_files: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    ignored_patterns: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # glob patterns
    conflict_policy: Mapped[str] = mapped_column(String, default="ask")    # ask, keep_local, keep_remote, auto_merge
    backup_policy: Mapped[str] = mapped_column(String, default="keep_3")   # keep_1, keep_3, keep_10, keep_all
    sync_attachments: Mapped[bool] = mapped_column(Boolean, default=True)
    sync_metadata: Mapped[bool] = mapped_column(Boolean, default=True)
    sync_templates: Mapped[bool] = mapped_column(Boolean, default=True)
    max_file_size_kb: Mapped[int] = mapped_column(Integer, default=5120)   # 5MB
    encrypt_sync: Mapped[bool] = mapped_column(Boolean, default=False)
    note_type_rules: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # {folder_pattern: note_type} e.g. {"Trading/Reviews/*": "trade_review"}


class VaultStatistics(Base):
    """Vault sync statistics snapshot."""
    __tablename__ = "vault_statistics"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    vault_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("vault.id", ondelete="CASCADE"), nullable=False)

    total_notes: Mapped[int] = mapped_column(Integer, default=0)
    synced_notes: Mapped[int] = mapped_column(Integer, default=0)
    pending_notes: Mapped[int] = mapped_column(Integer, default=0)
    conflicted_notes: Mapped[int] = mapped_column(Integer, default=0)
    deleted_notes: Mapped[int] = mapped_column(Integer, default=0)
    total_size_kb: Mapped[float] = mapped_column(Float, default=0)
    total_tags: Mapped[int] = mapped_column(Integer, default=0)
    total_wiki_links: Mapped[int] = mapped_column(Integer, default=0)
    total_backlinks: Mapped[int] = mapped_column(Integer, default=0)
    notes_by_type: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # {trade_review: 50, journal: 120, ...}
    notes_by_folder: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    top_tags: Mapped[list | None] = mapped_column(JSONB, nullable=True)    # [{tag, count}]
    last_full_sync: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_incremental_sync: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class NoteTemplate(Base):
    """Reusable note templates for Obsidian."""
    __tablename__ = "note_template"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    template_type: Mapped[str] = mapped_column(String, nullable=False)     # trade_review, daily_journal, weekly_review, monthly_review,
                                                                          # strategy, research, psychology, market_prep, post_market
    content: Mapped[str] = mapped_column(Text, nullable=False)             # markdown template with placeholders
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    frontmatter_template: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tags_template: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    use_count: Mapped[int] = mapped_column(Integer, default=0)
    target_folder: Mapped[str | None] = mapped_column(String, nullable=True)

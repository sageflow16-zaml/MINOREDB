from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services import obsidian
from src.schemas.obsidian import (
    VaultCreate, VaultUpdate, NoteImportRequest, NoteExportRequest,
    SyncSettingsUpdate, ConflictResolution, NoteTemplateCreate,
)
from src.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception as exc:
        logger.error("Obsidian query failed: %s", exc)
        raise HTTPException(status_code=500, detail="Operation failed")


# ── Vaults ──

@router.get("/vaults")
def list_vaults(project_id: UUID, db: Session = Depends(get_db)):
    return _safe(obsidian.get_vaults, db, project_id)


@router.get("/vaults/{vault_id}")
def get_vault(project_id: UUID, vault_id: UUID, db: Session = Depends(get_db)):
    result = _safe(obsidian.get_vault, db, vault_id)
    if not result: raise HTTPException(404, "Vault not found")
    return result


@router.post("/vaults")
def create_vault(project_id: UUID, body: VaultCreate, db: Session = Depends(get_db)):
    return _safe(obsidian.create_vault, db, project_id, body.model_dump())


@router.put("/vaults/{vault_id}")
def update_vault(project_id: UUID, vault_id: UUID, body: VaultUpdate, db: Session = Depends(get_db)):
    result = _safe(obsidian.update_vault, db, vault_id, body.model_dump(exclude_unset=True))
    if not result: raise HTTPException(404, "Vault not found")
    return result


@router.delete("/vaults/{vault_id}")
def delete_vault(project_id: UUID, vault_id: UUID, db: Session = Depends(get_db)):
    if not _safe(obsidian.delete_vault, db, vault_id): raise HTTPException(404, "Vault not found")
    return {"ok": True}


@router.get("/vaults/{vault_id}/health")
def check_health(project_id: UUID, vault_id: UUID, db: Session = Depends(get_db)):
    return _safe(obsidian.check_vault_health, db, vault_id)


# ── Notes ──

@router.get("/notes")
def list_notes(project_id: UUID, vault_id: UUID | None = None, note_type: str = None, limit: int = 100, db: Session = Depends(get_db)):
    return _safe(obsidian.get_notes, db, vault_id, note_type, limit)


@router.get("/notes/{note_id}")
def get_note(project_id: UUID, note_id: UUID, db: Session = Depends(get_db)):
    result = _safe(obsidian.get_note, db, note_id)
    if not result: raise HTTPException(404, "Note not found")
    return result


@router.put("/notes/{note_id}/content")
def update_content(project_id: UUID, note_id: UUID, content: str, db: Session = Depends(get_db)):
    result = _safe(obsidian.update_note_content, db, note_id, content)
    if not result: raise HTTPException(404, "Note not found")
    return result


@router.delete("/notes/{note_id}")
def delete_note(project_id: UUID, note_id: UUID, db: Session = Depends(get_db)):
    if not _safe(obsidian.delete_note, db, note_id): raise HTTPException(404, "Note not found")
    return {"ok": True}


@router.get("/notes/{note_id}/backlinks")
def get_backlinks(project_id: UUID, note_id: UUID, db: Session = Depends(get_db)):
    return _safe(obsidian.get_backlinks, db, note_id)


@router.post("/notes/parse")
def parse_note_markdown(content: str):
    return obsidian.parse_markdown(content)


# ── Sync ──

@router.post("/sync/import")
def sync_import(project_id: UUID, body: NoteImportRequest, db: Session = Depends(get_db)):
    return _safe(obsidian.import_notes, db, body.vault_id, [{"file_path": fp, "content": ""} for fp in (body.file_paths or [])], body.force)


@router.post("/sync/import-data")
def sync_import_data(project_id: UUID, vault_id: UUID, notes: list[dict], db: Session = Depends(get_db)):
    return _safe(obsidian.import_notes, db, vault_id, notes)


@router.post("/sync/export")
def sync_export(project_id: UUID, body: NoteExportRequest, db: Session = Depends(get_db)):
    return _safe(obsidian.export_notes, db, body.vault_id, body.note_ids)


@router.get("/sync/logs")
def sync_logs(project_id: UUID, vault_id: UUID, limit: int = 20, db: Session = Depends(get_db)):
    return _safe(obsidian.get_sync_logs, db, vault_id, limit)


@router.post("/sync/auto-link")
def auto_link(project_id: UUID, vault_id: UUID = None, db: Session = Depends(get_db)):
    count = _safe(obsidian.auto_link_entities, db, project_id, vault_id)
    return {"linked": count}


@router.post("/sync/knowledge-links")
def knowledge_links(project_id: UUID, db: Session = Depends(get_db)):
    count = _safe(obsidian.create_knowledge_links, db, project_id)
    return {"created": count}


# ── Conflicts ──

@router.get("/conflicts")
def list_conflicts(project_id: UUID, vault_id: UUID, db: Session = Depends(get_db)):
    return _safe(obsidian.get_conflicts, db, vault_id)


@router.post("/conflicts/resolve")
def resolve(project_id: UUID, body: ConflictResolution, db: Session = Depends(get_db)):
    result = _safe(obsidian.resolve_conflict, db, body.conflict_id, body.resolution, body.merged_content)
    if not result: raise HTTPException(404, "Conflict not found")
    return result


# ── Settings ──

@router.get("/settings")
def get_settings(project_id: UUID, vault_id: UUID | None = None, db: Session = Depends(get_db)):
    return _safe(obsidian.get_sync_settings, db, vault_id)


@router.put("/settings")
def update_settings(project_id: UUID, body: SyncSettingsUpdate, vault_id: UUID | None = None, db: Session = Depends(get_db)):
    return _safe(obsidian.update_sync_settings, db, vault_id, body.model_dump(exclude_unset=True))


# ── Statistics ──

@router.get("/statistics")
def get_statistics(project_id: UUID, vault_id: UUID | None = None, db: Session = Depends(get_db)):
    return _safe(obsidian.get_vault_statistics, db, vault_id)


# ── Templates ──

@router.get("/templates")
def list_templates(project_id: UUID, template_type: str = None, db: Session = Depends(get_db)):
    return _safe(obsidian.get_templates, db, project_id, template_type)


@router.post("/templates")
def create_template(project_id: UUID, body: NoteTemplateCreate, db: Session = Depends(get_db)):
    return _safe(obsidian.create_template, db, project_id, body.model_dump())


@router.delete("/templates/{template_id}")
def delete_template(project_id: UUID, template_id: UUID, db: Session = Depends(get_db)):
    if not _safe(obsidian.delete_template, db, template_id): raise HTTPException(404, "Template not found")
    return {"ok": True}


@router.post("/templates/{template_id}/render")
def render_template(project_id: UUID, template_id: UUID, context: dict = None, db: Session = Depends(get_db)):
    result = _safe(obsidian.render_template, db, template_id, context)
    if not result: raise HTTPException(404, "Template not found")
    return {"content": result}


# ── Search ──

@router.get("/search")
def search(project_id: UUID, q: str, limit: int = 20, db: Session = Depends(get_db)):
    return _safe(obsidian.search_all, db, project_id, q, limit)


# ── Dashboard ──

@router.get("/dashboard")
def sync_dashboard(project_id: UUID, db: Session = Depends(get_db)):
    return _safe(obsidian.get_sync_dashboard, db, project_id)

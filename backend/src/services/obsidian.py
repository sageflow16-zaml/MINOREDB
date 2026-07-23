"""
Obsidian Integration Services — Vault management, sync engine, markdown parser,
knowledge graph sync, entity linking, smart indexer, search, conflict resolution.
"""
import hashlib
import re
from uuid import UUID, uuid4
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from src.models.obsidian import (
    Vault, ObsidianNote, SyncLog, SyncConflict, SyncSettings,
    VaultStatistics, NoteTemplate,
)
from src.models.trade import Trade
from src.models.strategy import Strategy
from src.models.knowledge_rule import KnowledgeRule
from src.models.ai_foundation import KnowledgeLink


# ═══════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════

def _dict(obj):
    if obj is None: return None
    return {attr.key: getattr(obj, attr.key) for attr in obj.__mapper__.attrs if hasattr(attr, 'columns')}

def _now(): return datetime.utcnow()
def _today(): return _now().strftime("%Y-%m-%d")
def _hash(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()[:32]


# ═══════════════════════════════════════════════════════
# VAULT MANAGEMENT
# ═══════════════════════════════════════════════════════

def get_vaults(db: Session, project_id: UUID) -> list[dict]:
    return [_dict(v) for v in db.query(Vault).filter(Vault.project_id == project_id).order_by(Vault.name).all()]


def get_vault(db: Session, vault_id: UUID) -> dict | None:
    return _dict(db.query(Vault).filter(Vault.id == vault_id).first())


def create_vault(db: Session, project_id: UUID, data: dict) -> dict:
    v = Vault(project_id=project_id, **data)
    db.add(v)
    db.flush()
    # Create default sync settings
    settings = SyncSettings(vault_id=v.id)
    db.add(settings)
    db.commit()
    db.refresh(v)
    return _dict(v)


def update_vault(db: Session, vault_id: UUID, data: dict) -> dict | None:
    v = db.query(Vault).filter(Vault.id == vault_id).first()
    if not v: return None
    for k, val in data.items():
        if val is not None and hasattr(v, k):
            setattr(v, k, val)
    v.updated_at = _now()
    db.commit()
    db.refresh(v)
    return _dict(v)


def delete_vault(db: Session, vault_id: UUID) -> bool:
    v = db.query(Vault).filter(Vault.id == vault_id).first()
    if not v: return False
    db.delete(v)
    db.commit()
    return True


def check_vault_health(db: Session, vault_id: UUID) -> dict:
    v = db.query(Vault).filter(Vault.id == vault_id).first()
    if not v:
        return {"vault_id": vault_id, "is_connected": False, "health_status": "error", "health_message": "Vault not found"}
    notes_count = db.query(func.count(ObsidianNote.id)).filter(ObsidianNote.vault_id == vault_id, ObsidianNote.is_deleted == False).scalar()
    return {
        "vault_id": vault_id, "is_connected": v.is_connected,
        "health_status": v.health_status, "health_message": v.health_message,
        "notes_count": notes_count, "last_sync": v.last_synced_at,
    }


# ═══════════════════════════════════════════════════════
# SYNC ENGINE
# ═══════════════════════════════════════════════════════

def import_notes(db: Session, vault_id: UUID, notes_data: list[dict], force: bool = False) -> dict:
    """Import notes from Obsidian into Minore."""
    vault = db.query(Vault).filter(Vault.id == vault_id).first()
    if not vault:
        return {"status": "error", "message": "Vault not found"}

    log = SyncLog(vault_id=vault_id, sync_type="import", direction="inbound", trigger="manual", status="running")
    db.add(log)
    db.flush()

    imported = 0
    conflicted = 0
    skipped = 0
    errors = []

    for nd in notes_data:
        try:
            file_path = nd.get("file_path", "")
            content = nd.get("content", "")
            content_hash = _hash(content)

            existing = db.query(ObsidianNote).filter(
                ObsidianNote.vault_id == vault_id, ObsidianNote.file_path == file_path
            ).first()

            if existing:
                if existing.file_hash == content_hash and not force:
                    skipped += 1
                    continue
                if existing.file_hash != content_hash:
                    # Conflict
                    conflict = SyncConflict(
                        vault_id=vault_id, note_id=existing.id, file_path=file_path,
                        conflict_type="content_mismatch",
                        local_version=existing.version, remote_version=existing.version + 1,
                        local_hash=existing.file_hash, remote_hash=content_hash,
                        local_content=existing.content, remote_content=content,
                    )
                    db.add(conflict)
                    conflicted += 1
                    continue
                # Force update
                _update_note(existing, nd, vault.project_id)
                imported += 1
            else:
                note = ObsidianNote(vault_id=vault_id, project_id=vault.project_id)
                _update_note(note, nd, vault.project_id)
                db.add(note)
                imported += 1
        except Exception as e:
            errors.append({"file": nd.get("file_path", "?"), "error": str(e)})

    log.files_processed = len(notes_data)
    log.files_imported = imported
    log.files_conflicted = conflicted
    log.files_skipped = skipped
    log.errors = errors
    log.status = "completed" if not errors else "partial"
    log.duration_ms = int((_now() - log.created_at).total_seconds() * 1000)

    vault.last_synced_at = _now()
    vault.sync_token = _now().isoformat()
    db.commit()

    return {"status": log.status, "imported": imported, "conflicted": conflicted, "skipped": skipped, "errors": len(errors)}


def export_notes(db: Session, vault_id: UUID, note_ids: list[UUID] = None) -> dict:
    """Export Minore notes to Obsidian format."""
    vault = db.query(Vault).filter(Vault.id == vault_id).first()
    if not vault:
        return {"status": "error", "message": "Vault not found"}

    q = db.query(ObsidianNote).filter(ObsidianNote.vault_id == vault_id, ObsidianNote.is_deleted == False)
    if note_ids:
        q = q.filter(ObsidianNote.id.in_(note_ids))
    notes = q.all()

    log = SyncLog(vault_id=vault_id, sync_type="export", direction="outbound", trigger="manual", status="running")
    db.add(log)

    exported = 0
    for note in notes:
        note.sync_status = "synced"
        note.last_synced_at = _now()
        note.version += 1
        exported += 1

    log.files_exported = exported
    log.status = "completed"
    log.duration_ms = 0
    vault.last_synced_at = _now()
    db.commit()

    return {"status": "completed", "exported": exported}


def get_sync_logs(db: Session, vault_id: UUID, limit: int = 20) -> list[dict]:
    return [_dict(l) for l in db.query(SyncLog).filter(SyncLog.vault_id == vault_id).order_by(SyncLog.created_at.desc()).limit(limit).all()]


def _update_note(note: ObsidianNote, data: dict, project_id: UUID):
    note.file_path = data.get("file_path", note.file_path)
    note.file_name = data.get("file_name", data.get("file_path", "").split("/")[-1])
    note.content = data.get("content", note.content)
    note.file_hash = _hash(data.get("content", ""))
    note.title = data.get("title") or _extract_title(data.get("content", ""))
    note.frontmatter = data.get("frontmatter")
    note.tags = data.get("tags")
    note.aliases = data.get("aliases")
    note.wiki_links = data.get("wiki_links")
    note.backlinks = data.get("backlinks")
    note.embeds = data.get("embeds")
    note.sync_status = "synced"
    note.last_synced_at = _now()
    note.version += 1
    note.project_id = project_id
    # Auto-index
    _index_note(note)


def _extract_title(content: str) -> str | None:
    m = re.search(r'^#\s+(.+)', content, re.MULTILINE)
    if m: return m.group(1).strip()
    return None


# ═══════════════════════════════════════════════════════
# MARKDOWN ENGINE
# ═══════════════════════════════════════════════════════

def parse_markdown(content: str) -> dict:
    """Parse Obsidian-flavored markdown into structured data."""
    if not content:
        return {}

    headings = []
    for m in re.finditer(r'^(#{1,6})\s+(.+)', content, re.MULTILINE):
        headings.append({"level": len(m.group(1)), "text": m.group(2).strip()})

    # Wiki links [[target]] or [[target|display]]
    wiki_links = []
    for m in re.finditer(r'\[\[([^\]|]+)(?:\|([^\]]+))?\]\]', content):
        wiki_links.append({"target": m.group(1).strip(), "display": (m.group(2) or m.group(1)).strip()})

    # Tags #tag or #nested/tag
    tags = list(set(re.findall(r'(?<!\w)#([a-zA-Z][\w/]*(?:/[\w]+)*)', content)))

    # Embeds ![[file]] or ![[file|width]]
    embeds = []
    for m in re.finditer(r'!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]', content):
        embeds.append({"type": "obsidian", "path": m.group(1).strip(), "options": m.group(2)})

    # Standard images ![alt](url)
    for m in re.finditer(r'!\[([^\]]*)\]\(([^)]+)\)', content):
        embeds.append({"type": "image", "path": m.group(2), "alt": m.group(1)})

    # Callouts > [!type] content
    callouts = []
    for m in re.finditer(r'>\s*\[!([a-z]+)\]\s*(.*?)(?=\n(?:>\s*(?!>)|\n\n|\n[^>]))', content, re.DOTALL | re.IGNORECASE):
        callouts.append({"type": m.group(1), "content": m.group(2).strip()})

    # Code blocks
    code_blocks = []
    for m in re.finditer(r'```(\w*)\n(.*?)```', content, re.DOTALL):
        code_blocks.append({"language": m.group(1), "content": m.group(2).strip()})

    # Footnotes
    footnotes = re.findall(r'\[\^(\d+)\]:\s*(.+)', content)

    # Math blocks
    math = re.findall(r'\$\$(.+?)\$\$', content, re.DOTALL)

    # Mermaid
    mermaid = []
    for m in re.finditer(r'```mermaid\n(.*?)```', content, re.DOTALL):
        mermaid.append(m.group(1).strip())

    return {
        "headings": headings,
        "wiki_links": wiki_links,
        "tags": tags,
        "embeds": embeds,
        "callouts": callouts,
        "code_blocks": code_blocks,
        "footnotes": footnotes,
        "math": math,
        "mermaid": mermaid,
    }


def markdown_to_html(content: str) -> str:
    """Basic markdown to HTML conversion."""
    if not content: return ""
    html = content
    # Headers
    for i in range(6, 0, -1):
        html = re.sub(r'^' + '#' * i + r'\s+(.+)$', f'<h{i}>\\1</h{i}>', html, flags=re.MULTILINE)
    # Bold, italic
    html = re.sub(r'\*\*\*(.+?)\*\*\*', r'<strong><em>\1</em></strong>', html)
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)
    # Code
    html = re.sub(r'`([^`]+)`', r'<code>\1</code>', html)
    # Links
    html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', html)
    # Wiki links to anchors
    html = re.sub(r'\[\[([^\]|]+)(?:\|([^\]]+))?\]\]', r'<a class="wiki-link" href="#">\2</a>', html)
    # Line breaks
    html = re.sub(r'\n\n', '</p><p>', html)
    return f'<p>{html}</p>'


# ═══════════════════════════════════════════════════════
# SMART INDEXER
# ═══════════════════════════════════════════════════════

def _index_note(note: ObsidianNote):
    """Extract metadata from note content for smart indexing."""
    content = note.content or ""
    parsed = parse_markdown(content)

    note.headings = parsed.get("headings")
    note.wiki_links = parsed.get("wiki_links")
    note.tags = parsed.get("tags")
    note.embeds = parsed.get("embeds")

    # Extract keywords (words > 4 chars, not common)
    words = re.findall(r'\b[a-zA-Z]{5,}\b', content.lower())
    stop = {'about', 'after', 'again', 'being', 'below', 'between', 'could', 'every', 'first', 'found', 'great',
            'house', 'large', 'later', 'never', 'night', 'place', 'point', 'right', 'small', 'sound', 'still',
            'their', 'there', 'these', 'thing', 'think', 'three', 'under', 'until', 'using', 'water', 'where',
            'which', 'while', 'world', 'would', 'write', 'years'}
    freq = {}
    for w in words:
        if w not in stop:
            freq[w] = freq.get(w, 0) + 1
    note.keywords = sorted(freq.keys(), key=lambda x: freq[x], reverse=True)[:20]

    # Detect dates
    note.detected_dates = list(set(re.findall(r'\b\d{4}-\d{2}-\d{2}\b', content)))
    note.detected_dates = note.detected_dates[:10]

    # Detect sessions
    sessions = set()
    for s in ['london', 'new york', 'newyork', 'asian', 'tokyo', 'sydney']:
        if s in content.lower():
            sessions.add(s.replace(' ', ''))
    note.detected_sessions = list(sessions)

    # Detect markets
    markets = set()
    for m in ['forex', 'crypto', 'stocks', 'futures', 'indices', 'commodities', 'gold', 'oil']:
        if m in content.lower():
            markets.add(m)
    note.detected_markets = list(markets)

    # Detect pairs
    pairs = set()
    for p in re.findall(r'\b([A-Z]{6})\b', content):
        if p.isalpha() and p.upper() == p:
            pairs.add(p)
    note.detected_pairs = list(pairs)[:10]

    # Detect timeframes
    tfs = set()
    for tf in re.findall(r'\b(M[15]|M30|H[1-4]|D[1-5]|W[1-4]|MN)\b', content):
        tfs.add(tf)
    note.detected_timeframes = list(tfs)

    # Concepts (tag-like terms)
    note.concepts = [t for t in (note.tags or []) if '/' in t][:20]


# ═══════════════════════════════════════════════════════
# ENTITY LINKING
# ═══════════════════════════════════════════════════════

def auto_link_entities(db: Session, project_id: UUID, note_id: UUID = None) -> int:
    """Auto-detect and link entities referenced in notes."""
    q = db.query(ObsidianNote).filter(ObsidianNote.project_id == project_id, ObsidianNote.is_deleted == False)
    if note_id:
        q = q.filter(ObsidianNote.id == note_id)
    notes = q.all()
    count = 0

    for note in notes:
        content = (note.content or "").lower()
        refs = []

        # Detect trade references
        trades = db.query(Trade).filter(Trade.project_id == project_id).limit(100).all()
        for t in trades:
            tid = str(t.id)[:8]
            if tid in content or (t.pair and t.pair.lower() in content):
                refs.append({"type": "trade", "id": str(t.id), "context": t.pair or "referenced"})

        # Detect strategy references
        strats = db.query(Strategy).filter(Strategy.project_id == project_id).limit(50).all()
        for s in strats:
            if s.name and s.name.lower() in content:
                refs.append({"type": "strategy", "id": str(s.id), "context": s.name})

        if refs:
            note.referenced_entities = refs[:20]
            count += 1

    db.commit()
    return count


def create_knowledge_links(db: Session, project_id: UUID) -> int:
    """Create KnowledgeLink entries from note entity references."""
    notes = db.query(ObsidianNote).filter(
        ObsidianNote.project_id == project_id, ObsidianNote.is_deleted == False
    ).all()
    count = 0

    for note in notes:
        for ref in (note.referenced_entities or []):
            exists = db.query(KnowledgeLink).filter(
                KnowledgeLink.project_id == project_id,
                KnowledgeLink.source_type == "obsidian_note",
                KnowledgeLink.source_id == note.id,
                KnowledgeLink.target_type == ref["type"],
                KnowledgeLink.target_id == UUID(ref["id"]),
            ).first()
            if not exists:
                db.add(KnowledgeLink(
                    project_id=project_id,
                    source_type="obsidian_note", source_id=note.id,
                    target_type=ref["type"], target_id=UUID(ref["id"]),
                    relationship="references",
                ))
                count += 1

    db.commit()
    return count


# ═══════════════════════════════════════════════════════
# CONFLICT RESOLUTION
# ═══════════════════════════════════════════════════════

def get_conflicts(db: Session, vault_id: UUID, unresolved_only: bool = True) -> list[dict]:
    q = db.query(SyncConflict).filter(SyncConflict.vault_id == vault_id)
    if unresolved_only:
        q = q.filter(SyncConflict.is_resolved == False)
    return [_dict(c) for c in q.order_by(SyncConflict.created_at.desc()).all()]


def resolve_conflict(db: Session, conflict_id: UUID, resolution: str, merged_content: str = None) -> dict:
    c = db.query(SyncConflict).filter(SyncConflict.id == conflict_id).first()
    if not c: return None

    c.resolution = resolution
    c.resolved_at = _now()
    c.is_resolved = True

    note = db.query(ObsidianNote).filter(ObsidianNote.id == c.note_id).first() if c.note_id else None
    if note:
        if resolution == "keep_local":
            note.content = c.local_content
        elif resolution == "keep_remote":
            note.content = c.remote_content
        elif resolution == "merge" and merged_content:
            note.content = merged_content
        note.file_hash = _hash(note.content or "")
        note.version += 1
        note.sync_status = "synced"

    db.commit()
    return _dict(c)


# ═══════════════════════════════════════════════════════
# SYNC SETTINGS
# ═══════════════════════════════════════════════════════

def get_sync_settings(db: Session, vault_id: UUID | None) -> dict | None:
    if vault_id is None:
        return None
    s = db.query(SyncSettings).filter(SyncSettings.vault_id == vault_id).first()
    if not s:
        s = SyncSettings(vault_id=vault_id)
        db.add(s)
        db.commit()
        db.refresh(s)
    return _dict(s)


def update_sync_settings(db: Session, vault_id: UUID, data: dict) -> dict:
    s = db.query(SyncSettings).filter(SyncSettings.vault_id == vault_id).first()
    if not s:
        s = SyncSettings(vault_id=vault_id)
        db.add(s)
    for k, v in data.items():
        if v is not None and hasattr(s, k):
            setattr(s, k, v)
    s.updated_at = _now()
    db.commit()
    db.refresh(s)
    return _dict(s)


# ═══════════════════════════════════════════════════════
# VAULT STATISTICS
# ═══════════════════════════════════════════════════════

def get_vault_statistics(db: Session, vault_id: UUID | None) -> dict | None:
    if vault_id is None:
        return None
    existing = db.query(VaultStatistics).filter(VaultStatistics.vault_id == vault_id).first()
    if existing:
        return _dict(existing)

    # Compute fresh
    notes = db.query(ObsidianNote).filter(ObsidianNote.vault_id == vault_id).all()
    total = len(notes)
    synced = sum(1 for n in notes if n.sync_status == "synced")
    pending = sum(1 for n in notes if n.sync_status == "pending")
    conflicted = sum(1 for n in notes if n.sync_status == "conflict")
    deleted = sum(1 for n in notes if n.is_deleted)
    size_kb = sum(len((n.content or "").encode()) / 1024 for n in notes)

    all_tags = {}
    for n in notes:
        for t in (n.tags or []):
            all_tags[t] = all_tags.get(t, 0) + 1

    by_type = {}
    by_folder = {}
    for n in notes:
        nt = n.note_type or "unclassified"
        by_type[nt] = by_type.get(nt, 0) + 1
        folder = "/".join(n.file_path.split("/")[:-1]) or "/"
        by_folder[folder] = by_folder.get(folder, 0) + 1

    stats = VaultStatistics(
        vault_id=vault_id, total_notes=total, synced_notes=synced,
        pending_notes=pending, conflicted_notes=conflicted, deleted_notes=deleted,
        total_size_kb=round(size_kb, 1),
        total_tags=len(all_tags),
        total_wiki_links=sum(len(n.wiki_links or []) for n in notes),
        total_backlinks=sum(len(n.backlinks or []) for n in notes),
        notes_by_type=by_type, notes_by_folder=by_folder,
        top_tags=[{"tag": t, "count": c} for t, c in sorted(all_tags.items(), key=lambda x: x[1], reverse=True)[:20]],
    )
    db.add(stats)
    db.commit()
    db.refresh(stats)
    return _dict(stats)


# ═══════════════════════════════════════════════════════
# NOTE TEMPLATES
# ═══════════════════════════════════════════════════════

def get_templates(db: Session, project_id: UUID, template_type: str = None) -> list[dict]:
    q = db.query(NoteTemplate).filter(NoteTemplate.project_id == project_id, NoteTemplate.is_active == True)
    if template_type:
        q = q.filter(NoteTemplate.template_type == template_type)
    return [_dict(t) for t in q.order_by(NoteTemplate.name).all()]


def create_template(db: Session, project_id: UUID, data: dict) -> dict:
    t = NoteTemplate(project_id=project_id, **data)
    db.add(t)
    db.commit()
    db.refresh(t)
    return _dict(t)


def delete_template(db: Session, template_id: UUID) -> bool:
    t = db.query(NoteTemplate).filter(NoteTemplate.id == template_id).first()
    if not t: return False
    db.delete(t)
    db.commit()
    return True


def render_template(db: Session, template_id: UUID, context: dict = None) -> str | None:
    t = db.query(NoteTemplate).filter(NoteTemplate.id == template_id).first()
    if not t: return None
    t.use_count += 1
    db.commit()
    content = t.content
    if context:
        for k, v in context.items():
            content = content.replace("{{" + k + "}}", str(v))
    return content


# ═══════════════════════════════════════════════════════
# UNIFIED SEARCH
# ═══════════════════════════════════════════════════════

def search_all(db: Session, project_id: UUID, query: str, limit: int = 20) -> list[dict]:
    """Search across Minore database and Obsidian notes."""
    results = []
    q = f"%{query.lower()}%"

    # Search notes
    notes = db.query(ObsidianNote).filter(
        ObsidianNote.project_id == project_id, ObsidianNote.is_deleted == False,
        or_(
            ObsidianNote.title.ilike(q),
            ObsidianNote.content.ilike(q),
            ObsidianNote.file_name.ilike(q),
        )
    ).limit(limit).all()
    for n in notes:
        snippet = (n.content or "")[:200]
        results.append({"result_type": "note", "id": str(n.id), "title": n.title or n.file_name,
                        "snippet": snippet, "source": "obsidian", "tags": n.tags or [], "path": n.file_path})

    # Search trades
    trades = db.query(Trade).filter(Trade.project_id == project_id).limit(50).all()
    for t in trades:
        searchable = f"{t.pair or ''} {t.notes or ''} {t.emotion or ''}".lower()
        if query.lower() in searchable:
            results.append({"result_type": "trade", "id": str(t.id), "title": f"Trade {t.pair or 'unknown'}",
                            "snippet": (t.notes or "")[:200], "source": "minore", "tags": []})

    # Search strategies
    strats = db.query(Strategy).filter(Strategy.project_id == project_id).all()
    for s in strats:
        if s.name and query.lower() in s.name.lower():
            results.append({"result_type": "strategy", "id": str(s.id), "title": s.name,
                            "snippet": getattr(s, 'description', '') or "", "source": "minore", "tags": []})

    # Search knowledge rules
    rules = db.query(KnowledgeRule).filter(KnowledgeRule.project_id == project_id).all()
    for r in rules:
        searchable = f"{r.name or ''} {r.description or ''}".lower()
        if query.lower() in searchable:
            results.append({"result_type": "concept", "id": str(r.id), "title": r.name,
                            "snippet": (r.description or "")[:200], "source": "minore", "tags": []})

    results.sort(key=lambda x: len(x.get("snippet", "")), reverse=True)
    return results[:limit]


# ═══════════════════════════════════════════════════════
# NOTES CRUD
# ═══════════════════════════════════════════════════════

def get_notes(db: Session, vault_id: UUID, note_type: str = None, limit: int = 100) -> list[dict]:
    q = db.query(ObsidianNote).filter(ObsidianNote.vault_id == vault_id, ObsidianNote.is_deleted == False)
    if note_type:
        q = q.filter(ObsidianNote.note_type == note_type)
    return [_dict(n) for n in q.order_by(ObsidianNote.updated_at.desc()).limit(limit).all()]


def get_note(db: Session, note_id: UUID) -> dict | None:
    return _dict(db.query(ObsidianNote).filter(ObsidianNote.id == note_id).first())


def update_note_content(db: Session, note_id: UUID, content: str) -> dict | None:
    note = db.query(ObsidianNote).filter(ObsidianNote.id == note_id).first()
    if not note: return None
    note.content = content
    note.file_hash = _hash(content)
    note.version += 1
    note.sync_status = "pending"
    _index_note(note)
    db.commit()
    db.refresh(note)
    return _dict(note)


def delete_note(db: Session, note_id: UUID) -> bool:
    note = db.query(ObsidianNote).filter(ObsidianNote.id == note_id).first()
    if not note: return False
    note.is_deleted = True
    note.sync_status = "deleted"
    db.commit()
    return True


def get_backlinks(db: Session, note_id: UUID) -> list[dict]:
    note = db.query(ObsidianNote).filter(ObsidianNote.id == note_id).first()
    if not note: return []
    # Find notes that link to this note's file_path
    linking = db.query(ObsidianNote).filter(
        ObsidianNote.vault_id == note.vault_id,
        ObsidianNote.is_deleted == False,
        ObsidianNote.file_path != note.file_path,
    ).all()
    result = []
    for n in linking:
        for wl in (n.wiki_links or []):
            if isinstance(wl, dict) and wl.get("target") == note.file_path:
                result.append({"id": str(n.id), "file_path": n.file_path, "title": n.title or n.file_name})
                break
    return result


# ═══════════════════════════════════════════════════════
# SYNC DASHBOARD
# ═══════════════════════════════════════════════════════

def get_sync_dashboard(db: Session, project_id: UUID) -> dict:
    vaults = get_vaults(db, project_id)
    all_notes = []
    total_synced = 0
    total_pending = 0
    total_conflicts = 0

    for v in vaults:
        notes = db.query(ObsidianNote).filter(ObsidianNote.vault_id == v["id"], ObsidianNote.is_deleted == False).all()
        total_synced += sum(1 for n in notes if n.sync_status == "synced")
        total_pending += sum(1 for n in notes if n.sync_status == "pending")
        total_conflicts += sum(1 for n in notes if n.sync_status == "conflict")

    recent_syncs = []
    for v in vaults:
        logs = db.query(SyncLog).filter(SyncLog.vault_id == v["id"]).order_by(SyncLog.created_at.desc()).limit(5).all()
        recent_syncs.extend([_dict(l) for l in logs])
    recent_syncs.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    conflicts = []
    for v in vaults:
        cs = db.query(SyncConflict).filter(SyncConflict.vault_id == v["id"], SyncConflict.is_resolved == False).all()
        conflicts.extend([_dict(c) for c in cs])

    return {
        "vaults": vaults,
        "recent_syncs": recent_syncs[:10],
        "active_conflicts": conflicts[:10],
        "total_notes": total_synced + total_pending + total_conflicts,
        "total_synced": total_synced,
        "total_pending": total_pending,
        "total_conflicts": total_conflicts,
    }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

async function hashText(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function parseFrontmatter(content: string) {
  const fm: Record<string, any> = {};
  let body = content;
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (match) {
    body = content.slice(match[0].length);
    for (const line of match[1].split(/\r?\n/)) {
      const idx = line.indexOf(':');
      if (idx <= 0) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      fm[key] = value;
    }
  }
  return { frontmatter: fm, body };
}

function extractWikiLinks(content: string): string[] {
  const links = [...content.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g)].map((m) => m[1].trim());
  return [...new Set(links)];
}

function extractTags(content: string): string[] {
  const tags = [...content.matchAll(/(?<!\[)(#[\w-]+)/g)].map((m) => m[1].slice(1));
  return [...new Set(tags)].slice(0, 50);
}

function extractHeadings(content: string): string[] {
  return [...content.matchAll(/^#{1,4}\s+(.+)$/gm)].map((m) => m[1].trim()).slice(0, 30);
}

function vaultApi(vault: any) {
  const base = (vault.path || '').replace(/\/+$/, '');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
  };
  if (vault.api_key) {
    headers['Authorization'] = `Bearer ${vault.api_key}`;
    headers['x-api-key'] = vault.api_key;
  }
  const get = async (path: string) => {
    const res = await fetch(`${base}/vault/${encodeURIComponent(path)}`, { headers });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Obsidian REST API ${res.status}: ${await res.text().catch(() => '')}`);
    return await res.text();
  };
  const list = async () => {
    const res = await fetch(`${base}/vault/`, { headers });
    if (!res.ok) throw new Error(`Obsidian REST API list ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  };
  const put = async (path: string, content: string) => {
    const res = await fetch(`${base}/vault/${encodeURIComponent(path)}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'text/markdown' },
      body: content,
    });
    if (!res.ok) throw new Error(`Obsidian REST API write ${res.status}`);
  };
  return { get, list, put, base };
}

async function updateVaultHealth(supabase: any, vaultId: string, status: string, message?: string) {
  await supabase.from('vault').update({ health_status: status, health_message: message || null }).eq('id', vaultId);
}

async function refreshVaultStatistics(supabase: any, vaultId: string) {
  const { data: notes } = await supabase.from('obsidian_note').select('note_type, file_path, tags').eq('vault_id', vaultId).eq('is_deleted', false);
  const list = notes || [];
  const notesByType: Record<string, number> = {};
  const notesByFolder: Record<string, number> = {};
  const tagCount: Record<string, number> = {};
  for (const n of list) {
    notesByType[n.note_type || 'note'] = (notesByType[n.note_type || 'note'] || 0) + 1;
    const folder = n.file_path.includes('/') ? n.file_path.split('/').slice(0, -1).join('/') : '/';
    notesByFolder[folder] = (notesByFolder[folder] || 0) + 1;
    for (const t of n.tags || []) tagCount[t] = (tagCount[t] || 0) + 1;
  }
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([tag, count]) => ({ tag, count }));
  await supabase.from('vault_statistics').upsert({
    vault_id: vaultId,
    total_notes: list.length,
    synced_notes: list.length,
    pending_notes: 0,
    conflicted_notes: 0,
    deleted_notes: 0,
    notes_by_type: notesByType,
    notes_by_folder: notesByFolder,
    top_tags: topTags,
    last_full_sync: new Date().toISOString(),
  }, { onConflict: 'vault_id' });
}

function writeSyncLog(supabase: any, vaultId: string, entry: Record<string, any>) {
  return supabase.from('sync_log').insert({ vault_id: vaultId, ...entry, created_at: new Date().toISOString() });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse('Unauthorized', 401);

    const { operation, project_id, data } = await req.json() as any;
    if (!project_id) return errorResponse('Missing project_id');

    const loadVault = async (vaultId?: string) => {
      if (!vaultId) throw new Error('Missing vault_id');
      const { data: vault } = await supabase.from('vault').select('*').eq('id', vaultId).eq('project_id', project_id).maybeSingle();
      if (!vault) throw new Error('Vault not found');
      return vault;
    };

    switch (operation) {
      case 'check-health': {
        const vault = await loadVault(data?.vault_id);
        if (!vault.api_key) {
          await updateVaultHealth(supabase, vault.id, 'unconfigured', 'No REST API token set');
          return successResponse({ status: 'unconfigured', message: 'Set the Obsidian Local REST API token on the vault to enable sync.' });
        }
        try {
          const api = vaultApi(vault);
          await api.list();
          await updateVaultHealth(supabase, vault.id, 'healthy', 'Obsidian REST API reachable');
          return successResponse({ status: 'healthy', message: 'Obsidian REST API reachable' });
        } catch (err: any) {
          const message = err instanceof Error ? err.message : 'Unreachable';
          await updateVaultHealth(supabase, vault.id, 'unreachable', message);
          return successResponse({ status: 'unreachable', message });
        }
      }

      case 'import': {
        const vault = await loadVault(data?.vault_id);
        const startedAt = Date.now();
        const force = !!data?.force;
        let imported = 0, skipped = 0, conflicted = 0, errors = 0;
        const errorMessages: string[] = [];

        if (!vault.api_key) {
          return errorResponse('Vault has no REST API token. Add the Obsidian Local REST API token to the vault settings.', 400);
        }
        const api = vaultApi(vault);

        let files: string[] = [];
        try { files = await api.list(); } catch (err: any) {
          const message = err instanceof Error ? err.message : 'List failed';
          await updateVaultHealth(supabase, vault.id, 'unreachable', message);
          return errorResponse(message, 502);
        }
        const mdFiles = files.filter((f) => f.toLowerCase().endsWith('.md'));
        const requested = data?.file_paths;
        const selected = requested && Array.isArray(requested) && requested.length
          ? mdFiles.filter((f) => requested.includes(f))
          : mdFiles;

        for (const filePath of selected) {
          try {
            const content = await api.get(filePath);
            if (content === null) { skipped++; continue; }
            const hash = await hashText(content);
            const { data: existing } = await supabase.from('obsidian_note').select('id, file_hash, content').eq('vault_id', vault.id).eq('file_path', filePath).maybeSingle();
            if (existing && existing.file_hash === hash && !force) { skipped++; continue; }
            if (existing && existing.file_hash !== hash && existing.content && existing.content !== content) {
              conflicted++;
              await supabase.from('sync_conflict').insert({
                vault_id: vault.id,
                file_path: filePath,
                local_content: existing.content,
                remote_content: content,
                is_resolved: false,
              });
            }
            const { frontmatter, body } = parseFrontmatter(content);
            const fileName = filePath.split('/').pop() || filePath;
            const upsert: Record<string, any> = {
              vault_id: vault.id,
              project_id,
              file_path: filePath,
              file_name: fileName,
              file_hash: hash,
              title: frontmatter.title || fileName.replace(/\.md$/, ''),
              content,
              frontmatter,
              tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : extractTags(body),
              aliases: Array.isArray(frontmatter.aliases) ? frontmatter.aliases : [],
              wiki_links: extractWikiLinks(content),
              headings: extractHeadings(body),
              note_type: frontmatter.type || (body ? 'note' : 'note'),
              sync_status: 'synced',
              sync_direction: 'import',
              is_deleted: false,
              last_synced_at: new Date().toISOString(),
            };
            const { error } = await supabase.from('obsidian_note').upsert(upsert, { onConflict: 'file_path' });
            if (error) { errors++; errorMessages.push(`${filePath}: ${error.message}`); } else { imported++; }
          } catch (err: any) {
            errors++;
            errorMessages.push(`${filePath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        const durationMs = Date.now() - startedAt;
        await supabase.from('vault').update({ is_connected: true, last_synced_at: new Date().toISOString(), health_status: 'healthy' }).eq('id', vault.id);
        await refreshVaultStatistics(supabase, vault.id);
        await writeSyncLog(supabase, vault.id, {
          sync_type: 'import', status: errors ? 'partial' : 'success', direction: 'import',
          files_processed: selected.length, files_imported: imported, files_skipped: skipped,
          files_conflicted: conflicted, errors, duration_ms: durationMs, trigger: 'manual',
        });
        return successResponse({ status: errors ? 'partial' : 'success', files_processed: selected.length, imported, skipped, conflicted, errors, error_messages: errorMessages });
      }

      case 'import-data': {
        const vault = await loadVault(data?.vault_id);
        const notes = data?.notes || [];
        let imported = 0;
        for (const n of notes) {
          const filePath = n.file_path || '';
          if (!filePath) continue;
          const content = n.content || '';
          const hash = await hashText(content);
          const fileName = filePath.split('/').pop() || filePath;
          const { frontmatter } = parseFrontmatter(content);
          const { error } = await supabase.from('obsidian_note').upsert({
            vault_id: vault.id,
            project_id,
            file_path: filePath,
            file_name: fileName,
            file_hash: hash,
            title: n.title || frontmatter.title || fileName.replace(/\.md$/, ''),
            content,
            frontmatter,
            tags: n.tags || [],
            wiki_links: extractWikiLinks(content),
            note_type: frontmatter.type || 'note',
            sync_status: 'synced',
            sync_direction: 'import',
            is_deleted: false,
            last_synced_at: new Date().toISOString(),
          }, { onConflict: 'file_path' });
          if (!error) imported++;
        }
        await refreshVaultStatistics(supabase, vault.id);
        return successResponse({ status: 'success', imported });
      }

      case 'export': {
        const vault = await loadVault(data?.vault_id);
        const startedAt = Date.now();
        if (!vault.api_key) return errorResponse('Vault has no REST API token', 400);
        const api = vaultApi(vault);
        let query = supabase.from('obsidian_note').select('*').eq('vault_id', vault.id).eq('is_deleted', false);
        if (data?.note_ids && Array.isArray(data.note_ids) && data.note_ids.length) {
          query = query.in('id', data.note_ids);
        }
        const { data: notes } = await query;
        let exported = 0;
        const errors: string[] = [];
        for (const note of notes || []) {
          try {
            await api.put(note.file_path, note.content || '');
            await supabase.from('obsidian_note').update({ sync_status: 'synced', sync_direction: 'export', last_synced_at: new Date().toISOString() }).eq('id', note.id);
            exported++;
          } catch (err: any) {
            errors.push(`${note.file_path}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        await writeSyncLog(supabase, vault.id, {
          sync_type: 'export', status: errors.length ? 'partial' : 'success', direction: 'export',
          files_processed: (notes || []).length, files_exported: exported, errors: errors.length,
          duration_ms: Date.now() - startedAt, trigger: 'manual',
        });
        return successResponse({ status: errors.length ? 'partial' : 'success', exported, errors });
      }

      case 'resolve-conflict': {
        const conflictId = data?.conflict_id;
        const resolution = data?.resolution;
        if (!conflictId) throw new Error('Missing conflict_id');
        const { data: conflict } = await supabase.from('sync_conflict').select('*').eq('id', conflictId).maybeSingle();
        if (conflict) {
          await supabase.from('sync_conflict').update({ resolution, merged_content: data?.merged_content || null, resolved_at: new Date().toISOString(), is_resolved: true }).eq('id', conflictId);
          if ((resolution === 'keep_local' || resolution === 'merge') && data?.merged_content) {
            const { data: note } = await supabase.from('obsidian_note').select('*').eq('vault_id', conflict.vault_id).eq('file_path', conflict.file_path).maybeSingle();
            if (note) {
              await supabase.from('obsidian_note').update({ content: data.merged_content, file_hash: await hashText(data.merged_content), sync_status: 'pending', sync_direction: 'export' }).eq('id', note.id);
            }
          }
        }
        return successResponse({ status: 'success' });
      }

      case 'auto-link':
      case 'knowledge-links': {
        const vault = await loadVault(data?.vault_id);
        const { data: notes } = await supabase.from('obsidian_note').select('id, file_path, wiki_links, title').eq('vault_id', vault.id).eq('is_deleted', false).limit(200);
        let linked = 0;
        const targetSet = new Set((notes || []).map((n: any) => n.file_name));
        for (const note of notes || []) {
          for (const link of note.wiki_links || []) {
            const target = (notes || []).find((n: any) => n.file_name.replace(/\.md$/, '') === link);
            if (!target) continue;
            const { error } = await supabase.from('knowledge_link').upsert({
              project_id,
              source_type: 'note',
              source_id: note.id,
              target_type: 'note',
              target_id: target.id,
              relationship: 'references',
              strength: 0.5,
            }, { onConflict: 'source_type,source_id,target_type,target_id' });
            if (!error) linked++;
          }
        }
        return successResponse({ status: 'success', linked });
      }

      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

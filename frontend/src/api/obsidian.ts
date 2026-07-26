import api from '../services/api';
import { supabase } from '../lib/supabase';
import type {
  Vault, ObsidianNote, SyncLog, SyncConflict, SyncSettings,
  VaultStatistics, NoteTemplate, SyncDashboardData, ObsidianSearchResult,
  ParsedMarkdown,
} from './types';

const base = (projectId: string) => `/projects/${projectId}/obsidian`;

export const obsidianService = {
  // Vaults — Supabase client (vault table migrated)
  getVaults: async (projectId: string): Promise<Vault[]> => {
    const { data, error } = await supabase
      .from('vault')
      .select('*')
      .eq('project_id', projectId)
      .order('name');

    if (error) throw error;
    return (data ?? []) as Vault[];
  },

  getVault: async (projectId: string, vaultId: string): Promise<Vault> => {
    const { data, error } = await supabase
      .from('vault')
      .select('*')
      .eq('id', vaultId)
      .eq('project_id', projectId)
      .single();

    if (error) throw error;
    return data as Vault;
  },

  createVault: async (projectId: string, data: { name: string; path: string; vault_type?: string }): Promise<Vault> => {
    const { data: row, error } = await supabase
      .from('vault')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();

    if (error) throw error;
    return row as Vault;
  },

  updateVault: async (projectId: string, vaultId: string, data: Partial<Vault>): Promise<Vault> => {
    const { data: row, error } = await supabase
      .from('vault')
      .update(data)
      .eq('id', vaultId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;
    return row as Vault;
  },

  deleteVault: async (projectId: string, vaultId: string): Promise<void> => {
    const { error } = await supabase
      .from('vault')
      .delete()
      .eq('id', vaultId)
      .eq('project_id', projectId);

    if (error) throw error;
  },

  checkHealth: (projectId: string, vaultId: string) =>
    api.get(`${base(projectId)}/vaults/${vaultId}/health`).then((r) => r.data),

  // Notes — Supabase client (obsidian_note table migrated)
  getNotes: async (projectId: string, vaultId: string, noteType?: string, limit = 100): Promise<ObsidianNote[]> => {
    let query = supabase
      .from('obsidian_note')
      .select('*')
      .eq('project_id', projectId)
      .eq('vault_id', vaultId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (noteType) {
      query = query.eq('note_type', noteType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ObsidianNote[];
  },

  getNote: async (projectId: string, noteId: string): Promise<ObsidianNote> => {
    const { data, error } = await supabase
      .from('obsidian_note')
      .select('*')
      .eq('id', noteId)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .single();

    if (error) throw error;
    return data as ObsidianNote;
  },

  updateNoteContent: async (projectId: string, noteId: string, content: string): Promise<ObsidianNote> => {
    const { data, error } = await supabase
      .from('obsidian_note')
      .update({ content, sync_status: 'pending' })
      .eq('id', noteId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data as ObsidianNote;
  },

  deleteNote: async (projectId: string, noteId: string): Promise<void> => {
    const { error } = await supabase
      .from('obsidian_note')
      .update({ is_deleted: true, sync_status: 'deleted' })
      .eq('id', noteId)
      .eq('project_id', projectId);

    if (error) throw error;
  },

  getBacklinks: (projectId: string, noteId: string) =>
    api.get<{ id: string; file_path: string; title: string }[]>(`${base(projectId)}/notes/${noteId}/backlinks`).then((r) => r.data),
  parseMarkdown: (projectId: string, content: string) =>
    api.post<ParsedMarkdown>(`${base(projectId)}/notes/parse`, null, { params: { content } }).then((r) => r.data),

  // Sync — FastAPI (complex import/export pipeline)
  syncImport: (projectId: string, vaultId: string, filePaths?: string[], force = false) =>
    api.post(`${base(projectId)}/sync/import`, { vault_id: vaultId, file_paths: filePaths, force }).then((r) => r.data),
  syncImportData: (projectId: string, vaultId: string, notes: { file_path: string; content: string; title?: string; tags?: string[] }[]) =>
    api.post(`${base(projectId)}/sync/import-data`, notes, { params: { vault_id: vaultId } }).then((r) => r.data),
  syncExport: (projectId: string, vaultId: string, noteIds?: string[]) =>
    api.post(`${base(projectId)}/sync/export`, { vault_id: vaultId, note_ids: noteIds }).then((r) => r.data),
  getSyncLogs: (projectId: string, vaultId: string, limit = 20) =>
    api.get<SyncLog[]>(`${base(projectId)}/sync/logs?vault_id=${vaultId}&limit=${limit}`).then((r) => r.data),
  autoLink: (projectId: string, vaultId?: string) =>
    api.post(`${base(projectId)}/sync/auto-link`, null, { params: vaultId ? { vault_id: vaultId } : {} }).then((r) => r.data),
  createKnowledgeLinks: (projectId: string) =>
    api.post(`${base(projectId)}/sync/knowledge-links`).then((r) => r.data),

  // Conflicts — FastAPI (sync infrastructure)
  getConflicts: (projectId: string, vaultId: string) =>
    api.get<SyncConflict[]>(`${base(projectId)}/conflicts?vault_id=${vaultId}`).then((r) => r.data),
  resolveConflict: (projectId: string, conflictId: string, resolution: string, mergedContent?: string) =>
    api.post(`${base(projectId)}/conflicts/resolve`, { conflict_id: conflictId, resolution, merged_content: mergedContent }).then((r) => r.data),

  // Settings — FastAPI
  getSettings: (projectId: string, vaultId: string) =>
    api.get<SyncSettings>(`${base(projectId)}/settings?vault_id=${vaultId}`).then((r) => r.data),
  updateSettings: (projectId: string, vaultId: string, data: Partial<SyncSettings>) =>
    api.put<SyncSettings>(`${base(projectId)}/settings?vault_id=${vaultId}`, data).then((r) => r.data),

  // Statistics — FastAPI (aggregates across vaults)
  getStatistics: (projectId: string, vaultId: string) =>
    api.get<VaultStatistics>(`${base(projectId)}/statistics?vault_id=${vaultId}`).then((r) => r.data),

  // Templates — FastAPI (rendering with placeholder substitution)
  getTemplates: (projectId: string, templateType?: string) =>
    api.get<NoteTemplate[]>(`${base(projectId)}/templates${templateType ? `?template_type=${templateType}` : ''}`).then((r) => r.data),
  createTemplate: (projectId: string, data: { name: string; template_type: string; content: string; description?: string; target_folder?: string }) =>
    api.post<NoteTemplate>(`${base(projectId)}/templates`, data).then((r) => r.data),
  deleteTemplate: (projectId: string, templateId: string) =>
    api.delete(`${base(projectId)}/templates/${templateId}`).then((r) => r.data),
  renderTemplate: (projectId: string, templateId: string, context?: Record<string, string>) =>
    api.post<{ content: string }>(`${base(projectId)}/templates/${templateId}/render`, context).then((r) => r.data),

  // Search — FastAPI (cross-domain: notes + trades + strategies + rules)
  search: (projectId: string, query: string, limit = 20) =>
    api.get<ObsidianSearchResult[]>(`${base(projectId)}/search?q=${encodeURIComponent(query)}&limit=${limit}`).then((r) => r.data),

  // Dashboard — FastAPI (aggregated stats)
  getDashboard: (projectId: string) =>
    api.get<SyncDashboardData>(`${base(projectId)}/dashboard`).then((r) => r.data),
};

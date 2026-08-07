import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type {
  Vault, ObsidianNote, SyncLog, SyncConflict, SyncSettings,
  VaultStatistics, NoteTemplate, SyncDashboardData, ObsidianSearchResult,
  ParsedMarkdown, BacklinkRef,
} from './types';

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

  checkHealth: async (projectId: string, vaultId: string): Promise<{ status: string; message?: string }> => {
    const { data, error } = await supabase
      .from('vault')
      .select('health_status, health_message, api_key')
      .eq('id', vaultId)
      .eq('project_id', projectId)
      .single();

    if (error) throw error;
    if (!data.api_key) {
      return { status: data.health_status ?? 'unknown', message: data.health_message ?? 'Set the Obsidian Local REST API token to enable sync.' };
    }
    try {
      const res = await callEdgeFunction<{ status: string; message?: string }>('obsidian-sync', {
        operation: 'check-health',
        project_id: projectId,
        data: { vault_id: vaultId },
      });
      return { status: res.status, message: res.message };
    } catch {
      return { status: data.health_status ?? 'unknown', message: data.health_message };
    }
  },

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

  // Backlinks — direct JSONB query
  getBacklinks: async (projectId: string, noteId: string): Promise<BacklinkRef[]> => {
    const { data, error } = await supabase
      .from('obsidian_note')
      .select('backlinks')
      .eq('id', noteId)
      .eq('project_id', projectId)
      .single();

    if (error) throw error;
    return (data?.backlinks ?? []) as BacklinkRef[];
  },

  // Sync — callEdgeFunction (obsidian-sync function)
  syncImport: async (projectId: string, vaultId: string, filePaths?: string[], force = false): Promise<any> =>
    callEdgeFunction('obsidian-sync', { operation: 'import', project_id: projectId, data: { vault_id: vaultId, file_paths: filePaths, force } }),

  syncImportData: async (projectId: string, vaultId: string, notes: { file_path: string; content: string; title?: string; tags?: string[] }[]): Promise<any> =>
    callEdgeFunction('obsidian-sync', { operation: 'import-data', project_id: projectId, data: { vault_id: vaultId, notes } }),

  syncExport: async (projectId: string, vaultId: string, noteIds?: string[]): Promise<any> =>
    callEdgeFunction('obsidian-sync', { operation: 'export', project_id: projectId, data: { vault_id: vaultId, note_ids: noteIds } }),

  getSyncLogs: async (projectId: string, vaultId: string, limit = 20): Promise<SyncLog[]> => {
    const { data, error } = await supabase
      .from('sync_log')
      .select('*')
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as SyncLog[];
  },

  autoLink: async (projectId: string, vaultId?: string): Promise<any> =>
    callEdgeFunction('obsidian-sync', { operation: 'auto-link', project_id: projectId, data: { vault_id: vaultId } }),

  createKnowledgeLinks: async (projectId: string): Promise<any> =>
    callEdgeFunction('obsidian-sync', { operation: 'knowledge-links', project_id: projectId }),

  // Conflicts — direct table queries
  getConflicts: async (projectId: string, vaultId: string): Promise<SyncConflict[]> => {
    const { data, error } = await supabase
      .from('sync_conflict')
      .select('*')
      .eq('vault_id', vaultId)
      .eq('is_resolved', false);

    if (error) throw error;
    return (data ?? []) as SyncConflict[];
  },

  resolveConflict: async (projectId: string, conflictId: string, resolution: string, mergedContent?: string): Promise<any> => {
    const { error } = await supabase
      .from('sync_conflict')
      .update({ resolution, resolved_at: new Date().toISOString(), is_resolved: true })
      .eq('id', conflictId);

    if (error) throw error;

    return callEdgeFunction('obsidian-sync', {
      operation: 'resolve-conflict',
      project_id: projectId,
      data: { conflict_id: conflictId, resolution, merged_content: mergedContent },
    });
  },

  // Settings — direct table queries
  getSettings: async (projectId: string, vaultId: string): Promise<SyncSettings> => {
    const { data, error } = await supabase
      .from('sync_settings')
      .select('*')
      .eq('vault_id', vaultId)
      .single();

    if (error) throw error;
    return data as SyncSettings;
  },

  updateSettings: async (projectId: string, vaultId: string, data: Partial<SyncSettings>): Promise<SyncSettings> => {
    const { data: row, error } = await supabase
      .from('sync_settings')
      .upsert({ ...data, vault_id: vaultId })
      .select()
      .single();

    if (error) throw error;
    return row as SyncSettings;
  },

  // Statistics — direct table query
  getStatistics: async (projectId: string, vaultId: string): Promise<VaultStatistics> => {
    const { data, error } = await supabase
      .from('vault_statistics')
      .select('*')
      .eq('vault_id', vaultId)
      .single();

    if (error) throw error;
    return data as VaultStatistics;
  },

  // Templates — direct table queries
  getTemplates: async (projectId: string, templateType?: string): Promise<NoteTemplate[]> => {
    let query = supabase
      .from('note_template')
      .select('*')
      .eq('project_id', projectId);

    if (templateType) {
      query = query.eq('template_type', templateType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as NoteTemplate[];
  },

  createTemplate: async (projectId: string, data: { name: string; template_type: string; content: string; description?: string; target_folder?: string }): Promise<NoteTemplate> => {
    const { data: row, error } = await supabase
      .from('note_template')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();

    if (error) throw error;
    return row as NoteTemplate;
  },

  deleteTemplate: async (projectId: string, templateId: string): Promise<void> => {
    const { error } = await supabase
      .from('note_template')
      .delete()
      .eq('id', templateId)
      .eq('project_id', projectId);

    if (error) throw error;
  },

  // Search — callEdgeFunction (obsidian-sync function)
  search: async (projectId: string, query: string, limit = 20): Promise<ObsidianSearchResult[]> =>
    callEdgeFunction('obsidian-sync', { operation: 'search', project_id: projectId, data: { query, limit } }),

  // Dashboard — composed from multiple supabase queries
  getDashboard: async (projectId: string): Promise<SyncDashboardData> => {
    const { data: vaults } = await supabase
      .from('vault')
      .select('*')
      .eq('project_id', projectId);

    const vaultIds = (vaults ?? []).map(v => v.id);

    const { data: recentSyncs } = await supabase
      .from('sync_log')
      .select('*')
      .in('vault_id', vaultIds)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: conflicts } = await supabase
      .from('sync_conflict')
      .select('*')
      .in('vault_id', vaultIds)
      .eq('is_resolved', false);

    const { data: noteStatuses } = await supabase
      .from('obsidian_note')
      .select('sync_status')
      .in('vault_id', vaultIds)
      .eq('is_deleted', false);

    const notes = noteStatuses ?? [];
    const totalNotes = notes.length;
    const synced = notes.filter(n => n.sync_status === 'synced').length;
    const pending = notes.filter(n => n.sync_status === 'pending').length;

    return {
      vaults: (vaults ?? []) as Vault[],
      recent_syncs: (recentSyncs ?? []) as SyncLog[],
      active_conflicts: (conflicts ?? []) as SyncConflict[],
      total_notes: totalNotes,
      total_synced: synced,
      total_pending: pending,
      total_conflicts: conflicts?.length ?? 0,
    };
  },
};

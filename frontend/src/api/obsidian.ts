import api from '../services/api';
import type {
  Vault, ObsidianNote, SyncLog, SyncConflict, SyncSettings,
  VaultStatistics, NoteTemplate, SyncDashboardData, ObsidianSearchResult,
  ParsedMarkdown,
} from './types';

const base = (projectId: string) => `/projects/${projectId}/obsidian`;

export const obsidianService = {
  // Vaults
  getVaults: (projectId: string) =>
    api.get<Vault[]>(`${base(projectId)}/vaults`).then((r) => r.data),
  getVault: (projectId: string, vaultId: string) =>
    api.get<Vault>(`${base(projectId)}/vaults/${vaultId}`).then((r) => r.data),
  createVault: (projectId: string, data: { name: string; path: string; vault_type?: string }) =>
    api.post<Vault>(`${base(projectId)}/vaults`, data).then((r) => r.data),
  updateVault: (projectId: string, vaultId: string, data: Partial<Vault>) =>
    api.put<Vault>(`${base(projectId)}/vaults/${vaultId}`, data).then((r) => r.data),
  deleteVault: (projectId: string, vaultId: string) =>
    api.delete(`${base(projectId)}/vaults/${vaultId}`).then((r) => r.data),
  checkHealth: (projectId: string, vaultId: string) =>
    api.get(`${base(projectId)}/vaults/${vaultId}/health`).then((r) => r.data),

  // Notes
  getNotes: (projectId: string, vaultId: string, noteType?: string, limit = 100) =>
    api.get<ObsidianNote[]>(`${base(projectId)}/notes?vault_id=${vaultId}${noteType ? `&note_type=${noteType}` : ''}&limit=${limit}`).then((r) => r.data),
  getNote: (projectId: string, noteId: string) =>
    api.get<ObsidianNote>(`${base(projectId)}/notes/${noteId}`).then((r) => r.data),
  updateNoteContent: (projectId: string, noteId: string, content: string) =>
    api.put<ObsidianNote>(`${base(projectId)}/notes/${noteId}/content`, null, { params: { content } }).then((r) => r.data),
  deleteNote: (projectId: string, noteId: string) =>
    api.delete(`${base(projectId)}/notes/${noteId}`).then((r) => r.data),
  getBacklinks: (projectId: string, noteId: string) =>
    api.get<{ id: string; file_path: string; title: string }[]>(`${base(projectId)}/notes/${noteId}/backlinks`).then((r) => r.data),
  parseMarkdown: (projectId: string, content: string) =>
    api.post<ParsedMarkdown>(`${base(projectId)}/notes/parse`, null, { params: { content } }).then((r) => r.data),

  // Sync
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

  // Conflicts
  getConflicts: (projectId: string, vaultId: string) =>
    api.get<SyncConflict[]>(`${base(projectId)}/conflicts?vault_id=${vaultId}`).then((r) => r.data),
  resolveConflict: (projectId: string, conflictId: string, resolution: string, mergedContent?: string) =>
    api.post(`${base(projectId)}/conflicts/resolve`, { conflict_id: conflictId, resolution, merged_content: mergedContent }).then((r) => r.data),

  // Settings
  getSettings: (projectId: string, vaultId: string) =>
    api.get<SyncSettings>(`${base(projectId)}/settings?vault_id=${vaultId}`).then((r) => r.data),
  updateSettings: (projectId: string, vaultId: string, data: Partial<SyncSettings>) =>
    api.put<SyncSettings>(`${base(projectId)}/settings?vault_id=${vaultId}`, data).then((r) => r.data),

  // Statistics
  getStatistics: (projectId: string, vaultId: string) =>
    api.get<VaultStatistics>(`${base(projectId)}/statistics?vault_id=${vaultId}`).then((r) => r.data),

  // Templates
  getTemplates: (projectId: string, templateType?: string) =>
    api.get<NoteTemplate[]>(`${base(projectId)}/templates${templateType ? `?template_type=${templateType}` : ''}`).then((r) => r.data),
  createTemplate: (projectId: string, data: { name: string; template_type: string; content: string; description?: string; target_folder?: string }) =>
    api.post<NoteTemplate>(`${base(projectId)}/templates`, data).then((r) => r.data),
  deleteTemplate: (projectId: string, templateId: string) =>
    api.delete(`${base(projectId)}/templates/${templateId}`).then((r) => r.data),
  renderTemplate: (projectId: string, templateId: string, context?: Record<string, string>) =>
    api.post<{ content: string }>(`${base(projectId)}/templates/${templateId}/render`, context).then((r) => r.data),

  // Search
  search: (projectId: string, query: string, limit = 20) =>
    api.get<ObsidianSearchResult[]>(`${base(projectId)}/search?q=${encodeURIComponent(query)}&limit=${limit}`).then((r) => r.data),

  // Dashboard
  getDashboard: (projectId: string) =>
    api.get<SyncDashboardData>(`${base(projectId)}/dashboard`).then((r) => r.data),
};

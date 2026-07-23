import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obsidianService } from '../api/obsidian';

// ── Vaults ──

export const useVaults = (projectId: string) => {
  return useQuery({
    queryKey: ['obsidian', projectId, 'vaults'],
    queryFn: () => obsidianService.getVaults(projectId),
    enabled: !!projectId,
  });
};

export const useVault = (projectId: string, vaultId: string) => {
  return useQuery({
    queryKey: ['obsidian', projectId, 'vault', vaultId],
    queryFn: () => obsidianService.getVault(projectId, vaultId),
    enabled: !!projectId && !!vaultId,
  });
};

export const useCreateVault = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; path: string; vault_type?: string }) => obsidianService.createVault(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obsidian', projectId, 'vaults'] }),
  });
};

export const useUpdateVault = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => obsidianService.updateVault(projectId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obsidian', projectId, 'vaults'] }),
  });
};

export const useDeleteVault = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vaultId: string) => obsidianService.deleteVault(projectId, vaultId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obsidian', projectId, 'vaults'] }),
  });
};

export const useVaultHealth = (projectId: string, vaultId: string) => {
  return useQuery({
    queryKey: ['obsidian', projectId, 'health', vaultId],
    queryFn: () => obsidianService.checkHealth(projectId, vaultId),
    enabled: !!projectId && !!vaultId,
  });
};

// ── Notes ──

export const useNotes = (projectId: string, vaultId: string, noteType?: string) => {
  return useQuery({
    queryKey: ['obsidian', projectId, 'notes', vaultId, noteType],
    queryFn: () => obsidianService.getNotes(projectId, vaultId, noteType),
    enabled: !!projectId && !!vaultId,
  });
};

export const useNote = (projectId: string, noteId: string) => {
  return useQuery({
    queryKey: ['obsidian', projectId, 'note', noteId],
    queryFn: () => obsidianService.getNote(projectId, noteId),
    enabled: !!projectId && !!noteId,
  });
};

export const useUpdateNoteContent = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) => obsidianService.updateNoteContent(projectId, noteId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obsidian', projectId, 'notes'] }),
  });
};

export const useDeleteNote = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => obsidianService.deleteNote(projectId, noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obsidian', projectId, 'notes'] }),
  });
};

export const useBacklinks = (projectId: string, noteId: string) => {
  return useQuery({
    queryKey: ['obsidian', projectId, 'backlinks', noteId],
    queryFn: () => obsidianService.getBacklinks(projectId, noteId),
    enabled: !!projectId && !!noteId,
  });
};

// ── Sync ──

export const useSyncImport = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vaultId, filePaths, force }: { vaultId: string; filePaths?: string[]; force?: boolean }) =>
      obsidianService.syncImport(projectId, vaultId, filePaths, force),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['obsidian', projectId, 'notes'] }); qc.invalidateQueries({ queryKey: ['obsidian', projectId, 'vaults'] }); },
  });
};

export const useSyncImportData = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vaultId, notes }: { vaultId: string; notes: { file_path: string; content: string; title?: string; tags?: string[] }[] }) =>
      obsidianService.syncImportData(projectId, vaultId, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['obsidian', projectId, 'notes'] }); qc.invalidateQueries({ queryKey: ['obsidian', projectId, 'vaults'] }); },
  });
};

export const useSyncExport = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vaultId, noteIds }: { vaultId: string; noteIds?: string[] }) =>
      obsidianService.syncExport(projectId, vaultId, noteIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obsidian', projectId, 'vaults'] }),
  });
};

export const useSyncLogs = (projectId: string, vaultId: string) => {
  return useQuery({
    queryKey: ['obsidian', projectId, 'sync-logs', vaultId],
    queryFn: () => obsidianService.getSyncLogs(projectId, vaultId),
    enabled: !!projectId && !!vaultId,
  });
};

export const useAutoLink = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vaultId?: string) => obsidianService.autoLink(projectId, vaultId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obsidian', projectId] }),
  });
};

// ── Conflicts ──

export const useConflicts = (projectId: string, vaultId: string) => {
  return useQuery({
    queryKey: ['obsidian', projectId, 'conflicts', vaultId],
    queryFn: () => obsidianService.getConflicts(projectId, vaultId),
    enabled: !!projectId && !!vaultId,
  });
};

export const useResolveConflict = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conflictId, resolution, mergedContent }: { conflictId: string; resolution: string; mergedContent?: string }) =>
      obsidianService.resolveConflict(projectId, conflictId, resolution, mergedContent),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obsidian', projectId, 'conflicts'] }),
  });
};

// ── Settings ──

export const useSyncSettings = (projectId: string, vaultId: string) => {
  return useQuery({
    queryKey: ['obsidian', projectId, 'settings', vaultId],
    queryFn: () => obsidianService.getSettings(projectId, vaultId),
    enabled: !!projectId && !!vaultId,
  });
};

export const useUpdateSyncSettings = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vaultId, data }: { vaultId: string; data: Record<string, unknown> }) =>
      obsidianService.updateSettings(projectId, vaultId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obsidian', projectId, 'settings'] }),
  });
};

// ── Statistics ──

export const useVaultStatistics = (projectId: string, vaultId: string) => {
  return useQuery({
    queryKey: ['obsidian', projectId, 'stats', vaultId],
    queryFn: () => obsidianService.getStatistics(projectId, vaultId),
    enabled: !!projectId && !!vaultId,
  });
};

// ── Templates ──

export const useTemplates = (projectId: string, templateType?: string) => {
  return useQuery({
    queryKey: ['obsidian', projectId, 'templates', templateType],
    queryFn: () => obsidianService.getTemplates(projectId, templateType),
    enabled: !!projectId,
  });
};

export const useCreateTemplate = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; template_type: string; content: string; description?: string; target_folder?: string }) =>
      obsidianService.createTemplate(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obsidian', projectId, 'templates'] }),
  });
};

export const useDeleteTemplate = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => obsidianService.deleteTemplate(projectId, templateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obsidian', projectId, 'templates'] }),
  });
};

export const useRenderTemplate = (projectId: string) => {
  return useMutation({
    mutationFn: ({ templateId, context }: { templateId: string; context?: Record<string, string> }) =>
      obsidianService.renderTemplate(projectId, templateId, context),
  });
};

// ── Search ──

export const useObsidianSearch = (projectId: string, query: string) => {
  return useQuery({
    queryKey: ['obsidian', projectId, 'search', query],
    queryFn: () => obsidianService.search(projectId, query),
    enabled: !!projectId && query.length >= 2,
  });
};

// ── Dashboard ──

export const useSyncDashboard = (projectId: string) => {
  return useQuery({
    queryKey: ['obsidian', projectId, 'dashboard'],
    queryFn: () => obsidianService.getDashboard(projectId),
    enabled: !!projectId,
  });
};

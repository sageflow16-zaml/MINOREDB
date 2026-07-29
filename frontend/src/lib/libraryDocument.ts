import type { SourceRead } from '../api/types';

export interface LibraryDocument {
  id: string;
  title: string;
  fileType: string;
  originType: string;
  attribution: string;
  rawText: string;
  metadata: Record<string, unknown>;
}

export function normalizeLibraryDocument(source: SourceRead | undefined | null): LibraryDocument | null {
  if (!source) return null;
  const meta = source.source_metadata ?? {};
  const originalName = (meta as any)?.original_name as string | undefined;
  const ext = (originalName || '').split('.').pop()?.toLowerCase() || '';
  return {
    id: source.id,
    title: originalName || source.attribution || source.id.slice(0, 8),
    fileType: ext,
    originType: source.origin_type || 'text',
    attribution: source.attribution || '',
    rawText: source.raw_text || '',
    metadata: meta,
  };
}

export function getSourceDisplayName(source: SourceRead | undefined | null): string {
  const doc = normalizeLibraryDocument(source);
  return doc ? doc.title : '';
}

export function getSourceFileType(source: SourceRead | undefined | null): string {
  const doc = normalizeLibraryDocument(source);
  return doc ? doc.fileType : '';
}

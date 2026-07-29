import { useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSources, useUploadSource, useExtractClaims, useDetectConflicts, useDeleteSource } from '../hooks/useSources';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/Feedback';
import { DocumentIntelligencePanel } from '../components/ui/intelligence-panel';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { extractTextFromFile } from '../lib/textExtraction';
import {
  Upload, FileText, Brain, AlertTriangle, Trash2, Search,
  Bookmark, Layers, Link, CheckCircle, XCircle, Sparkles,
  ChevronRight, File, Download, ExternalLink, Eye, Lightbulb,
} from 'lucide-react';
import type { SourceRead } from '../api/types';

export default function SourcesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: sources, isLoading, error, refetch } = useSources(projectId!);
  const uploadSource = useUploadSource(projectId!);
  const extractClaims = useExtractClaims(projectId!);
  const detectConflicts = useDetectConflicts(projectId!);
  const deleteSource = useDeleteSource(projectId!);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [viewSource, setViewSource] = useState<SourceRead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSources = sources ? sources.filter((s: any) => {
    if (searchQuery && !s.raw_text?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }) : [];

  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  const ALLOWED_TYPES = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'image/gif'];
  const ALLOWED_EXTENSIONS = ['.txt', '.pdf', '.docx', '.png', '.jpg', '.jpeg', '.gif'];

  const validateFile = useCallback((file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
      return `File type "${ext || file.type}" is not supported. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File exceeds the maximum allowed size of 50 MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`;
    }
    return null;
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    if (file.name.endsWith('.txt')) {
      formData.append('raw_text', await file.text());
    } else if (file.name.endsWith('.pdf')) {
      toast.loading('Extracting text from PDF...', { id: 'pdf-extract' });
      try {
        const text = await extractTextFromFile(file);
        if (text) formData.append('raw_text', text);
      } catch (err) {
        console.error('PDF extraction failed:', err);
        toast.error('Could not extract text from this PDF. Uploading without text.');
      }
      toast.dismiss('pdf-extract');
    } else if (file.name.endsWith('.docx')) {
      try {
        const text = await extractTextFromFile(file);
        if (text) formData.append('raw_text', text);
      } catch {
        /* DOCX extraction failed - upload without text */
      }
    }
    uploadSource.mutate(formData);
  }, [uploadSource, validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-7 w-36" /><Skeleton className="h-4 w-52" /></div><Skeleton className="h-8 w-24 rounded-lg" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (<div className="flex h-[80vh] items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10"><FileText className="h-6 w-6 text-danger" /></div><p className="text-sm font-medium text-foreground">Error loading sources</p><Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button></div></div>);
  }

  if (!sources || sources.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No sources yet"
          description="Upload documents to start building your research library"
          action={<Button onClick={() => fileInputRef.current?.click()}>Upload Document</Button>}
        />
        <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx,.png,.jpg,.jpeg,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      </div>
    );
  }

  const allTags = sources ? Array.from(new Set(sources.flatMap((s: any) => s.tags || []))) : [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto h-full">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-xl font-semibold text-foreground tracking-tight">Sources</h1><p className="text-sm text-muted mt-0.5">{sources?.length ?? 0} documents in your library</p></div>
      </motion.div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-5 min-h-[70vh]">
        {/* Left Panel — Library */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-4">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wider">Library</h3>
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search sources..." className="text-xs" />
          <div className="flex gap-1 flex-wrap">
            {allTags.slice(0, 6).map((tag: any) => (
              <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                className={cn('rounded-full px-2.5 py-0.5 text-3xs font-medium transition-colors', filterTag === tag ? 'bg-primary/20 text-primary' : 'bg-background text-muted hover:text-secondary')}>{tag}</button>
            ))}
          </div>
          <div
            className={cn('flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer', dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-6 w-6 text-muted mb-2" />
            <p className="text-xs text-muted">Drag & drop or click to upload</p>
            <p className="text-3xs text-muted mt-1">PDF, TXT, DOCX, images</p>
            <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx,.png,.jpg,.jpeg,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredSources.length > 0 ? filteredSources.map((s: any, i: number) => (
              <button key={s.id} onClick={() => setViewSource(s)}
                className={cn('w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-background', viewSource?.id === s.id && 'bg-primary/10')}>
                <FileText className="h-4 w-4 text-muted shrink-0" />
                <div className="flex-1 min-w-0"><p className="text-xs text-secondary truncate">{(s.raw_text || s.id).slice(0, 40)}</p><p className="text-3xs text-muted">{new Date(s.created_at).toLocaleDateString()}</p></div>
              </button>
            )) : <p className="text-xs text-muted py-4 text-center">{searchQuery ? 'No matches' : 'No sources yet'}</p>}
          </div>
        </motion.div>

        {/* Center Panel — Document Viewer */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border bg-surface p-5 flex flex-col min-h-[400px]">
          {viewSource ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Document</h3></div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => extractClaims.mutate(viewSource.id)}><Brain className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => detectConflicts.mutate(viewSource.id)}><AlertTriangle className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { setDeleteId(viewSource.id); setViewSource(null); }}><Trash2 className="h-4 w-4 text-danger" /></Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto rounded-lg bg-background p-4">
                <pre className="text-xs text-secondary whitespace-pre-wrap font-sans leading-relaxed">{viewSource.raw_text || 'No text content available for this document.'}</pre>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <Badge variant="default" size="sm">{sources?.findIndex((s: any) => s.id === viewSource.id) !== -1 ? `Source #${(sources?.findIndex((s: any) => s.id === viewSource.id) ?? 0) + 1}` : ''}</Badge>
                <span className="text-3xs text-muted">{viewSource.created_at ? new Date(viewSource.created_at).toLocaleDateString() : ''}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-elevated"><File className="h-6 w-6 text-muted" /></div>
              <p className="text-sm text-secondary">Select a source to view</p>
              <p className="text-xs text-muted mt-1">Choose a document from the library or upload a new one.</p>
            </div>
          )}
        </motion.div>

        {/* Right Panel — Document Intelligence */}
        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-4">
          {viewSource && projectId ? (
            <DocumentIntelligencePanel projectId={projectId} documentId={viewSource.id} />
          ) : (
            <>
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h3 className="text-xs font-medium text-foreground uppercase tracking-wider">AI Intelligence</h3></div>
              <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-elevated"><Lightbulb className="h-5 w-5 text-muted" /></div>
                <p className="text-sm text-secondary">Select a source</p>
                <p className="text-xs text-muted mt-1">Choose a document to extract trading concepts, rules, and intelligence.</p>
              </div>
            </>
          )}
        </motion.div>
      </div>

      <ConfirmDialog isOpen={!!deleteId} title="Delete Source" message="This cannot be undone." onConfirm={() => { if (deleteId) deleteSource.mutate(deleteId); setDeleteId(null); }} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

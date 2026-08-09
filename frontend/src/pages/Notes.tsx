import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSources } from '../hooks/useSources';
import { researchV3Service } from '../api/researchV3';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Feedback';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import {FileText, Trash2, Search, Plus, StickyNote, BookOpen, Calendar, ArrowUpRight, X} from 'lucide-react';
import { normalizeLibraryDocument, getSourceDisplayName } from '../lib/libraryDocument';
import type { SourceRead } from '../api/types';

interface NoteItem {
  id: string;
  document_id: string;
  text: string;
  page?: number;
  created_at: string;
  project_id: string;
  source_name: string;
}

export default function NotesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: sources, isLoading: sourcesLoading } = useSources(projectId!);

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filterDocId, setFilterDocId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [quickAddDocId, setQuickAddDocId] = useState<string | null>(null);
  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddPage, setQuickAddPage] = useState('');

  useEffect(() => {
    if (!sources || !projectId) return;
    let cancelled = false;
    setIsLoading(true);
    Promise.all(
      sources.map(async (source) => {
        const noteRows = await researchV3Service.getNotes(source.id);
        const doc = normalizeLibraryDocument(source);
        const name = doc?.title || source.id.slice(0, 8);
        return (noteRows as any[]).map((n) => ({
          ...n,
          source_name: name,
        })) as NoteItem[];
      }),
    ).then((results) => {
      if (cancelled) return;
      const flat = results.flat();
      setNotes(flat);
      setIsLoading(false);
    }).catch(() => {
      if (!cancelled) {
        toast.error('Failed to load notes');
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [sources, projectId]);

  const filteredNotes = useMemo(() => {
    let result = [...notes];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((n) => n.text.toLowerCase().includes(q));
    }
    if (filterDocId) {
      result = result.filter((n) => n.document_id === filterDocId);
    }
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return result;
  }, [notes, searchQuery, filterDocId, sortOrder]);

  const handleDelete = async (noteId: string) => {
    try {
      await researchV3Service.deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    }
    setDeleteConfirmId(null);
  };

  const handleQuickAdd = async (docId: string) => {
    if (!quickAddText.trim()) return;
    if (!projectId) return;
    try {
      const page = quickAddPage ? parseInt(quickAddPage, 10) : undefined;
      const result = await researchV3Service.addNote(projectId, docId, quickAddText.trim(), page);
      const source = sources?.find((s) => s.id === docId);
      const doc = normalizeLibraryDocument(source);
      const name = doc?.title || docId.slice(0, 8);
      const newNote: NoteItem = {
        id: (result as any).id,
        document_id: docId,
        text: quickAddText.trim(),
        page,
        created_at: (result as any).created_at || new Date().toISOString(),
        project_id: projectId,
        source_name: name,
      };
      setNotes((prev) => [newNote, ...prev]);
      setQuickAddText('');
      setQuickAddPage('');
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    }
  };

  const sourceMap = useMemo(() => {
    const map = new Map<string, SourceRead>();
    sources?.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  const getSourceName = (docId: string): string => {
    const source = sourceMap.get(docId);
    const doc = normalizeLibraryDocument(source);
    return doc?.title || docId.slice(0, 8);
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto h-full">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <StickyNote className="h-5 w-5 text-primary-text" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Notes</h1>
            <p className="text-sm text-muted mt-0.5">
              {isLoading ? 'Loading...' : `${notes.length} note${notes.length !== 1 ? 's' : ''} across ${sources?.length || 0} documents`}
            </p>
          </div>
          <Badge variant="default" className="ml-2 text-xs">{notes.length}</Badge>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="pl-9 text-sm bg-card border-border text-foreground placeholder:text-muted"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted">Sort:</span>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setSortOrder('newest')}
              className={cn('px-3 py-1.5 text-xs font-medium transition-colors', sortOrder === 'newest' ? 'bg-primary text-foreground' : 'bg-card text-muted hover:text-secondary')}
            >
              Newest
            </button>
            <button
              onClick={() => setSortOrder('oldest')}
              className={cn('px-3 py-1.5 text-xs font-medium transition-colors border-l border-border', sortOrder === 'oldest' ? 'bg-primary text-foreground' : 'bg-card text-muted hover:text-secondary')}
            >
              Oldest
            </button>
          </div>
        </div>
        {filterDocId && (
          <Button variant="outline" size="sm" onClick={() => setFilterDocId(null)} className="text-xs">
            <X className="h-3.5 w-3.5 mr-1" /> Clear filter
          </Button>
        )}
      </motion.div>

      {/* Content */}
      {isLoading || sourcesLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-28 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotes.length > 0 ? (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                variants={itemAnim}
                layout
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                className="group relative rounded-xl border border-border bg-card p-5 transition-all hover:border-elevated hover:shadow-lg hover:shadow-black/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Source badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => navigate(`/projects/${projectId}/library`)}
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary-text hover:bg-primary/20 transition-colors"
                      >
                        <BookOpen className="h-3 w-3" />
                        {note.source_name}
                        <ArrowUpRight className="h-3 w-3 ml-0.5" />
                      </button>
                      {note.page != null && (
                        <Badge variant="outline" className="text-3xs text-muted border-border">
                          p. {note.page}
                        </Badge>
                      )}
                    </div>
                    {/* Note text */}
                    <p className="text-sm text-secondary leading-relaxed">{note.text}</p>
                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(note.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={() => setDeleteConfirmId(note.id)}
                    className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/10 text-muted hover:text-danger-text"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No notes found"
          description={searchQuery ? "Try a different search term" : "Create your first note to get started"}
          action={!searchQuery && !filterDocId ? (
            <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${projectId}/library`)}>
              <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Go to Library
            </Button>
          ) : undefined}
        />
      )}

      {/* Document Filter Chips */}
      {sources && sources.length > 0 && notes.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-2 pt-2">
          <span className="text-xs text-muted self-center mr-1">Filter by document:</span>
          {sources.map((source) => {
            const name = getSourceDisplayName(source);
            const count = notes.filter((n) => n.document_id === source.id).length;
            if (count === 0) return null;
            return (
              <button
                key={source.id}
                onClick={() => setFilterDocId(filterDocId === source.id ? null : source.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  filterDocId === source.id
                    ? 'bg-primary/20 text-primary-text border border-primary/30'
                    : 'bg-background text-muted border border-border hover:text-secondary hover:border-elevated',
                )}
              >
                <FileText className="h-3 w-3" />
                {name}
                <span className="ml-0.5 opacity-60">({count})</span>
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Quick Add Section */}
      {sources && sources.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-4 w-4 text-primary-text" />
            <h3 className="text-sm font-medium text-foreground">Quick Add Note</h3>
          </div>
          {!quickAddDocId ? (
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => {
                const name = getSourceDisplayName(source);
                return (
                  <button
                    key={source.id}
                    onClick={() => setQuickAddDocId(source.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-background border border-border px-3 py-2 text-xs text-secondary hover:border-primary/50 hover:text-foreground transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted" />
                    {name}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Adding to:</span>
                <Badge variant="default" className="text-xs">
                  {getSourceName(quickAddDocId)}
                </Badge>
                <button
                  onClick={() => { setQuickAddDocId(null); setQuickAddText(''); setQuickAddPage(''); }}
                  className="text-xs text-muted hover:text-foreground underline ml-1"
                >
                  Change
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  placeholder="Write your note..."
                  className="flex-1 text-sm bg-background border-border text-foreground placeholder:text-muted"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(quickAddDocId!); }}
                />
                <Input
                  value={quickAddPage}
                  onChange={(e) => setQuickAddPage(e.target.value)}
                  placeholder="Page (opt)"
                  type="number"
                  min={1}
                  className="w-24 text-sm bg-background border-border text-foreground placeholder:text-muted"
                />
                <Button
                  size="sm"
                  onClick={() => handleQuickAdd(quickAddDocId!)}
                  disabled={!quickAddText.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Note
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription className="text-muted">
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-danger hover:bg-danger text-foreground"
              onClick={() => { if (deleteConfirmId) handleDelete(deleteConfirmId); }}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

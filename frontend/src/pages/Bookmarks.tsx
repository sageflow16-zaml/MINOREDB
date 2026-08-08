import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSources } from '../hooks/useSources';
import { researchV3Service } from '../api/researchV3';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageLayout, PageHeader, fadeSlideUp } from '../components/ui/PageLayout';
import { cn, formatDateTime, relativeTime } from '../lib/utils';
import toast from 'react-hot-toast';
import {
  FileText,
  Bookmark,
  Trash2,
  Search,
  BookMarked,
  Calendar,
  ArrowUpRight,
  X,
  ExternalLink,
  CornerDownRight,
} from 'lucide-react';
import type { SourceRead } from '../api/types';

interface BookmarkEntry {
  id: string;
  document_id: string;
  page: number;
  label?: string;
  created_at: string;
  source_name?: string;
}

type SortOrder = 'newest' | 'page' | 'document';

export default function BookmarksPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: sources, isLoading: sourcesLoading } = useSources(projectId!);

  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<BookmarkEntry | null>(null);

  const sourceMap = useMemo(() => {
    const map: Record<string, SourceRead> = {};
    if (sources) {
      for (const s of sources) {
        map[s.id] = s;
      }
    }
    return map;
  }, [sources]);

  const sourceName = useCallback(
    (documentId: string) => {
      const s = sourceMap[documentId];
      if (!s) return 'Unknown Document';
      const name = s.origin_type || s.attribution || `Source ${s.id.slice(0, 8)}`;
      return name;
    },
    [sourceMap]
  );

  useEffect(() => {
    if (!sources || !projectId) return;
    setIsLoading(true);

    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          sources.map(async (source) => {
            const items = await researchV3Service.getBookmarks(source.id);
            return items.map((b: any) => ({
              ...b,
              source_name: sourceName(source.id),
            }));
          })
        );
        const flat = results.flat();
        setBookmarks(flat);

        const expanded: Record<string, boolean> = {};
        for (const b of flat) {
          if (!expanded[b.document_id]) {
            expanded[b.document_id] = true;
          }
        }
        setExpandedDocs(expanded);
      } catch {
        toast.error('Failed to load bookmarks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [sources, projectId, sourceName]);

  const grouped = useMemo(() => {
    let filtered = bookmarks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = bookmarks.filter(
        (b) =>
          (b.label || '').toLowerCase().includes(q) ||
          String(b.page).includes(q) ||
          (b.source_name || '').toLowerCase().includes(q)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortOrder === 'page') {
        const cmp = a.page - b.page;
        if (cmp !== 0) return cmp;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      const nameCmp = (a.source_name || '').localeCompare(b.source_name || '');
      if (nameCmp !== 0) return nameCmp;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const groups: Record<string, BookmarkEntry[]> = {};
    for (const b of sorted) {
      const key = b.document_id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    }

    return Object.entries(groups)
      .map(([docId, entries]) => ({
        documentId: docId,
        sourceName: entries[0]?.source_name || sourceName(docId),
        entries,
      }))
      .sort((a, b) => a.sourceName.localeCompare(b.sourceName));
  }, [bookmarks, searchQuery, sortOrder, sourceName]);

  const totalBookmarks = bookmarks.length;

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await researchV3Service.removeBookmark(deleteTarget.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast.success('Bookmark removed');
    } catch {
      toast.error('Failed to remove bookmark');
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  const toggleDoc = useCallback((docId: string) => {
    setExpandedDocs((prev) => ({ ...prev, [docId]: !prev[docId] }));
  }, []);

  const isLoading_ = sourcesLoading || isLoading;

  return (
    <PageLayout maxWidth="lg">
      <PageHeader
        title="Bookmarks"
        description="All bookmarks across documents"
        actions={
          <Badge variant="secondary" size="lg" className="gap-1.5">
            <BookMarked className="h-3.5 w-3.5" />
            {totalBookmarks}
          </Badge>
        }
      />

      <motion.div variants={fadeSlideUp} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search bookmarks by label, page, or document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 bg-card border border-border rounded-lg p-1">
          {(['newest', 'page', 'document'] as SortOrder[]).map((order) => (
            <button
              key={order}
              onClick={() => setSortOrder(order)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                sortOrder === order
                  ? 'bg-elevated text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {order === 'newest'
                ? 'Newest'
                : order === 'page'
                  ? 'By Page'
                  : 'By Document'}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {isLoading_ ? (
          <motion.div
            key="loading"
            variants={fadeSlideUp}
            initial="initial"
            animate="animate"
            exit="initial"
            className="space-y-4"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <Skeleton className="h-5 w-48" />
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : totalBookmarks === 0 ? (
          <motion.div
            key="empty"
            variants={fadeSlideUp}
            initial="initial"
            animate="animate"
            exit="initial"
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="h-16 w-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
              <BookMarked className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1.5">
              No bookmarks yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Bookmark pages while reading documents in the Library.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            variants={fadeSlideUp}
            initial="initial"
            animate="animate"
            exit="initial"
            className="space-y-4"
          >
            {grouped.map((group) => (
              <motion.div
                key={group.documentId}
                layout
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => toggleDoc(group.documentId)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-elevated transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-primary-text" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {group.sourceName}
                      </span>
                    </div>
                    <Badge variant="secondary" size="sm" className="shrink-0">
                      {group.entries.length}
                    </Badge>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedDocs[group.documentId] ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {expandedDocs[group.documentId] && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border divide-y divide-border">
                        {group.entries.map((bookmark) => (
                          <motion.div
                            key={bookmark.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-4 px-4 py-3 hover:bg-elevated transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary-text font-bold text-sm shrink-0">
                                {bookmark.page}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  {bookmark.label && (
                                    <span className="text-sm text-foreground truncate">
                                      {bookmark.label}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {relativeTime(bookmark.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                asChild
                              >
                                <a
                                  href={`/projects/${projectId}/sources`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open document"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setDeleteTarget(bookmark)}
                                title="Remove bookmark"
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove Bookmark"
        message={
          deleteTarget
            ? `Remove bookmark on page ${deleteTarget.page}${deleteTarget.label ? ` - "${deleteTarget.label}"` : ''}?`
            : ''
        }
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageLayout>
  );
}

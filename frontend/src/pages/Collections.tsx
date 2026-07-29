import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useCollections, useCollectionDocuments } from '../hooks/useResearchV3';
import { researchV3Service } from '../api/researchV3';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState, ErrorState } from '../components/ui/Feedback';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import {
  FolderOpen, Library, BookOpen, Globe, Brain, Shield, FileText,
  Trash2, Search, ChevronRight, X, Microscope, Notebook,
} from 'lucide-react';

interface Collection {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  created_at: string;
}

interface CollectionDocumentMember {
  document_id: string;
  source: {
    id: string;
    name: string;
    raw_text: string;
    created_at: string;
  };
}

const collectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ict: Brain,
  'trading-journals': Notebook,
  macro: Globe,
  psychology: Brain,
  risk: Shield,
  books: BookOpen,
  'research-papers': Microscope,
};

const collectionColors: Record<string, string> = {
  ict: 'hsl(var(--chart-2))',
  'trading-journals': 'hsl(var(--chart-5))',
  macro: 'hsl(var(--warning))',
  psychology: 'hsl(var(--chart-4))',
  risk: 'hsl(var(--danger))',
  books: 'hsl(var(--chart-3))',
  'research-papers': 'hsl(var(--chart-1))',
};

function getWordCount(text?: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function getFileName(doc: CollectionDocumentMember): string {
  return doc.source.name || `Source ${doc.source.id.slice(0, 8)}`;
}

function getFileExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : 'TXT';
}

function getFileIcon(name: string) {
  const ext = getFileExtension(name);
  if (['PDF'].includes(ext)) return FileText;
  if (['DOCX', 'DOC'].includes(ext)) return FileText;
  if (['TXT', 'MD'].includes(ext)) return FileText;
  return FileText;
}

function getDefaultIcon(collection: Collection): React.ComponentType<{ className?: string; style?: React.CSSProperties }> {
  if (collection.icon && collectionIcons[collection.icon]) return collectionIcons[collection.icon];
  return FolderOpen;
}

function getDefaultColor(collection: Collection): string {
  if (collection.icon && collectionColors[collection.icon]) return collectionColors[collection.icon];
  return 'hsl(var(--chart-2))';
}

export default function CollectionsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const { data: collections, isLoading: collectionsLoading, error: collectionsError, refetch: refetchCollections } = useCollections(projectId!);

  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<CollectionDocumentMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: collectionDocuments, isLoading: documentsLoading } = useCollectionDocuments(selectedCollectionId);

  const removeMutation = useMutation({
    mutationFn: ({ documentId, collectionId }: { documentId: string; collectionId: string }) =>
      researchV3Service.removeFromCollection(projectId!, documentId, collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-documents', selectedCollectionId] });
      toast.success('Document removed from collection');
    },
    onError: () => toast.error('Failed to remove document'),
  });

  const selectedCollection = collections?.find((c: Collection) => c.id === selectedCollectionId) ?? null;

  const filteredDocuments = collectionDocuments
    ? (collectionDocuments as any[]).filter((d: CollectionDocumentMember) => {
        if (!searchQuery) return true;
        const name = getFileName(d).toLowerCase();
        return name.includes(searchQuery.toLowerCase());
      })
    : [];

  if (collectionsError) {
    return <ErrorState message="Failed to load collections" description={collectionsError?.message} onRetry={() => refetchCollections()} />;
  }

  if (collectionsLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <Skeleton className="h-7 w-36" />
        <div className="flex gap-5 h-[75vh]">
          <div className="w-72 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!collectionsLoading && (!collections || collections.length === 0)) {
    return <EmptyState icon={<FolderOpen className="h-6 w-6" />} title="No collections" description="Create a collection to organize your research documents" />;
  }

  const allCollections = collections || [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto h-full">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Collections</h1>
          <p className="text-sm text-muted mt-0.5">
            {allCollections.length} collections
          </p>
        </div>
      </motion.div>

      <div className="flex gap-5 min-h-[70vh]">
        {/* Left Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-72 shrink-0"
        >
          <div className="rounded-xl border border-border bg-surface p-3 flex flex-col gap-1">
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-2">
                <Library className="h-4 w-4 text-muted" />
                <span className="text-xs font-medium text-secondary">Collections</span>
              </div>
              <Badge variant="secondary" size="sm">{allCollections.length}</Badge>
            </div>
            <div className="space-y-1">
              {allCollections.map((collection: Collection, index: number) => {
                const Icon = getDefaultIcon(collection);
                const color = getDefaultColor(collection);
                const isActive = selectedCollectionId === collection.id;
                return (
                  <motion.button
                    key={collection.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedCollectionId(collection.id)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-background border border-transparent'
                    )}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ background: `color-mix(in srgb, ${color} 8%, transparent)` }}
                    >
                      <span className="h-4 w-4" style={{ color }}><Icon className="h-4 w-4" /></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium truncate',
                        isActive ? 'text-foreground' : 'text-secondary'
                      )}>
                        {collection.name}
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transition-all duration-200',
                        isActive ? 'text-primary opacity-100' : 'text-border opacity-0'
                      )}
                    />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Main Area */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex-1 min-w-0"
        >
          {selectedCollection ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCollection.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                {/* Collection Header */}
                <div className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{ background: `color-mix(in srgb, ${getDefaultColor(selectedCollection)} 8%, transparent)` }}
                      >
                        {(() => {
                          const Icon = getDefaultIcon(selectedCollection);
                          return <Icon className="h-6 w-6" style={{ color: getDefaultColor(selectedCollection) } as React.CSSProperties} />;
                        })()}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">{selectedCollection.name}</h2>
                        {selectedCollection.description && (
                          <p className="text-sm text-muted mt-0.5">{selectedCollection.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" size="lg">
                      {collectionDocuments?.length ?? 0} document{(collectionDocuments?.length ?? 0) !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search documents..."
                      className="w-full h-9 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Document Grid */}
                {documentsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                  </div>
                ) : filteredDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocuments.map((doc: any, index: number) => {
                      const fileName = getFileName(doc);
                      const ext = getFileExtension(fileName);
                      const Icon = getFileIcon(fileName);
                      return (
                        <motion.button
                          key={doc.document_id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => setPreviewDocument(doc)}
                          className="group relative rounded-xl border border-border bg-surface p-4 text-left hover:border-border transition-all duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background">
                              <Icon className="h-5 w-5 text-muted" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-2xs text-muted">
                                  {getWordCount(doc.source.raw_text).toLocaleString()} words
                                </span>
                                <span className="text-2xs text-border">·</span>
                                <span className="text-2xs text-muted">
                                  {new Date(doc.source.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <Badge variant="outline" size="sm" className="mt-2">{ext}</Badge>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMutation.mutate({
                                documentId: doc.document_id,
                                collectionId: selectedCollection.id,
                              });
                            }}
                            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-danger/10 hover:bg-danger/20 text-danger"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background">
                      <FolderOpen className="h-6 w-6 text-muted" />
                    </div>
                    <h3 className="text-sm font-medium text-foreground">No documents in this collection</h3>
                    <p className="text-xs text-muted mt-1.5 max-w-sm">
                      Upload documents and add them from the Library.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            /* No collection selected - show grid of all collections */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-semibold text-foreground">Browse Collections</h2>
                <p className="text-sm text-muted mt-0.5">Select a collection to view its documents</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCollections.map((collection: Collection, index: number) => {
                  const Icon = getDefaultIcon(collection);
                  const color = getDefaultColor(collection);
                  return (
                    <motion.button
                      key={collection.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => setSelectedCollectionId(collection.id)}
                      className="group rounded-xl border border-border bg-surface p-5 text-left hover:border-border transition-all duration-200"
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl mb-4"
                        style={{ background: `color-mix(in srgb, ${color} 8%, transparent)` }}
                      >
                        <Icon className="h-6 w-6" style={{ color } as React.CSSProperties} />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-white transition-colors">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-xs text-muted mt-1.5 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Document Preview Dialog */}
      <AnimatePresence>
        {previewDocument && (
          <Dialog open={!!previewDocument} onOpenChange={(open) => { if (!open) setPreviewDocument(null); }}>
            <DialogContent className="sm:max-w-2xl bg-background border-border text-foreground">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5 text-muted" />
                  {getFileName(previewDocument)}
                </DialogTitle>
                <DialogDescription className="text-muted">
                  {getWordCount(previewDocument.source.raw_text).toLocaleString()} words · {new Date(previewDocument.source.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[50vh] overflow-y-auto rounded-lg bg-background p-4">
                <pre className="text-sm text-secondary whitespace-pre-wrap font-sans leading-relaxed">
                  {previewDocument.source.raw_text || 'No text content available.'}
                </pre>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Badge variant="outline" size="sm">
                  {getFileExtension(getFileName(previewDocument))}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectedCollection) {
                      removeMutation.mutate({
                        documentId: previewDocument.document_id,
                        collectionId: selectedCollection.id,
                      });
                      setPreviewDocument(null);
                    }
                  }}
                  className="text-danger hover:text-danger hover:bg-danger/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Remove from collection
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { cn } from '../lib/utils';
import { useNotebooks, useCreateNotebookEntry, useDeleteNotebookEntry } from '../hooks/useQuantResearch';
import {
  BookOpen, Plus, Trash2, FileText, BarChart3,
  Code, MessageSquare, CheckCircle2, Link2,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const typeIcons: Record<string, any> = {
  markdown: FileText,
  chart: BarChart3,
  table: FileText,
  code: Code,
  observation: MessageSquare,
  conclusion: CheckCircle2,
};

const typeColors: Record<string, string> = {
  markdown: 'bg-muted text-muted-foreground',
  chart: 'bg-primary/10 text-primary',
  table: 'bg-info/10 text-info',
  code: 'bg-warning/10 text-warning',
  observation: 'bg-success/10 text-success',
  conclusion: 'bg-destructive/10 text-destructive',
};

export default function QuantNotebooks() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', content_type: 'markdown' });

  const { data: notebooks = [], isLoading, error } = useNotebooks(projectId!);
  const createEntry = useCreateNotebookEntry(projectId!);
  const deleteEntry = useDeleteNotebookEntry(projectId!);

  const handleCreate = () => {
    createEntry.mutate(form, {
      onSuccess: () => { setShowCreate(false); setForm({ title: '', content: '', content_type: 'markdown' }); },
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load notebooks" />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Research Notebook"
        description="Document observations, conclusions, and insights from your research"
        actions={<Button onClick={() => setShowCreate(!showCreate)}><Plus className="w-4 h-4 mr-2" />New Entry</Button>}
      />

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader><CardTitle>New Notebook Entry</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div><label className="text-xs font-medium mb-1 block">Title</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Research observation..." /></div>
                <div><label className="text-xs font-medium mb-1 block">Type</label>
                  <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value })}>
                    <option value="markdown">Markdown Note</option>
                    <option value="observation">Observation</option>
                    <option value="conclusion">Conclusion</option>
                    <option value="chart">Chart Reference</option>
                    <option value="table">Table</option>
                    <option value="code">Code Snippet</option>
                  </select>
                </div>
                <div><label className="text-xs font-medium mb-1 block">Content</label>
                  <textarea className="w-full min-h-[150px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                    value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your research notes here..." />
                </div>
                <Button onClick={handleCreate} disabled={!form.title || createEntry.isPending}>
                  {createEntry.isPending ? 'Saving...' : 'Save Entry'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {notebooks.length === 0 ? (
        <EmptyState title="No notebook entries" message="Start documenting your research" icon={<BookOpen className="h-6 w-6" />} />
      ) : (
        <div className="space-y-3">
          {notebooks.map((entry) => {
            const Icon = typeIcons[entry.content_type] || FileText;
            return (
              <motion.div key={entry.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={cn('cursor-pointer transition-all', expandedId === entry.id ? 'ring-1 ring-primary' : '')}
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn('p-2 rounded-lg mt-0.5', typeColors[entry.content_type] || 'bg-muted')}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm">{entry.title}</h3>
                            <Badge variant="outline" className="text-xs">{entry.content_type}</Badge>
                            {entry.tags && entry.tags.length > 0 && entry.tags.slice(0, 3).map((t: string) => (
                              <Badge key={t} variant="outline" className="text-xs bg-muted">{t}</Badge>
                            ))}
                          </div>
                          {expandedId === entry.id && entry.content && (
                            <div className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground border-t border-border pt-3">
                              {entry.content}
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteEntry.mutate(entry.id); }}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive ml-2">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {entry.linked_run_ids && Object.keys(entry.linked_run_ids).length > 0 && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Link2 className="w-3 h-3" />
                        {Object.entries(entry.linked_run_ids).map(([k, v]) => (
                          <Badge key={k} variant="outline" className="text-xs">{k}: {String(v).slice(0, 8)}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

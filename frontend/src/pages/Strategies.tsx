import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Alert } from '../components/ui/alert';
import { useStrategies, useDeleteStrategy, useDuplicateStrategy } from '../hooks/useStrategies';
import {
  BookOpen, Plus, Search, Trash2, Copy, Archive,
  Eye, Layers, TrendingUp, Clock, Target,
} from 'lucide-react';
import { cn } from '../lib/utils';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'info' | 'destructive'> = {
  Draft: 'default',
  Active: 'success',
  Archived: 'warning',
};

const categoryOptions = ['Trend Following', 'Mean Reversion', 'Breakout', 'Scalping', 'Swing', 'Position', 'ICT', 'Supply & Demand', 'Order Flow', 'Custom'];

export default function StrategiesPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);

  const { data: strategies, isLoading, error, refetch } = useStrategies(projectId!, { search: search || undefined, status: statusFilter || undefined, category: categoryFilter || undefined });
  const deleteStrategy = useDeleteStrategy(projectId!);
  const duplicateStrategy = useDuplicateStrategy(projectId!);

  const filtered = useMemo(() => {
    if (!strategies) return [];
    return strategies.filter((s) => {
      if (search && !s.name?.toLowerCase().includes(search.toLowerCase()) && !s.description?.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (categoryFilter && s.category !== categoryFilter) return false;
      return true;
    });
  }, [strategies, search, statusFilter, categoryFilter]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading strategies." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Strategy Library" description="Create, test, document, and improve your trading strategies.">
        <Button onClick={() => navigate(`/projects/${projectId}/strategies/new`)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> New Strategy
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search strategies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              placeholder="All Status"
              className="w-[140px]"
              options={[
                { value: '', label: 'All Status' },
                { value: 'Draft', label: 'Draft' },
                { value: 'Active', label: 'Active' },
                { value: 'Archived', label: 'Archived' },
              ]}
            />
            <Select
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v)}
              placeholder="All Categories"
              className="w-[160px]"
              options={[
                { value: '', label: 'All Categories' },
                ...categoryOptions.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Strategy Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No strategies found"
          description={strategies?.length === 0 ? 'Create your first strategy to document your trading methodology.' : 'Try adjusting your search or filters.'}
          action={<Button size="sm" onClick={() => navigate(`/projects/${projectId}/strategies/new`)}>Create Strategy</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((strategy, i) => (
            <motion.div
              key={strategy.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 h-full"
                onClick={() => navigate(`/projects/${projectId}/strategies/${strategy.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-sm font-semibold truncate">{strategy.name || 'Untitled'}</CardTitle>
                        <Badge variant={statusColors[strategy.status || 'Draft'] || 'default'} size="sm">
                          {strategy.status || 'Draft'}
                        </Badge>
                      </div>
                      {strategy.category && (
                        <span className="text-[11px] text-muted-foreground">{strategy.category}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDuplicateId(strategy.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(strategy.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {strategy.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{strategy.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {strategy.version && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <Layers className="h-3 w-3" /> v{strategy.version}
                      </span>
                    )}
                    {strategy.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="inline-flex items-center rounded-md bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {tag}
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground ml-auto">
                      {strategy.trades_count ?? 0} trades
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        title="Delete Strategy"
        message="This will permanently delete this strategy. Trades linked to it will not be affected."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteId) { deleteStrategy.mutate(deleteId); setDeleteId(null); }
        }}
      />

      {/* Duplicate Confirmation */}
      <ConfirmDialog
        isOpen={!!duplicateId}
        onCancel={() => setDuplicateId(null)}
        title="Duplicate Strategy"
        message="Create a copy of this strategy as a new Draft."
        confirmLabel="Duplicate"
        onConfirm={() => {
          if (duplicateId) { duplicateStrategy.mutate(duplicateId); setDuplicateId(null); }
        }}
      />
    </div>
  );
}

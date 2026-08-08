import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { cn } from '../lib/utils';
import {
  useWatchlists, useCreateWatchlist, useDeleteWatchlist,
  useWatchlistItems, useAddWatchlistItem, useDeleteWatchlistItem,
} from '../hooks/useMarketIntelligence';
import type { Watchlist, WatchlistItem } from '../api/types';
import { Star, Plus, Trash2, X, ChevronRight, Eye, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const BIAS_COLORS: Record<string, string> = {
  bullish: 'text-emerald-500',
  bearish: 'text-red-500',
  neutral: 'text-muted-foreground',
};

export default function WatchlistPage() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [activeWl, setActiveWl] = useState<string | null>(null);
  const [showCreateWl, setShowCreateWl] = useState(false);
  const [newWlName, setNewWlName] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState({ symbol: '', bias: 'neutral', notes: '' });

  const { data: watchlists = [], isLoading } = useWatchlists(projectId!);
  const createWlMutation = useCreateWatchlist(projectId!);
  const deleteWlMutation = useDeleteWatchlist(projectId!);
  const { data: items = [] } = useWatchlistItems(projectId!, activeWl ?? '');
  const addItemMutation = useAddWatchlistItem(projectId!);
  const deleteItemMutation = useDeleteWatchlistItem(projectId!);

  const handleCreateWl = () => {
    if (!newWlName.trim()) return;
    createWlMutation.mutate({ name: newWlName });
    setNewWlName('');
    setShowCreateWl(false);
  };

  const handleAddItem = () => {
    if (!itemForm.symbol.trim() || !activeWl) return;
    addItemMutation.mutate({ watchlistId: activeWl, data: { symbol: itemForm.symbol.toUpperCase(), bias: itemForm.bias, notes: itemForm.notes || undefined } });
    setItemForm({ symbol: '', bias: 'neutral', notes: '' });
    setShowAddItem(false);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Watchlist"
        description="Track symbols with bias, levels and risk/reward"
        actions={
          <Button size="sm" onClick={() => setShowCreateWl(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New Watchlist
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar — watchlist tabs */}
        <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-1 space-y-2">
          {watchlists.map((wl: Watchlist) => (
            <motion.div key={wl.id} variants={item}>
              <button
                onClick={() => setActiveWl(wl.id)}
                className={cn(
                  'w-full flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors',
                  activeWl === wl.id ? 'border-primary bg-primary/5 text-primary-text' : 'border-border/50 hover:border-border text-foreground',
                )}
              >
                <span className="font-medium truncate">{wl.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{wl.items?.length ?? 0}</span>
                  {!wl.is_default && (
                    <button onClick={(e) => { e.stopPropagation(); deleteWlMutation.mutate(wl.id); }}
                      className="p-0.5 rounded hover:bg-destructive/10">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  )}
                </div>
              </button>
            </motion.div>
          ))}
          {watchlists.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No watchlists yet</p>
          )}
        </motion.div>

        {/* Main content */}
        <div className="lg:col-span-3">
          {activeWl ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium">
                  {watchlists.find((w: Watchlist) => w.id === activeWl)?.name ?? 'Watchlist'}
                </CardTitle>
                <Button size="sm" onClick={() => setShowAddItem(true)}>
                  <Plus className="h-4 w-4 mr-1.5" /> Add Symbol
                </Button>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="space-y-2">
                    {items.map((it: WatchlistItem) => (
                      <div key={it.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3">
                        <span className="text-sm font-mono font-semibold text-foreground w-20">{it.symbol}</span>
                        <span className={cn('text-xs font-medium capitalize', BIAS_COLORS[it.bias ?? 'neutral'])}>
                          {it.bias === 'bullish' && <TrendingUp className="inline h-3 w-3 mr-0.5" />}
                          {it.bias === 'bearish' && <TrendingDown className="inline h-3 w-3 mr-0.5" />}
                          {it.bias ?? 'neutral'}
                        </span>
                        {it.current_price != null && (
                          <span className="text-sm text-muted-foreground">{it.current_price}</span>
                        )}
                        {it.risk_reward != null && (
                          <Badge variant={it.risk_reward >= 2 ? 'success' : it.risk_reward >= 1 ? 'warning' : 'destructive'}>
                            R:R {it.risk_reward.toFixed(1)}
                          </Badge>
                        )}
                        {it.notes && <span className="text-xs text-muted-foreground flex-1 truncate">{it.notes}</span>}
                        <button onClick={() => deleteItemMutation.mutate(it.id)} className="p-1 rounded hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <EmptyState />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Watchlist dialog */}
      {showCreateWl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-foreground">New Watchlist</h3>
            <input placeholder="Watchlist name" value={newWlName} onChange={(e) => setNewWlName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWl()} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateWl(false)}>Cancel</Button>
              <Button onClick={handleCreateWl} disabled={!newWlName.trim()}>Create</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Item dialog */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Add Symbol</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddItem(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              <input placeholder="Symbol (e.g. EURUSD)" value={itemForm.symbol}
                onChange={(e) => setItemForm({ ...itemForm, symbol: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" />
              <select value={itemForm.bias} onChange={(e) => setItemForm({ ...itemForm, bias: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="bullish">Bullish</option>
                <option value="bearish">Bearish</option>
                <option value="neutral">Neutral</option>
              </select>
              <textarea placeholder="Notes (optional)" value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm h-16 resize-none" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddItem(false)}>Cancel</Button>
              <Button onClick={handleAddItem} disabled={!itemForm.symbol.trim()}>Add</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { cn } from '../../lib/utils';
import { Search, Star, Plus, TrendingUp, TrendingDown } from 'lucide-react';

export function Watchlist() {
  const { state, dispatch } = useWorkspace();
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['EURUSD', 'XAUUSD', 'BTCUSD']);

  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) => prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]);
  };

  const items = state.watchlist.filter((w) =>
    w.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Watchlist</h3>
        <button className="p-0.5 rounded hover:bg-muted transition-colors">
          <Plus className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symbols..."
          className="w-full pl-7 pr-2 py-1 text-xs bg-muted/50 border border-border rounded-md outline-none focus:border-primary/50"
        />
      </div>
      <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
        {items.map((item) => {
          return (
            <div
              key={item.symbol}
              onClick={() => dispatch({ type: 'SYNC_SYMBOL', symbol: item.symbol })}
              className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(item.symbol); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Star className={cn('w-3 h-3', favorites.includes(item.symbol) ? 'text-warning fill-warning' : 'text-muted-foreground')} />
                </button>
                <span className={cn(
                  'text-xs font-medium',
                  state.layout.chartConfigs['chart-0']?.symbol === item.symbol && 'text-primary'
                )}>
                  {item.symbol}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">—</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

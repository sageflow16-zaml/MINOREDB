import { useState } from 'react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { cn } from '../../lib/utils';
import { Search, Star } from 'lucide-react';

const FAVORITES_KEY = 'minore_watchlist_favorites';

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : ['EURUSD', 'XAUUSD', 'BTCUSD'];
  } catch {
    return ['EURUSD', 'XAUUSD', 'BTCUSD'];
  }
}

function saveFavorites(favorites: string[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {}
}

export function Watchlist() {
  const { state, dispatch } = useWorkspace();
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) => {
      const next = prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol];
      saveFavorites(next);
      return next;
    });
  };

  const items = state.watchlist.filter((w) =>
    w.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <Star className="w-3.5 h-3.5" /> Watchlist
      </h3>
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symbols..."
          className="w-full pl-7 pr-2 py-1 text-xs bg-muted/50 border border-border rounded-md outline-none focus:border-primary/50"
        />
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto">
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-4 px-2">
            <Search className="w-6 h-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground text-center">No symbols match your search.</p>
          </div>
        )}
        {items.map((item) => (
          <div
            key={item.symbol}
            onClick={() => dispatch({ type: 'SET_SYMBOL', panelId: 'chart-main', symbol: item.symbol })}
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
                state.layout.chartConfigs['chart-main']?.symbol === item.symbol && 'text-primary'
              )}>
                {item.symbol}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">—</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

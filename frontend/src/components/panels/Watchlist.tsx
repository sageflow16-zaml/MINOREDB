import { useState, useMemo } from 'react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { cn, safeToFixed } from '../../lib/utils';
import { Search, Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

const CATEGORIES = ['All', 'Favorites', 'Forex', 'Indices', 'Crypto', 'Commodities'] as const;
type Category = (typeof CATEGORIES)[number];

const SYMBOL_CATEGORY: Record<string, Category> = {
  EURUSD: 'Forex', GBPUSD: 'Forex', USDJPY: 'Forex', AUDUSD: 'Forex',
  USDCAD: 'Forex', NZDUSD: 'Forex', EURJPY: 'Forex', GBPJPY: 'Forex',
  XAUUSD: 'Commodities', XAGUSD: 'Commodities', BTCUSD: 'Crypto',
  ETHUSD: 'Crypto', US30: 'Indices', SPX500: 'Indices', NASDAQ: 'Indices',
  DAX40: 'Indices', FTSE100: 'Indices',
};

export function Watchlist() {
  const { state, dispatch } = useWorkspace();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) => {
      const next = prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol];
      saveFavorites(next);
      return next;
    });
  };

  const activeSymbol = state.activePanel
    ? state.layout.chartConfigs[state.activePanel]?.symbol
    : state.layout.chartConfigs[Object.keys(state.layout.chartConfigs)[0]]?.symbol;

  const items = useMemo(() => {
    let filtered = state.watchlist;
    if (search) filtered = filtered.filter((w) => w.symbol.toLowerCase().includes(search.toLowerCase()));
    if (category === 'Favorites') filtered = filtered.filter((w) => favorites.includes(w.symbol));
    else if (category !== 'All') filtered = filtered.filter((w) => SYMBOL_CATEGORY[w.symbol] === category);
    return filtered;
  }, [state.watchlist, search, category, favorites]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Star className="w-3.5 h-3.5" /> Watchlist
        </h3>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="text-[10px] bg-transparent border border-border rounded px-1 py-0.5 text-muted-foreground outline-none"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
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
      <div className="flex-1 space-y-0.5 overflow-y-auto">
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-4 px-2">
            <Search className="w-6 h-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground text-center">No symbols match.</p>
          </div>
        )}
        {items.map((item) => {
          const isActive = activeSymbol === item.symbol;
          const isFav = favorites.includes(item.symbol);
          const cat = SYMBOL_CATEGORY[item.symbol];
          return (
            <div
              key={item.symbol}
              onClick={() => {
                const targetPanel = state.activePanel && state.layout.chartConfigs[state.activePanel]
                  ? state.activePanel
                  : Object.keys(state.layout.chartConfigs)[0];
                dispatch({ type: 'SET_SYMBOL', panelId: targetPanel, symbol: item.symbol });
              }}
              className={cn(
                'flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors group',
                isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(item.symbol); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <Star className={cn('w-3 h-3', isFav ? 'text-warning fill-warning' : 'text-muted-foreground')} />
                </button>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={cn('text-xs font-medium truncate', isActive && 'text-primary')}>
                    {item.symbol}
                  </span>
                  {cat && <span className="text-[9px] text-muted-foreground/50 px-1 rounded bg-muted/30 shrink-0">{cat.slice(0, 3)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.last > 0 && (
                  <span className="text-xs font-mono text-muted-foreground">
                    {safeToFixed(item.last, item.last > 100 ? 2 : item.last > 1 ? 4 : 6)}
                  </span>
                )}
                {item.change !== 0 && (
                  <span className={cn(
                    'text-[11px] font-mono flex items-center gap-0.5',
                    item.change > 0 ? 'text-success' : item.change < 0 ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {item.change > 0 ? <TrendingUp className="w-2.5 h-2.5" />
                      : item.change < 0 ? <TrendingDown className="w-2.5 h-2.5" />
                      : <Minus className="w-2.5 h-2.5" />}
                    {safeToFixed(item.changePercent, 2)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

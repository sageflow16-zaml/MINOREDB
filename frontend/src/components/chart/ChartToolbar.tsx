import { useState, useRef, useEffect } from 'react';
import {Search, ChevronDown, Layers, Clock} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Timeframe } from '../workspace/types';

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD'];

interface ChartToolbarProps {
  symbol: string;
  timeframe: Timeframe;
  onSymbolChange: (s: string) => void;
  onTimeframeChange: (tf: string) => void;
  showICT: boolean;
  showSessions: boolean;
  onToggleICT: () => void;
  onToggleSessions: () => void;
}

export function ChartToolbar({
  symbol, timeframe, onSymbolChange, onTimeframeChange,
  showICT, showSessions, onToggleICT, onToggleSessions,
}: ChartToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = SYMBOLS.filter((s) => s.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-muted/20 shrink-0">
      {/* Symbol selector */}
      <div ref={searchRef} className="relative">
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded hover:bg-muted transition-colors"
        >
          {symbol}
          <ChevronDown className="w-3 h-3" />
        </button>
        {searchOpen && (
          <div className="absolute top-full left-0 mt-1 w-36 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-1 border-b border-border">
              <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground">
                <Search className="w-3 h-3" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs"
                  placeholder="Search..."
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.map((s) => (
                <button
                  key={s}
                  onClick={() => { onSymbolChange(s); setSearchOpen(false); setSearch(''); }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors',
                    s === symbol && 'bg-muted text-primary-text font-medium'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeframes */}
      <div className="flex items-center gap-0.5 ml-2 border-l border-border pl-2">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={cn(
              'px-1.5 py-0.5 text-3xs font-medium rounded hover:bg-muted transition-colors',
              timeframe === tf && 'bg-muted text-primary-text'
            )}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Overlay toggles */}
      <div className="flex items-center gap-0.5 ml-auto">
        <button
          onClick={onToggleICT}
          className={cn('flex items-center gap-1 px-2 py-0.5 text-3xs rounded hover:bg-muted transition-colors', showICT && 'bg-muted text-primary-text')}
        >
          <Layers className="w-3 h-3" />
          ICT
        </button>
        <button
          onClick={onToggleSessions}
          className={cn('flex items-center gap-1 px-2 py-0.5 text-3xs rounded hover:bg-muted transition-colors', showSessions && 'bg-muted text-primary-text')}
        >
          <Clock className="w-3 h-3" />
          Sessions
        </button>
      </div>
    </div>
  );
}

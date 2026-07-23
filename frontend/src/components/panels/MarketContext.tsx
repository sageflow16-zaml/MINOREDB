import { Badge } from '../ui/badge';
import { Globe, TrendingUp, TrendingDown, Activity, BarChart3, DollarSign, Zap, Flame } from 'lucide-react';
import { cn } from '../../lib/utils';

const marketData = [
  { label: 'DXY', value: '104.32', change: '+0.15' },
  { label: 'US10Y', value: '4.28%', change: '-0.02' },
  { label: 'US02Y', value: '4.63%', change: '+0.01' },
  { label: 'VIX', value: '14.25', change: '-0.85' },
  { label: 'XAUUSD', value: '2,348.50', change: '+12.30' },
  { label: 'USOIL', value: '78.45', change: '-0.60' },
];

const news = [
  { time: '09:30', headline: 'US Non-Farm Payrolls beat expectations by 28K', impact: 'high' },
  { time: '08:00', headline: 'ECB holds rates steady at 4.25% as expected', impact: 'medium' },
  { time: '07:15', headline: 'ISM Services PMI rises to 54.2 vs 53.8 forecast', impact: 'high' },
];

export function MarketContext() {
  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <Globe className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Market Context</h3>
      </div>

      {/* Market data grid */}
      <div className="grid grid-cols-2 gap-1 mb-3">
        {marketData.map((m) => {
          const isUp = m.change.startsWith('+');
          return (
            <div key={m.label} className="flex items-center justify-between px-2 py-1 rounded border bg-card/50">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono">{m.value}</span>
                <span className={cn('text-[10px] flex items-center', isUp ? 'text-success' : 'text-destructive')}>
                  {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {m.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Regime indicator */}
      <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg border bg-card/50">
        <Activity className="w-3.5 h-3.5 text-warning" />
        <div className="flex-1">
          <div className="text-[10px] text-muted-foreground">Market Regime</div>
          <div className="text-xs font-semibold text-warning">Trending / Risk-On</div>
        </div>
        <Badge variant="outline" className="text-[10px]">High Vol</Badge>
      </div>

      {/* News */}
      <div>
        <h4 className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
          <Flame className="w-2.5 h-2.5" /> Latest News
        </h4>
        <div className="space-y-1">
          {news.map((n, i) => (
            <div key={i} className="px-2 py-1 rounded hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] text-muted-foreground">{n.time}</span>
                <Badge variant="outline" className={cn('text-[8px] px-1 py-0',
                  n.impact === 'high' ? 'border-destructive/30 text-destructive' : 'border-warning/30 text-warning'
                )}>
                  {n.impact}
                </Badge>
              </div>
              <p className="text-[11px] leading-tight">{n.headline}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

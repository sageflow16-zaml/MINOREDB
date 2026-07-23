import { useState } from 'react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import {
  Wallet, TrendingUp, TrendingDown, Percent, Gauge,
  Plus, Minus, X, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

export function ExecutionPanel() {
  const { state, dispatch } = useWorkspace();
  const { execution } = state;
  const [positionSize, setPositionSize] = useState('1.0');
  const [stopLoss, setStopLoss] = useState('20');
  const [takeProfit, setTakeProfit] = useState('40');

  const risk = parseFloat(positionSize) * parseFloat(stopLoss);
  const reward = parseFloat(positionSize) * parseFloat(takeProfit);
  const rr = stopLoss && takeProfit ? (parseFloat(takeProfit) / parseFloat(stopLoss)).toFixed(2) : '-';

  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <Wallet className="w-3 h-3" /> Execution
      </h3>

      {/* Account info */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        <div className="p-1.5 rounded border bg-card/50">
          <div className="text-[10px] text-muted-foreground">Balance</div>
          <div className="text-sm font-bold font-mono">${execution.balance.toLocaleString()}</div>
        </div>
        <div className="p-1.5 rounded border bg-card/50">
          <div className="text-[10px] text-muted-foreground">Equity</div>
          <div className="text-sm font-bold font-mono text-success">${execution.equity.toLocaleString()}</div>
        </div>
      </div>

      {/* Quick trade buttons */}
      <div className="flex gap-1 mb-2">
        <Button size="sm" className="flex-1 h-7 text-[11px] bg-success hover:bg-success/90">
          <TrendingUp className="w-3 h-3 mr-1" /> Buy
        </Button>
        <Button size="sm" className="flex-1 h-7 text-[11px] bg-destructive hover:bg-destructive/90">
          <TrendingDown className="w-3 h-3 mr-1" /> Sell
        </Button>
      </div>

      {/* Position size calculator */}
      <div className="space-y-1.5 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Size (lots)</span>
          <div className="flex items-center gap-1">
            <button className="p-0.5 rounded hover:bg-muted"><Minus className="w-2.5 h-2.5" /></button>
            <span className="text-xs font-mono w-8 text-center">{positionSize}</span>
            <button className="p-0.5 rounded hover:bg-muted"><Plus className="w-2.5 h-2.5" /></button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Stop Loss</span>
          <Input
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="w-16 h-6 text-xs text-right font-mono"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Take Profit</span>
          <Input
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            className="w-16 h-6 text-xs text-right font-mono"
          />
        </div>
      </div>

      {/* Risk summary */}
      <div className="grid grid-cols-3 gap-1 mb-2">
        <div className="p-1 rounded border bg-card/50 text-center">
          <div className="text-[10px] text-muted-foreground">Risk</div>
          <div className="text-xs font-bold font-mono text-destructive">${risk.toFixed(0)}</div>
        </div>
        <div className="p-1 rounded border bg-card/50 text-center">
          <div className="text-[10px] text-muted-foreground">Reward</div>
          <div className="text-xs font-bold font-mono text-success">${reward.toFixed(0)}</div>
        </div>
        <div className="p-1 rounded border bg-card/50 text-center">
          <div className="text-[10px] text-muted-foreground">R:R</div>
          <div className="text-xs font-bold font-mono">{rr}</div>
        </div>
      </div>

      {/* Open positions */}
      {execution.openPositions.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold text-muted-foreground mb-1">Open Positions</h4>
          {execution.openPositions.map((pos) => (
            <div key={pos.id} className="flex items-center justify-between px-2 py-1 rounded bg-card/50 mb-0.5">
              <div className="flex items-center gap-1">
                {pos.type === 'buy' ? <ArrowUpRight className="w-3 h-3 text-success" /> : <ArrowDownRight className="w-3 h-3 text-destructive" />}
                <span className="text-xs font-medium">{pos.symbol}</span>
                <span className="text-[10px] text-muted-foreground">{pos.volume} lots</span>
              </div>
              <span className={cn('text-xs font-mono', pos.profit >= 0 ? 'text-success' : 'text-destructive')}>
                ${pos.profit.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Journal button */}
      <Button variant="outline" size="sm" className="w-full h-7 text-[11px] mt-2">
        <Plus className="w-3 h-3 mr-1" /> Journal Trade
      </Button>
    </div>
  );
}

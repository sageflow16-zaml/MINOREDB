import { useWorkspace } from '../workspace/WorkspaceContext';
import { Switch } from '../ui/switch';
import { Layers, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

const overlayLabels: Record<string, string> = {
  fvg: 'Fair Value Gaps',
  order_block: 'Order Blocks',
  breaker_block: 'Breaker Blocks',
  mitigation_block: 'Mitigation Blocks',
  bpr: 'Balanced Price Ranges',
  liquidity_pool: 'Liquidity Pools',
  equal_high: 'Equal Highs',
  equal_low: 'Equal Lows',
  premium_discount: 'Premium / Discount',
  pdh: 'Previous Day High/Low',
  pdl: 'Previous Day Low',
  weekly_hl: 'Weekly High/Low',
  monthly_hl: 'Monthly High/Low',
};

export function ICTControls() {
  const { state, dispatch } = useWorkspace();
  const activePanel = state.activePanel || 'chart-0';
  const overlays = state.ictOverlays[activePanel] || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Layers className="w-3 h-3" /> ICT Overlays
        </h3>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_ICT', panelId: activePanel })}
          className="text-3xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {state.layout.chartConfigs[activePanel]?.showICT ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
      </div>
      <div className="space-y-1">
        {overlays.map((overlay) => (
          <div key={overlay.type} className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: overlay.color }} />
              <span className="text-2xs">{overlayLabels[overlay.type] || overlay.type}</span>
            </div>
            <Switch
              checked={overlay.visible}
              onCheckedChange={() => dispatch({ type: 'TOGGLE_ICT_OVERLAY', panelId: activePanel, overlayType: overlay.type })}
              className="scale-75"
            />
          </div>
        ))}
      </div>

      {/* Session controls */}
      <div className="mt-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-3xs font-semibold text-muted-foreground uppercase">Sessions</h4>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SESSION', panelId: activePanel })}
            className="text-3xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {state.layout.chartConfigs[activePanel]?.showSessions ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
        </div>
        <div className="space-y-1">
          {[
{ session: 'asia', label: 'Asia Session', color: 'hsl(var(--chart-1))' },
{ session: 'london', label: 'London Session', color: 'hsl(var(--warning))' },
{ session: 'new_york', label: 'New York Session', color: 'hsl(var(--danger))' },
{ session: 'kill_zone_london', label: 'London Kill Zone', color: 'hsl(var(--warning))' },
{ session: 'kill_zone_new_york', label: 'NY Kill Zone', color: 'hsl(var(--danger))' },
{ session: 'silver_bullet', label: 'Silver Bullet', color: 'hsl(var(--success))' },
          ].map((s) => (
            <div key={s.session} className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-2xs">{s.label}</span>
              </div>
              <Switch
                checked={
                  state.sessionOverlays[activePanel]?.find((o) => o.session === s.session)?.visible ?? false
                }
                onCheckedChange={() => {
                  /* toggle session overlay */
                }}
                className="scale-75"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

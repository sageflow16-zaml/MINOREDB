import { useState } from 'react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { cn } from '../../lib/utils';
import {
  Pencil, Minus, Square, ArrowUpRight, Circle,
  TrendingUp, Target, Droplets, GripHorizontal,
  MousePointer2, Image, Camera,
} from 'lucide-react';
import type { DrawingType } from '../workspace/types';

interface DrawingTool {
  type: DrawingType;
  icon: typeof Pencil;
  label: string;
  shortcut?: string;
}

const tools: DrawingTool[] = [
  { type: 'trendline', icon: TrendingUp, label: 'Trendline', shortcut: 'T' },
  { type: 'horizontal', icon: Minus, label: 'Horizontal', shortcut: 'H' },
  { type: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { type: 'fib_retracement', icon: ArrowUpRight, label: 'Fib Retracement', shortcut: 'F' },
  { type: 'risk_reward', icon: Target, label: 'Risk/Reward', shortcut: 'W' },
  { type: 'liquidity', icon: Droplets, label: 'Liquidity', shortcut: 'L' },
  { type: 'execution_marker', icon: Circle, label: 'Execution', shortcut: 'E' },
  { type: 'bias_marker', icon: GripHorizontal, label: 'Bias', shortcut: 'B' },
  { type: 'screenshot_marker', icon: Camera, label: 'Screenshot', shortcut: 'S' },
];

export function DrawingToolbar() {
  const [activeTool, setActiveTool] = useState<DrawingType | null>(null);
  const { state } = useWorkspace();

  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <Pencil className="w-3 h-3" /> Drawing Tools
      </h3>
      <div className="grid grid-cols-3 gap-1">
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => setActiveTool(activeTool === tool.type ? null : tool.type)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg border border-transparent hover:bg-muted/50 transition-colors',
              activeTool === tool.type && 'border-primary/30 bg-primary/5 text-primary'
            )}
            title={`${tool.label} (${tool.shortcut || 'N/A'})`}
          >
            <tool.icon className="w-3.5 h-3.5" />
            <span className="text-[8px] text-muted-foreground">{tool.shortcut || ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

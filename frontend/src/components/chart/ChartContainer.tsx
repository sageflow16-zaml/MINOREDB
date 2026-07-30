import { useRef, useEffect, useCallback, useState } from 'react';
import { createChart, CandlestickSeries, ColorType, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { renderICT } from './ICTChartRenderer';
import { ChartToolbar } from './ChartToolbar';
import { BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ChartConfig, PanelId } from '../workspace/types';

interface ChartContainerProps {
  panelId: PanelId;
  config: ChartConfig;
}

export function ChartContainer({ panelId, config }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const { state, dispatch } = useWorkspace();

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    try {
      const chart = createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight || 400,
        layout: {
          background: { type: ColorType.Solid, color: 'hsl(var(--card))' },
          textColor: 'hsl(var(--muted-foreground))',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: 'hsl(var(--border))' },
          horzLines: { color: 'hsl(var(--border))' },
        },
        timeScale: {
          borderColor: 'hsl(var(--border))',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: { borderColor: 'hsl(var(--border))' },
        crosshair: {
          mode: state.syncedCrosshair ? 1 : 0,
          vertLine: { color: 'hsl(var(--primary)/0.3)', width: 1, style: 2, labelBackgroundColor: 'hsl(var(--primary))' },
          horzLine: { color: 'hsl(var(--primary)/0.3)', width: 1, style: 2, labelBackgroundColor: 'hsl(var(--primary))' },
        },
      });

      const series = chart.addSeries(CandlestickSeries, {
        upColor: 'hsl(var(--success))',
        downColor: 'hsl(var(--destructive))',
        borderDownColor: 'hsl(var(--destructive))',
        borderUpColor: 'hsl(var(--success))',
        wickDownColor: 'hsl(var(--destructive))',
        wickUpColor: 'hsl(var(--success))',
      });

      chartRef.current = chart;
      seriesRef.current = series;
      setChartReady(true);

      const handleResize = () => {
        if (container) {
          chart.applyOptions({ width: container.clientWidth, height: container.clientHeight || 400 });
        }
      };
      const observer = new ResizeObserver(handleResize);
      observer.observe(container);

      return () => {
        observer.disconnect();
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
        setChartReady(false);
      };
    } catch {
      setChartReady(false);
    }
  }, [config.symbol, config.timeframe, config.showICT, config.showSessions, state.syncedCrosshair]);

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;
    renderICT(chartRef.current, seriesRef.current, config, state.ictOverlays[panelId] || []);
  }, [config, state.ictOverlays[panelId], config.showICT]);

  const handleSymbolChange = useCallback((symbol: string) => {
    dispatch({ type: 'SET_SYMBOL', panelId, symbol });
  }, [dispatch, panelId]);

  const handleTimeframeChange = useCallback((tf: string) => {
    dispatch({ type: 'SET_TIMEFRAME', panelId, timeframe: tf as any });
  }, [dispatch, panelId]);

  return (
    <div className="flex flex-col h-full">
      <ChartToolbar
        symbol={config.symbol}
        timeframe={config.timeframe}
        onSymbolChange={handleSymbolChange}
        onTimeframeChange={handleTimeframeChange}
        showICT={config.showICT}
        showSessions={config.showSessions}
        onToggleICT={() => dispatch({ type: 'TOGGLE_ICT', panelId })}
        onToggleSessions={() => dispatch({ type: 'TOGGLE_SESSION', panelId })}
      />
      <div className="relative flex-1 min-h-[200px]">
        <div ref={containerRef} className={cn('absolute inset-0', !chartReady && 'hidden')} />
        {!chartReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/50 border border-dashed border-border rounded-lg">
            <BarChart3 className="w-12 h-12 text-muted-foreground/40" />
            <div className="text-center max-w-[280px]">
              <p className="text-sm font-medium text-muted-foreground mb-1">Chart Unavailable</p>
              <p className="text-2xs text-muted-foreground/60 leading-relaxed">
                Connect to a project with market data to display live charts. TradingView and lightweight-charts rendering requires an active data feed.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



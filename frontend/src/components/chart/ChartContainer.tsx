import { useRef, useEffect, useCallback } from 'react';
import { createChart, CandlestickSeries, ColorType, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { renderICT } from './ICTChartRenderer';
import { ChartToolbar } from './ChartToolbar';
import { BarChart3, Settings } from 'lucide-react';
import type { ChartConfig, PanelId } from '../workspace/types';

interface ChartContainerProps {
  panelId: PanelId;
  config: ChartConfig;
}

export function ChartContainer({ panelId, config }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const { state, dispatch } = useWorkspace();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const previewMode = state.layout.previewMode;

  useEffect(() => {
    if (previewMode || !containerRef.current) return;
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
      };
    } catch {
      chartRef.current = null;
      seriesRef.current = null;
    }
  }, [config.symbol, config.timeframe, config.showICT, config.showSessions, state.syncedCrosshair, previewMode]);

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

  const chartExists = !!chartRef.current;

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
        <div ref={containerRef} className={chartExists ? 'absolute inset-0' : 'hidden'} />
        {!chartExists && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 mx-2 my-2 border border-dashed border-border rounded-lg bg-muted/20">
            <BarChart3 className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[260px]">
              Chart unavailable. Connect a project with market data to display live charts.
            </p>
            {projectId ? (
              <button
                onClick={() => navigate(`/projects/${projectId}/settings`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Project Settings
              </button>
            ) : (
              <button
                onClick={() => navigate('/projects')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Select Project
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



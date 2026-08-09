import {useRef, useEffect, useCallback} from 'react';
import {
  createChart, CandlestickSeries, HistogramSeries,
  ColorType, type IChartApi, type ISeriesApi, type Time,
} from 'lightweight-charts';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { renderICT } from './ICTChartRenderer';
import { ChartToolbar } from './ChartToolbar';
import { BarChart3, Settings, Loader2, AlertTriangle, Database } from 'lucide-react';
import { useMarketData } from '../../hooks/useMarketData';
import { marketDataService } from '../../services/marketDataService';
import type { ChartConfig, PanelId } from '../workspace/types';

interface ChartContainerProps {
  panelId: PanelId;
  config: ChartConfig;
}

interface NormalizedCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function normalizeCandles(candles: any[]): NormalizedCandle[] {
  const seen = new Set<number>();
  const out: NormalizedCandle[] = [];
  for (const c of candles ?? []) {
    const time = Math.floor(Number(c?.time));
    const open = Number(c?.open);
    const high = Number(c?.high);
    const low = Number(c?.low);
    const close = Number(c?.close);
    const volume = Number(c?.volume) || 0;
    if (!Number.isFinite(time) || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) continue;
    if (seen.has(time)) continue;
    seen.add(time);
    out.push({ time, open, high, low, close, volume });
  }
  out.sort((a, b) => a.time - b.time);
  return out;
}

function getTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

export function ChartContainer({ panelId, config }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lastCandleTimeRef = useRef<number | null>(null);
  const liveFetchingRef = useRef(false);
  const { state, dispatch } = useWorkspace();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const previewMode = state.layout.previewMode;

  const { data: result, isLoading } = useMarketData(
    config.symbol, config.timeframe, projectId, !previewMode
  );

  useEffect(() => {
    if (previewMode || !containerRef.current) return;
    const container = containerRef.current;
    const isDark = getTheme() === 'dark';

    const resolveColor = (t: string) => {
      try {
        const d = document.createElement('div');
        d.style.display = 'none';
        document.body.appendChild(d);
        d.style.color = t;
        const c = window.getComputedStyle(d).color;
        document.body.removeChild(d);
        return c || t;
      } catch { return t; }
    };

    try {
      const chart = createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight || 400,
        layout: {
          background: { type: ColorType.Solid, color: isDark ? resolveColor('hsl(var(--card))') : '#ffffff' },
          textColor: isDark ? resolveColor('hsl(var(--muted-foreground))') : '#6b7280',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: isDark ? resolveColor('hsl(var(--border))') : '#e5e7eb' },
          horzLines: { color: isDark ? resolveColor('hsl(var(--border))') : '#e5e7eb' },
        },
        timeScale: {
          borderColor: isDark ? resolveColor('hsl(var(--border))') : '#e5e7eb',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: { borderColor: isDark ? resolveColor('hsl(var(--border))') : '#e5e7eb' },
        crosshair: {
          mode: state.syncedCrosshair ? 1 : 0,
          vertLine: { color: isDark ? resolveColor('hsl(var(--primary)/0.3)') : '#3b82f680', width: 1, style: 2, labelBackgroundColor: isDark ? resolveColor('hsl(var(--primary))') : '#3b82f6' },
          horzLine: { color: isDark ? resolveColor('hsl(var(--primary)/0.3)') : '#3b82f680', width: 1, style: 2, labelBackgroundColor: isDark ? resolveColor('hsl(var(--primary))') : '#3b82f6' },
        },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: isDark ? resolveColor('hsl(var(--success))') : '#22c55e',
        downColor: isDark ? resolveColor('hsl(var(--danger))') : '#ef4444',
        borderUpColor: isDark ? resolveColor('hsl(var(--success))') : '#22c55e',
        borderDownColor: isDark ? resolveColor('hsl(var(--danger))') : '#ef4444',
        wickUpColor: isDark ? resolveColor('hsl(var(--success))') : '#22c55e',
        wickDownColor: isDark ? resolveColor('hsl(var(--danger))') : '#ef4444',
        priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
      });

      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
        visible: false,
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;

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
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
      };
    } catch {
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }
  }, [config.symbol, config.timeframe, config.showICT, config.showSessions, state.syncedCrosshair, previewMode]);

  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return;
    renderICT(chartRef.current, candleSeriesRef.current, config, state.ictOverlays[panelId] || []);
  }, [config, state.ictOverlays[panelId], config.showICT]);

  useEffect(() => {
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    const volume = volumeSeriesRef.current;
    if (!chart || !series) return;

    if (result?.success && Array.isArray(result.candles) && result.candles.length > 0) {
      const candles = normalizeCandles(result.candles);
      if (candles.length > 0) {
        try {
          series.setData(candles as any);
          volume?.setData(
            candles.map(c => ({ time: c.time as Time, value: c.volume, color: c.close >= c.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }))
          );
          chart.timeScale().fitContent();
          lastCandleTimeRef.current = candles[candles.length - 1].time;
        } catch (err) {
          console.warn('[ChartContainer] setData failed', err);
        }
        return;
      }
    }
    series.setData([]);
    volume?.setData([]);
    lastCandleTimeRef.current = null;
  }, [result, config.symbol, config.timeframe]);

  const handleSymbolChange = useCallback((symbol: string) => {
    dispatch({ type: 'SET_SYMBOL', panelId, symbol });
  }, [dispatch, panelId]);

  const handleTimeframeChange = useCallback((tf: string) => {
    dispatch({ type: 'SET_TIMEFRAME', panelId, timeframe: tf as any });
  }, [dispatch, panelId]);

  const chartExists = !!chartRef.current;
  const dataApplied = result?.success && (result.candles?.length ?? 0) > 0;
  const showChart = chartExists && dataApplied;
  const showLoading = !previewMode && isLoading;
  const showError = !previewMode && !isLoading && result && !result.success;
  const showEmpty = previewMode || (!showChart && !showLoading && !showError);

  useEffect(() => {
    if (previewMode || !dataApplied || !chartRef.current || !candleSeriesRef.current) return;

    const tick = async () => {
      if (liveFetchingRef.current) return;
      liveFetchingRef.current = true;
      try {
        const candle = await marketDataService.fetchLatest(config.symbol, config.timeframe, projectId);
        if (!candle) return;
        const series = candleSeriesRef.current;
        const volume = volumeSeriesRef.current;
        if (!series) return;
        const last = lastCandleTimeRef.current;
        if (last != null && candle.time < last) return;
        series.update(candle as any);
        volume?.update({ time: candle.time as Time, value: candle.volume, color: candle.close >= candle.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' });
        lastCandleTimeRef.current = candle.time;
        chartRef.current?.timeScale().scrollToRealTime();
        const age = Math.max(0, Math.floor(Date.now() / 1000 - candle.time));
        console.log(`Latest candle age: ${age} seconds`);
      } finally {
        liveFetchingRef.current = false;
      }
    };

    const interval = window.setInterval(tick, 5000);
    return () => window.clearInterval(interval);
  }, [previewMode, dataApplied, config.symbol, config.timeframe, projectId]);

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
        <div ref={containerRef} className="absolute inset-0" />
        {showLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 mx-2 my-2 border border-dashed border-border rounded-lg bg-muted/20">
            <Loader2 className="w-6 h-6 text-muted-foreground/40 animate-spin" />
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Loading market data for {config.symbol}...
            </p>
          </div>
        )}
        {showError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 mx-2 my-2 border border-dashed border-border rounded-lg bg-muted/20">
            <AlertTriangle className="w-8 h-8 text-amber-500/60" />
            <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[300px]">
              {result?.reason?.includes('Twelve Data API key')
                ? 'Market data feed requires a Twelve Data API key. Add TWELVEDATA_API_KEY to your Supabase project secrets to enable live charts.'
                : result?.reason || 'Market data temporarily unavailable.'}
            </p>
            <span className="text-[10px] text-muted-foreground/50 font-mono">
              {config.symbol} ({config.timeframe})
            </span>
          </div>
        )}
        {showEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 mx-2 my-2 border border-dashed border-border rounded-lg bg-muted/20">
            <Database className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[260px]">
              {previewMode
                ? 'Chart unavailable in preview mode. Open a project to view live market data.'
                : 'No market data received. Select a symbol to begin.'}
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

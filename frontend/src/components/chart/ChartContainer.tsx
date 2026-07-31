import { useRef, useEffect, useCallback, useState } from 'react';
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
  const testSeriesAddedRef = useRef(false);
  const { state, dispatch } = useWorkspace();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const previewMode = state.layout.previewMode;

  const { data: result, isLoading, isError } = useMarketData(
    config.symbol, config.timeframe, projectId, !previewMode
  );

  useEffect(() => {
    if (previewMode || !containerRef.current) return;
    const container = containerRef.current;
    const isDark = getTheme() === 'dark';

    try {
      const chart = createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight || 400,
        layout: {
          background: { type: ColorType.Solid, color: isDark ? 'hsl(var(--card))' : '#ffffff' },
          textColor: isDark ? 'hsl(var(--muted-foreground))' : '#6b7280',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: isDark ? 'hsl(var(--border))' : '#e5e7eb' },
          horzLines: { color: isDark ? 'hsl(var(--border))' : '#e5e7eb' },
        },
        timeScale: {
          borderColor: isDark ? 'hsl(var(--border))' : '#e5e7eb',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: { borderColor: isDark ? 'hsl(var(--border))' : '#e5e7eb' },
        crosshair: {
          mode: state.syncedCrosshair ? 1 : 0,
          vertLine: { color: isDark ? 'hsl(var(--primary)/0.3)' : '#3b82f680', width: 1, style: 2, labelBackgroundColor: isDark ? 'hsl(var(--primary))' : '#3b82f6' },
          horzLine: { color: isDark ? 'hsl(var(--primary)/0.3)' : '#3b82f680', width: 1, style: 2, labelBackgroundColor: isDark ? 'hsl(var(--primary))' : '#3b82f6' },
        },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: isDark ? 'hsl(var(--success))' : '#22c55e',
        downColor: isDark ? 'hsl(var(--destructive))' : '#ef4444',
        borderDownColor: isDark ? 'hsl(var(--destructive))' : '#ef4444',
        borderUpColor: isDark ? 'hsl(var(--success))' : '#22c55e',
        wickDownColor: isDark ? 'hsl(var(--destructive))' : '#ef4444',
        wickUpColor: isDark ? 'hsl(var(--success))' : '#22c55e',
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
    const container = containerRef.current;
    if (!chart || !series || !container) return;

    if (result?.success && Array.isArray(result.candles) && result.candles.length > 0) {
      const candles = normalizeCandles(result.candles);
      if (candles.length > 0) {
        try {
          series.setData(candles as any);
          chart.timeScale().fitContent();
        } catch (err) {
          console.warn('[ChartContainer] setData failed', err);
        }
        try {
          volume?.setData(
            candles.map(c => ({ time: c.time as Time, value: c.volume, color: c.close >= c.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }))
          );
        } catch (err) {
          console.warn('[ChartContainer] volume setData failed', err);
        }

        const first = candles[0];
        const last = candles[candles.length - 1];
        console.log('[ChartContainer] setData executed', { length: candles.length, first, last });
        console.log('[ChartContainer][diag] dataByIndex(0)', series.dataByIndex?.(0));
        console.log('[ChartContainer][diag] priceScale right options', chart.priceScale('right').options());
        console.log('[ChartContainer][diag] first candle', {
          time: first.time, open: first.open, high: first.high, low: first.low, close: first.close,
          typeof_open: typeof first.open, typeof_high: typeof first.high,
          typeof_low: typeof first.low, typeof_close: typeof first.close,
        });
        const sanityBad = candles.filter(c => c.high < Math.max(c.open, c.close) || c.low > Math.min(c.open, c.close));
        const nanCount = candles.filter(c => [c.open, c.high, c.low, c.close].some(v => Number.isNaN(v))).length;
        console.log('[ChartContainer][diag] OHLC sanity violations', sanityBad.length, sanityBad.slice(0, 3));
        console.log('[ChartContainer][diag] NaN candles', nanCount);
        console.log('[ChartContainer][diag] container', {
          clientWidth: container.clientWidth, clientHeight: container.clientHeight,
          rect: (() => { const r = container.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })(),
        });
        const canvasInfo: any[] = [];
        container.querySelectorAll('canvas').forEach((cv, i) => {
          const cs = getComputedStyle(cv);
          const r = cv.getBoundingClientRect();
          canvasInfo.push({
            index: i, backingWidth: cv.width, backingHeight: cv.height,
            cssWidth: cs.width, cssHeight: cs.height,
            display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
            rect: { x: r.x, y: r.y, width: r.width, height: r.height },
          });
        });
        console.log('[ChartContainer][diag] canvases', canvasInfo);

        if (!testSeriesAddedRef.current) {
          try {
            const testSeries = chart.addSeries(CandlestickSeries, {
              upColor: '#22c55e', downColor: '#ef4444',
              borderUpColor: '#22c55e', borderDownColor: '#ef4444',
              wickUpColor: '#22c55e', wickDownColor: '#ef4444',
              priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
            });
            testSeries.setData([
              { time: 1700000000 as Time, open: 100, high: 105, low: 95, close: 102 },
              { time: 1700003600 as Time, open: 102, high: 108, low: 101, close: 107 },
            ]);
            chart.timeScale().fitContent();
            testSeriesAddedRef.current = true;
            console.log('[ChartContainer][diag] hardcoded test series added, dataByIndex(0)=', testSeries.dataByIndex?.(0));
          } catch (err) {
            console.warn('[ChartContainer][diag] hardcoded test series failed', err);
          }
        }
        return;
      }
    }
    series.setData([]);
    volume?.setData([]);
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

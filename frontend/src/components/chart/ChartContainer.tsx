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
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.setAttribute('data-chart-diag', 'true');

    try {
      const chart = createChart(container, {
        width: 1200,
        height: 700,
        layout: {
          background: { type: ColorType.Solid, color: '#000000' },
          textColor: '#ffffff',
        },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = null;

      const styleEl = document.createElement('style');
      styleEl.id = 'chart-diag-style';
      styleEl.textContent = '[data-chart-diag] canvas { border: 3px solid red !important; box-sizing: border-box; }';
      document.head.appendChild(styleEl);

      requestAnimationFrame(() => {
        setTimeout(() => {
          const report: any[] = [];
          for (const el of [container, ...container.querySelectorAll('canvas')]) {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            const backing = (el as HTMLCanvasElement).width !== undefined
              ? { width: (el as HTMLCanvasElement).width, height: (el as HTMLCanvasElement).height }
              : null;
            report.push({
              tag: el.tagName,
              className: (el as HTMLElement).className || (el as HTMLElement).getAttribute('class'),
              rect: { x: r.x, y: r.y, width: r.width, height: r.height },
              canvasBacking: backing,
              zIndex: cs.zIndex, visibility: cs.visibility, display: cs.display,
              overflow: cs.overflow, opacity: cs.opacity, position: cs.position,
              pointerEvents: cs.pointerEvents, backgroundColor: cs.backgroundColor,
            });
          }
          console.log('[ChartContainer][diag] full metrics', report);
        }, 500);
      });

      return () => {
        document.getElementById('chart-diag-style')?.remove();
        chart.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
      };
    } catch (err) {
      console.warn('[ChartContainer][diag] chart init failed', err);
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }
  }, []);

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

  return (
    <div style={{ width: 1200, height: 700, position: 'relative' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}

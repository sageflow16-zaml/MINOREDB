import { useRef, useEffect, useCallback } from 'react';
import { createChart, CandlestickSeries, ColorType, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { renderICT } from './ICTChartRenderer';
import { ChartToolbar } from './ChartToolbar';
import type { ChartConfig, PanelId } from '../workspace/types';

interface ChartContainerProps {
  panelId: PanelId;
  config: ChartConfig;
}

const mockCandles = (symbol: string) => {
  const data = [];
  const now = Math.floor(Date.now() / 1000);
  let price = symbol === 'XAUUSD' ? 2350 : symbol === 'BTCUSD' ? 68000 : 1.08;
  for (let i = 200; i >= 0; i--) {
    const open = price + (Math.random() - 0.5) * (symbol === 'BTCUSD' ? 500 : 0.05);
    const close = open + (Math.random() - 0.5) * (symbol === 'BTCUSD' ? 400 : 0.04);
    const high = Math.max(open, close) + Math.random() * (symbol === 'BTCUSD' ? 200 : 0.02);
    const low = Math.min(open, close) - Math.random() * (symbol === 'BTCUSD' ? 200 : 0.02);
    data.push({ time: (now - i * 3600) as any, open, high, low, close });
    price = close;
  }
  return data;
};

export function ChartContainer({ panelId, config }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const { state, dispatch } = useWorkspace();

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
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

    const candles = mockCandles(config.symbol);
    series.setData(candles);
    chart.timeScale().fitContent();

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
      <div ref={containerRef} className="flex-1 min-h-[200px]" />
    </div>
  );
}

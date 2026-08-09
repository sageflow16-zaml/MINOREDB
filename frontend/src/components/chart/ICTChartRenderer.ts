import {IChartApi, ISeriesApi} from 'lightweight-charts';
import type { ChartConfig, ICTOverlay } from '../workspace/types';

export function renderICT(
  _chart: IChartApi,
  _series: ISeriesApi<'Candlestick'>,
  config: ChartConfig,
  _overlays: ICTOverlay[],
) {
  if (!config.showICT) return;
  // ICT overlay rendering is handled by lightweight-charts API
  // In production, this would use custom primitives or markers
  // For now we store the overlay state for future rendering
}

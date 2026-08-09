import { supabase } from '../lib/supabase';
import type { StatisticsResponse, StatisticsRisk, StatisticsByField, StatisticsBias, StatisticsSession, MonthlyReturn, RollingStats, EquityPoint, DistributionData, WeeklyReturn, YearlyReturn, RiskAnalytics, PsychologyAnalytics, CalendarHeatmap, ScatterData, StrategyStats, StatisticsByFieldValue } from './types';

type CacheKey = string;
const pending = new Map<CacheKey, Promise<unknown>>();

async function rpcCached<T>(fnName: string, args: Record<string, unknown>): Promise<T> {
  const key = `${fnName}:${JSON.stringify(args)}`;
  if (!pending.has(key)) {
    pending.set(key, (async () => {
      try {
        const r = await supabase.rpc(fnName, args);
        if (r.error) throw r.error;
        return r.data as T;
      } finally {
        pending.delete(key);
      }
    })());
  }
  return pending.get(key) as Promise<T>;
}


const EMPTY_STATS = (): StatisticsByFieldValue => ({ trades: 0, wins: 0, losses: 0, pnl: 0, win_rate: 0 });

interface AnalyticsOverviewResponse {
  total_trades?: number; closed_trades?: number; wins?: number; losses?: number; breakevens?: number;
  open_trades?: number; win_rate?: number; avg_rr?: number; total_pnl?: number; expectancy?: number;
  avg_win?: number; avg_loss?: number; max_drawdown?: number; profit_factor?: number;
  sharpe_ratio?: number; recovery_factor?: number; by_result?: Record<string, number>;
}
interface AnalyticsBreakdownsResponse {
  by_pair?: Record<string, StatisticsByFieldValue>;
  by_direction?: Record<string, StatisticsByFieldValue>;
  by_bias?: Record<string, StatisticsByFieldValue>;
  by_session?: Record<string, StatisticsByFieldValue>;
  by_timeframe?: Record<string, StatisticsByFieldValue>;
  by_news?: Record<string, StatisticsByFieldValue>;
  by_weekday?: Record<string, StatisticsByFieldValue>;
}
interface AnalyticsTimeSeriesResponse {
  monthly_returns?: MonthlyReturn[];
  weekly_returns?: WeeklyReturn[];
  yearly_returns?: YearlyReturn[];
  rolling_10?: RollingStats;
  rolling_50?: RollingStats;
  calendar_heatmap?: CalendarHeatmap;
}
interface AnalyticsDetailResponse {
  risk_analytics?: RiskAnalytics;
  psychology_analytics?: PsychologyAnalytics;
  scatter_data?: ScatterData;
}
export type { AnalyticsOverviewResponse, AnalyticsBreakdownsResponse, AnalyticsTimeSeriesResponse, AnalyticsDetailResponse };

export const statisticsService = {
  overview: async (projectId: string): Promise<StatisticsResponse> => {
    const overview = (await rpcCached<AnalyticsOverviewResponse>('get_analytics_overview', { p_project_id: projectId })) ?? {};
    const breakdowns = (await rpcCached<AnalyticsBreakdownsResponse>('get_analytics_breakdowns', { p_project_id: projectId })) ?? {};
    const timeSeries = (await rpcCached<AnalyticsTimeSeriesResponse>('get_analytics_time_series', { p_project_id: projectId })) ?? {};
    return {
      overview: {
        total_trades: overview.total_trades ?? 0, closed_trades: overview.closed_trades ?? 0,
        wins: overview.wins ?? 0, losses: overview.losses ?? 0, breakevens: overview.breakevens ?? 0,
        open_trades: overview.open_trades ?? 0, win_rate: overview.win_rate ?? 0, avg_rr: overview.avg_rr ?? 0,
        total_pnl: overview.total_pnl ?? 0, expectancy: overview.expectancy ?? 0,
        avg_win: overview.avg_win ?? 0, avg_loss: overview.avg_loss ?? 0,
      },
      risk: {
        max_drawdown: overview.max_drawdown ?? 0, profit_factor: overview.profit_factor ?? 0,
        sharpe_ratio: overview.sharpe_ratio ?? 0, recovery_factor: overview.recovery_factor ?? 0,
      },
      by_result: overview.by_result ?? {}, by_pair: breakdowns.by_pair ?? {},
      by_direction: breakdowns.by_direction ?? {}, by_bias: breakdowns.by_bias ?? {},
      by_session: breakdowns.by_session ?? {}, by_market_phase: {}, by_trend: {}, by_strategy: {},
      by_timeframe: breakdowns.by_timeframe ?? {}, by_news: breakdowns.by_news ?? {},
      by_weekday: breakdowns.by_weekday ?? {}, by_market_condition: {}, by_volatility: {}, by_setup: {},
      monthly_returns: timeSeries.monthly_returns ?? [], weekly_returns: timeSeries.weekly_returns ?? [],
      yearly_returns: timeSeries.yearly_returns ?? [],
      rolling_10: timeSeries.rolling_10 ?? {}, rolling_50: timeSeries.rolling_50 ?? {},
      calendar_heatmap: timeSeries.calendar_heatmap ?? {},
      risk_analytics: {}, psychology_analytics: {}, scatter_data: {},
    } as StatisticsResponse;
  },

  risk: async (projectId: string): Promise<StatisticsRisk> => {
    const data = (await rpcCached<AnalyticsOverviewResponse>('get_analytics_overview', { p_project_id: projectId })) ?? {};
    return {
      max_drawdown: data.max_drawdown ?? 0, profit_factor: data.profit_factor ?? 0,
      sharpe_ratio: data.sharpe_ratio ?? 0, recovery_factor: data.recovery_factor ?? 0,
    };
  },

  byPair: async (projectId: string): Promise<StatisticsByField> => {
    const r = (await rpcCached<Record<string, StatisticsByFieldValue> | null>('get_stats_by_pair', { p_project_id: projectId })) ?? {};
    return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { ...EMPTY_STATS(), ...v }])) as StatisticsByField;
  },

  byDirection: async (projectId: string): Promise<StatisticsByField> => {
    const r = (await rpcCached<Record<string, StatisticsByFieldValue> | null>('get_stats_by_direction', { p_project_id: projectId })) ?? {};
    return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { ...EMPTY_STATS(), ...v }])) as StatisticsByField;
  },

  byBias: async (projectId: string): Promise<StatisticsBias> => {
    const r = await rpcCached<AnalyticsBreakdownsResponse>('get_analytics_breakdowns', { p_project_id: projectId });
    return (r?.by_bias ?? {}) as StatisticsBias;
  },

  bySession: async (projectId: string): Promise<StatisticsSession> => {
    const r = await rpcCached<AnalyticsBreakdownsResponse>('get_analytics_breakdowns', { p_project_id: projectId });
    return (r?.by_session ?? {}) as StatisticsSession;
  },

  byMarketPhase: async (_projectId: string): Promise<StatisticsByField> => {
    try {
      const { data, error } = await supabase.from('trade').select('market_phase').not('market_phase', 'is', null);
      if (error) throw error;
      const grouped: Record<string, number> = {};
      ((data as { market_phase: string | null }[] | null) ?? []).forEach((t) => { grouped[t.market_phase ?? ''] = (grouped[t.market_phase ?? ''] || 0) + 1; });
      return Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, { ...EMPTY_STATS(), trades: v }])) as StatisticsByField;
    } catch {
      return {};
    }
  },

  byTrend: async (_projectId: string): Promise<StatisticsByField> => {
    const { data, error } = await supabase.from('trade').select('weekly_bias').not('weekly_bias', 'is', null);
    if (error) throw error;
    const grouped: Record<string, number> = {};
    ((data as { weekly_bias: string | null }[] | null) ?? []).forEach((t) => { grouped[t.weekly_bias ?? ''] = (grouped[t.weekly_bias ?? ''] || 0) + 1; });
    return Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, { ...EMPTY_STATS(), trades: v }])) as StatisticsByField;
  },

  monthlyReturns: async (projectId: string): Promise<MonthlyReturn[]> => {
    const r = (await rpcCached<MonthlyReturn[] | null>('get_monthly_returns', { p_project_id: projectId })) ?? [];
    return r;
  },

  rolling: async (projectId: string, window: number): Promise<RollingStats> => {
    const r = await rpcCached<RollingStats | null>('get_rolling_stats', { p_project_id: projectId, p_window: window });
    return r ?? { available: false, window, trades: 0, wins: 0, losses: 0, win_rate: 0, pnl: 0 };
  },

  equityCurve: async (projectId: string): Promise<EquityPoint[]> => {
    const r = (await rpcCached<EquityPoint[] | null>('get_equity_curve', { p_project_id: projectId })) ?? [];
    return r;
  },

  pnlDistribution: async (_projectId: string): Promise<DistributionData> => {
    return { bins: [], counts: [] };
  },

  rrDistribution: async (_projectId: string): Promise<DistributionData> => {
    return { bins: [], counts: [] };
  },

  full: (projectId: string): Promise<StatisticsResponse> =>
    statisticsService.overview(projectId),

  byStrategy: async (projectId: string): Promise<Record<string, StrategyStats>> => {
    const { data, error } = await supabase.from('trade').select('strategy_id, pnl, result').not('strategy_id', 'is', null).eq('project_id', projectId);
    if (error) throw error;
    const grouped: Record<string, StrategyStats> = {};
    ((data as { strategy_id: string | null; pnl: number | null; result: string | null }[] | null) ?? []).forEach((t) => {
      const key = t.strategy_id ?? 'unknown';
      if (!grouped[key]) grouped[key] = { trades: 0, wins: 0, losses: 0, pnl: 0, win_rate: 0, avg_rr: 0, expectancy: 0 };
      grouped[key].trades++;
      if (t.result === 'WIN') grouped[key].wins++;
      if (t.result === 'LOSS') grouped[key].losses++;
      grouped[key].pnl += (t.pnl || 0);
    });
    for (const k of Object.keys(grouped)) {
      if (grouped[k].trades > 0) grouped[k].win_rate = grouped[k].wins / grouped[k].trades;
    }
    return grouped;
  },

  byWeekday: async (projectId: string): Promise<Record<string, StatisticsByFieldValue>> => {
    const r = await rpcCached<AnalyticsBreakdownsResponse>('get_analytics_breakdowns', { p_project_id: projectId });
    return (r?.by_weekday ?? {}) as Record<string, StatisticsByFieldValue>;
  },

  byTimeframe: async (projectId: string): Promise<StatisticsByField> => {
    const r = await rpcCached<AnalyticsBreakdownsResponse>('get_analytics_breakdowns', { p_project_id: projectId });
    return (r?.by_timeframe ?? {}) as StatisticsByField;
  },

  byMarketCondition: async (_projectId: string): Promise<StatisticsByField> => ({}),
  byVolatility: async (_projectId: string): Promise<StatisticsByField> => ({}),

  byNews: async (projectId: string): Promise<Record<string, StatisticsByFieldValue>> => {
    const r = await rpcCached<AnalyticsBreakdownsResponse>('get_analytics_breakdowns', { p_project_id: projectId });
    return (r?.by_news ?? {}) as Record<string, StatisticsByFieldValue>;
  },

  bySetup: async (_projectId: string): Promise<StatisticsByField> => ({}),

  weeklyReturns: async (projectId: string): Promise<WeeklyReturn[]> => {
    const r = await rpcCached<AnalyticsTimeSeriesResponse>('get_analytics_time_series', { p_project_id: projectId });
    return r?.weekly_returns ?? [];
  },

  yearlyReturns: async (projectId: string): Promise<YearlyReturn[]> => {
    const r = await rpcCached<AnalyticsTimeSeriesResponse>('get_analytics_time_series', { p_project_id: projectId });
    return r?.yearly_returns ?? [];
  },

  riskAnalytics: async (projectId: string): Promise<RiskAnalytics> => {
    const r = await rpcCached<AnalyticsDetailResponse>('get_analytics_detail', { p_project_id: projectId });
    return (r?.risk_analytics ?? {}) as RiskAnalytics;
  },

  psychologyAnalytics: async (projectId: string): Promise<PsychologyAnalytics> => {
    const r = await rpcCached<AnalyticsDetailResponse>('get_analytics_detail', { p_project_id: projectId });
    return (r?.psychology_analytics ?? {}) as PsychologyAnalytics;
  },

  calendarHeatmap: async (projectId: string): Promise<CalendarHeatmap> => {
    const r = await rpcCached<CalendarHeatmap | null>('get_calendar_heatmap', { p_project_id: projectId });
    return r ?? { daily_pnl: {}, min_date: null, max_date: null };
  },

  scatterData: async (projectId: string): Promise<ScatterData> => {
    const r = await rpcCached<AnalyticsDetailResponse>('get_analytics_detail', { p_project_id: projectId });
    return (r?.scatter_data ?? {}) as ScatterData;
  },
};

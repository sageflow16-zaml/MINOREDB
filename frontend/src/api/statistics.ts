import { supabase } from '../lib/supabase';
import type { StatisticsResponse, StatisticsRisk, StatisticsByField, StatisticsBias, StatisticsSession, MonthlyReturn, RollingStats, EquityPoint, DistributionData, WeeklyReturn, YearlyReturn, RiskAnalytics, PsychologyAnalytics, CalendarHeatmap, ScatterData } from './types';

type CacheKey = string;
const pending = new Map<CacheKey, Promise<any>>();

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
  return pending.get(key)! as Promise<T>;
}

export const statisticsService = {
  overview: async (projectId: string): Promise<StatisticsResponse> => {
    const overview = await rpcCached<any>('get_analytics_overview', { p_project_id: projectId });
    const breakdowns = await rpcCached<any>('get_analytics_breakdowns', { p_project_id: projectId });
    const timeSeries = await rpcCached<any>('get_analytics_time_series', { p_project_id: projectId });
    return {
      overview: { total_trades: overview.total_trades, closed_trades: overview.closed_trades, wins: overview.wins, losses: overview.losses, breakevens: overview.breakevens, open_trades: overview.open_trades, win_rate: overview.win_rate, avg_rr: overview.avg_rr, total_pnl: overview.total_pnl, expectancy: overview.expectancy, avg_win: overview.avg_win, avg_loss: overview.avg_loss },
      risk: { max_drawdown: overview.max_drawdown, profit_factor: overview.profit_factor, sharpe_ratio: overview.sharpe_ratio, recovery_factor: overview.recovery_factor },
      by_result: overview.by_result || {}, by_pair: breakdowns.by_pair || {}, by_direction: breakdowns.by_direction || {}, by_bias: breakdowns.by_bias || {}, by_session: breakdowns.by_session || {}, by_market_phase: {}, by_trend: {}, by_strategy: {}, by_timeframe: breakdowns.by_timeframe || {}, by_news: breakdowns.by_news || {}, by_weekday: breakdowns.by_weekday || {}, by_market_condition: {}, by_volatility: {}, by_setup: {},
      monthly_returns: timeSeries.monthly_returns || [], weekly_returns: timeSeries.weekly_returns || [], yearly_returns: timeSeries.yearly_returns || [],
      rolling_10: timeSeries.rolling_10 || [], rolling_50: timeSeries.rolling_50 || [], calendar_heatmap: timeSeries.calendar_heatmap || [],
      risk_analytics: undefined as any, psychology_analytics: undefined as any, scatter_data: undefined as any,
    } as StatisticsResponse;
  },

  risk: async (projectId: string): Promise<StatisticsRisk> => {
    const data = await rpcCached<any>('get_analytics_overview', { p_project_id: projectId });
    return { max_drawdown: data.max_drawdown, profit_factor: data.profit_factor, sharpe_ratio: data.sharpe_ratio, recovery_factor: data.recovery_factor };
  },

  byPair: (projectId: string): Promise<StatisticsByField> =>
    rpcCached('get_stats_by_pair', { p_project_id: projectId }),

  byDirection: (projectId: string): Promise<StatisticsByField> =>
    rpcCached('get_stats_by_direction', { p_project_id: projectId }),

  byBias: (projectId: string): Promise<StatisticsBias> => {
    const result = rpcCached<any>('get_analytics_breakdowns', { p_project_id: projectId });
    return result.then((r: any) => r.by_bias || {});
  },

  bySession: (projectId: string): Promise<StatisticsSession> => {
    const result = rpcCached<any>('get_analytics_breakdowns', { p_project_id: projectId });
    return result.then((r: any) => r.by_session || {});
  },

  byMarketPhase: async (_projectId: string): Promise<StatisticsByField> => {
    const { data, error } = await supabase.from('trade').select('market_phase').not('market_phase', 'is', null);
    if (error) throw error;
    const grouped: Record<string, number> = {};
    (data ?? []).forEach((t: any) => { grouped[t.market_phase] = (grouped[t.market_phase] || 0) + 1; });
    return grouped as any as StatisticsByField;
  },

  byTrend: async (_projectId: string): Promise<StatisticsByField> => {
    const { data, error } = await supabase.from('trade').select('weekly_bias').not('weekly_bias', 'is', null);
    if (error) throw error;
    const grouped: Record<string, number> = {};
    (data ?? []).forEach((t: any) => { grouped[t.weekly_bias] = (grouped[t.weekly_bias] || 0) + 1; });
    return grouped as any as StatisticsByField;
  },

  monthlyReturns: (projectId: string): Promise<MonthlyReturn[]> =>
    rpcCached('get_monthly_returns', { p_project_id: projectId }),

  rolling: (projectId: string, window: number): Promise<RollingStats> =>
    rpcCached('get_rolling_stats', { p_project_id: projectId, p_window: window }),

  equityCurve: (projectId: string): Promise<EquityPoint[]> =>
    rpcCached('get_equity_curve', { p_project_id: projectId }),

  pnlDistribution: (_projectId: string): Promise<DistributionData> => {
    throw new Error('PnL distribution requires backend compute');
  },

  rrDistribution: (_projectId: string): Promise<DistributionData> => {
    throw new Error('RR distribution requires backend compute');
  },

  full: (projectId: string): Promise<StatisticsResponse> =>
    statisticsService.overview(projectId),

  byStrategy: async (projectId: string): Promise<Record<string, any>> => {
    const { data, error } = await supabase.from('trade').select('strategy_id, pnl, result').not('strategy_id', 'is', null).eq('project_id', projectId);
    if (error) throw error;
    const grouped: Record<string, any> = {};
    (data ?? []).forEach((t: any) => {
      if (!grouped[t.strategy_id]) grouped[t.strategy_id] = { trades: 0, wins: 0, losses: 0, pnl: 0 };
      grouped[t.strategy_id].trades++;
      if (t.result === 'WIN') grouped[t.strategy_id].wins++;
      if (t.result === 'LOSS') grouped[t.strategy_id].losses++;
      grouped[t.strategy_id].pnl += (t.pnl || 0);
    });
    return grouped;
  },

  byWeekday: (projectId: string): Promise<Record<string, any>> => {
    const result = rpcCached<any>('get_analytics_breakdowns', { p_project_id: projectId });
    return result.then((r: any) => r.by_weekday || {});
  },

  byTimeframe: (projectId: string): Promise<StatisticsByField> => {
    const result = rpcCached<any>('get_analytics_breakdowns', { p_project_id: projectId });
    return result.then((r: any) => r.by_timeframe || {});
  },

  byMarketCondition: async (_projectId: string): Promise<StatisticsByField> => ({}),
  byVolatility: async (_projectId: string): Promise<StatisticsByField> => ({}),

  byNews: (projectId: string): Promise<Record<string, any>> => {
    const result = rpcCached<any>('get_analytics_breakdowns', { p_project_id: projectId });
    return result.then((r: any) => r.by_news || {});
  },

  bySetup: async (_projectId: string): Promise<StatisticsByField> => ({}),

  weeklyReturns: (projectId: string): Promise<WeeklyReturn[]> => {
    const result = rpcCached<any>('get_analytics_time_series', { p_project_id: projectId });
    return result.then((r: any) => r.weekly_returns || []);
  },

  yearlyReturns: (projectId: string): Promise<YearlyReturn[]> => {
    const result = rpcCached<any>('get_analytics_time_series', { p_project_id: projectId });
    return result.then((r: any) => r.yearly_returns || []);
  },

  riskAnalytics: (projectId: string): Promise<RiskAnalytics> => {
    const result = rpcCached<any>('get_analytics_detail', { p_project_id: projectId });
    return result.then((r: any) => r.risk_analytics || {});
  },

  psychologyAnalytics: (projectId: string): Promise<PsychologyAnalytics> => {
    const result = rpcCached<any>('get_analytics_detail', { p_project_id: projectId });
    return result.then((r: any) => r.psychology_analytics || {});
  },

  calendarHeatmap: (projectId: string): Promise<CalendarHeatmap> =>
    rpcCached('get_calendar_heatmap', { p_project_id: projectId }),

  scatterData: (projectId: string): Promise<ScatterData> => {
    const result = rpcCached<any>('get_analytics_detail', { p_project_id: projectId });
    return result.then((r: any) => r.scatter_data || {});
  },

  filtered: async (projectId: string, startDate?: string, endDate?: string): Promise<StatisticsResponse> => {
    const { data, error } = await supabase.rpc('get_trade_statistics', { p_project_id: projectId, p_start_date: startDate || null, p_end_date: endDate || null });
    if (error) throw error;
    return { overview: (data ?? {}) as any } as StatisticsResponse;
  },
};

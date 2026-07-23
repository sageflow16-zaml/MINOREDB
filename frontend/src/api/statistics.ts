import api from '../services/api';
import type {
  StatisticsResponse,
  StatisticsOverview,
  StatisticsRisk,
  StatisticsByField,
  StatisticsBias,
  StatisticsSession,
  MonthlyReturn,
  RollingStats,
  EquityPoint,
  DistributionData,
  StrategyStats,
  WeeklyReturn,
  YearlyReturn,
  RiskAnalytics,
  PsychologyAnalytics,
  CalendarHeatmap,
  ScatterData,
} from './types';

const base = (projectId: string) => `/projects/${projectId}/statistics`;

export const statisticsService = {
  overview: (projectId: string) =>
    api.get<StatisticsResponse>(`${base(projectId)}/overview`).then((r) => r.data),
  risk: (projectId: string) =>
    api.get<StatisticsRisk>(`${base(projectId)}/risk`).then((r) => r.data),
  byPair: (projectId: string) =>
    api.get<StatisticsByField>(`${base(projectId)}/by-pair`).then((r) => r.data),
  byDirection: (projectId: string) =>
    api.get<StatisticsByField>(`${base(projectId)}/by-direction`).then((r) => r.data),
  byBias: (projectId: string) =>
    api.get<StatisticsBias>(`${base(projectId)}/by-bias`).then((r) => r.data),
  bySession: (projectId: string) =>
    api.get<StatisticsSession>(`${base(projectId)}/by-session`).then((r) => r.data),
  byMarketPhase: (projectId: string) =>
    api.get<StatisticsByField>(`${base(projectId)}/by-market-phase`).then((r) => r.data),
  byTrend: (projectId: string) =>
    api.get<StatisticsByField>(`${base(projectId)}/by-trend`).then((r) => r.data),
  monthlyReturns: (projectId: string) =>
    api.get<MonthlyReturn[]>(`${base(projectId)}/monthly-returns`).then((r) => r.data),
  rolling: (projectId: string, window: number) =>
    api.get<RollingStats>(`${base(projectId)}/rolling`, { params: { window } }).then((r) => r.data),
  equityCurve: (projectId: string) =>
    api.get<EquityPoint[]>(`${base(projectId)}/equity-curve`).then((r) => r.data),
  pnlDistribution: (projectId: string) =>
    api.get<DistributionData>(`${base(projectId)}/pnl-distribution`).then((r) => r.data),
  rrDistribution: (projectId: string) =>
    api.get<DistributionData>(`${base(projectId)}/rr-distribution`).then((r) => r.data),
  full: (projectId: string) =>
    api.get<StatisticsResponse>(`${base(projectId)}/`).then((r) => r.data),

  // NEW: Phase 2.5 endpoints
  byStrategy: (projectId: string) =>
    api.get<Record<string, StrategyStats>>(`${base(projectId)}/by-strategy`).then((r) => r.data),
  byWeekday: (projectId: string) =>
    api.get<Record<string, { trades: number; wins: number; losses: number; pnl: number; win_rate: number }>>(
      `${base(projectId)}/by-weekday`
    ).then((r) => r.data),
  byTimeframe: (projectId: string) =>
    api.get<StatisticsByField>(`${base(projectId)}/by-timeframe`).then((r) => r.data),
  byMarketCondition: (projectId: string) =>
    api.get<StatisticsByField>(`${base(projectId)}/by-market-condition`).then((r) => r.data),
  byVolatility: (projectId: string) =>
    api.get<StatisticsByField>(`${base(projectId)}/by-volatility`).then((r) => r.data),
  byNews: (projectId: string) =>
    api.get<Record<string, { trades: number; wins: number; losses: number; pnl: number; win_rate: number }>>(
      `${base(projectId)}/by-news`
    ).then((r) => r.data),
  bySetup: (projectId: string) =>
    api.get<StatisticsByField>(`${base(projectId)}/by-setup`).then((r) => r.data),
  weeklyReturns: (projectId: string) =>
    api.get<WeeklyReturn[]>(`${base(projectId)}/weekly-returns`).then((r) => r.data),
  yearlyReturns: (projectId: string) =>
    api.get<YearlyReturn[]>(`${base(projectId)}/yearly-returns`).then((r) => r.data),
  riskAnalytics: (projectId: string) =>
    api.get<RiskAnalytics>(`${base(projectId)}/risk-analytics`).then((r) => r.data),
  psychologyAnalytics: (projectId: string) =>
    api.get<PsychologyAnalytics>(`${base(projectId)}/psychology-analytics`).then((r) => r.data),
  calendarHeatmap: (projectId: string) =>
    api.get<CalendarHeatmap>(`${base(projectId)}/calendar-heatmap`).then((r) => r.data),
  scatterData: (projectId: string) =>
    api.get<ScatterData>(`${base(projectId)}/scatter-data`).then((r) => r.data),
  filtered: (projectId: string, startDate?: string, endDate?: string) =>
    api.get<StatisticsResponse>(`${base(projectId)}/filtered`, {
      params: { start_date: startDate, end_date: endDate },
    }).then((r) => r.data),
};
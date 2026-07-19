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
};
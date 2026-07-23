import { useQuery } from '@tanstack/react-query';
import { statisticsService, type StatisticsResponse, type EquityPoint, type DistributionData, type MonthlyReturn, type RollingStats, type WeeklyReturn, type YearlyReturn, type RiskAnalytics, type PsychologyAnalytics, type CalendarHeatmap, type ScatterData } from '../api';

export const useStatisticsOverview = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'overview'],
    queryFn: () => statisticsService.overview(projectId),
    enabled: !!projectId,
  });
};

export const useStatisticsRisk = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'risk'],
    queryFn: () => statisticsService.risk(projectId),
    enabled: !!projectId,
  });
};

export const useStatisticsByPair = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'byPair'],
    queryFn: () => statisticsService.byPair(projectId),
    enabled: !!projectId,
  });
};

export const useStatisticsByDirection = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'byDirection'],
    queryFn: () => statisticsService.byDirection(projectId),
    enabled: !!projectId,
  });
};

export const useStatisticsByBias = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'byBias'],
    queryFn: () => statisticsService.byBias(projectId),
    enabled: !!projectId,
  });
};

export const useStatisticsBySession = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'bySession'],
    queryFn: () => statisticsService.bySession(projectId),
    enabled: !!projectId,
  });
};

export const useStatisticsByMarketPhase = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'byMarketPhase'],
    queryFn: () => statisticsService.byMarketPhase(projectId),
    enabled: !!projectId,
  });
};

export const useStatisticsByTrend = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'byTrend'],
    queryFn: () => statisticsService.byTrend(projectId),
    enabled: !!projectId,
  });
};

export const useMonthlyReturns = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'monthlyReturns'],
    queryFn: () => statisticsService.monthlyReturns(projectId),
    enabled: !!projectId,
  });
};

export const useRollingStats = (projectId: string, window: number = 10) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'rolling', window],
    queryFn: () => statisticsService.rolling(projectId, window),
    enabled: !!projectId,
  });
};

export const useEquityCurve = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'equityCurve'],
    queryFn: () => statisticsService.equityCurve(projectId),
    enabled: !!projectId,
  });
};

export const usePnlDistribution = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'pnlDistribution'],
    queryFn: () => statisticsService.pnlDistribution(projectId),
    enabled: !!projectId,
  });
};

export const useRrDistribution = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'rrDistribution'],
    queryFn: () => statisticsService.rrDistribution(projectId),
    enabled: !!projectId,
  });
};

export const useFullStatistics = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'full'],
    queryFn: () => statisticsService.full(projectId),
    enabled: !!projectId,
  });
};

// NEW: Phase 2.5 hooks
export const useStatisticsByStrategy = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'byStrategy'],
    queryFn: () => statisticsService.byStrategy(projectId),
    enabled: !!projectId,
  });
};

export const useStatisticsByWeekday = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'byWeekday'],
    queryFn: () => statisticsService.byWeekday(projectId),
    enabled: !!projectId,
  });
};

export const useStatisticsByTimeframe = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'byTimeframe'],
    queryFn: () => statisticsService.byTimeframe(projectId),
    enabled: !!projectId,
  });
};

export const useStatisticsByMarketCondition = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'byMarketCondition'],
    queryFn: () => statisticsService.byMarketCondition(projectId),
    enabled: !!projectId,
  });
};

export const useStatisticsByVolatility = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'byVolatility'],
    queryFn: () => statisticsService.byVolatility(projectId),
    enabled: !!projectId,
  });
};

export const useStatisticsByNews = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'byNews'],
    queryFn: () => statisticsService.byNews(projectId),
    enabled: !!projectId,
  });
};

export const useStatisticsBySetup = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'bySetup'],
    queryFn: () => statisticsService.bySetup(projectId),
    enabled: !!projectId,
  });
};

export const useWeeklyReturns = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'weeklyReturns'],
    queryFn: () => statisticsService.weeklyReturns(projectId),
    enabled: !!projectId,
  });
};

export const useYearlyReturns = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'yearlyReturns'],
    queryFn: () => statisticsService.yearlyReturns(projectId),
    enabled: !!projectId,
  });
};

export const useRiskAnalytics = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'riskAnalytics'],
    queryFn: () => statisticsService.riskAnalytics(projectId),
    enabled: !!projectId,
  });
};

export const usePsychologyAnalytics = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'psychologyAnalytics'],
    queryFn: () => statisticsService.psychologyAnalytics(projectId),
    enabled: !!projectId,
  });
};

export const useCalendarHeatmap = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'calendarHeatmap'],
    queryFn: () => statisticsService.calendarHeatmap(projectId),
    enabled: !!projectId,
  });
};

export const useScatterData = (projectId: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'scatterData'],
    queryFn: () => statisticsService.scatterData(projectId),
    enabled: !!projectId,
  });
};

export const useFilteredStatistics = (projectId: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['statistics', projectId, 'filtered', startDate, endDate],
    queryFn: () => statisticsService.filtered(projectId, startDate, endDate),
    enabled: !!projectId && (!!startDate || !!endDate),
  });
};
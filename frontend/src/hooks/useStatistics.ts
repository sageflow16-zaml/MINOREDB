import { useQuery } from '@tanstack/react-query';
import { statisticsService, type StatisticsResponse, type EquityPoint, type DistributionData, type MonthlyReturn, type RollingStats } from '../api';

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
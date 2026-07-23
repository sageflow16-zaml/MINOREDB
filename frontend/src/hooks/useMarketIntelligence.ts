import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketIntelService } from '../api/marketIntelligence';

// ── Dashboard ──
export const useMarketDashboard = (projectId: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'dashboard'],
    queryFn: () => marketIntelService.dashboard(projectId),
    enabled: !!projectId,
  });
};

// ── Events ──
export const useMarketEvents = (
  projectId: string,
  startDate?: string, endDate?: string, country?: string, impact?: string, category?: string
) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'events', startDate, endDate, country, impact, category],
    queryFn: () => marketIntelService.events(projectId, startDate, endDate, country, impact, category),
    enabled: !!projectId,
  });
};

export const useCreateMarketEvent = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => marketIntelService.createEvent(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useUpdateMarketEvent = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Record<string, unknown> }) =>
      marketIntelService.updateEvent(projectId, eventId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useDeleteMarketEvent = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => marketIntelService.deleteEvent(projectId, eventId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useToggleEventFavorite = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => marketIntelService.toggleFavorite(projectId, eventId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useFavorites = (projectId: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'favorites'],
    queryFn: () => marketIntelService.favorites(projectId),
    enabled: !!projectId,
  });
};

// ── Regime ──
export const useRegimes = (projectId: string, symbol?: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'regimes', symbol],
    queryFn: () => marketIntelService.regimes(projectId, symbol),
    enabled: !!projectId,
  });
};

export const useActiveRegime = (projectId: string, symbol?: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'regimes', 'active', symbol],
    queryFn: () => marketIntelService.activeRegime(projectId, symbol),
    enabled: !!projectId,
  });
};

export const useDetectRegime = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ symbol, metrics }: { symbol?: string; metrics?: Record<string, unknown> }) =>
      marketIntelService.detectRegime(projectId, symbol, metrics),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

// ── Correlations ──
export const useCorrelations = (projectId: string, symbol?: string, period?: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'correlations', symbol, period],
    queryFn: () => marketIntelService.correlations(projectId, symbol, period),
    enabled: !!projectId,
  });
};

export const useCorrelationMatrix = (projectId: string, period?: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'correlation-matrix', period],
    queryFn: () => marketIntelService.correlationMatrix(projectId, period),
    enabled: !!projectId,
  });
};

export const useCalculateCorrelation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { symbol_a: string; symbol_b: string; prices_a: number[]; prices_b: number[]; period?: string }) =>
      marketIntelService.calculateCorrelation(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

// ── Liquidity ──
export const useLiquidityLevels = (projectId: string, symbol: string, date?: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'liquidity', symbol, date],
    queryFn: () => marketIntelService.liquidity(projectId, symbol, date),
    enabled: !!projectId && !!symbol,
  });
};

export const useCreateLiquidity = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => marketIntelService.createLiquidity(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useMarkSwept = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (levelId: string) => marketIntelService.markSwept(projectId, levelId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useDeleteLiquidity = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (levelId: string) => marketIntelService.deleteLiquidity(projectId, levelId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

// ── Structure ──
export const useStructurePoints = (projectId: string, symbol: string, timeframe?: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'structure', symbol, timeframe],
    queryFn: () => marketIntelService.structure(projectId, symbol, timeframe),
    enabled: !!projectId && !!symbol,
  });
};

export const useCreateStructure = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => marketIntelService.createStructure(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useMitigateStructure = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pointId: string) => marketIntelService.mitigateStructure(projectId, pointId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

// ── Sessions ──
export const useSessions = (projectId: string, date?: string, symbol?: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'sessions', date, symbol],
    queryFn: () => marketIntelService.sessions(projectId, date, symbol),
    enabled: !!projectId,
  });
};

export const useCreateSession = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => marketIntelService.createSession(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useSessionStats = (projectId: string, sessionName: string, days?: number) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'sessions', sessionName, 'stats', days],
    queryFn: () => marketIntelService.sessionStats(projectId, sessionName, days),
    enabled: !!projectId && !!sessionName,
  });
};

// ── Watchlist ──
export const useWatchlists = (projectId: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'watchlists'],
    queryFn: () => marketIntelService.watchlists(projectId),
    enabled: !!projectId,
  });
};

export const useCreateWatchlist = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => marketIntelService.createWatchlist(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useDeleteWatchlist = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (watchlistId: string) => marketIntelService.deleteWatchlist(projectId, watchlistId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useWatchlistItems = (projectId: string, watchlistId: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'watchlists', watchlistId, 'items'],
    queryFn: () => marketIntelService.watchlistItems(projectId, watchlistId),
    enabled: !!projectId && !!watchlistId,
  });
};

export const useAddWatchlistItem = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ watchlistId, data }: { watchlistId: string; data: Record<string, unknown> }) =>
      marketIntelService.addWatchlistItem(projectId, watchlistId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useUpdateWatchlistItem = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Record<string, unknown> }) =>
      marketIntelService.updateWatchlistItem(projectId, itemId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useDeleteWatchlistItem = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => marketIntelService.deleteWatchlistItem(projectId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

// ── Alerts ──
export const useMarketAlerts = (projectId: string, alertType?: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'alerts', alertType],
    queryFn: () => marketIntelService.alerts(projectId, alertType),
    enabled: !!projectId,
  });
};

export const useCreateAlert = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => marketIntelService.createAlert(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useReadAlert = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => marketIntelService.readAlert(projectId, alertId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useDismissAlert = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => marketIntelService.dismissAlert(projectId, alertId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useCheckNewsAlerts = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => marketIntelService.checkNewsAlerts(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

// ── Timeline ──
export const useTimeline = (projectId: string, startDate?: string, endDate?: string, eventType?: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'timeline', startDate, endDate, eventType],
    queryFn: () => marketIntelService.timeline(projectId, startDate, endDate, eventType),
    enabled: !!projectId,
  });
};

export const useCreateTimelineEvent = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => marketIntelService.createTimelineEvent(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useAutoPopulateTimeline = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => marketIntelService.autoPopulateTimeline(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

// ── Providers ──
export const useProviders = (projectId: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'providers'],
    queryFn: () => marketIntelService.providers(projectId),
    enabled: !!projectId,
  });
};

export const useCreateProvider = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => marketIntelService.createProvider(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useUpdateProvider = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ providerId, data }: { providerId: string; data: Record<string, unknown> }) =>
      marketIntelService.updateProvider(projectId, providerId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

export const useDeleteProvider = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (providerId: string) => marketIntelService.deleteProvider(projectId, providerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-intel', projectId] }),
  });
};

// ── AI Context ──
export const useMarketAIContext = (projectId: string) => {
  return useQuery({
    queryKey: ['market-intel', projectId, 'ai-context'],
    queryFn: () => marketIntelService.aiContext(projectId),
    enabled: !!projectId,
  });
};

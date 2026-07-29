import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quantResearchService } from '../api/quantResearch';
import { createEvent, eventBus } from '../lib/ai/eventBus';

// ── Dashboard ──
export const useQuantDashboard = (projectId: string) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'dashboard'],
    queryFn: () => quantResearchService.dashboard(projectId),
    enabled: !!projectId,
  });
};

// ── Experiments ──
export const useExperiments = (projectId: string, params?: { status?: string; tags?: string }) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'experiments', params],
    queryFn: () => quantResearchService.experiments(projectId, params),
    enabled: !!projectId,
  });
};

export const useExperiment = (projectId: string, id: string | undefined) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'experiments', id],
    queryFn: () => quantResearchService.getExperiment(projectId, id!),
    enabled: !!projectId && !!id,
  });
};

export const useCreateExperiment = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => quantResearchService.createExperiment(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quant-research', projectId, 'experiments'] }),
  });
};

export const useUpdateExperiment = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      quantResearchService.updateExperiment(projectId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quant-research', projectId] }),
  });
};

export const useDeleteExperiment = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quantResearchService.deleteExperiment(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quant-research', projectId, 'experiments'] }),
  });
};

export const useDuplicateExperiment = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quantResearchService.duplicateExperiment(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quant-research', projectId, 'experiments'] }),
  });
};

export const useExperimentResults = (projectId: string, id: string | undefined) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'experiments', id, 'results'],
    queryFn: () => quantResearchService.getExperimentResults(projectId, id!),
    enabled: !!projectId && !!id,
  });
};

// ── Backtests ──
export const useBacktests = (projectId: string, params?: { experiment_id?: string; status?: string }) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'backtests', params],
    queryFn: () => quantResearchService.backtests(projectId, params),
    enabled: !!projectId,
  });
};

export const useRunBacktest = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => quantResearchService.runBacktest(projectId, data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['quant-research', projectId, 'backtests'] });
      eventBus.emit(createEvent('BACKTEST_CREATED', projectId, { backtestId: data?.id, backtestName: data?.name }));
    },
  });
};

export const useBacktest = (projectId: string, id: string | undefined) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'backtests', id],
    queryFn: () => quantResearchService.getBacktest(projectId, id!),
    enabled: !!projectId && !!id,
  });
};

export const useDeleteBacktest = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quantResearchService.deleteBacktest(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quant-research', projectId, 'backtests'] }),
  });
};

export const useBacktestTrades = (projectId: string, id: string | undefined, page?: number, perPage?: number) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'backtests', id, 'trades', page, perPage],
    queryFn: () => quantResearchService.getBacktestTrades(projectId, id!, page, perPage),
    enabled: !!projectId && !!id,
  });
};

export const useEquityCurve = (projectId: string, id: string | undefined) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'backtests', id, 'equity-curve'],
    queryFn: () => quantResearchService.getEquityCurve(projectId, id!),
    enabled: !!projectId && !!id,
  });
};

export const useBacktestMetrics = (projectId: string, id: string | undefined) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'backtests', id, 'metrics'],
    queryFn: () => quantResearchService.getBacktestMetrics(projectId, id!),
    enabled: !!projectId && !!id,
  });
};

// ── Simulations ──
export const useSimulations = (projectId: string, params?: { experiment_id?: string; simulation_type?: string }) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'simulations', params],
    queryFn: () => quantResearchService.simulations(projectId, params),
    enabled: !!projectId,
  });
};

export const useRunSimulation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => quantResearchService.runSimulation(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quant-research', projectId, 'simulations'] }),
  });
};

export const useSimulation = (projectId: string, id: string | undefined) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'simulations', id],
    queryFn: () => quantResearchService.getSimulation(projectId, id!),
    enabled: !!projectId && !!id,
  });
};

export const useDeleteSimulation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quantResearchService.deleteSimulation(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quant-research', projectId, 'simulations'] }),
  });
};

// ── Walk-Forward ──
export const useWalkforwardRuns = (projectId: string, params?: { experiment_id?: string }) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'walkforward', params],
    queryFn: () => quantResearchService.walkforwardRuns(projectId, params),
    enabled: !!projectId,
  });
};

export const useRunWalkforward = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => quantResearchService.runWalkforward(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quant-research', projectId, 'walkforward'] }),
  });
};

// ── Optimization ──
export const useOptimizations = (projectId: string, params?: { experiment_id?: string; optimization_type?: string }) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'optimizations', params],
    queryFn: () => quantResearchService.optimizations(projectId, params),
    enabled: !!projectId,
  });
};

export const useRunOptimization = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => quantResearchService.runOptimization(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quant-research', projectId, 'optimizations'] }),
  });
};

// ── Edge Health ──
export const useEdgeHealthSnapshots = (projectId: string, params?: { experiment_id?: string }) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'edge-health', params],
    queryFn: () => quantResearchService.edgeHealthSnapshots(projectId, params),
    enabled: !!projectId,
  });
};

export const useCurrentEdgeHealth = (projectId: string, experimentId?: string) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'edge-health', 'current', experimentId],
    queryFn: () => quantResearchService.getCurrentEdgeHealth(projectId, experimentId),
    enabled: !!projectId,
  });
};

export const useCreateEdgeSnapshot = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => quantResearchService.createEdgeSnapshot(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quant-research', projectId, 'edge-health'] }),
  });
};

// ── AI Research ──
export const useAIResearch = (projectId: string) => {
  return useMutation({
    mutationFn: (data: { query: string; experiment_id?: string; context?: Record<string, unknown> }) =>
      quantResearchService.aiResearch(projectId, data),
  });
};

export const useAISummarize = (projectId: string) => {
  return useMutation({
    mutationFn: ({ experimentId, backtestRunId }: { experimentId?: string; backtestRunId?: string }) =>
      quantResearchService.aiSummarize(projectId, experimentId, backtestRunId),
  });
};

export const useAIImprove = (projectId: string) => {
  return useMutation({
    mutationFn: (experimentId: string) => quantResearchService.aiSuggestImprovements(projectId, experimentId),
  });
};

// ── Notebooks ──
export const useNotebooks = (projectId: string, params?: { experiment_id?: string; content_type?: string }) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'notebooks', params],
    queryFn: () => quantResearchService.notebooks(projectId, params),
    enabled: !!projectId,
  });
};

export const useCreateNotebookEntry = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => quantResearchService.createNotebookEntry(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quant-research', projectId, 'notebooks'] }),
  });
};

export const useDeleteNotebookEntry = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quantResearchService.deleteNotebookEntry(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quant-research', projectId, 'notebooks'] }),
  });
};

// ── Hypothesis Tests ──
export const useHypothesisTests = (projectId: string, params?: { experiment_id?: string }) => {
  return useQuery({
    queryKey: ['quant-research', projectId, 'hypothesis-tests', params],
    queryFn: () => quantResearchService.hypothesisTests(projectId, params),
    enabled: !!projectId,
  });
};

// ── Export ──
export const useExportData = (projectId: string) => {
  return useMutation({
    mutationFn: (data: { experiment_id?: string; backtest_run_id?: string; format?: string }) =>
      quantResearchService.exportData(projectId, data),
  });
};

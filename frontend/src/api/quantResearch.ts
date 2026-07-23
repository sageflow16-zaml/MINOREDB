import api from '../services/api';
import type {
  QuantExperiment, BacktestRun, BacktestTrade, SimulationRun,
  WalkForwardRun, OptimizationRun, EdgeHealthSnapshot,
  ResearchNotebook, HypothesisTestResult, QuantDashboardData,
  AISummaryResponse, AIImproveResponse, ExportResponse,
} from './types';

const base = (projectId: string) => `/projects/${projectId}/quant-research`;

export const quantResearchService = {
  // Dashboard
  dashboard: (projectId: string) =>
    api.get<QuantDashboardData>(`${base(projectId)}/dashboard`).then((r) => r.data),

  // Experiments
  experiments: (projectId: string, params?: { status?: string; tags?: string; sort?: string; limit?: number }) =>
    api.get<QuantExperiment[]>(`${base(projectId)}/experiments`, { params }).then((r) => r.data),

  createExperiment: (projectId: string, data: Record<string, unknown>) =>
    api.post<QuantExperiment>(`${base(projectId)}/experiments`, data).then((r) => r.data),

  getExperiment: (projectId: string, id: string) =>
    api.get<QuantExperiment>(`${base(projectId)}/experiments/${id}`).then((r) => r.data),

  updateExperiment: (projectId: string, id: string, data: Record<string, unknown>) =>
    api.put<QuantExperiment>(`${base(projectId)}/experiments/${id}`, data).then((r) => r.data),

  deleteExperiment: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/experiments/${id}`).then((r) => r.data),

  duplicateExperiment: (projectId: string, id: string) =>
    api.post<QuantExperiment>(`${base(projectId)}/experiments/${id}/duplicate`).then((r) => r.data),

  getExperimentResults: (projectId: string, id: string) =>
    api.get<Record<string, unknown>>(`${base(projectId)}/experiments/${id}/results`).then((r) => r.data),

  // Backtests
  backtests: (projectId: string, params?: { experiment_id?: string; status?: string; limit?: number }) =>
    api.get<BacktestRun[]>(`${base(projectId)}/backtests`, { params }).then((r) => r.data),

  runBacktest: (projectId: string, data: Record<string, unknown>) =>
    api.post<BacktestRun>(`${base(projectId)}/backtests`, data).then((r) => r.data),

  getBacktest: (projectId: string, id: string) =>
    api.get<BacktestRun>(`${base(projectId)}/backtests/${id}`).then((r) => r.data),

  deleteBacktest: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/backtests/${id}`).then((r) => r.data),

  getBacktestTrades: (projectId: string, id: string, page?: number, perPage?: number) =>
    api.get<{ trades: BacktestTrade[]; total: number; page: number; per_page: number }>(
      `${base(projectId)}/backtests/${id}/trades`, { params: { page, per_page: perPage } }
    ).then((r) => r.data),

  getEquityCurve: (projectId: string, id: string) =>
    api.get<{ date: string; equity: number; pnl: number }[]>(`${base(projectId)}/backtests/${id}/equity-curve`).then((r) => r.data),

  getBacktestMetrics: (projectId: string, id: string) =>
    api.get<Record<string, unknown>>(`${base(projectId)}/backtests/${id}/metrics`).then((r) => r.data),

  // Simulations
  simulations: (projectId: string, params?: { experiment_id?: string; simulation_type?: string; limit?: number }) =>
    api.get<SimulationRun[]>(`${base(projectId)}/simulations`, { params }).then((r) => r.data),

  runSimulation: (projectId: string, data: Record<string, unknown>) =>
    api.post<SimulationRun>(`${base(projectId)}/simulations`, data).then((r) => r.data),

  getSimulation: (projectId: string, id: string) =>
    api.get<SimulationRun>(`${base(projectId)}/simulations/${id}`).then((r) => r.data),

  deleteSimulation: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/simulations/${id}`).then((r) => r.data),

  getSimulationDistribution: (projectId: string, id: string) =>
    api.get<{ bucket: number; count: number }[]>(`${base(projectId)}/simulations/${id}/distribution`).then((r) => r.data),

  // Walk-Forward
  walkforwardRuns: (projectId: string, params?: { experiment_id?: string; limit?: number }) =>
    api.get<WalkForwardRun[]>(`${base(projectId)}/walkforward`, { params }).then((r) => r.data),

  runWalkforward: (projectId: string, data: Record<string, unknown>) =>
    api.post<WalkForwardRun>(`${base(projectId)}/walkforward`, data).then((r) => r.data),

  getWalkforwardRun: (projectId: string, id: string) =>
    api.get<WalkForwardRun>(`${base(projectId)}/walkforward/${id}`).then((r) => r.data),

  deleteWalkforwardRun: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/walkforward/${id}`).then((r) => r.data),

  // Optimization
  optimizations: (projectId: string, params?: { experiment_id?: string; optimization_type?: string; limit?: number }) =>
    api.get<OptimizationRun[]>(`${base(projectId)}/optimizations`, { params }).then((r) => r.data),

  runOptimization: (projectId: string, data: Record<string, unknown>) =>
    api.post<OptimizationRun>(`${base(projectId)}/optimizations`, data).then((r) => r.data),

  getOptimization: (projectId: string, id: string) =>
    api.get<OptimizationRun>(`${base(projectId)}/optimizations/${id}`).then((r) => r.data),

  deleteOptimization: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/optimizations/${id}`).then((r) => r.data),

  getOptimizationHeatmap: (projectId: string, id: string) =>
    api.get<Record<string, unknown>>(`${base(projectId)}/optimizations/${id}/heatmap`).then((r) => r.data),

  // Edge Health
  edgeHealthSnapshots: (projectId: string, params?: { experiment_id?: string; limit?: number }) =>
    api.get<EdgeHealthSnapshot[]>(`${base(projectId)}/edge-health`, { params }).then((r) => r.data),

  createEdgeSnapshot: (projectId: string, data: Record<string, unknown>) =>
    api.post<EdgeHealthSnapshot>(`${base(projectId)}/edge-health`, data).then((r) => r.data),

  getCurrentEdgeHealth: (projectId: string, experimentId?: string) =>
    api.get<EdgeHealthSnapshot>(`${base(projectId)}/edge-health/current`, { params: { experiment_id: experimentId } }).then((r) => r.data),

  deleteEdgeSnapshot: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/edge-health/${id}`).then((r) => r.data),

  // Statistics
  describePerformance: (projectId: string, params?: { backtest_run_id?: string }) =>
    api.get<Record<string, unknown>>(`${base(projectId)}/statistics/describe`, { params }).then((r) => r.data),

  // AI Research
  aiResearch: (projectId: string, data: { query: string; experiment_id?: string; context?: Record<string, unknown> }) =>
    api.post<Record<string, unknown>>(`${base(projectId)}/ai/research`, data).then((r) => r.data),

  aiSummarize: (projectId: string, experimentId?: string, backtestRunId?: string) =>
    api.post<AISummaryResponse>(`${base(projectId)}/ai/summarize`, null, {
      params: { experiment_id: experimentId, backtest_run_id: backtestRunId },
    }).then((r) => r.data),

  aiSuggestImprovements: (projectId: string, experimentId: string) =>
    api.post<AIImproveResponse>(`${base(projectId)}/ai/improve`, null, {
      params: { experiment_id: experimentId },
    }).then((r) => r.data),

  // Notebooks
  notebooks: (projectId: string, params?: { experiment_id?: string; content_type?: string }) =>
    api.get<ResearchNotebook[]>(`${base(projectId)}/notebooks`, { params }).then((r) => r.data),

  createNotebookEntry: (projectId: string, data: Record<string, unknown>) =>
    api.post<ResearchNotebook>(`${base(projectId)}/notebooks`, data).then((r) => r.data),

  getNotebookEntry: (projectId: string, id: string) =>
    api.get<ResearchNotebook>(`${base(projectId)}/notebooks/${id}`).then((r) => r.data),

  updateNotebookEntry: (projectId: string, id: string, data: Record<string, unknown>) =>
    api.put<ResearchNotebook>(`${base(projectId)}/notebooks/${id}`, data).then((r) => r.data),

  deleteNotebookEntry: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/notebooks/${id}`).then((r) => r.data),

  // Hypothesis Tests
  hypothesisTests: (projectId: string, params?: { experiment_id?: string; limit?: number }) =>
    api.get<HypothesisTestResult[]>(`${base(projectId)}/hypothesis-tests`, { params }).then((r) => r.data),

  createHypothesisTest: (projectId: string, data: Record<string, unknown>) =>
    api.post<HypothesisTestResult>(`${base(projectId)}/hypothesis-tests`, data).then((r) => r.data),

  // Export
  exportData: (projectId: string, data: { experiment_id?: string; backtest_run_id?: string; format?: string }) =>
    api.post<ExportResponse>(`${base(projectId)}/export`, data).then((r) => r.data),
};

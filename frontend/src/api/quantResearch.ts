import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type {
  QuantExperiment, BacktestRun, BacktestTrade, SimulationRun,
  WalkForwardRun, OptimizationRun, EdgeHealthSnapshot,
  ResearchNotebook, HypothesisTestResult, QuantDashboardData,
  AISummaryResponse, AIImproveResponse, ExportResponse,
} from './types';

export const quantResearchService = {
  // Dashboard
  dashboard: async (projectId: string): Promise<QuantDashboardData> => {
    const { data, error } = await supabase
      .rpc('get_quant_dashboard', { p_project_id: projectId });
    if (error) throw error;
    return (data ?? {}) as unknown as QuantDashboardData;
  },

  // Experiments
  experiments: async (projectId: string, params?: { status?: string; tags?: string; sort?: string; limit?: number }): Promise<QuantExperiment[]> => {
    let query = supabase
      .from('quant_experiment')
      .select('*')
      .eq('project_id', projectId);

    if (params?.status) query = query.eq('status', params.status);
    if (params?.tags) query = query.contains('tags', [params.tags]);
    if (params?.sort) {
      const [col, dir] = params.sort.split(':');
      query = query.order(col ?? 'created_at', { ascending: dir === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    if (params?.limit) query = query.limit(params.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as QuantExperiment[];
  },

  createExperiment: async (projectId: string, data: Record<string, unknown>): Promise<QuantExperiment> => {
    const { data: row, error } = await supabase
      .from('quant_experiment')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return row as unknown as QuantExperiment;
  },

  getExperiment: async (projectId: string, id: string): Promise<QuantExperiment> => {
    const { data, error } = await supabase
      .from('quant_experiment')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as unknown as QuantExperiment;
  },

  updateExperiment: async (projectId: string, id: string, data: Record<string, unknown>): Promise<QuantExperiment> => {
    const { data: row, error } = await supabase
      .from('quant_experiment')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return row as unknown as QuantExperiment;
  },

  deleteExperiment: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('quant_experiment')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  duplicateExperiment: async (projectId: string, id: string): Promise<QuantExperiment> => {
    const { data: original, error: fetchError } = await supabase
      .from('quant_experiment')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (fetchError) throw fetchError;

    const { name, ...rest } = original as Record<string, unknown>;
    const { data: duplicate, error: insertError } = await supabase
      .from('quant_experiment')
      .insert({ ...rest, name: `${name} (copy)`, project_id: projectId })
      .select()
      .single();
    if (insertError) throw insertError;
    return duplicate as unknown as QuantExperiment;
  },

  getExperimentResults: async (projectId: string, id: string): Promise<Record<string, unknown>> => {
    const { data, error } = await supabase
      .from('quant_experiment')
      .select('config, results_summary')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as unknown as Record<string, unknown>;
  },

  // Backtests
  backtests: async (projectId: string, params?: { experiment_id?: string; status?: string; limit?: number }): Promise<BacktestRun[]> => {
    let query = supabase
      .from('quant_backtest_run')
      .select('*')
      .eq('project_id', projectId);

    if (params?.experiment_id) query = query.eq('experiment_id', params.experiment_id);
    if (params?.status) query = query.eq('status', params.status);
    query = query.order('created_at', { ascending: false });
    if (params?.limit) query = query.limit(params.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as BacktestRun[];
  },

  runBacktest: async (projectId: string, data: Record<string, unknown>): Promise<BacktestRun> => {
    const config = (data.config as Record<string, unknown>) ?? {};
    const costs = (data.costs as Record<string, unknown>) ?? {};
    const symbols = Array.isArray(data.symbols) ? data.symbols : [];
    const strategyConfig = {
      backtest_type: data.backtest_type ?? 'single',
      config,
      costs,
      symbols,
    };
    const { data: row, error } = await supabase
      .from('quant_backtest_run')
      .insert({
        name: data.name ?? 'Backtest',
        symbol: typeof config.symbol === 'string' ? config.symbol : symbols[0] ?? null,
        timeframe: typeof config.timeframe === 'string' ? config.timeframe : null,
        start_date: data.start_date ?? null,
        end_date: data.end_date ?? null,
        initial_capital: config.initial_capital ?? 10000,
        strategy_config: strategyConfig,
        project_id: projectId,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    await callEdgeFunction('quant', {
      operation: 'run-backtest',
      project_id: projectId,
      data: { run_id: (row as unknown as Record<string, unknown>).id },
    });
    const { data: refreshed, error: refetchError } = await supabase
      .from('quant_backtest_run')
      .select('*')
      .eq('id', (row as unknown as Record<string, unknown>).id)
      .single();
    if (refetchError) throw refetchError;
    return refreshed as unknown as BacktestRun;
  },

  getBacktest: async (projectId: string, id: string): Promise<BacktestRun> => {
    const { data, error } = await supabase
      .from('quant_backtest_run')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as unknown as BacktestRun;
  },

  deleteBacktest: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('quant_backtest_run')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  getBacktestTrades: async (projectId: string, id: string, page?: number, perPage?: number): Promise<{ trades: BacktestTrade[]; total: number; page: number; per_page: number }> => {
    const pageNum = page ?? 1;
    const perPageNum = perPage ?? 50;
    const from = (pageNum - 1) * perPageNum;
    const to = from + perPageNum - 1;

    const { data, error, count } = await supabase
      .from('quant_backtest_trade')
      .select('*', { count: 'exact' })
      .eq('backtest_run_id', id)
      .eq('project_id', projectId)
      .order('entry_date', { ascending: true })
      .range(from, to);
    if (error) throw error;

    return {
      trades: (data ?? []) as unknown as BacktestTrade[],
      total: count ?? 0,
      page: pageNum,
      per_page: perPageNum,
    };
  },

  getEquityCurve: async (projectId: string, id: string): Promise<{ date: string; equity: number; pnl: number }[]> => {
    const { data, error } = await supabase
      .from('quant_backtest_trade')
      .select('entry_date, profit')
      .eq('backtest_run_id', id)
      .eq('project_id', projectId)
      .order('entry_date', { ascending: true });
    if (error) throw error;

    let equity = 0;
    return ((data ?? []) as { entry_date: string; profit: number }[]).map((t) => {
      equity += (t.profit ?? 0);
      return { date: t.entry_date, equity, pnl: t.profit ?? 0 };
    });
  },

  getBacktestMetrics: async (projectId: string, id: string): Promise<Record<string, unknown>> => {
    const { data, error } = await supabase
      .from('quant_backtest_run')
      .select('metrics')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return (data as unknown as Record<string, unknown>)?.metrics as Record<string, unknown> ?? {};
  },

  // Simulations
  simulations: async (projectId: string, params?: { experiment_id?: string; simulation_type?: string; limit?: number }): Promise<SimulationRun[]> => {
    let query = supabase
      .from('quant_simulation_run')
      .select('*')
      .eq('project_id', projectId);

    if (params?.experiment_id) query = query.eq('experiment_id', params.experiment_id);
    if (params?.simulation_type) query = query.eq('simulation_type', params.simulation_type);
    query = query.order('created_at', { ascending: false });
    if (params?.limit) query = query.limit(params.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as SimulationRun[];
  },

  runSimulation: async (projectId: string, data: Record<string, unknown>): Promise<SimulationRun> => {
    const { data: row, error } = await supabase
      .from('quant_simulation_run')
      .insert({
        name: data.name ?? 'Simulation',
        simulation_type: data.simulation_type ?? 'monte_carlo',
        iterations: data.num_simulations ?? data.iterations ?? 1000,
        config: data.config ?? {},
        project_id: projectId,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    await callEdgeFunction('quant', {
      operation: 'run-simulation',
      project_id: projectId,
      data: { simulation_id: (row as unknown as Record<string, unknown>).id },
    });
    const { data: refreshed, error: refetchError } = await supabase
      .from('quant_simulation_run')
      .select('*')
      .eq('id', (row as unknown as Record<string, unknown>).id)
      .single();
    if (refetchError) throw refetchError;
    return refreshed as unknown as SimulationRun;
  },

  getSimulation: async (projectId: string, id: string): Promise<SimulationRun> => {
    const { data, error } = await supabase
      .from('quant_simulation_run')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as unknown as SimulationRun;
  },

  deleteSimulation: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('quant_simulation_run')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  getSimulationDistribution: async (projectId: string, id: string): Promise<{ bucket: number; count: number }[]> => {
    const { data, error } = await supabase
      .from('quant_simulation_run')
      .select('distribution')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return ((data as unknown as Record<string, unknown>)?.distribution as { bucket: number; count: number }[]) ?? [];
  },
  // Walk-Forward
  walkforwardRuns: async (projectId: string, params?: { experiment_id?: string; limit?: number }): Promise<WalkForwardRun[]> => {
    let query = supabase
      .from('quant_walk_forward_run')
      .select('*')
      .eq('project_id', projectId);

    if (params?.experiment_id) query = query.eq('experiment_id', params.experiment_id);
    query = query.order('created_at', { ascending: false });
    if (params?.limit) query = query.limit(params.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as WalkForwardRun[];
  },

  runWalkforward: async (projectId: string, data: Record<string, unknown>): Promise<WalkForwardRun> => {
    const { data: row, error } = await supabase
      .from('quant_walk_forward_run')
      .insert({ ...data, project_id: projectId, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return row as unknown as WalkForwardRun;
  },

  getWalkforwardRun: async (projectId: string, id: string): Promise<WalkForwardRun> => {
    const { data, error } = await supabase
      .from('quant_walk_forward_run')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as unknown as WalkForwardRun;
  },

  deleteWalkforwardRun: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('quant_walk_forward_run')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  // Optimization
  optimizations: async (projectId: string, params?: { experiment_id?: string; optimization_type?: string; limit?: number }): Promise<OptimizationRun[]> => {
    let query = supabase
      .from('quant_optimization_run')
      .select('*')
      .eq('project_id', projectId);

    if (params?.experiment_id) query = query.eq('experiment_id', params.experiment_id);
    if (params?.optimization_type) query = query.eq('optimization_type', params.optimization_type);
    query = query.order('created_at', { ascending: false });
    if (params?.limit) query = query.limit(params.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as OptimizationRun[];
  },

  runOptimization: async (projectId: string, data: Record<string, unknown>): Promise<OptimizationRun> => {
    const { data: row, error } = await supabase
      .from('quant_optimization_run')
      .insert({ ...data, project_id: projectId, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return row as unknown as OptimizationRun;
  },

  getOptimization: async (projectId: string, id: string): Promise<OptimizationRun> => {
    const { data, error } = await supabase
      .from('quant_optimization_run')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as unknown as OptimizationRun;
  },

  deleteOptimization: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('quant_optimization_run')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  getOptimizationHeatmap: async (projectId: string, id: string): Promise<Record<string, unknown>> => {
    const { data, error } = await supabase
      .from('quant_optimization_run')
      .select('heatmap_data')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return ((data as unknown as Record<string, unknown>)?.heatmap_data as Record<string, unknown>) ?? {};
  },

  // Edge Health
  edgeHealthSnapshots: async (projectId: string, params?: { experiment_id?: string; limit?: number }): Promise<EdgeHealthSnapshot[]> => {
    let query = supabase
      .from('quant_edge_health_snapshot')
      .select('*')
      .eq('project_id', projectId);

    if (params?.experiment_id) query = query.eq('experiment_id', params.experiment_id);
    query = query.order('snapshot_date', { ascending: false });
    if (params?.limit) query = query.limit(params.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as EdgeHealthSnapshot[];
  },

  createEdgeSnapshot: async (projectId: string, data: Record<string, unknown>): Promise<EdgeHealthSnapshot> => {
    const { data: row, error } = await supabase
      .from('quant_edge_health_snapshot')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return row as unknown as EdgeHealthSnapshot;
  },

  getCurrentEdgeHealth: async (projectId: string, experimentId?: string): Promise<EdgeHealthSnapshot> => {
    let query = supabase
      .from('quant_edge_health_snapshot')
      .select('*')
      .eq('project_id', projectId)
      .order('snapshot_date', { ascending: false })
      .limit(1);

    if (experimentId) query = query.eq('experiment_id', experimentId);

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No edge health snapshot found');
    return data[0] as unknown as EdgeHealthSnapshot;
  },

  deleteEdgeSnapshot: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('quant_edge_health_snapshot')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  // Statistics
  describePerformance: async (projectId: string, params?: { backtest_run_id?: string }): Promise<Record<string, unknown>> => {
    return callEdgeFunction('ai', { operation: 'describe-performance', project_id: projectId, data: params ?? {} });
  },

  // AI Research
  aiResearch: async (projectId: string, data: { query: string; experiment_id?: string; context?: Record<string, unknown> }): Promise<Record<string, unknown>> => {
    return callEdgeFunction('ai', { operation: 'research', project_id: projectId, data });
  },

  aiSummarize: async (projectId: string, experimentId?: string, backtestRunId?: string): Promise<AISummaryResponse> => {
    return callEdgeFunction<AISummaryResponse>('ai', {
      operation: 'summarize',
      project_id: projectId,
      data: { experiment_id: experimentId, backtest_run_id: backtestRunId },
    });
  },

  aiSuggestImprovements: async (projectId: string, experimentId: string): Promise<AIImproveResponse> => {
    return callEdgeFunction<AIImproveResponse>('ai', {
      operation: 'suggest-improvements',
      project_id: projectId,
      data: { experiment_id: experimentId },
    });
  },

  // Notebooks
  notebooks: async (projectId: string, params?: { experiment_id?: string; content_type?: string }): Promise<ResearchNotebook[]> => {
    let query = supabase
      .from('quant_research_notebook')
      .select('*')
      .eq('project_id', projectId);

    if (params?.experiment_id) query = query.eq('experiment_id', params.experiment_id);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as ResearchNotebook[];
  },

  createNotebookEntry: async (projectId: string, data: Record<string, unknown>): Promise<ResearchNotebook> => {
    const { data: row, error } = await supabase
      .from('quant_research_notebook')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return row as unknown as ResearchNotebook;
  },

  getNotebookEntry: async (projectId: string, id: string): Promise<ResearchNotebook> => {
    const { data, error } = await supabase
      .from('quant_research_notebook')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as unknown as ResearchNotebook;
  },

  updateNotebookEntry: async (projectId: string, id: string, data: Record<string, unknown>): Promise<ResearchNotebook> => {
    const { data: row, error } = await supabase
      .from('quant_research_notebook')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return row as unknown as ResearchNotebook;
  },

  deleteNotebookEntry: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('quant_research_notebook')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  // Hypothesis Tests
  hypothesisTests: async (projectId: string, params?: { experiment_id?: string; limit?: number }): Promise<HypothesisTestResult[]> => {
    let query = supabase
      .from('quant_hypothesis_test')
      .select('*')
      .eq('project_id', projectId);

    if (params?.experiment_id) query = query.eq('experiment_id', params.experiment_id);
    query = query.order('created_at', { ascending: false });
    if (params?.limit) query = query.limit(params.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as HypothesisTestResult[];
  },

  createHypothesisTest: async (projectId: string, data: Record<string, unknown>): Promise<HypothesisTestResult> => {
    const { data: row, error } = await supabase
      .from('quant_hypothesis_test')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return row as unknown as HypothesisTestResult;
  },

  // Export
  exportData: async (projectId: string, data: { experiment_id?: string; backtest_run_id?: string; format?: string }): Promise<ExportResponse> => {
    const payload: Record<string, unknown> = {};
    const format = data.format ?? 'json';

    if (data.experiment_id) {
      const { data: experiment, error: e1 } = await supabase
        .from('quant_experiment')
        .select('*')
        .eq('id', data.experiment_id)
        .eq('project_id', projectId)
        .single();
      if (!e1) payload.experiment = experiment;
    }

    if (data.backtest_run_id) {
      const { data: backtest, error: e2 } = await supabase
        .from('quant_backtest_run')
        .select('*')
        .eq('id', data.backtest_run_id)
        .eq('project_id', projectId)
        .single();
      if (!e2) {
        payload.backtest = backtest;
        const { data: trades, error: e3 } = await supabase
          .from('quant_backtest_trade')
          .select('*')
          .eq('backtest_run_id', data.backtest_run_id)
          .eq('project_id', projectId);
        if (!e3) payload.trades = trades;
      }
    }

    return {
      format,
      content: JSON.stringify(payload, null, 2),
      filename: `quant-export-${projectId}-${Date.now()}.${format}`,
    } as ExportResponse;
  },
};

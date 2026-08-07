import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { ICTAnalysisRequest, ICTAnalysisResponse, ICTMarketBias, ICTExecutionSignal, AIContext, ICTFullContext, SwingPoint, StructureResult, FVGResult, OrderBlockResult, LiquidityResult, SessionResult, ICTModelResult } from './types';

export const ictApi = {
  analyze: async (projectId: string, data: ICTAnalysisRequest): Promise<{ data: ICTAnalysisResponse }> => {
    const startTime = Date.now();

    const [structRes, sessionRes] = await Promise.all([
      supabase.from('market_structure_point').select('*').eq('project_id', projectId).eq('symbol', data.symbol).order('created_at', { ascending: false }).limit(100),
      supabase.from('session_analysis').select('*').eq('project_id', projectId).eq('symbol', data.symbol).order('date', { ascending: false }).limit(10),
    ]);

    const swing_points: SwingPoint[] = (structRes.data ?? []).map((s: any) => ({
      index: s.bar_index ?? 0,
      timestamp: s.created_at ?? '',
      price: s.price ?? 0,
      type: s.point_type ?? 'unknown',
      strength: s.strength ?? 0,
    }));

    const structures: StructureResult[] = [];
    let trend = 'neutral';
    if (swing_points.length > 0) {
      const highs = swing_points.filter((sp) => sp.type === 'high');
      const lows = swing_points.filter((sp) => sp.type === 'low');
      if (highs.length > 1 && lows.length > 1) {
        const recentHigh = highs[highs.length - 1]?.price ?? 0;
        const prevHigh = highs[highs.length - 2]?.price ?? 0;
        const recentLow = lows[lows.length - 1]?.price ?? 0;
        const prevLow = lows[lows.length - 2]?.price ?? 0;
        if (recentHigh > prevHigh && recentLow > prevLow) trend = 'bullish';
        else if (recentHigh < prevHigh && recentLow < prevLow) trend = 'bearish';
      }
    }

    const dbSessions: SessionResult[] = (sessionRes.data ?? []).map((s: any) => ({
      session_type: s.session_name ?? s.session_type ?? 'unknown',
      date: s.date ?? '',
      open_price: s.open_price ?? 0,
      high_price: s.high_price ?? 0,
      low_price: s.low_price ?? 0,
      close_price: s.close_price ?? 0,
      range: s.range_pips ?? 0,
      direction: s.direction ?? null,
      start_time: s.created_at ?? '',
      end_time: s.created_at ?? '',
    }));
    const sessionRow = sessionRes.data?.[0] as Record<string, unknown> | undefined;

    let aiContext: any = null;
    try {
      const env = { symbol: data.symbol, timeframe: data.timeframe };
      aiContext = await callEdgeFunction('ai', {
        operation: 'evaluate-current',
        project_id: projectId,
        data: { environment: env },
      });
    } catch {
      /* AI context unavailable - analyze without it */
    }

    const analysis: ICTAnalysisResponse = {
      symbol: data.symbol,
      timeframe: data.timeframe,
      structure: {
        swing_points,
        structures,
        trend,
        current_high: swing_points.filter((sp) => sp.type === 'high').pop()?.price ?? null,
        current_low: swing_points.filter((sp) => sp.type === 'low').pop()?.price ?? null,
        protected_high: swing_points.filter((sp) => sp.type === 'high').slice(-2)[0]?.price ?? null,
        protected_low: swing_points.filter((sp) => sp.type === 'low').slice(-2)[0]?.price ?? null,
        last_bos: null,
        last_mss: null,
      },
      fvg: { fvgs: [], bullish_count: 0, bearish_count: 0, best_fvg: null },
      order_blocks: { order_blocks: [], bullish_count: 0, bearish_count: 0, best_block: null },
      liquidity: { zones: [], buy_side_liquidity: [], sell_side_liquidity: [], equal_highs: [], equal_lows: [], recent_sweeps: [] },
      sessions: {
        sessions: dbSessions,
        current_session: dbSessions[0]?.session_type ?? null,
        current_kill_zone: null,
        is_silver_bullet_window: false,
        opening_range_high: dbSessions[0]?.high_price ?? null,
        opening_range_low: dbSessions[0]?.low_price ?? null,
        id: sessionRow?.id as string ?? '',
        project_id: projectId,
        date: sessionRow?.date as string ?? '',
        session_name: sessionRow?.session_name as string ?? '',
      },
      models: [],
      multi_timeframe: {
        weekly: aiContext?.statistics?.overall_win_rate ? (aiContext.statistics.overall_win_rate >= 50 ? 'bullish' : 'bearish') : 'neutral',
        daily: trend,
        h4: 'neutral',
        h1: 'neutral',
        m15: 'neutral',
        htf_bias: trend,
        ltf_confirmation: 'neutral',
        confluence_score: swing_points.length > 0 ? Math.min(swing_points.length, 10) : 0,
        premium_discount: 'neutral',
      },
      scores: {
        structure_score: Math.min(swing_points.length, 10),
        liquidity_score: 0,
        fvg_score: 0,
        order_block_score: 0,
        risk_score: trend === 'neutral' ? 3 : 6,
        session_score: Math.min(dbSessions.length, 10),
        confluence_score: swing_points.length > 0 ? Math.min(swing_points.length, 10) : 0,
        overall_quality: swing_points.length > 0 ? Math.min(5 + dbSessions.length, 10) : 0,
      },
      execution: {
        status: swing_points.length > 0 ? 'wait' : 'pending',
        direction: trend === 'bullish' ? 'buy' : trend === 'bearish' ? 'sell' : null,
        entry: null,
        stop_loss: null,
        take_profit: null,
        risk_amount: null,
        reasoning: swing_points.length > 0
          ? `${swing_points.length} swing points detected. Trend: ${trend}. ${dbSessions.length} sessions analyzed.`
          : 'No market structure data found. Import trades or connect a data source to enable ICT analysis.',
        scores: {
          structure_score: Math.min(swing_points.length, 10),
          liquidity_score: 0,
          fvg_score: 0,
          order_block_score: 0,
          risk_score: trend === 'neutral' ? 3 : 6,
          session_score: Math.min(dbSessions.length, 10),
          confluence_score: swing_points.length > 0 ? Math.min(swing_points.length, 10) : 0,
          overall_quality: swing_points.length > 0 ? Math.min(5 + dbSessions.length, 10) : 0,
        },
      },
      market_context: {
        symbol: data.symbol,
        current_price: swing_points[0]?.price ?? 0,
        htf_bias: trend,
        ltf_bias: 'neutral',
        current_structure: swing_points.length > 0 ? { swing_points: swing_points.length, trend } : null,
        best_setup: null,
        premium_discount: 'neutral',
        key_levels: swing_points.map((sp) => sp.price),
        weak_areas: [],
        invalidation_levels: [],
        confluence: swing_points.length > 0 ? Math.min(swing_points.length, 10) : 0,
        session_info: sessionRow ?? null,
        recent_events: [],
        reasoning: aiContext?.explanation?.join('\n') ?? (swing_points.length > 0
          ? `Analysis complete: ${swing_points.length} swing points found across ${data.symbol} on ${data.timeframe}. Trade with caution.`
          : 'Insufficient market data to generate AI reasoning.'),
      },
      analysis_time_ms: Date.now() - startTime,
    };

    return { data: analysis };
  },

  getStructures: async (projectId: string, symbol?: string, limit = 50): Promise<{ data: Record<string, unknown>[] }> => {
    let query = supabase.from('market_structure_point').select('*').eq('project_id', projectId);
    if (symbol) query = query.eq('symbol', symbol);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return { data: data ?? [] };
  },

  getEvents: async (projectId: string, symbol?: string, eventType?: string, limit = 50): Promise<{ data: Record<string, unknown>[] }> => {
    let query = supabase.from('market_timeline').select('*').eq('project_id', projectId);
    if (symbol) query = query.eq('symbol', symbol);
    if (eventType) query = query.eq('event_type', eventType);
    const { data, error } = await query.order('event_time', { ascending: false }).limit(limit);
    if (error) throw error;
    return { data: data ?? [] };
  },

  getFVGs: async (_projectId: string, _symbol?: string, _status?: string, _limit = 50): Promise<{ data: Record<string, unknown>[] }> => {
    throw new Error('FVG data requires ICT analysis engine');
  },

  getOrderBlocks: async (_projectId: string, _symbol?: string, _blockType?: string, _limit = 50): Promise<{ data: Record<string, unknown>[] }> => {
    throw new Error('Order blocks require ICT analysis engine');
  },

  getLiquidityZones: async (_projectId: string, _symbol?: string, _liquidityType?: string, _limit = 50): Promise<{ data: Record<string, unknown>[] }> => {
    throw new Error('Liquidity zones require ICT analysis engine');
  },

  getSetups: async (_projectId: string, _symbol?: string, _modelType?: string, _status?: string, _limit = 50): Promise<{ data: Record<string, unknown>[] }> => {
    throw new Error('ICT setups require analysis engine');
  },

  getSetup: async (_projectId: string, _setupId: string): Promise<{ data: Record<string, unknown> }> => {
    throw new Error('ICT setup detail requires analysis engine');
  },

  getSessions: async (projectId: string, symbol?: string, _date?: string, limit = 50): Promise<{ data: Record<string, unknown>[] }> => {
    let query = supabase.from('session_analysis').select('*').eq('project_id', projectId);
    if (symbol) query = query.eq('symbol', symbol);
    const { data, error } = await query.order('date', { ascending: false }).limit(limit);
    if (error) throw error;
    return { data: data ?? [] };
  },

  getMarketBias: async (_projectId: string, _symbol = 'EURUSD'): Promise<{ data: ICTMarketBias }> => {
    throw new Error('Market bias requires AI analysis');
  },

  getSignals: async (_projectId: string, _symbol?: string, _status?: string, _limit = 50): Promise<{ data: ICTExecutionSignal[] }> => {
    throw new Error('ICT signals require analysis engine');
  },

  getAIContext: async (projectId: string, symbol = 'EURUSD'): Promise<{ data: AIContext }> => {
    const [structuresRes, biasRes, eventsRes] = await Promise.all([
      supabase.from('market_structure_point').select('*').eq('project_id', projectId).eq('symbol', symbol).order('created_at', { ascending: false }).limit(20),
      supabase.rpc('get_market_bias_summary', { p_project_id: projectId }),
      supabase.from('market_timeline').select('*').eq('project_id', projectId).eq('symbol', symbol).order('event_time', { ascending: false }).limit(10),
    ]);
    if (structuresRes.error) throw structuresRes.error;
    if (eventsRes.error) throw eventsRes.error;

    const points = (structuresRes.data ?? []) as Array<{ point_type?: string; price?: number }>;
    const highs = points.filter((sp) => sp.point_type === 'high');
    const lows = points.filter((sp) => sp.point_type === 'low');
    const trend = highs.length > 1 && lows.length > 1
      ? (highs[0]?.price ?? 0) > (highs[1]?.price ?? 0) && (lows[0]?.price ?? 0) > (lows[1]?.price ?? 0)
        ? 'bullish'
        : 'bearish'
      : 'neutral';
    const events = (eventsRes.data ?? []) as Record<string, unknown>[];

    return {
      data: {
        symbol,
        bias: biasRes.data ?? null,
        best_setup: null,
        recent_events: events,
        active_signal: null,
        summary: points.length > 0
          ? `${points.length} swing points detected for ${symbol}. Trend: ${trend}. ${events.length} market events.`
          : `No market structure data for ${symbol} yet. Run analysis after importing market data.`,
      },
    };
  },

  getFullContext: async (projectId: string, symbol = 'EURUSD'): Promise<{ data: ICTFullContext }> => {
    const [structuresRes, eventsRes, biasRes] = await Promise.all([
      supabase.from('market_structure_point').select('*').eq('project_id', projectId).eq('symbol', symbol).order('created_at', { ascending: false }).limit(50),
      supabase.from('market_timeline').select('*').eq('project_id', projectId).eq('symbol', symbol).order('event_time', { ascending: false }).limit(50),
      supabase.rpc('get_market_bias_summary', { p_project_id: projectId }),
    ]);
    if (structuresRes.error) throw structuresRes.error;
    if (eventsRes.error) throw eventsRes.error;

    return {
      data: {
        structures: structuresRes.data ?? [],
        events: eventsRes.data ?? [],
        fvgs: [],
        order_blocks: [],
        liquidity: [],
        setups: [],
        bias: { current: biasRes.data ?? null },
        signals: [],
      },
    };
  },
};

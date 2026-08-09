import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type {
  EconomicEvent,
  MarketRegime,
  CorrelationData,
  LiquidityLevel,
  MarketStructurePoint,
  SessionAnalysis,
  Watchlist,
  WatchlistItem,
  MarketAlert,
  MarketTimelineEvent,
  DataProviderConfig,
  MarketDashboardData,
  CorrelationMatrix,
  SessionStats,
  MarketAIContext,
} from './types';

const IMPACT_MAP: Record<string, number> = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
const IMPORTANCE_MAP: Record<number, string> = { 1: 'very_low', 2: 'low', 3: 'medium', 4: 'high', 5: 'very_high' };

function mapEventFromDb(row: Record<string, unknown>): EconomicEvent {
  const r = row as Record<string, unknown> & { importance?: number; is_favorite?: boolean };
  const impact = r.importance != null ? IMPORTANCE_MAP[r.importance] ?? 'medium' : 'medium';
  return {
    id: String(r.id ?? ''),
    created_at: String(r.created_at ?? r.event_date ?? ''),
    project_id: String(r.project_id ?? ''),
    event_name: String(r.title ?? ''),
    event_date: String(r.event_date ?? ''),
    country: String(r.country ?? ''),
    currency: String(r.currency ?? r.country ?? ''),
    category: String(r.category ?? ''),
    impact,
    impact_level: impact,
    actual: r.actual != null ? Number(r.actual) : undefined,
    forecast: r.forecast != null ? Number(r.forecast) : undefined,
    previous: r.previous != null ? Number(r.previous) : undefined,
    description: r.description != null ? String(r.description) : undefined,
    is_favorite: r.is_favorite === true,
  };
}

function mapEventToDb(data: Partial<EconomicEvent>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (data.event_name !== undefined) db.title = data.event_name;
  if (data.event_date !== undefined) db.event_date = data.event_date;
  if (data.country !== undefined) db.country = data.country;
  if (data.category !== undefined) db.category = data.category;
  if (data.impact !== undefined) db.importance = IMPACT_MAP[data.impact] ?? 3;
  if (data.actual !== undefined) db.actual = data.actual;
  if (data.forecast !== undefined) db.forecast = data.forecast;
  if (data.previous !== undefined) db.previous = data.previous;
  if (data.description !== undefined) db.description = data.description;
  if (data.is_favorite !== undefined) db.is_favorite = data.is_favorite;
  return db;
}

function mapRegimeFromDb(row: Record<string, unknown>): MarketRegime {
  return {
    id: String(row.id ?? ''),
    project_id: String(row.project_id ?? ''),
    regime_type: String(row.regime_type ?? ''),
    regime_value: String(row.direction ?? row.description ?? ''),
    symbol: String(row.symbol ?? ''),
    confidence: row.strength != null ? Number(row.strength) : 0,
    is_active: row.is_active === true,
    started_at: row.detected_at != null ? String(row.detected_at) : undefined,
    ended_at: row.ended_at != null ? String(row.ended_at) : undefined,
  };
}

function mapLiquidityFromDb(row: Record<string, unknown>): LiquidityLevel {
  return {
    id: String(row.id ?? ''),
    project_id: String(row.project_id ?? ''),
    symbol: String(row.symbol ?? ''),
    level_type: String(row.level_type ?? ''),
    level_value: row.price != null ? Number(row.price) : 0,
    date: row.created_at != null ? String(row.created_at) : '',
    is_swept: row.is_swept === true,
    swept_at: row.swept_at != null ? String(row.swept_at) : undefined,
  };
}

function mapLiquidityToDb(data: Partial<LiquidityLevel>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (data.symbol !== undefined) db.symbol = data.symbol;
  if (data.level_type !== undefined) db.level_type = data.level_type;
  if (data.level_value !== undefined) db.price = data.level_value;
  return db;
}

function mapStructureFromDb(row: Record<string, unknown>): MarketStructurePoint {
  return {
    id: String(row.id ?? ''),
    project_id: String(row.project_id ?? ''),
    symbol: String(row.symbol ?? ''),
    timeframe: row.timeframe != null ? String(row.timeframe) : undefined,
    point_type: String(row.point_type ?? ''),
    price_level: row.price != null ? Number(row.price) : undefined,
    is_mitigated: row.is_mitigated === true,
    is_active: true,
    detected_at: row.created_at != null ? String(row.created_at) : undefined,
  };
}

function mapStructureToDb(data: Partial<MarketStructurePoint>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (data.symbol !== undefined) db.symbol = data.symbol;
  if (data.timeframe !== undefined) db.timeframe = data.timeframe;
  if (data.point_type !== undefined) db.point_type = data.point_type;
  if (data.price_level !== undefined) db.price = data.price_level;
  return db;
}

function mapSessionFromDb(row: Record<string, unknown>): SessionAnalysis {
  return {
    id: String(row.id ?? ''),
    project_id: String(row.project_id ?? ''),
    symbol: row.symbol != null ? String(row.symbol) : undefined,
    date: String(row.date ?? ''),
    session_name: String(row.session_name ?? ''),
    open_price: row.open != null ? Number(row.open) : undefined,
    high_price: row.high != null ? Number(row.high) : undefined,
    low_price: row.low != null ? Number(row.low) : undefined,
    close_price: row.close != null ? Number(row.close) : undefined,
    range_pips: row.range != null ? Number(row.range) : undefined,
    direction: row.bias != null ? String(row.bias) : undefined,
    notes: row.analysis != null ? JSON.stringify(row.analysis) : undefined,
    sessions: [],
    current_session: null,
    current_kill_zone: null,
    is_silver_bullet_window: false,
    opening_range_high: null,
    opening_range_low: null,
  };
}

function mapSessionToDb(data: Partial<SessionAnalysis>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (data.session_name !== undefined) db.session_name = data.session_name;
  if (data.symbol !== undefined) db.symbol = data.symbol;
  if (data.date !== undefined) db.date = data.date;
  if (data.open_price !== undefined) db.open = data.open_price;
  if (data.high_price !== undefined) db.high = data.high_price;
  if (data.low_price !== undefined) db.low = data.low_price;
  if (data.close_price !== undefined) db.close = data.close_price;
  if (data.range_pips !== undefined) db.range = data.range_pips;
  if (data.direction !== undefined) db.bias = data.direction;
  if (data.notes !== undefined) db.analysis = data.notes;
  return db;
}

function mapAlertFromDb(row: Record<string, unknown>): MarketAlert {
  return {
    id: String(row.id ?? ''),
    project_id: String(row.project_id ?? ''),
    alert_type: String(row.alert_type ?? ''),
    title: String(row.condition ?? row.alert_type ?? ''),
    message: row.message != null ? String(row.message) : undefined,
    severity: 'medium',
    is_read: row.is_read === true,
    is_dismissed: row.is_dismissed === true,
    created_at: row.triggered_at != null ? String(row.triggered_at) : undefined,
  };
}

function mapAlertToDb(data: Partial<MarketAlert>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (data.alert_type !== undefined) db.alert_type = data.alert_type;
  if (data.message !== undefined) db.message = data.message;
  return db;
}

function mapTimelineFromDb(row: Record<string, unknown>): MarketTimelineEvent {
  return {
    id: String(row.id ?? ''),
    project_id: String(row.project_id ?? ''),
    event_type: String(row.event_type ?? ''),
    event_date: row.event_time != null ? String(row.event_time) : String(row.created_at ?? ''),
    title: String(row.title ?? ''),
    description: row.description != null ? String(row.description) : undefined,
    symbol: row.symbol != null ? String(row.symbol) : undefined,
    impact: row.importance != null ? IMPORTANCE_MAP[row.importance as number] ?? 'medium' : undefined,
  };
}

function mapTimelineToDb(data: Partial<MarketTimelineEvent>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (data.event_type !== undefined) db.event_type = data.event_type;
  if (data.title !== undefined) db.title = data.title;
  if (data.description !== undefined) db.description = data.description;
  if (data.symbol !== undefined) db.symbol = data.symbol;
  if (data.impact !== undefined) db.importance = IMPACT_MAP[data.impact] ?? 3;
  if (data.event_date !== undefined) db.event_time = data.event_date;
  return db;
}

function mapProviderFromDb(row: Record<string, unknown>): DataProviderConfig {
  return {
    id: String(row.id ?? ''),
    provider_name: String(row.provider_name ?? ''),
    provider_type: row.config != null ? (row.config as Record<string, unknown>)?.type as string ?? '' : '',
    is_default: row.is_default === true,
    is_enabled: row.is_active === true,
    priority: 0,
    config: row.config != null ? row.config as Record<string, unknown> : undefined,
  };
}

function mapProviderToDb(data: Partial<DataProviderConfig>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (data.provider_name !== undefined) db.provider_name = data.provider_name;
  if (data.is_default !== undefined) db.is_default = data.is_default;
  if (data.is_enabled !== undefined) db.is_active = data.is_enabled;
  if (data.config !== undefined) db.config = data.config;
  return db;
}

export const marketIntelService = {
  async dashboard(projectId: string): Promise<MarketDashboardData> {
    const { data, error } = await supabase.rpc('get_market_intelligence_dashboard', {
      p_project_id: projectId,
    });
    if (error) throw error;
    const d = data as Record<string, unknown>;
    return {
      regime: d.regime ? mapRegimeFromDb(d.regime as Record<string, unknown>) : null,
      recent_regimes: ((d.recent_regimes ?? []) as Record<string, unknown>[]).map(mapRegimeFromDb),
      upcoming_events: ((d.upcoming_events ?? []) as Record<string, unknown>[]).map(mapEventFromDb),
      alerts: ((d.alerts ?? []) as Record<string, unknown>[]).map(mapAlertFromDb),
      watchlist_summary: d.watchlist_summary != null ? d.watchlist_summary as MarketDashboardData['watchlist_summary'] : null,
      session_status: (d.session_status ?? {}) as Record<string, string>,
      correlation_summary: d.correlation_summary != null ? d.correlation_summary as Record<string, unknown> : null,
      usd_strength: Number(d.usd_strength ?? 0),
      volatility_summary: d.volatility_summary as MarketDashboardData['volatility_summary'] ?? { level: 'unknown', regime: null },
      equity_summary: d.equity_summary != null ? d.equity_summary as Record<string, unknown> : null,
      commodity_summary: d.commodity_summary != null ? d.commodity_summary as Record<string, unknown> : null,
      bond_summary: d.bond_summary != null ? d.bond_summary as Record<string, unknown> : null,
    };
  },

  async events(
    projectId: string,
    startDate?: string,
    endDate?: string,
    country?: string,
    impact?: string,
    category?: string,
  ): Promise<EconomicEvent[]> {
    let query = supabase
      .from('economic_calendar_event')
      .select('*')
      .eq('project_id', projectId);
    if (startDate) query = query.gte('event_date', startDate);
    if (endDate) query = query.lte('event_date', endDate);
    if (country) query = query.eq('country', country);
    if (impact) query = query.eq('importance', IMPACT_MAP[impact] ?? -1);
    if (category) query = query.eq('category', category);
    query = query.order('event_date', { ascending: true });
    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(mapEventFromDb);
  },

  async createEvent(projectId: string, data: Partial<EconomicEvent>): Promise<EconomicEvent> {
    const db = { project_id: projectId, ...mapEventToDb(data) };
    const { data: row, error } = await supabase
      .from('economic_calendar_event')
      .insert(db)
      .select()
      .single();
    if (error) throw error;
    return mapEventFromDb(row as Record<string, unknown>);
  },

  async updateEvent(projectId: string, eventId: string, data: Partial<EconomicEvent>): Promise<EconomicEvent> {
    const db = mapEventToDb(data);
    const { data: row, error } = await supabase
      .from('economic_calendar_event')
      .update(db)
      .eq('id', eventId)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return mapEventFromDb(row as Record<string, unknown>);
  },

  async deleteEvent(projectId: string, eventId: string): Promise<void> {
    const { error } = await supabase
      .from('economic_calendar_event')
      .delete()
      .eq('id', eventId)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  async toggleFavorite(projectId: string, eventId: string): Promise<EconomicEvent> {
    const { data: current, error: fetchError } = await supabase
      .from('economic_calendar_event')
      .select('is_favorite')
      .eq('id', eventId)
      .eq('project_id', projectId)
      .single();
    if (fetchError) throw fetchError;
    const newFav = !(current as { is_favorite: boolean }).is_favorite;
    const { data: row, error } = await supabase
      .from('economic_calendar_event')
      .update({ is_favorite: newFav })
      .eq('id', eventId)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return mapEventFromDb(row as Record<string, unknown>);
  },

  async favorites(projectId: string): Promise<EconomicEvent[]> {
    const { data, error } = await supabase
      .from('economic_calendar_event')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_favorite', true)
      .order('event_date', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(mapEventFromDb);
  },

  async regimes(projectId: string, symbol?: string): Promise<MarketRegime[]> {
    let query = supabase
      .from('market_regime')
      .select('*')
      .eq('project_id', projectId)
      .order('detected_at', { ascending: false });
    if (symbol) query = query.eq('symbol', symbol);
    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(mapRegimeFromDb);
  },

  async activeRegime(projectId: string, symbol?: string): Promise<MarketRegime | null> {
    let query = supabase
      .from('market_regime')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('detected_at', { ascending: false })
      .limit(1);
    if (symbol) query = query.eq('symbol', symbol);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as Record<string, unknown>[];
    return rows.length > 0 ? mapRegimeFromDb(rows[0]) : null;
  },

  async detectRegime(projectId: string, symbol?: string, metrics?: Record<string, unknown>): Promise<MarketRegime> {
    const result = await callEdgeFunction('ai', {
      operation: 'detect-regime',
      project_id: projectId,
      data: { symbol, metrics },
    });
    return result as MarketRegime;
  },

  async correlations(projectId: string, symbol?: string, _period?: string): Promise<CorrelationData[]> {
    let query = supabase
      .from('correlation_data')
      .select('*')
      .eq('project_id', projectId)
      .order('calculated_at', { ascending: false });
    if (symbol) query = query.or(`symbol_a.eq.${symbol},symbol_b.eq.${symbol}`);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as CorrelationData[];
  },

  async correlationMatrix(projectId: string, _period?: string): Promise<CorrelationMatrix> {
    const { data, error } = await supabase
      .from('correlation_data')
      .select('symbol_a, symbol_b, correlation')
      .eq('project_id', projectId);
    if (error) throw error;
    const rows = (data ?? []) as { symbol_a: string; symbol_b: string; correlation: number }[];
    const symbols = [...new Set(rows.flatMap((r) => [r.symbol_a, r.symbol_b]))];
    const matrix: Record<string, number> = {};
    for (const r of rows) {
      matrix[`${r.symbol_a}:${r.symbol_b}`] = r.correlation;
      matrix[`${r.symbol_b}:${r.symbol_a}`] = r.correlation;
    }
    for (const s of symbols) matrix[`${s}:${s}`] = 1;
    return { symbols, matrix };
  },

  async calculateCorrelation(
    _projectId: string,
    data: { symbol_a: string; symbol_b: string; prices_a: number[]; prices_b: number[]; period?: string },
  ): Promise<CorrelationData> {
    const n = Math.min(data.prices_a.length, data.prices_b.length);
    if (n < 3) throw new Error('Need at least 3 data points for correlation');
    const a = data.prices_a.slice(0, n);
    const b = data.prices_b.slice(0, n);
    const meanA = a.reduce((s, v) => s + v, 0) / n;
    const meanB = b.reduce((s, v) => s + v, 0) / n;
    let num = 0, denA = 0, denB = 0;
    for (let i = 0; i < n; i++) {
      const da = a[i] - meanA;
      const db = b[i] - meanB;
      num += da * db;
      denA += da * da;
      denB += db * db;
    }
    const denom = Math.sqrt(denA * denB);
    const correlation = denom === 0 ? 0 : num / denom;
    return {
      id: '',
      project_id: _projectId,
      symbol_a: data.symbol_a,
      symbol_b: data.symbol_b,
      correlation: Math.max(-1, Math.min(1, correlation)),
      period: data.period ?? 'custom',
      data_points: n,
      calculated_at: new Date().toISOString(),
    };
  },

  async liquidity(projectId: string, symbol: string, _date?: string): Promise<LiquidityLevel[]> {
    let query = supabase
      .from('liquidity_level')
      .select('*')
      .eq('project_id', projectId)
      .eq('symbol', symbol)
      .order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(mapLiquidityFromDb);
  },

  async createLiquidity(projectId: string, data: Partial<LiquidityLevel>): Promise<LiquidityLevel> {
    const db = { project_id: projectId, ...mapLiquidityToDb(data) };
    const { data: row, error } = await supabase
      .from('liquidity_level')
      .insert(db)
      .select()
      .single();
    if (error) throw error;
    return mapLiquidityFromDb(row as Record<string, unknown>);
  },

  async markSwept(projectId: string, levelId: string): Promise<LiquidityLevel> {
    const { data: row, error } = await supabase
      .from('liquidity_level')
      .update({ is_swept: true, swept_at: new Date().toISOString() })
      .eq('id', levelId)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return mapLiquidityFromDb(row as Record<string, unknown>);
  },

  async deleteLiquidity(projectId: string, levelId: string): Promise<void> {
    const { error } = await supabase
      .from('liquidity_level')
      .delete()
      .eq('id', levelId)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  async structure(projectId: string, symbol: string, timeframe?: string): Promise<MarketStructurePoint[]> {
    let query = supabase
      .from('market_structure_point')
      .select('*')
      .eq('project_id', projectId)
      .eq('symbol', symbol)
      .order('created_at', { ascending: false });
    if (timeframe) query = query.eq('timeframe', timeframe);
    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(mapStructureFromDb);
  },

  async createStructure(projectId: string, data: Partial<MarketStructurePoint>): Promise<MarketStructurePoint> {
    const db = { project_id: projectId, ...mapStructureToDb(data) };
    const { data: row, error } = await supabase
      .from('market_structure_point')
      .insert(db)
      .select()
      .single();
    if (error) throw error;
    return mapStructureFromDb(row as Record<string, unknown>);
  },

  async mitigateStructure(projectId: string, pointId: string): Promise<MarketStructurePoint> {
    const { data: row, error } = await supabase
      .from('market_structure_point')
      .update({ is_mitigated: true, mitigated_at: new Date().toISOString() })
      .eq('id', pointId)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return mapStructureFromDb(row as Record<string, unknown>);
  },

  async sessions(projectId: string, date?: string, symbol?: string): Promise<SessionAnalysis[]> {
    let query = supabase
      .from('session_analysis')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });
    if (date) query = query.eq('date', date);
    if (symbol) query = query.eq('symbol', symbol);
    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(mapSessionFromDb);
  },

  async createSession(projectId: string, data: Partial<SessionAnalysis>): Promise<SessionAnalysis> {
    const db = { project_id: projectId, ...mapSessionToDb(data) };
    const { data: row, error } = await supabase
      .from('session_analysis')
      .insert(db)
      .select()
      .single();
    if (error) throw error;
    return mapSessionFromDb(row as Record<string, unknown>);
  },

  async sessionStats(projectId: string, sessionName: string, days?: number): Promise<SessionStats> {
    let query = supabase
      .from('session_analysis')
      .select('date, range, bias')
      .eq('project_id', projectId)
      .eq('session_name', sessionName);
    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      query = query.gte('date', cutoff.toISOString().slice(0, 10));
    }
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as { date: string; range: number | null; bias: string | null }[];
    const ranges = rows.map((r) => r.range).filter((r): r is number => r != null);
    const avgRange = ranges.length > 0 ? ranges.reduce((s, v) => s + v, 0) / ranges.length : 0;
    return {
      session: sessionName,
      sample_size: rows.length,
      avg_range: ranges.length > 0 ? avgRange : undefined,
      max_range: ranges.length > 0 ? Math.max(...ranges) : undefined,
      min_range: ranges.length > 0 ? Math.min(...ranges) : undefined,
    };
  },

  async watchlists(projectId: string): Promise<Watchlist[]> {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: String(r.id ?? ''),
      project_id: String(r.project_id ?? ''),
      name: String(r.name ?? ''),
      description: r.description != null ? String(r.description) : undefined,
      is_default: false,
      sort_order: 0,
    }));
  },

  async createWatchlist(projectId: string, data: Partial<Watchlist>): Promise<Watchlist> {
    const db: Record<string, unknown> = { project_id: projectId };
    if (data.name !== undefined) db.name = data.name;
    if (data.description !== undefined) db.description = data.description;
    const { data: row, error } = await supabase
      .from('watchlist')
      .insert(db)
      .select()
      .single();
    if (error) throw error;
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? ''),
      project_id: String(r.project_id ?? ''),
      name: String(r.name ?? ''),
      description: r.description != null ? String(r.description) : undefined,
      is_default: false,
      sort_order: 0,
    };
  },

  async deleteWatchlist(projectId: string, watchlistId: string): Promise<void> {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', watchlistId)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  async watchlistItems(_projectId: string, watchlistId: string): Promise<WatchlistItem[]> {
    const { data, error } = await supabase
      .from('watchlist_item')
      .select('*')
      .eq('watchlist_id', watchlistId);
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: String(r.id ?? ''),
      watchlist_id: String(r.watchlist_id ?? ''),
      symbol: String(r.symbol ?? ''),
      notes: r.notes != null ? String(r.notes) : undefined,
      sort_order: r.sort_order != null ? Number(r.sort_order) : 0,
    }));
  },

  async addWatchlistItem(projectId: string, watchlistId: string, data: Partial<WatchlistItem>): Promise<WatchlistItem> {
    const db: Record<string, unknown> = {
      watchlist_id: watchlistId,
      project_id: projectId,
    };
    if (data.symbol !== undefined) db.symbol = data.symbol;
    if (data.notes !== undefined) db.notes = data.notes;
    if (data.sort_order !== undefined) db.sort_order = data.sort_order;
    const { data: row, error } = await supabase
      .from('watchlist_item')
      .insert(db)
      .select()
      .single();
    if (error) throw error;
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? ''),
      watchlist_id: String(r.watchlist_id ?? ''),
      symbol: String(r.symbol ?? ''),
      notes: r.notes != null ? String(r.notes) : undefined,
      sort_order: r.sort_order != null ? Number(r.sort_order) : 0,
    };
  },

  async updateWatchlistItem(_projectId: string, itemId: string, data: Partial<WatchlistItem>): Promise<WatchlistItem> {
    const db: Record<string, unknown> = {};
    if (data.symbol !== undefined) db.symbol = data.symbol;
    if (data.notes !== undefined) db.notes = data.notes;
    if (data.sort_order !== undefined) db.sort_order = data.sort_order;
    const { data: row, error } = await supabase
      .from('watchlist_item')
      .update(db)
      .eq('id', itemId)
      .select()
      .single();
    if (error) throw error;
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? ''),
      watchlist_id: String(r.watchlist_id ?? ''),
      symbol: String(r.symbol ?? ''),
      notes: r.notes != null ? String(r.notes) : undefined,
      sort_order: r.sort_order != null ? Number(r.sort_order) : 0,
    };
  },

  async deleteWatchlistItem(_projectId: string, itemId: string): Promise<void> {
    const { error } = await supabase
      .from('watchlist_item')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
  },

  async alerts(projectId: string, alertType?: string): Promise<MarketAlert[]> {
    let query = supabase
      .from('market_alert')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_dismissed', false)
      .order('triggered_at', { ascending: false });
    if (alertType) query = query.eq('alert_type', alertType);
    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(mapAlertFromDb);
  },

  async createAlert(projectId: string, data: Partial<MarketAlert>): Promise<MarketAlert> {
    const db = { project_id: projectId, ...mapAlertToDb(data) };
    const { data: row, error } = await supabase
      .from('market_alert')
      .insert(db)
      .select()
      .single();
    if (error) throw error;
    return mapAlertFromDb(row as Record<string, unknown>);
  },

  async readAlert(projectId: string, alertId: string): Promise<MarketAlert> {
    const { data: row, error } = await supabase
      .from('market_alert')
      .update({ is_read: true })
      .eq('id', alertId)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return mapAlertFromDb(row as Record<string, unknown>);
  },

  async dismissAlert(projectId: string, alertId: string): Promise<void> {
    const { error } = await supabase
      .from('market_alert')
      .update({ is_dismissed: true })
      .eq('id', alertId)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  async checkNewsAlerts(projectId: string): Promise<MarketAlert[]> {
    const result = await callEdgeFunction('ai', {
      operation: 'check-news-alerts',
      project_id: projectId,
    });
    return (result as MarketAlert[]) ?? [];
  },

  async timeline(
    projectId: string,
    startDate?: string,
    endDate?: string,
    eventType?: string,
    limit?: number,
  ): Promise<MarketTimelineEvent[]> {
    let query = supabase
      .from('market_timeline')
      .select('*')
      .eq('project_id', projectId)
      .order('event_time', { ascending: false });
    if (startDate) query = query.gte('event_time', startDate);
    if (endDate) query = query.lte('event_time', endDate);
    if (eventType) query = query.eq('event_type', eventType);
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(mapTimelineFromDb);
  },

  async createTimelineEvent(projectId: string, data: Partial<MarketTimelineEvent>): Promise<MarketTimelineEvent> {
    const db = { project_id: projectId, ...mapTimelineToDb(data) };
    const { data: row, error } = await supabase
      .from('market_timeline')
      .insert(db)
      .select()
      .single();
    if (error) throw error;
    return mapTimelineFromDb(row as Record<string, unknown>);
  },

  async autoPopulateTimeline(projectId: string): Promise<{ count: number }> {
    const result = await callEdgeFunction('ai', {
      operation: 'auto-populate-timeline',
      project_id: projectId,
    });
    return result as { count: number };
  },

  async providers(projectId: string): Promise<DataProviderConfig[]> {
    const { data, error } = await supabase
      .from('market_data_provider')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(mapProviderFromDb);
  },

  async defaultProvider(projectId: string): Promise<DataProviderConfig | null> {
    const { data, error } = await supabase
      .from('market_data_provider')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_default', true)
      .limit(1);
    if (error) throw error;
    const rows = (data ?? []) as Record<string, unknown>[];
    return rows.length > 0 ? mapProviderFromDb(rows[0]) : null;
  },

  async createProvider(projectId: string, data: Partial<DataProviderConfig>): Promise<DataProviderConfig> {
    const db = { project_id: projectId, ...mapProviderToDb(data) };
    const { data: row, error } = await supabase
      .from('market_data_provider')
      .insert(db)
      .select()
      .single();
    if (error) throw error;
    return mapProviderFromDb(row as Record<string, unknown>);
  },

  async updateProvider(projectId: string, providerId: string, data: Partial<DataProviderConfig>): Promise<DataProviderConfig> {
    const db = mapProviderToDb(data);
    const { data: row, error } = await supabase
      .from('market_data_provider')
      .update(db)
      .eq('id', providerId)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return mapProviderFromDb(row as Record<string, unknown>);
  },

  async deleteProvider(projectId: string, providerId: string): Promise<void> {
    const { error } = await supabase
      .from('market_data_provider')
      .delete()
      .eq('id', providerId)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  async aiContext(projectId: string): Promise<MarketAIContext> {
    const result = await callEdgeFunction('ai', {
      operation: 'market-context',
      project_id: projectId,
    });
    return result as MarketAIContext;
  },
};

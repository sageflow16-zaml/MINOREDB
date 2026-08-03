/**
 * Shared API types mirroring the backend Pydantic schemas.
 * Kept intentionally permissive (Record<string, unknown>) for free-form
 * metadata while still typing the core identity/audit fields.
 */

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface SourceRead {
  id: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
  admissibility_status?: string;
  origin_type?: string;
  attribution?: string;
  raw_text?: string;
  normalized_text?: string;
  source_metadata?: Record<string, unknown>;
}

export interface SourceCreate {
  raw_text: string;
  normalized_text?: string;
  attribution?: string;
  origin_type?: string;
  admissibility_status?: string;
  source_metadata?: Record<string, unknown>;
}

export interface SourceUpdate {
  attribution?: string;
  origin_type?: string;
  admissibility_status?: string;
  source_metadata?: Record<string, unknown>;
}

export interface ClaimRead {
  id: string;
  project_id?: string;
  source_id: string;
  verbatim_text: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClaimCreate {
  source_id: string;
  verbatim_text: string;
}

export interface ClaimUpdate {
  verbatim_text?: string;
}

export interface ConceptRead {
  id: string;
  project_id?: string;
  conceptual_term: string;
  definition: string;
  created_at: string;
  updated_at?: string;
}

export interface ConceptCreate {
  conceptual_term: string;
  definition: string;
}

export interface ConceptUpdate {
  conceptual_term?: string;
  definition?: string;
}

export interface AssociationRead {
  id: string;
  project_id?: string;
  claim_id: string;
  concept_id: string;
  association_state?: string;
  ambiguity_metric?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AssociationCreate {
  claim_id: string;
  concept_id: string;
  association_state?: string;
  ambiguity_metric?: string;
}

export interface AssociationUpdate {
  association_state?: string;
  ambiguity_metric?: string;
}

export interface ConflictRead {
  id: string;
  project_id?: string;
  conflict_classification: string;
  contextual_applicability_check: string;
  created_at: string;
  updated_at?: string;
}

export interface ConflictCreate {
  conflict_classification: string;
  contextual_applicability_check: string;
}

export interface ConflictUpdate {
  conflict_classification?: string;
  contextual_applicability_check?: string;
}

export interface InterpretationRead {
  id: string;
  project_id?: string;
  concept_id: string;
  interpretation_statement: string;
  reasoning_chain: string;
  interpretation_foundation: string;
  created_at: string;
  updated_at?: string;
}

export interface ResearchQuestionRead {
  id: string;
  project_id?: string;
  conflict_id: string;
  question_statement: string;
  inquiry_origin: string;
  domain_relevance: string;
  substantive_grounding: string;
  created_at: string;
  updated_at?: string;
}

export interface HypothesisRead {
  id: string;
  project_id?: string;
  research_question_id: string;
  hypothesis_statement: string;
  variable_specification: string;
  measurement_specification: string;
  substantive_departure: string;
  created_at: string;
  updated_at?: string;
}

export interface GraphResponse {
  claim: ClaimRead;
  concepts: ConceptRead[];
  interpretation?: InterpretationRead;
  conflicts: ConflictRead[];
  research_questions: ResearchQuestionRead[];
  hypotheses: HypothesisRead[];
}

export interface CollectorStatus {
  id: string;
  name: string;
  status: string;
  enabled: boolean;
  last_run_at?: string;
  next_run_at?: string;
  records_collected: number;
  errors: number;
  last_error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CollectorLog {
  id: string;
  collector_name: string;
  status: string;
  records_count: number;
  errors_count: number;
  error_message?: string;
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
  created_at: string;
}

export interface CollectorRunResult {
  collector_name: string;
  status: string;
  records_collected: number;
  errors_count: number;
  error_message?: string;
  duration_ms: number;
}

export interface DashboardStats {
  sources: number;
  claims: number;
  concepts: number;
  interpretations: number;
  conflicts: number;
  questions: number;
  hypotheses: number;
  total_trades?: number;
  win_rate?: number;
  avg_rr?: number;
  open_trades?: number;
  bullish_bias?: number;
  bearish_bias?: number;
  current_market_phase?: string;
  current_trend?: string;
  total_collectors?: number;
  active_collectors?: number;
  collector_errors?: number;
  collector_records?: number;
  expectancy?: number;
  total_pnl?: number;
  avg_win?: number;
  avg_loss?: number;
  max_drawdown?: number;
  profit_factor?: number;
  sharpe_ratio?: number;
  recovery_factor?: number;
  top_knowledge_rule?: TopKnowledgeRule | null;
  graph_nodes?: number;
  graph_edges?: number;
}

export interface StatisticsOverview {
  total_trades: number;
  closed_trades: number;
  wins: number;
  losses: number;
  breakevens: number;
  open_trades: number;
  win_rate: number;
  avg_rr: number;
  total_pnl: number;
  expectancy: number;
  avg_win: number;
  avg_loss: number;
}

export interface StatisticsRisk {
  max_drawdown: number;
  profit_factor: number;
  sharpe_ratio: number;
  recovery_factor: number;
}

export interface StatisticsByField {
  [key: string]: {
    trades: number;
    wins: number;
    losses: number;
    pnl: number;
    win_rate: number;
  };
}

export interface StatisticsBias {
  [key: string]: {
    trades: number;
    wins: number;
    losses: number;
    pnl: number;
    win_rate: number;
  };
}

export interface StatisticsSession {
  [key: string]: {
    trades: number;
    wins: number;
    losses: number;
    pnl: number;
    win_rate: number;
  };
}

export interface MonthlyReturn {
  month: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
}

export interface RollingStats {
  available: boolean;
  window: number;
  trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  pnl: number;
  trades_needed?: number;
}

export interface StatisticsResponse {
  overview: StatisticsOverview;
  risk: StatisticsRisk;
  by_pair: StatisticsByField;
  by_direction: StatisticsByField;
  by_result: Record<string, number>;
  by_bias: StatisticsBias;
  by_session: StatisticsSession;
  by_market_phase: StatisticsByField;
  by_trend: StatisticsByField;
  by_strategy: Record<string, StrategyStats>;
  by_weekday: Record<string, StatisticsByFieldValue>;
  by_timeframe: StatisticsByField;
  by_market_condition: StatisticsByField;
  by_volatility: StatisticsByField;
  by_news: Record<string, StatisticsByFieldValue>;
  by_setup: StatisticsByField;
  monthly_returns: MonthlyReturn[];
  weekly_returns: WeeklyReturn[];
  yearly_returns: YearlyReturn[];
  rolling_10: RollingStats;
  rolling_50: RollingStats;
  risk_analytics: RiskAnalytics;
  psychology_analytics: PsychologyAnalytics;
  calendar_heatmap: CalendarHeatmap;
  scatter_data: ScatterData;
}

export interface StatisticsByFieldValue {
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
  win_rate: number;
}

export interface StrategyStats {
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
  win_rate: number;
  avg_rr: number;
  expectancy: number;
}

export interface WeeklyReturn {
  week: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
}

export interface YearlyReturn {
  year: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export interface RiskAnalytics {
  avg_risk_percent: number;
  avg_position_size: number;
  max_position_size: number;
  total_exposure: number;
  rr_distribution: DistributionData;
  drawdown_analysis: {
    max_dd: number;
    avg_dd: number;
    avg_dd_duration_days: number;
    num_drawdowns: number;
  };
  risk_usage: {
    current: number;
    max: number;
    avg: number;
  };
  rule_violations: number;
}

export interface PsychologyAnalytics {
  fomo_frequency: number;
  revenge_trades: number;
  early_exits: number;
  late_entries: number;
  rule_violations: number;
  missed_setups: number;
  overtrading_days: number;
  confidence_vs_results: ConfidenceBin[];
  emotion_breakdown: Record<string, EmotionStats>;
  psychology_trend: PsychologyTrendPoint[];
}

export interface ConfidenceBin {
  confidence_range: string;
  trades: number;
  win_rate: number;
  avg_pnl: number;
}

export interface EmotionStats {
  trades: number;
  wins: number;
  pnl: number;
  win_rate: number;
}

export interface PsychologyTrendPoint {
  month: string;
  avg_confidence: number;
}

export interface CalendarHeatmap {
  daily_pnl: Record<string, number>;
  min_date: string | null;
  max_date: string | null;
}

export interface ScatterData {
  pnl_vs_rr: ScatterPoint[];
  pnl_vs_hold_time: ScatterPoint[];
  win_loss_scatter: ScatterPoint[];
  confidence_vs_pnl: ScatterPoint[];
}

export interface ScatterPoint {
  rr?: number;
  pnl: number;
  result: string;
  pair?: string;
  hold_time_hours?: number;
  confidence?: number;
  x?: number;
  y?: number;
}

export interface EquityPoint {
  date: string | null;
  equity: number;
  trade_id: string;
  pnl: number;
}

export interface DistributionData {
  bins: number[];
  counts: number[];
}

export interface SearchResult {
  [key: string]: unknown;
}

export interface MarketStructureRead {
  id: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
  trade_id?: string;
  date?: string;
  pair?: string;
  timeframe?: string;
  weekly_bias?: string;
  daily_bias?: string;
  h4_bias?: string;
  market_phase?: string;
  trend?: string;
  premium_discount?: string;
  external_liquidity?: string;
  internal_liquidity?: string;
  equal_highs?: string;
  equal_lows?: string;
  buy_side_liquidity?: string;
  sell_side_liquidity?: string;
  bos?: string;
  mss?: string;
  choch?: string;
  order_block?: string;
  breaker?: string;
  mitigation?: string;
  fvg?: string;
  ifvg?: string;
  asian_high?: number;
  asian_low?: number;
  london_open?: number;
  newyork_open?: number;
  london_killzone?: string;
  newyork_killzone?: string;
}

export interface MarketStructureCreate {
  trade_id?: string;
  date?: string;
  pair?: string;
  timeframe?: string;
  weekly_bias?: string;
  daily_bias?: string;
  h4_bias?: string;
  market_phase?: string;
  trend?: string;
  premium_discount?: string;
  external_liquidity?: string;
  internal_liquidity?: string;
  equal_highs?: string;
  equal_lows?: string;
  buy_side_liquidity?: string;
  sell_side_liquidity?: string;
  bos?: string;
  mss?: string;
  choch?: string;
  order_block?: string;
  breaker?: string;
  mitigation?: string;
  fvg?: string;
  ifvg?: string;
  asian_high?: number;
  asian_low?: number;
  london_open?: number;
  newyork_open?: number;
  london_killzone?: string;
  newyork_killzone?: string;
}

export interface MarketStructureUpdate {
  trade_id?: string;
  date?: string;
  pair?: string;
  timeframe?: string;
  weekly_bias?: string;
  daily_bias?: string;
  h4_bias?: string;
  market_phase?: string;
  trend?: string;
  premium_discount?: string;
  external_liquidity?: string;
  internal_liquidity?: string;
  equal_highs?: string;
  equal_lows?: string;
  buy_side_liquidity?: string;
  sell_side_liquidity?: string;
  bos?: string;
  mss?: string;
  choch?: string;
  order_block?: string;
  breaker?: string;
  mitigation?: string;
  fvg?: string;
  ifvg?: string;
  asian_high?: number;
  asian_low?: number;
  london_open?: number;
  newyork_open?: number;
  london_killzone?: string;
  newyork_killzone?: string;
}

export interface TradeRead {
  id: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
  market_structure_id?: string;
  pair?: string;
  direction?: string;
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
  exit_price?: number;
  position_size?: number;
  risk_percent?: number;
  rr?: number;
  pnl?: number;
  commission?: number;
  swap?: number;
  result?: string;
  status?: string;
  broker_name?: string;
  timeframe?: string;
  open_time?: string;
  close_time?: string;
  tags?: string[];
  weekly_bias?: string;
  daily_bias?: string;
  h4_bias?: string;
  liquidity_sweep?: string;
  bos?: string;
  mss?: string;
  order_block?: string;
  fvg?: string;
  asian_session?: string;
  london_session?: string;
  newyork_session?: string;
  dxy?: string;
  us10y?: string;
  us02y?: string;
  news_event?: string;
  emotion?: string;
  notes?: string;
  before_image?: string;
  after_image?: string;
}

export interface TradeCreate {
  market_structure_id?: string;
  pair?: string;
  direction?: string;
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
  exit_price?: number;
  position_size?: number;
  risk_percent?: number;
  rr?: number;
  pnl?: number;
  commission?: number;
  swap?: number;
  result?: string;
  status?: string;
  broker_name?: string;
  timeframe?: string;
  open_time?: string;
  close_time?: string;
  tags?: string[];
  weekly_bias?: string;
  daily_bias?: string;
  h4_bias?: string;
  liquidity_sweep?: string;
  bos?: string;
  mss?: string;
  order_block?: string;
  fvg?: string;
  asian_session?: string;
  london_session?: string;
  newyork_session?: string;
  dxy?: string;
  us10y?: string;
  us02y?: string;
  news_event?: string;
  emotion?: string;
  notes?: string;
  before_image?: string;
  after_image?: string;
}

export interface TradeUpdate {
  market_structure_id?: string;
  pair?: string;
  direction?: string;
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
  exit_price?: number;
  position_size?: number;
  risk_percent?: number;
  rr?: number;
  pnl?: number;
  commission?: number;
  swap?: number;
  result?: string;
  status?: string;
  broker_name?: string;
  timeframe?: string;
  open_time?: string;
  close_time?: string;
  tags?: string[];
  weekly_bias?: string;
  daily_bias?: string;
  h4_bias?: string;
  liquidity_sweep?: string;
  bos?: string;
  mss?: string;
  order_block?: string;
  fvg?: string;
  asian_session?: string;
  london_session?: string;
  newyork_session?: string;
  dxy?: string;
  us10y?: string;
  us02y?: string;
  news_event?: string;
  emotion?: string;
  notes?: string;
  before_image?: string;
  after_image?: string;
}

export interface ImportRow {
  row_number: number;
  data: Record<string, unknown>;
  errors: string[];
  is_duplicate: boolean;
  duplicate_of?: string;
}

export interface ImportPreview {
  import_id: string;
  filename: string;
  format: string;
  total_rows: number;
  valid_rows: number;
  duplicate_rows: number;
  error_rows: number;
  rows: ImportRow[];
  created_at: string;
}

export interface ImportResult {
  import_id: string;
  status: string;
  total_rows: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  details: Array<{ row: number; action: string; trade_id?: string; errors?: string[]; reason?: string }>;
}

export interface ImportHistoryItem {
  id: string;
  project_id: string;
  filename: string;
  format: string;
  status: string;
  total_rows: number;
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  created_at: string;
  completed_at?: string;
}

// ---- Similarity Engine Types ----

export interface SimilarityMatch {
  trade_id: string;
  pattern_id?: string;
  similarity_score: number;
  trade_result?: string;
  rr?: number;
  pnl?: number;
  session?: string;
  pair?: string;
  weekly_bias?: string;
  market_phase?: string;
  created_at?: string;
}

export interface SimilaritySummary {
  matches_found: number;
  average_win_rate: number;
  average_rr: number;
  average_pnl: number;
  best_pattern?: string;
  worst_pattern?: string;
  average_drawdown: number;
}

export interface SimilarityResponse {
  matches: SimilarityMatch[];
  summary: SimilaritySummary;
}

export interface SimilarityEnvironment {
  pair?: string;
  direction?: string;
  weekly_bias?: string;
  daily_bias?: string;
  h4_bias?: string;
  market_phase?: string;
  trend?: string;
  asian_session?: boolean;
  london_session?: boolean;
  newyork_session?: boolean;
  liquidity_sweep?: string;
  bos?: string;
  mss?: string;
  order_block?: string;
  fvg?: string;
  dxy?: string;
  us10y?: string;
  us02y?: string;
  cpi?: string;
  nfp?: string;
  fomc?: string;
  news_risk?: string;
}

export interface SimilarityHistoryEntry {
  trade_id: string;
  pair?: string;
  direction?: string;
  result?: string;
  rr?: number;
  pnl?: number;
  weekly_bias?: string;
  market_phase?: string;
  trend?: string;
  created_at?: string;
}

// ---- Decision Support Engine Types ----

export interface DecisionMarketAlignment {
  score: number;
  details: string;
  aligned_biases: string[];
  conflicting_biases: string[];
}

export interface DecisionICTComponents {
  score: number;
  present: string[];
  missing: string[];
  details: string;
}

export interface DecisionSessionAlignment {
  score: number;
  active_sessions: string[];
  details: string;
}

export interface DecisionPatternMatch {
  found: boolean;
  name?: string;
  win_rate: number;
  expectancy: number;
  occurrences: number;
  confidence: number;
  avg_rr: number;
  profit_factor: number;
  match_score: number;
}

export interface DecisionSimilaritySummary {
  matches_found: number;
  average_win_rate: number;
  average_rr: number;
  average_pnl: number;
  average_drawdown: number;
  top_matches: Record<string, unknown>[];
}

export interface DecisionStatsContext {
  overall_win_rate: number;
  overall_avg_rr: number;
  overall_expectancy: number;
  overall_total_trades: number;
  overall_profit_factor: number;
  overall_max_drawdown: number;
  pair_stats?: Record<string, unknown>;
  session_stats?: Record<string, unknown>;
}

export interface DecisionConfidence {
  score: number;
  level: string;
}

export interface DecisionCriterion {
  name: string;
  met: boolean;
  detail: string;
}

export interface DecisionExecution {
  status: string;
  criteria: DecisionCriterion[];
  satisfied: number;
  total: number;
}

export interface DecisionResponse {
  market_alignment: DecisionMarketAlignment;
  ict_components: DecisionICTComponents;
  session_alignment: DecisionSessionAlignment;
  pattern_match: DecisionPatternMatch;
  similarity: DecisionSimilaritySummary;
  statistics: DecisionStatsContext;
  confidence: DecisionConfidence;
  execution: DecisionExecution;
  explanation: string[];
}

export interface DecisionEnvironment {
  pair?: string;
  direction?: string;
  weekly_bias?: string;
  daily_bias?: string;
  h4_bias?: string;
  market_phase?: string;
  trend?: string;
  asian_session?: boolean;
  london_session?: boolean;
  newyork_session?: boolean;
  liquidity_sweep?: string;
  bos?: string;
  mss?: string;
  order_block?: string;
  fvg?: string;
  dxy?: string;
  us10y?: string;
  us02y?: string;
}

export interface DecisionHistoryEntry {
  trade_id: string;
  pair?: string;
  direction?: string;
  result?: string;
  rr?: number;
  pnl?: number;
  market_alignment: number;
  created_at?: string;
}

// ---- Continuous Learning Engine Types ----

export interface LearningEventRead {
  id: string;
  created_at?: string;
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  duration_ms?: number;
  status: string;
  summary?: string;
}

export interface KnowledgeRule {
  id: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description?: string;
  category?: string;
  rule_type?: string;
  confidence?: number;
  occurrences: number;
  wins: number;
  losses: number;
  win_rate?: number;
  avg_rr?: number;
  expectancy?: number;
  signature?: string;
}

export interface TopKnowledgeRule {
  id: string;
  title: string;
  confidence?: number;
  win_rate?: number;
  occurrences: number;
  avg_rr?: number;
}

export interface KnowledgeNode {
  id: string;
  project_id: string;
  created_at: string;
  type: string;
  name: string;
  category?: string;
  weight?: number;
  occurrences: number;
}

export interface KnowledgeEdge {
  id: string;
  project_id: string;
  source_node_id: string;
  target_node_id: string;
  created_at: string;
  relationship: string;
  strength?: number;
  occurrences: number;
  confidence?: number;
}

export interface GraphSnapshot {
  id: string;
  project_id: string;
  created_at: string;
  total_nodes: number;
  total_edges: number;
  most_connected_type?: string;
  highest_confidence_edge_id?: string;
  summary?: string;
}

export interface GraphData {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  snapshot?: GraphSnapshot | null;
}

export interface KnowledgeSnapshotRead {
  id: string;
  created_at?: string;
  total_trades: number;
  total_patterns: number;
  total_claims: number;
  total_concepts: number;
  total_sources: number;
  total_similarities: number;
  total_interpretations: number;
  win_rate: number;
  avg_rr: number;
  expectancy: number;
  knowledge_growth: number;
}

export interface LearningStatus {
  total_trades: number;
  total_sources: number;
  total_claims: number;
  total_concepts: number;
  total_interpretations: number;
  total_patterns: number;
  total_market_structures: number;
  total_events: number;
  last_event?: {
    event_type: string;
    status: string;
    created_at?: string;
  };
  last_snapshot?: {
    created_at?: string;
    knowledge_growth: number;
  };
}

export interface LearningRebuildResponse {
  event_id: string;
  status: string;
  duration_ms: number;
  steps_completed: string[];
  errors: string[];
}

export interface MacroEvent {
  id: string;
  project_id?: string;
  event_date?: string;
  title?: string;
  country?: string;
  category?: string;
  importance?: number;
  actual?: number | null;
  forecast?: number | null;
  previous?: number | null;
  source?: string;
  created_at: string;
}

export interface MarketSnapshot {
  id: string;
  timestamp: string;
  dxy?: number;
  us02y?: number;
  us10y?: number;
  yield_curve?: number;
  sp500?: number;
  nasdaq?: number;
  gold?: number;
  oil?: number;
  vix?: number;
  created_at: string;
}

export interface MacroRefreshResponse {
  events_stored: number;
  snapshot_stored: number;
  duration_ms: number;
}

export interface MarketState {
  snapshot?: MarketSnapshot;
  events_today: MacroEvent[];
  high_impact_events: MacroEvent[];
  upcoming_events: MacroEvent[];
  recent_releases: MacroEvent[];
}

export interface BrokerConnection {
  id: string;
  broker: string;
  account: string;
  server: string;
  terminal_path: string;
  status: string;
  connected: boolean;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

export interface TradeSyncLog {
  id: string;
  broker: string;
  trade_ticket: number;
  sync_time: string;
  status: string;
  message?: string;
  created_at: string;
}

export interface MT5StatusResponse {
  connected: boolean;
  broker?: string;
  account?: string;
  server?: string;
  terminal_path?: string;
  last_sync?: string;
  total_trades: number;
  total_synced: number;
}

export interface MT5ConnectRequest {
  account: string;
  server: string;
  terminal_path?: string;
}

export interface MT5SyncResponse {
  status: string;
  trades_imported: number;
  trades_skipped: number;
  trades_updated: number;
  duration_ms: number;
}

export interface MarketEvent {
  id: string;
  symbol: string;
  timeframe: string;
  timestamp: string;
  event_type: string;
  price?: number;
  event_metadata?: Record<string, unknown>;
  source: string;
  created_at: string;
}

export interface WebhookLog {
  id: string;
  received_at: string;
  status: string;
  payload?: Record<string, unknown>;
  processing_time_ms?: number;
  message?: string;
  created_at: string;
}

export interface WebhookResponse {
  status: string;
  event_id?: string;
  message: string;
}

export interface WebhookStats {
  total_events: number;
  total_logs: number;
  events_by_type: Record<string, number>;
  events_by_symbol: Record<string, number>;
  events_by_timeframe: Record<string, number>;
}

export interface TradeMemory {
  id: string;
  project_id: string;
  trade_id: string;
  created_at: string;
  pair?: string;
  direction?: string;
  session?: string;
  weekly_bias?: string;
  daily_bias?: string;
  h4_bias?: string;
  market_phase?: string;
  market_trend?: string;
  entry_model?: string;
  liquidity_type?: string;
  execution_model?: string;
  risk_percent?: number;
  rr?: number;
  pnl?: number;
  result?: string;
  strengths?: string[];
  weaknesses?: string[];
  mistakes?: string[];
  lessons?: string[];
  tags?: string[];
  confidence?: number;
  pattern_match?: number;
  similarity_score?: number;
  summary?: string;
}

// ── Strategy Types ──

export interface StrategyBase {
  name?: string;
  description?: string;
  category?: string;
  market?: string;
  instrument_types?: string[];
  timeframes?: string[];
  version?: string;
  status?: string;
  market_bias?: string;
  entry_conditions?: Record<string, unknown>;
  confirmation_rules?: string[];
  invalidation_rules?: string[];
  exit_rules?: Record<string, unknown>;
  risk_rules?: Record<string, unknown>;
  entry_model?: string;
  stop_loss_model?: string;
  take_profit_model?: string;
  partial_close_rules?: string[];
  trade_management_rules?: string[];
  preferred_sessions?: string[];
  preferred_market_conditions?: string;
  volatility_requirements?: string;
  news_restrictions?: string;
  required_mindset?: string;
  discipline_rules?: string[];
  common_mistakes?: string[];
  things_to_avoid?: string[];
  checklist_items?: ChecklistItem[];
  documentation?: string;
  tags?: string[];
  author?: string;
  change_log?: ChangeLogEntry[];
}

export interface ChecklistItem {
  label: string;
  category?: string;
  optional?: boolean;
}

export interface ChangeLogEntry {
  version: string;
  timestamp: string;
  change_log?: string;
  author?: string;
}

export interface StrategyCreate extends StrategyBase {
  name: string;
}

export type StrategyUpdate = StrategyBase;

export interface StrategyRead extends StrategyBase {
  id: string;
  created_at: string;
  updated_at: string;
  trades_count?: number;
}

export interface StrategyVersionRead {
  id: string;
  created_at: string;
  strategy_id: string;
  project_id: string;
  version?: string;
  change_log?: string;
  snapshot?: Record<string, unknown>;
  author?: string;
}

export interface StrategyVersionCreate {
  version: string;
  change_log?: string;
  author?: string;
}

export interface StrategyAnalytics {
  strategy_id: string;
  total_trades: number;
  wins: number;
  losses: number;
  breakevens: number;
  win_rate: number;
  total_pnl: number;
  avg_pnl: number;
  avg_win: number;
  avg_loss: number;
  avg_rr: number;
  expectancy: number;
  profit_factor: number;
  max_drawdown: number;
  sharpe_ratio: number;
  avg_holding_time?: number;
  best_session?: string;
  worst_session?: string;
  best_pair?: string;
  worst_pair?: string;
  monthly_performance?: { month: string; trades: number; wins: number; pnl: number }[];
  equity_curve?: { trade: number; value: number }[];
  distribution?: { range: string; count: number; pnl: number }[];
  session_analysis?: { session: string; trades: number; wins: number; pnl: number }[];
  pair_analysis?: { pair: string; trades: number; wins: number; pnl: number }[];
}

// ── Risk Management Types ──

export interface RiskRule {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  name: string;
  rule_type: string;
  description?: string;
  limit_value: number;
  current_value: number;
  is_active: boolean;
  severity: string;
  rule_config?: Record<string, unknown>;
  last_triggered_at?: string;
  violation_count: number;
}

export interface RiskAlert {
  id: string;
  created_at: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_read: boolean;
  is_dismissed: boolean;
  metadata_json?: Record<string, unknown>;
}

export interface ExposureBreakdown {
  name: string;
  exposure: number;
  count: number;
  risk: number;
}

export interface ExposureAnalysis {
  total_exposure: number;
  open_positions: number;
  by_pair: ExposureBreakdown[];
  by_direction: ExposureBreakdown[];
  by_strategy: ExposureBreakdown[];
  correlation_risk: number;
  max_single_exposure: number;
}

export interface RiskDashboard {
  account_balance: number;
  equity: number;
  daily_pnl: number;
  weekly_pnl: number;
  monthly_pnl: number;
  current_risk_percent: number;
  open_risk: number;
  closed_risk: number;
  available_risk: number;
  daily_risk_remaining: number;
  max_drawdown: number;
  current_drawdown: number;
  recovery_progress: number;
  open_positions: number;
  total_exposure: number;
  active_alerts: number;
  rule_violations: number;
  exposure: ExposureAnalysis;
}

export interface DrawdownPoint {
  date: string;
  drawdown: number;
  equity: number;
}

export interface RiskHistoryPoint {
  date: string;
  daily_pnl: number;
  weekly_pnl: number;
  monthly_pnl: number;
  drawdown: number;
  risk_percent: number;
  exposure: number;
}

export interface ValidationCheck {
  check_name: string;
  passed: boolean;
  severity: string;
  message: string;
}

export interface TradeValidationResult {
  status: string;
  checks: ValidationCheck[];
  risk_amount?: number;
  potential_loss?: number;
  potential_profit?: number;
  rr_ratio?: number;
}

export interface PositionSizeResult {
  position_size: number;
  lot_size: number;
  dollar_risk: number;
  expected_rr: number;
  potential_profit: number;
  potential_loss: number;
  risk_per_pip: number;
  stop_distance_pips: number;
}

export interface RuleViolation {
  rule_name: string;
  rule_type: string;
  severity: string;
  limit_value: number;
  actual_value: number;
  timestamp: string;
  trade_id?: string;
}

// ── Planning & Calendar Types ──

export interface TradingPlan {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  plan_date: string;
  plan_type: string;
  market_bias?: string;
  watchlist?: string[];
  pairs_to_avoid?: string[];
  key_levels?: { pair: string; levels: number[] }[];
  liquidity_areas?: { pair: string; areas: string[] }[];
  expected_scenarios?: { scenario: string; bias: string; invalidation: string }[];
  invalidation_levels?: { pair: string; level: number }[];
  session_goals?: Record<string, string>;
  risk_allocation?: Record<string, number>;
  notes?: string;
  status: string;
  is_completed: boolean;
}

export interface ChecklistTemplate {
  id: string;
  created_at: string;
  name: string;
  checklist_type: string;
  items: { label: string; category?: string; optional?: boolean }[];
  is_active: boolean;
}

export interface ChecklistExecution {
  id: string;
  created_at: string;
  template_id: string;
  execution_date: string;
  completed_items: { label: string; completed: boolean }[];
  notes?: string;
  is_completed: boolean;
}

export interface EconomicEvent {
  id: string;
  created_at: string;
  event_date: string;
  event_time?: string;
  country: string;
  currency: string;
  impact_level: string;
  event_name: string;
  event_category?: string;
  previous_value?: string;
  forecast_value?: string;
  actual_value?: string;
  notes?: string;
}

export interface DailyReview {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  review_date: string;
  daily_summary?: string;
  best_trade?: string;
  worst_trade?: string;
  mistakes?: string[];
  lessons?: string[];
  next_improvements?: string[];
  discipline_score?: number;
  adherence_to_plan?: number;
  psychology_rating?: number;
  overall_rating?: number;
}

export interface Goal {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  title: string;
  description?: string;
  goal_type: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  priority: string;
  tags?: string[];
  progress_history?: { date: string; value: number }[];
}

export interface Reminder {
  id: string;
  created_at: string;
  project_id: string;
  title: string;
  reminder_type: string;
  reminder_time: string;
  reminder_days?: string[];
  is_active: boolean;
  notes?: string;
}

export interface CalendarEvent {
  id: string;
  created_at: string;
  project_id: string;
  title: string;
  event_date: string;
  event_time?: string;
  end_time?: string;
  event_type: string;
  color?: string;
  description?: string;
  is_all_day: boolean;
  recurrence?: string;
  metadata_json?: Record<string, unknown>;
}

export interface SessionInfo {
  name: string;
  start_time: string;
  end_time: string;
  status: string;
  is_current: boolean;
}

export interface DayViewData {
  date: string;
  plan?: TradingPlan;
  events: CalendarEvent[];
  economic_events: EconomicEvent[];
  checklist_completed: boolean;
  review?: DailyReview;
  sessions: SessionInfo[];
}

export interface WeekViewData {
  week_start: string;
  week_end: string;
  days: DayViewData[];
  weekly_goals: Goal[];
  weekly_review?: DailyReview;
}

export interface PlanningDashboard {
  today: string;
  has_plan: boolean;
  plan_status?: string;
  active_goals_count: number;
  completed_goals_count: number;
  goal_progress: number;
  goals_by_type: Record<string, Goal[]>;
  active_reminders: Reminder[];
  today_events: (EconomicEvent | CalendarEvent)[];
  upcoming_sessions: { name: string; time: string }[];
}

// ── AI Foundation ──

export interface AIProfile {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  trading_style?: string;
  preferred_sessions?: string[];
  preferred_markets?: string[];
  preferred_timeframes?: string[];
  preferred_pairs?: string[];
  risk_profile?: string;
  avg_rr?: number;
  avg_holding_time_min?: number;
  avg_risk_per_trade?: number;
  max_drawdown_pct?: number;
  best_conditions?: Record<string, unknown>;
  worst_conditions?: Record<string, unknown>;
  psychological_patterns?: PsychologicalPattern[];
  most_common_mistakes?: MistakeEntry[];
  most_successful_behaviors?: BehaviorEntry[];
  learning_progress?: LearningProgress;
  overall_score?: number;
  total_trades_analyzed: number;
  last_analyzed_at?: string;
}

export interface PsychologicalPattern {
  pattern: string;
  frequency: number;
  impact: string;
  win_rate?: number;
}

export interface MistakeEntry {
  trade_id?: string;
  note: string;
  pnl?: number;
}

export interface BehaviorEntry {
  behavior: string;
  win_rate?: number;
}

export interface LearningProgress {
  level: string;
  topics_mastered?: string[];
  streak_days?: number;
  total_reviews?: number;
}

export interface TradeEvaluation {
  id: string;
  created_at: string;
  project_id: string;
  trade_id: string;
  strength_score?: number;
  risk_score?: number;
  execution_score?: number;
  psychology_score?: number;
  discipline_score?: number;
  strategy_alignment?: number;
  confidence_score?: number;
  overall_quality?: number;
  critique?: TradeCritique;
  provider?: string;
  evaluated_at?: string;
}

export interface TradeCritique {
  what_went_well: string[];
  what_went_wrong: string[];
  rule_violations: string[];
  execution_quality: string;
  risk_quality: string;
  entry_quality: string;
  exit_quality: string;
  psychology_observations: string[];
  improvement_suggestions: string[];
}

export interface KnowledgeLink {
  id: string;
  created_at: string;
  project_id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relationship: string;
  strength: number;
  metadata_json?: Record<string, unknown>;
}

export interface DetectedPattern {
  id: string;
  created_at: string;
  project_id: string;
  pattern_type: string;
  pattern_key: string;
  pattern_value?: string;
  confidence: number;
  sample_size: number;
  avg_pnl?: number;
  win_rate?: number;
  description?: string;
  is_positive: boolean;
  is_active: boolean;
  last_detected_at?: string;
}

export interface CoachingSession {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  session_type: string;
  session_date: string;
  period_start?: string;
  period_end?: string;
  summary?: string;
  key_findings?: CoachingFinding[];
  action_items?: ActionItem[];
  strengths?: string[];
  weaknesses?: string[];
  score?: number;
  metrics_snapshot?: Record<string, unknown>;
  is_read: boolean;
}

export interface CoachingFinding {
  finding: string;
  category: string;
  impact: string;
}

export interface ActionItem {
  action: string;
  priority: string;
  deadline?: string;
  completed: boolean;
}

export interface AIInsight {
  id: string;
  created_at: string;
  project_id: string;
  insight_type: string;
  category?: string;
  title: string;
  description?: string;
  data?: Record<string, unknown>;
  confidence: number;
  is_read: boolean;
  is_dismissed: boolean;
}

export interface AIRecommendation {
  id: string;
  created_at: string;
  project_id: string;
  recommendation_type: string;
  priority: string;
  title: string;
  description?: string;
  rationale?: string;
  action_url?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_dismissed: boolean;
  is_completed: boolean;
}

export interface AISummary {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  summary_type: string;
  entity_id?: string;
  period?: string;
  content?: Record<string, unknown>;
  text_summary?: string;
  keywords?: string[];
  sentiment?: string;
  importance: number;
}

export interface AIContextSnapshot {
  id: string;
  created_at: string;
  project_id: string;
  snapshot_type: string;
  trade_id?: string;
  context?: Record<string, unknown>;
}

export interface AIProviderConfig {
  id: string;
  created_at: string;
  provider_name: string;
  display_name: string;
  is_enabled: boolean;
  is_default: boolean;
  model_name?: string;
  api_endpoint?: string;
  config_json?: Record<string, unknown>;
  capabilities?: string[];
}

export interface AIDashboardData {
  profile?: AIProfile;
  latest_insights: AIInsight[];
  coaching_cards: CoachingSession[];
  recommendations: AIRecommendation[];
  detected_patterns: DetectedPattern[];
  learning_progress?: LearningProgress;
  recent_improvements: string[];
  areas_to_improve: string[];
  overall_score?: number;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeNode[];
  edges: KnowledgeGraphEdge[];
}

export interface KnowledgeNode {
  id: string;
  type: string;
  entity_id: string;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  relationship: string;
  strength: number;
}

// ── Obsidian Integration ──

export interface Vault {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  name: string;
  path: string;
  vault_type: string;
  is_active: boolean;
  is_connected: boolean;
  last_synced_at?: string;
  health_status: string;
  health_message?: string;
  permission_level: string;
  settings_json?: Record<string, unknown>;
  metadata_json?: Record<string, unknown>;
}

export interface ObsidianNote {
  id: string;
  created_at: string;
  updated_at: string;
  vault_id: string;
  project_id: string;
  file_path: string;
  file_name: string;
  file_hash?: string;
  title?: string;
  content?: string;
  html_content?: string;
  frontmatter?: Record<string, unknown>;
  tags?: string[];
  aliases?: string[];
  wiki_links?: WikiLink[];
  backlinks?: BacklinkRef[];
  embeds?: EmbedRef[];
  headings?: HeadingRef[];
  keywords?: string[];
  concepts?: string[];
  referenced_entities?: EntityRef[];
  detected_dates?: string[];
  detected_sessions?: string[];
  detected_markets?: string[];
  detected_pairs?: string[];
  detected_timeframes?: string[];
  sync_status: string;
  sync_direction?: string;
  version: number;
  is_deleted: boolean;
  last_synced_at?: string;
  note_type?: string;
}

export interface WikiLink {
  target: string;
  display: string;
}

export interface BacklinkRef {
  source_path: string;
  link_text: string;
}

export interface EmbedRef {
  type: string;
  path: string;
  alt?: string;
  options?: string;
}

export interface HeadingRef {
  level: number;
  text: string;
}

export interface EntityRef {
  type: string;
  id: string;
  context: string;
}

export interface SyncLog {
  id: string;
  created_at: string;
  vault_id: string;
  sync_type: string;
  status: string;
  direction: string;
  files_processed: number;
  files_imported: number;
  files_exported: number;
  files_conflicted: number;
  files_skipped: number;
  errors?: unknown[];
  duration_ms?: number;
  trigger: string;
  metadata_json?: Record<string, unknown>;
}

export interface SyncConflict {
  id: string;
  created_at: string;
  vault_id: string;
  note_id?: string;
  file_path: string;
  conflict_type: string;
  local_version?: number;
  remote_version?: number;
  local_hash?: string;
  remote_hash?: string;
  local_content?: string;
  remote_content?: string;
  resolution?: string;
  resolved_at?: string;
  is_resolved: boolean;
}

export interface SyncSettings {
  id: string;
  created_at: string;
  updated_at: string;
  vault_id: string;
  auto_sync: boolean;
  sync_frequency: string;
  folder_mapping?: Record<string, string>;
  ignored_folders?: string[];
  ignored_files?: string[];
  ignored_patterns?: string[];
  conflict_policy: string;
  backup_policy: string;
  sync_attachments: boolean;
  sync_metadata: boolean;
  sync_templates: boolean;
  max_file_size_kb: number;
  encrypt_sync: boolean;
  note_type_rules?: Record<string, string>;
}

export interface VaultStatistics {
  id: string;
  created_at: string;
  vault_id: string;
  total_notes: number;
  synced_notes: number;
  pending_notes: number;
  conflicted_notes: number;
  deleted_notes: number;
  total_size_kb: number;
  total_tags: number;
  total_wiki_links: number;
  total_backlinks: number;
  notes_by_type?: Record<string, number>;
  notes_by_folder?: Record<string, number>;
  top_tags?: { tag: string; count: number }[];
  last_full_sync?: string;
  last_incremental_sync?: string;
}

export interface NoteTemplate {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  name: string;
  template_type: string;
  content: string;
  description?: string;
  frontmatter_template?: Record<string, unknown>;
  tags_template?: string[];
  is_active: boolean;
  use_count: number;
  target_folder?: string;
}

export interface SyncDashboardData {
  vaults: Vault[];
  recent_syncs: SyncLog[];
  active_conflicts: SyncConflict[];
  total_notes: number;
  total_synced: number;
  total_pending: number;
  total_conflicts: number;
}

export interface ObsidianSearchResult {
  result_type: string;
  id: string;
  title: string;
  snippet?: string;
  source: string;
  score: number;
  tags: string[];
  path?: string;
}

export interface ParsedMarkdown {
  headings?: HeadingRef[];
  wiki_links?: WikiLink[];
  tags?: string[];
  embeds?: EmbedRef[];
  callouts?: { type: string; content: string }[];
  code_blocks?: { language: string; content: string }[];
  footnotes?: string[];
  math?: string[];
  mermaid?: string[];
}

// ═══════════════════════════════════════════════════════
// Market Intelligence Types
// ═══════════════════════════════════════════════════════

export interface EconomicEvent {
  id: string;
  project_id: string;
  event_name: string;
  event_date: string;
  event_time?: string;
  country: string;
  currency: string;
  category: string;
  impact: string;
  actual?: number;
  forecast?: number;
  previous?: number;
  unit?: string;
  description?: string;
  source?: string;
  is_favorite: boolean;
  notes?: string;
}

export interface MarketRegime {
  id: string;
  project_id: string;
  regime_type: string;
  regime_value: string;
  symbol: string;
  confidence: number;
  metrics?: Record<string, unknown>;
  source?: string;
  is_active: boolean;
  started_at?: string;
  ended_at?: string;
}

export interface CorrelationData {
  id: string;
  project_id: string;
  symbol_a: string;
  symbol_b: string;
  correlation: number;
  period: string;
  data_points: number;
  calculated_at: string;
}

export interface LiquidityLevel {
  id: string;
  project_id: string;
  symbol: string;
  level_type: string;
  level_value: number;
  date: string;
  timeframe?: string;
  is_swept: boolean;
  swept_at?: string;
  notes?: string;
}

export interface MarketStructurePoint {
  id: string;
  project_id: string;
  symbol: string;
  timeframe?: string;
  point_type: string;
  price_level?: number;
  swing_type?: string;
  is_mitigated: boolean;
  is_active: boolean;
  notes?: string;
  detected_at?: string;
}

export interface SessionAnalysis {
  id: string;
  project_id: string;
  symbol?: string;
  date: string;
  session_name: string;
  open_price?: number;
  high_price?: number;
  low_price?: number;
  close_price?: number;
  range_pips?: number;
  direction?: string;
  volatility?: string;
  notes?: string;
}

export interface Watchlist {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  sort_order: number;
  items?: WatchlistItem[];
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  symbol: string;
  bias?: string;
  current_price?: number;
  stop_loss?: number;
  take_profit?: number;
  risk_reward?: number;
  notes?: string;
  tags?: string[];
  sort_order: number;
}

export interface MarketAlert {
  id: string;
  project_id: string;
  alert_type: string;
  title: string;
  message?: string;
  severity: string;
  trigger_data?: Record<string, unknown>;
  is_read: boolean;
  is_dismissed: boolean;
  created_at?: string;
}

export interface MarketTimelineEvent {
  id: string;
  project_id: string;
  event_type: string;
  event_date: string;
  event_time?: string;
  title: string;
  description?: string;
  symbol?: string;
  impact?: string;
  source?: string;
  notes?: string;
  tags?: string[];
}

export interface DataProviderConfig {
  id: string;
  provider_name: string;
  provider_type: string;
  api_key_env?: string;
  base_url?: string;
  rate_limit?: number;
  is_default: boolean;
  is_enabled: boolean;
  priority: number;
  config?: Record<string, unknown>;
}

export interface MarketDashboardData {
  regime: MarketRegime | null;
  recent_regimes: MarketRegime[];
  upcoming_events: EconomicEvent[];
  alerts: MarketAlert[];
  watchlist_summary: { count: number; bullish: number; bearish: number } | null;
  session_status: Record<string, string>;
  correlation_summary: Record<string, unknown> | null;
  usd_strength: number;
  volatility_summary: { level: string; regime: string | null };
  equity_summary: Record<string, unknown> | null;
  commodity_summary: Record<string, unknown> | null;
  bond_summary: Record<string, unknown> | null;
}

export interface CorrelationMatrix {
  symbols: string[];
  matrix: Record<string, number>;
}

export interface SessionStats {
  session: string;
  sample_size: number;
  avg_range?: number;
  max_range?: number;
  min_range?: number;
  high_vol_count?: number;
  low_vol_count?: number;
}

export interface MarketAIContext {
  current_regime: string | null;
  usd_direction: string | null;
  risk_sentiment: string;
  volatility_level: string;
  upcoming_high_impact: { name: string; date: string; time?: string; country: string }[];
  active_alerts: { title: string; severity: string }[];
  correlation_highlights: Record<string, unknown>[];
  session_notes?: string;
  watchlist_biases?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════
// AI Research Copilot Types
// ═══════════════════════════════════════════════════════

export interface AIConversation {
  id: string;
  created_at?: string;
  updated_at?: string;
  project_id: string;
  title: string;
  agent_type?: string;
  folder?: string;
  is_pinned: boolean;
  is_archived: boolean;
  tags?: string[];
  message_count: number;
  total_tokens?: number;
  summary?: string;
}

export interface AIMessage {
  id: string;
  created_at?: string;
  conversation_id: string;
  project_id: string;
  role: string;
  content: string;
  agent_type?: string;
  provider?: string;
  model?: string;
  citations?: AICitation[];
  contexts?: Record<string, unknown>[];
  chunks_retrieved?: number;
  latency_ms?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost_usd?: number;
  is_streaming: boolean;
  is_error: boolean;
  error_message?: string;
}

export interface AICitation {
  id: string;
  source_type: string;
  source_id: string;
  source_title?: string;
  snippet?: string;
  relevance_score?: number;
  url?: string;
  page?: number;
  excerpt?: string;
  content?: string;
}

export interface AIChatRequest {
  message: string;
  conversation_id?: string;
  agent_type?: string;
  options?: Record<string, unknown>;
}

export interface AIChatResponse {
  message: AIMessage;
  citations: AICitation[];
  context_used: Record<string, unknown>;
  token_usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  latency_ms: number;
}

export interface AIPrompt {
  id: string;
  created_at?: string;
  updated_at?: string;
  project_id: string;
  title: string;
  content: string;
  category?: string;
  agent_type?: string;
  folder_id?: string;
  tags?: string[];
  is_favorite: boolean;
  use_count: number;
  variables?: string[];
  description?: string;
}

export interface AIPromptFolder {
  id: string;
  project_id: string;
  name: string;
  parent_id?: string;
  sort_order: number;
}

export interface AIAgentConfig {
  agent_type: string;
  display_name: string;
  description?: string;
  is_enabled: boolean;
  system_prompt?: string;
  provider?: string;
  model?: string;
  config_json?: Record<string, unknown>;
  tools?: string[];
  icon?: string;
  color?: string;
  sort_order: number;
}

export interface AIWorkflow {
  id: string;
  created_at?: string;
  updated_at?: string;
  project_id: string;
  name: string;
  description?: string;
  workflow_type: string;
  steps: Record<string, unknown>[];
  config?: Record<string, unknown>;
  is_active: boolean;
  last_run_at?: string;
  run_count: number;
}

export interface AIWorkflowExecution {
  id: string;
  created_at?: string;
  project_id: string;
  workflow_id: string;
  status: string;
  result?: Record<string, unknown>;
  error?: string;
  duration_ms?: number;
}

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AIMemoryEntry {
  id: string;
  created_at?: string;
  updated_at?: string;
  project_id: string;
  memory_type: string;
  key: string;
  value?: Record<string, unknown>;
  text_value?: string;
  importance: number;
  expires_at?: string;
  conversation_id?: string;
  tags?: string[];
}

export interface AIDocumentIngestion {
  id: string;
  created_at?: string;
  updated_at?: string;
  project_id: string;
  source_type: string;
  source_id?: string;
  title?: string;
  chunk_count: number;
  status: string;
  error?: string;
  metadata_json?: Record<string, unknown>;
}

export interface AIDocumentChunk {
  id: string;
  project_id: string;
  ingestion_id: string;
  source_type: string;
  chunk_index: number;
  content: string;
  document_title?: string;
  created_date?: string;
  tags?: string[];
  entity_type?: string;
  relevance_score?: number;
}

export interface AISearchResult {
  chunk_id: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
  source_type: string;
}

export interface AITokenUsage {
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  operation?: string;
}

export interface AIAuditLog {
  id: string;
  created_at?: string;
  project_id: string;
  action: string;
  status: string;
  details?: Record<string, unknown>;
}

export interface AIWorkflowTemplate {
  type: string;
  name: string;
  description: string;
  steps: number;
}

// ── Quantitative Research Lab ──

export interface QuantExperiment {
  id: string;
  created_at?: string;
  updated_at?: string;
  project_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'completed' | 'failed' | 'archived';
  hypothesis?: string;
  hypothesis_status?: 'proposed' | 'testing' | 'supported' | 'rejected' | 'inconclusive';
  confidence_score?: number;
  tags?: string[];
  config?: Record<string, unknown>;
  results_summary?: Record<string, unknown>;
  linked_strategy_ids?: string[];
  linked_trade_ids?: string[];
  linked_research_ids?: string[];
  version: number;
  parent_experiment_id?: string;
  notes?: string;
}

export interface BacktestRun {
  id: string;
  created_at?: string;
  updated_at?: string;
  project_id: string;
  experiment_id?: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  strategy_id?: string;
  backtest_type: string;
  config: Record<string, unknown>;
  filters?: Record<string, unknown>;
  costs?: Record<string, unknown>;
  start_date: string;
  end_date: string;
  symbols?: string[];
  timeframes?: string[];
  total_trades?: number;
  win_rate?: number;
  profit_factor?: number;
  net_profit?: number;
  gross_profit?: number;
  gross_loss?: number;
  sharpe_ratio?: number;
  sortino_ratio?: number;
  calmar_ratio?: number;
  max_drawdown?: number;
  max_drawdown_pct?: number;
  avg_drawdown?: number;
  recovery_factor?: number;
  expectancy?: number;
  avg_rr?: number;
  avg_win?: number;
  avg_loss?: number;
  largest_win?: number;
  largest_loss?: number;
  std_dev?: number;
  variance?: number;
  z_score?: number;
  confidence_interval?: Record<string, number>;
  p_value?: number;
  sample_size_adequacy?: number;
  edge_stability?: number;
  duration_seconds?: number;
  error?: string;
  equity_curve?: { date: string; equity: number; pnl: number }[];
  drawdown_curve?: number[];
  monthly_returns?: { month: string; return: number }[];
  trade_distribution?: Record<string, number>;
  regime_performance?: RegimePerformance[];
  rolling_metrics?: Record<string, unknown>;
  parameters_used?: Record<string, unknown>;
}

export interface BacktestTrade {
  id: string;
  created_at?: string;
  backtest_run_id: string;
  entry_date: string;
  exit_date?: string;
  symbol: string;
  direction: 'long' | 'short';
  entry_price: number;
  exit_price?: number;
  quantity: number;
  pnl?: number;
  pnl_pct?: number;
  rr?: number;
  fees: number;
  slippage: number;
  exit_reason?: string;
  regime_at_entry?: string;
  regime_at_exit?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface SimulationRun {
  id: string;
  created_at?: string;
  project_id: string;
  experiment_id?: string;
  backtest_run_id?: string;
  name: string;
  simulation_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  config: Record<string, unknown>;
  num_simulations: number;
  random_seed?: number;
  results?: Record<string, unknown>;
  percentiles?: Record<string, number>;
  confidence_intervals?: Record<string, unknown>;
  equity_curves?: Record<string, number[]>;
  distribution?: { bucket: number; count: number }[];
  duration_seconds?: number;
  error?: string;
}

export interface WalkForwardRun {
  id: string;
  created_at?: string;
  project_id: string;
  experiment_id?: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  config: Record<string, unknown>;
  training_window: number;
  validation_window: number;
  step_size: number;
  windows?: Record<string, unknown>[];
  aggregate_metrics?: Record<string, number>;
  stability_score?: number;
  oos_performance?: Record<string, number>;
  parameter_stability?: Record<string, unknown>;
  duration_seconds?: number;
  error?: string;
}

export interface OptimizationRun {
  id: string;
  created_at?: string;
  project_id: string;
  experiment_id?: string;
  name: string;
  optimization_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  config: Record<string, unknown>;
  parameters: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  objective: string;
  maximize: boolean;
  total_combinations?: number;
  results?: Record<string, unknown>[];
  best_result?: Record<string, unknown>;
  heatmap_data?: Record<string, unknown>;
  convergence_curve?: { iteration: number; best: number }[];
  duration_seconds?: number;
  error?: string;
}

export interface EdgeHealthSnapshot {
  id: string;
  created_at?: string;
  project_id: string;
  experiment_id?: string;
  snapshot_date: string;
  overall_health?: number;
  edge_stability?: number;
  performance_drift?: number;
  parameter_drift?: number;
  strategy_degradation?: number;
  drawdown_severity?: number;
  confidence_decay?: number;
  metrics?: Record<string, unknown>;
  signals?: { type: string; message: string; severity: string }[];
  recommendations?: string[];
}

export interface RegimePerformance {
  id?: string;
  created_at?: string;
  backtest_run_id?: string;
  regime: string;
  num_trades: number;
  win_rate?: number;
  profit_factor?: number;
  net_profit?: number;
  avg_rr?: number;
  sharpe_ratio?: number;
  max_drawdown?: number;
  expectancy?: number;
}

export interface ResearchNotebook {
  id: string;
  created_at?: string;
  updated_at?: string;
  project_id: string;
  experiment_id?: string;
  title: string;
  content?: string;
  content_type: string;
  tags?: string[];
  attachments?: Record<string, unknown>[];
  linked_run_ids?: Record<string, unknown>;
  sort_order: number;
}

export interface HypothesisTestResult {
  id: string;
  created_at?: string;
  project_id: string;
  experiment_id?: string;
  hypothesis: string;
  test_type: string;
  result: string;
  confidence?: number;
  test_statistics?: Record<string, unknown>;
  supporting_evidence?: Record<string, unknown>[];
  notes?: string;
}

export interface QuantDashboardData {
  total_experiments: number;
  active_experiments: number;
  completed_experiments: number;
  draft_experiments: number;
  supported_hypotheses: number;
  rejected_hypotheses: number;
  recent_discoveries: HypothesisTestResult[];
  best_model?: BacktestRun;
  current_edge_health?: EdgeHealthSnapshot;
  experiment_queue_count: number;
  research_progress: number;
  overall_confidence: number;
}

export interface AISummaryResponse {
  report: string;
  summary: Record<string, unknown>;
}

export interface AIImproveResponse {
  suggestions: string[];
  overfitting_risk: string;
  statistics?: Record<string, unknown>;
  edge_health?: Record<string, unknown>;
}

export interface ExportResponse {
  format: string;
  content: string;
  filename: string;
}

// ── Automation & Workflow Engine ──

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type NotificationType = 'info' | 'warning' | 'success' | 'error';
export type NotificationChannelType = 'in_app' | 'email' | 'discord' | 'telegram' | 'slack' | 'webhook';
export type JobType = 'one_time' | 'recurring';
export type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'pending';
export type AuditEventType =
  | 'workflow_run' | 'workflow_created' | 'workflow_updated' | 'workflow_deleted'
  | 'rule_triggered' | 'notification_sent' | 'job_executed'
  | 'connector_synced' | 'report_generated' | 'ai_automation';

export type TriggerType =
  | 'scheduled' | 'market_open' | 'london_open' | 'new_york_open'
  | 'economic_event' | 'news_release' | 'trade_created' | 'trade_closed'
  | 'journal_added' | 'replay_finished' | 'risk_rule_triggered'
  | 'drawdown_threshold' | 'performance_threshold' | 'strategy_updated'
  | 'webhook' | 'manual';

export type ActionType =
  | 'create_journal_entry' | 'generate_ai_summary' | 'generate_daily_brief'
  | 'generate_weekly_review' | 'run_analytics' | 'run_backtest'
  | 'export_report' | 'create_task' | 'update_strategy' | 'send_notification'
  | 'open_trade_review' | 'generate_research_note' | 'sync_obsidian'
  | 'update_dashboard' | 'run_ai_coach';

export type ConditionType =
  | 'win_rate' | 'drawdown' | 'risk_pct' | 'session' | 'market' | 'pair'
  | 'strategy' | 'performance' | 'psychology_score' | 'execution_score'
  | 'ai_score' | 'custom_variable';

export type ConnectorType =
  | 'google_calendar' | 'notion' | 'obsidian' | 'tradingview'
  | 'discord' | 'telegram' | 'slack' | 'google_drive' | 'dropbox'
  | 'github' | 'email_smtp' | 'rest_api';

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'performance' | 'risk' | 'research' | 'strategy';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'loop' | 'branch';
  label: string;
  config?: Record<string, unknown>;
  position?: { x: number; y: number };
  trigger_type?: TriggerType;
  action_type?: ActionType;
  condition_type?: ConditionType;
  operator?: string;
  value?: unknown;
  variable?: string;
}

export interface WorkflowConnection {
  id: string;
  source_node_id: string;
  target_node_id: string;
  label?: string;
  condition_expression?: string;
}

export interface Workflow {
  id: string;
  created_at?: string;
  updated_at?: string;
  project_id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  version: number;
  tags?: string[];
  category?: string;
  nodes?: WorkflowNode[];
  connections?: WorkflowConnection[];
  triggers?: Record<string, unknown>[];
  actions?: Record<string, unknown>[];
  conditions?: Record<string, unknown>[];
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  error_handling?: Record<string, unknown>;
  is_template?: boolean;
  template_category?: string;
  usage_count?: number;
  last_executed_at?: string;
}

export interface WorkflowExecution {
  id: string;
  created_at?: string;
  project_id: string;
  workflow_id: string;
  status: ExecutionStatus;
  triggered_by: string;
  trigger_type?: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  nodes_executed?: { node_id: string; type: string; status: string; duration_ms?: number; error?: string }[];
  results?: Record<string, unknown>;
  error?: string;
  error_details?: Record<string, unknown>;
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
}

export interface RuleCondition {
  variable: string;
  operator: string;
  value: unknown;
  logical?: 'and' | 'or';
}

export interface RuleAction {
  action_type: ActionType;
  config?: Record<string, unknown>;
}

export interface Rule {
  id: string;
  created_at?: string;
  updated_at?: string;
  project_id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  category?: string;
  condition_expression?: string;
  conditions?: RuleCondition[];
  actions_config?: RuleAction[];
  config?: Record<string, unknown>;
  trigger_count: number;
  last_triggered_at?: string;
  cooldown_minutes?: number;
  max_triggers_per_day?: number;
}

export interface ScheduledJob {
  id: string;
  created_at?: string;
  updated_at?: string;
  project_id: string;
  workflow_id?: string;
  name: string;
  job_type: JobType;
  enabled: boolean;
  cron_expression?: string;
  timezone: string;
  start_at?: string;
  end_at?: string;
  action_type?: string;
  action_config?: Record<string, unknown>;
  last_run_at?: string;
  next_run_at?: string;
  total_runs: number;
  success_runs: number;
  failed_runs: number;
  retry_on_failure: boolean;
  max_retries: number;
  retry_delay_minutes: number;
  priority: number;
}

export interface JobExecution {
  id: string;
  created_at?: string;
  project_id: string;
  job_id: string;
  status: ExecutionStatus;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  retry_count: number;
  result?: Record<string, unknown>;
  error?: string;
}

export interface Notification {
  id: string;
  created_at?: string;
  project_id: string;
  title: string;
  message?: string;
  notification_type: NotificationType;
  channel: NotificationChannelType;
  status: ExecutionStatus;
  source?: string;
  source_id?: string;
  action_url?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  read_at?: string;
  sent_at?: string;
  error?: string;
  recipient?: string;
}

export interface NotificationChannel {
  id: string;
  created_at?: string;
  updated_at?: string;
  project_id: string;
  name: string;
  channel_type: NotificationChannelType;
  config: Record<string, unknown>;
  enabled: boolean;
  verified: boolean;
  last_verified_at?: string;
  error?: string;
}

export interface AuditLog {
  id: string;
  created_at?: string;
  project_id: string;
  event_type: AuditEventType;
  source?: string;
  source_id?: string;
  actor?: string;
  action?: string;
  summary?: string;
  details?: Record<string, unknown>;
  severity: string;
  ip_address?: string;
}

export interface Connector {
  id: string;
  created_at?: string;
  updated_at?: string;
  project_id: string;
  name: string;
  connector_type: ConnectorType;
  config: Record<string, unknown>;
  enabled: boolean;
  status: ConnectorStatus;
  last_sync_at?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface AutomationReport {
  id: string;
  created_at?: string;
  updated_at?: string;
  project_id: string;
  name: string;
  report_type: ReportType;
  description?: string;
  enabled: boolean;
  config: Record<string, unknown>;
  format: string;
  recipients?: string[];
  schedule_cron?: string;
  last_generated_at?: string;
  last_generated_result?: Record<string, unknown>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  icon?: string;
  triggers_config?: Record<string, unknown>[];
  actions_config?: Record<string, unknown>[];
  conditions_config?: Record<string, unknown>[];
  is_built_in: boolean;
  usage_count: number;
}

export interface AutomationDashboardData {
  total_workflows: number;
  active_workflows: number;
  total_rules: number;
  enabled_rules: number;
  total_jobs: number;
  active_jobs: number;
  total_notifications: number;
  unread_notifications: number;
  recent_executions: WorkflowExecution[];
  recent_audit_logs: AuditLog[];
}

// -- Portfolio Management --

export type AccountType = "personal" | "prop_firm" | "evaluation" | "live" | "demo";
export type AccountStatus = "active" | "archived" | "closed" | "suspended" | "pending";
export type BrokerPlatform = "mt4" | "mt5" | "ctrader" | "tradingview" | "ninjatrader" | "tradestation" | "ibkr" | "custom";
export type ExecutionModel = "market" | "limit" | "stop" | "dma" | "stp" | "ecn";
export type CommissionModel = "per_lot" | "per_trade" | "per_share" | "per_contract" | "none";
export type AllocationType = "fixed" | "percentage" | "target" | "risk_budget";
export type TransferType = "internal" | "external" | "funding" | "withdrawal";
export type GoalStatus = "active" | "completed" | "at_risk" | "failed" | "paused";
export type GoalMetric = "portfolio_growth" | "account_growth" | "monthly_profit" | "annual_return" | "max_drawdown" | "risk_consistency" | "win_rate" | "profit_factor" | "expectancy";
export type RuleSeverity = "critical" | "high" | "medium" | "low";

export interface BrokerProfile {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  broker_name: string;
  server?: string;
  platform: BrokerPlatform;
  account_number?: string;
  base_currency: string;
  spread_profile?: string;
  commission_model: CommissionModel;
  commission_rate?: number;
  swap_long?: number;
  swap_short?: number;
  execution_model: ExecutionModel;
  trading_costs?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  is_active: boolean;
}

export interface Account {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  broker_profile_id?: string;
  name: string;
  account_number?: string;
  account_type: AccountType;
  status: AccountStatus;
  currency: string;
  leverage?: number;
  initial_balance: number;
  current_balance: number;
  current_equity: number;
  open_pnl: number;
  used_margin: number;
  free_margin: number;
  margin_level?: number;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface AccountGroup {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  name: string;
  description?: string;
  color?: string;
  account_ids: string[];
}

export interface FundingHistory {
  id: string;
  created_at: string;
  project_id: string;
  account_id: string;
  event_type: string;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
  balance_after?: number;
  metadata?: Record<string, unknown>;
}

export interface BalanceHistoryPoint {
  id: string;
  recorded_at: string;
  project_id: string;
  account_id: string;
  balance: number;
  source?: string;
}

export interface EquityHistoryPoint {
  id: string;
  recorded_at: string;
  project_id: string;
  account_id: string;
  equity: number;
  balance: number;
  source?: string;
}

export interface PortfolioAllocation {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  allocation_type: AllocationType;
  entity_type: string;
  entity_id: string;
  entity_name?: string;
  target_percentage?: number;
  current_percentage?: number;
  target_amount?: number;
  current_amount?: number;
  risk_budget?: number;
  max_allocation?: number;
  min_allocation?: number;
  is_active: boolean;
  rebalance_frequency?: string;
  last_rebalanced_at?: string;
  notes?: string;
}

export interface Transfer {
  id: string;
  created_at: string;
  project_id: string;
  transfer_type: TransferType;
  from_account_id?: string;
  to_account_id?: string;
  amount: number;
  currency: string;
  converted_amount?: number;
  exchange_rate?: number;
  description?: string;
  reference?: string;
  status: string;
  completed_at?: string;
  metadata?: Record<string, unknown>;
}

export interface PortfolioGoal {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  account_id?: string;
  name: string;
  description?: string;
  metric: GoalMetric;
  target_value: number;
  current_value: number;
  start_value: number;
  status: GoalStatus;
  deadline?: string;
  started_at?: string;
  completed_at?: string;
  progress: number;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  is_portfolio_goal: boolean;
}

export interface AccountHealth {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  account_id: string;
  margin_usage?: number;
  drawdown_current?: number;
  drawdown_limit?: number;
  daily_loss_current?: number;
  daily_loss_limit?: number;
  trailing_drawdown?: number;
  trailing_drawdown_limit?: number;
  max_loss?: number;
  max_loss_limit?: number;
  max_daily_loss?: number;
  max_daily_loss_limit?: number;
  violation_count: number;
  last_violation_at?: string;
  health_score?: number;
  metadata?: Record<string, unknown>;
}

export interface AccountRule {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  account_id: string;
  rule_type: string;
  rule_name: string;
  description?: string;
  severity: RuleSeverity;
  threshold_value?: number;
  current_value?: number;
  is_active: boolean;
  is_violated: boolean;
  last_checked_at?: string;
  metadata?: Record<string, unknown>;
}

export interface AccountNote {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  account_id: string;
  title: string;
  content?: string;
  category?: string;
  pinned: boolean;
}

export interface PortfolioSnapshot {
  id: string;
  recorded_at: string;
  project_id: string;
  total_balance: number;
  total_equity: number;
  total_open_pnl: number;
  total_used_margin: number;
  total_free_margin: number;
  daily_pnl: number;
  weekly_pnl: number;
  monthly_pnl: number;
  total_deposits: number;
  total_withdrawals: number;
  account_count: number;
  active_account_count: number;
  snapshot_breakdown?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface PortfolioSummary {
  total_balance: number;
  total_equity: number;
  total_open_pnl: number;
  total_used_margin: number;
  total_free_margin: number;
  daily_pnl: number;
  weekly_pnl: number;
  monthly_pnl: number;
  total_deposits: number;
  total_withdrawals: number;
  account_count: number;
  active_account_count: number;
  total_trades: number;
  win_count: number;
  loss_count: number;
  win_rate: number;
  total_pnl: number;
  profit_factor: number;
  avg_rr: number;
  max_drawdown_pct: number;
}

export interface PortfolioRisk {
  total_exposure: number;
  used_margin: number;
  free_margin: number;
  margin_ratio: number;
  margin_level: number;
  portfolio_drawdown: number;
  win_rate: number;
  loss_count: number;
  concentration_risk: number;
  max_symbol_exposure: number;
  total_open_positions: number;
  risk_score: number;
}

export interface PortfolioDashboardData {
  summary: PortfolioSummary;
  risk: PortfolioRisk;
  allocations: { total_allocated: number; allocations: PortfolioAllocation[]; unallocated: number };
  account_breakdown: (Account & { trade_count: number; win_rate: number; pnl: number })[];
  history: { equity_curve: { date: string; equity: number; balance: number }[]; snapshot_count: number };
}

export interface AIAnswer {
  question: string;
  answer: string;
  confidence: number;
  sources: string[];
  generated_at: string;
}

// -- Broker Integration Hub Types --

export type BrokerProvider =
  | "metatrader4" | "metatrader5" | "ctrader" | "dxtrade"
  | "interactive_brokers" | "oanda" | "tradelocker"
  | "binance" | "bybit" | "kraken" | "custom_rest";

export type ConnectionStatus = "connected" | "disconnected" | "error" | "pending" | "expired";

export interface BrokerHubConnection {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  provider: BrokerProvider;
  label: string;
  status: ConnectionStatus;
  credentials_encrypted: Record<string, unknown>;
  metadata: Record<string, unknown>;
  config: Record<string, unknown>;
  permissions: string[];
  is_active: boolean;
  last_connected_at: string | null;
  error_count: number;
  last_error: string | null;
}

export interface BrokerAccount {
  id: string;
  created_at: string;
  updated_at: string;
  connection_id: string;
  project_id: string;
  external_id: string;
  name: string;
  account_type: string | null;
  currency: string;
  leverage: number | null;
  balance: number;
  equity: number;
  open_pl: number;
  used_margin: number;
  free_margin: number;
  margin_level: number | null;
  is_active: boolean;
  last_synced_at: string | null;
  metadata: Record<string, unknown>;
}

export interface SyncHistoryRecord {
  id: string;
  created_at: string;
  connection_id: string;
  account_id: string | null;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  items_synced: number;
  items_failed: number;
  items_created: number;
  items_updated: number;
  items_duplicates: number;
  error_message: string | null;
  details: Record<string, unknown>;
}

export interface BrokerLog {
  id: string;
  created_at: string;
  connection_id: string;
  level: string;
  message: string;
  details: Record<string, unknown>;
}

export interface BrokerHealth {
  id: string;
  created_at: string;
  updated_at: string;
  connection_id: string;
  is_reachable: boolean;
  latency_ms: number | null;
  last_check_at: string | null;
  error_message: string | null;
  uptime_percentage: number | null;
  details: Record<string, unknown>;
}

export interface ImportedTrade {
  id: string;
  created_at: string;
  connection_id: string;
  account_id: string;
  strategy_id: string | null;
  external_id: string;
  symbol: string;
  trade_type: string;
  volume: number;
  open_price: number | null;
  close_price: number | null;
  open_time: string | null;
  close_time: string | null;
  profit: number;
  commission: number;
  swap: number;
  magic_number: number | null;
  comment: string | null;
  stop_loss: number | null;
  take_profit: number | null;
  is_duplicate: boolean;
  import_hash: string;
  raw_data: Record<string, unknown>;
}

export interface BrokerAnalytics {
  id: string;
  connection_id: string;
  total_trades: number;
  total_profit: number;
  total_commission: number;
  total_swap: number;
  avg_spread: number | null;
  avg_execution_ms: number | null;
  avg_slippage: number | null;
  rejected_orders: number;
  latency_avg_ms: number | null;
  uptime_pct: number | null;
  error_rate: number | null;
}

export interface BrokerDashboardData {
  total_connections: number;
  connected_count: number;
  total_accounts: number;
  total_balance: number;
  total_equity: number;
  total_trades: number;
  recent_syncs: SyncHistoryRecord[];
}

export interface BrokerProviderInfo {
  name: string;
  display_name: string;
  icon: string;
  required_credentials: string[];
  optional_credentials: string[];
  supports_live_prices: boolean;
  supports_streaming: boolean;
}

export interface ExecutionAnalysis {
  total_trades: number;
  profitable_trades: number;
  losing_trades: number;
  win_rate: number;
  total_profit: number;
  total_commission: number;
  total_swap: number;
  avg_execution_ms: number | null;
  avg_slippage: number | null;
  avg_spread: number | null;
  rejected_orders: number;
  latency_avg_ms: number | null;
  uptime_pct: number | null;
  error_rate: number | null;
}

export interface TradeStats {
  total_trades: number;
  total_profit: number;
  total_commission: number;
  total_swap: number;
  total_duplicates: number;
}

export interface BrokerPosition {
  id: string;
  external_id: string;
  symbol: string;
  position_type: string;
  volume: number;
  open_price: number;
  current_price: number | null;
  open_time: string | null;
  profit: number;
  commission: number;
  swap: number;
  stop_loss: number | null;
  take_profit: number | null;
  magic_number: number | null;
  comment: string | null;
}

export interface BrokerOrder {
  id: string;
  external_id: string;
  symbol: string;
  order_type: string;
  order_status: string;
  volume: number;
  price: number | null;
  stop_price: number | null;
  created_time: string | null;
  expiration: string | null;
  comment: string | null;
}

// -- Trader Intelligence Types --------------

export interface TradeDebrief {
  id: string;
  project_id: string;
  trade_id: string;
  created_at: string;
  updated_at?: string;
  summary?: string;
  lessons_learned?: string | string[];
  mistakes_identified?: string | string[];
  improvements?: string | string[];
  emotional_state?: string;
  discipline_score?: number;
  overall_rating?: number;
  entry_review?: string;
  execution_review?: string;
  exit_review?: string;
  psychology_review?: string;
  strengths?: string[];
  tags?: string[];
  ai_analysis?: Record<string, unknown>;
}

export interface PersonalPattern {
  id: string;
  project_id: string;
  created_at: string;
  updated_at?: string;
  name?: string;
  pattern_type: string;
  category?: string;
  description?: string;
  occurrence_count: number;
  win_count?: number;
  loss_count?: number;
  win_rate?: number;
  avg_pnl?: number;
  confidence?: number;
  active: boolean;
  related_trade_ids?: string[];
  metadata?: Record<string, unknown>;
}

export interface PersonalRule {
  id: string;
  project_id: string;
  created_at: string;
  updated_at?: string;
  title: string;
  description?: string;
  category?: string;
  rule_type?: string;
  condition?: string;
  action?: string;
  status: string;
  version?: string;
  confidence?: number;
  supporting_stats?: Record<string, unknown>;
  rejection_reason?: string;
  approved_at?: string;
  rejected_at?: string;
  metadata?: Record<string, unknown>;
}

export interface TraderProfile {
  id: string;
  project_id: string;
  created_at: string;
  updated_at?: string;
  trading_style?: string;
  preferred_sessions?: string[];
  preferred_pairs?: string[];
  preferred_timeframes?: string[];
  risk_tolerance?: string;
  avg_holding_period?: string;
  strengths?: string[];
  weaknesses?: string[];
  trading_psychology_notes?: string;
  goals?: string[];
  experience_level?: string;
  preferred_models?: string[];
  discipline_score?: number;
  rule_adherence?: Record<string, unknown>;
  improvement_suggestions?: string[];
  total_trades_analyzed?: number;
  active_patterns?: number;
  approved_rules?: number;
  ai_generated: boolean;
  metadata?: Record<string, unknown>;
}

export interface TraderProfileSnapshot {
  id: string;
  project_id: string;
  created_at: string;
  snapshot_date: string;
  win_rate?: number;
  avg_rr?: number;
  expectancy?: number;
  total_trades: number;
  profit_factor?: number;
  max_drawdown?: number;
  sharpe_ratio?: number;
  discipline_score?: number;
  psychology_score?: number;
  top_improvements?: string[];
  areas_to_focus?: string[];
  profile_summary?: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardData {
  debrief_count: number;
  pattern_count: number;
  rule_count: number;
  approved_rule_count: number;
  profile: TraderProfile | null;
  recent_debriefs: TradeDebrief[];
}

export interface AnalystResponse {
  answer: string;
  sources?: Array<{ title: string; url?: string; relevance?: number }> | string[];
  confidence?: number;
  follow_up_questions?: string[];
  evidence?: EvidenceItem[];
}

export interface EvidenceItem {
  id: string;
  title: string;
  source?: string;
  content?: string;
  data?: Record<string, unknown>;
  relevance?: number;
  created_at?: string;
}

export interface ResearchDetail {
  id: string;
  project_id: string;
  question: string;
  status: string;
  answer?: string;
  sources?: string[];
  session?: any;
  tasks?: any;
  report?: any;
  created_at?: string;
  updated_at?: string;
}

export interface ResearchSession {
  id: string;
  project_id: string;
  title?: string;
  question?: string;
  duration?: number | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  created_at?: string;
}

export interface KnowledgeTag {
  id: string;
  name: string;
  slug?: string;
  color?: string;
  created_at?: string;
}

export interface KnowledgeConcept {
  id: string;
  name: string;
  title?: string;
  description?: string;
  summary?: string;
  difficulty?: string;
  category_id?: string;
  tags?: any[];
  status?: string;
  confidence?: number;
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeConceptDetail extends KnowledgeConcept {
  category?: { id?: string; name?: string };
  definition?: string;
  purpose?: string;
  market_context?: string;
  rules?: any;
  conditions?: string;
  confirmations?: string;
  invalidations?: string;
  common_mistakes?: string;
  best_practices?: string;
  examples?: any[];
  references?: any[];
  relationships_outgoing?: any[];
  relationships_incoming?: any[];
  relationships?: KnowledgeRelationship[];
}

export interface KnowledgeRelationship {
  id: string;
  source_concept_id: string;
  target_concept_id: string;
  relationship_type: string;
  description?: string;
  strength?: number;
  source_concept?: { id?: string; title?: string; name?: string };
  target_concept?: { id?: string; title?: string; name?: string };
  title?: string;
  created_at?: string;
}

export interface KnowledgeExample {
  id: string;
  concept_id: string;
  title?: string;
  content?: string;
  source?: string;
  created_at?: string;
}

export interface KnowledgeReference {
  id: string;
  concept_id: string;
  title?: string;
  url?: string;
  author?: string;
  source_type?: string;
  created_at?: string;
}

export interface KnowledgeStats {
  total_categories: number;
  total_concepts: number;
  total_relationships: number;
  total_examples: number;
  total_references: number;
}

export interface KnowledgeSearchResult {
  id: string;
  name: string;
  type: string;
  description?: string;
  relevance?: number;
  category?: string;
  tags?: string[];
}

// -- Context Service Types -------------------

export interface ContextRequest {
  symbols: string[];
  timeframes?: string[];
  include_news?: boolean;
  include_macro?: boolean;
  include_technical?: boolean;
  include_sentiment?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface ContextAnalysis {
  symbol: string;
  timeframe?: string;
  timestamp: string;
  bias?: string;
  strength?: number;
  market_phase?: string;
  trend?: string;
  support_levels?: number[];
  resistance_levels?: number[];
  key_events?: string[];
  news_sentiment?: string;
  macro_context?: string;
  technical_summary?: string;
  risk_assessment?: string;
  confidence_score?: number;
  raw_data?: Record<string, unknown>;
}

// -- ICT Smart Engine Types ----------------------------------------------

export interface OHLCBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SwingPoint {
  index: number;
  timestamp: string;
  price: number;
  type: string;
  strength: number;
}

export interface StructureResult {
  type: string;
  price: number;
  timestamp: string;
  bar_index: number;
  strength_score: number;
  confidence_score: number;
}

export interface StructureAnalysis {
  swing_points: SwingPoint[];
  structures: StructureResult[];
  trend: string;
  current_high: number | null;
  current_low: number | null;
  protected_high: number | null;
  protected_low: number | null;
  last_bos: Record<string, unknown> | null;
  last_mss: Record<string, unknown> | null;
}

export interface FVGResult {
  type: string;
  top_price: number;
  bottom_price: number;
  gap_size: number;
  midpoint: number;
  timestamp: string;
  bar_index: number;
  status: string;
  freshness_score: number;
  probability_score: number;
  reaction_strength: number;
  parent_fvg_id: string | null;
}

export interface FVGAnalysis {
  fvgs: FVGResult[];
  bullish_count: number;
  bearish_count: number;
  best_fvg: FVGResult | null;
}

export interface OrderBlockResult {
  type: string;
  top_price: number;
  bottom_price: number;
  midpoint: number;
  timestamp: string;
  bar_index: number;
  touch_count: number;
  is_mitigated: boolean;
  validity_score: number;
  quality_score: number;
  reaction_strength: number;
}

export interface OrderBlockAnalysis {
  order_blocks: OrderBlockResult[];
  bullish_count: number;
  bearish_count: number;
  best_block: OrderBlockResult | null;
}

export interface LiquidityResult {
  type: string;
  top_price: number;
  bottom_price: number;
  peak_price: number;
  timestamp: string;
  bar_index: number;
  is_swept: boolean;
  strength_score: number;
}

export interface LiquidityAnalysis {
  zones: LiquidityResult[];
  buy_side_liquidity: LiquidityResult[];
  sell_side_liquidity: LiquidityResult[];
  equal_highs: LiquidityResult[];
  equal_lows: LiquidityResult[];
  recent_sweeps: LiquidityResult[];
}

export interface SessionResult {
  session_type: string;
  date: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  range: number;
  direction: string | null;
  start_time: string;
  end_time: string;
}

export interface SessionAnalysis {
  sessions: SessionResult[];
  current_session: string | null;
  current_kill_zone: string | null;
  is_silver_bullet_window: boolean;
  opening_range_high: number | null;
  opening_range_low: number | null;
}

export interface ICTModelResult {
  model_type: string;
  direction: string;
  entry_price_min: number | null;
  entry_price_max: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  risk_reward_ratio: number | null;
  timestamp: string;
  bar_index: number;
  components: string[];
  quality_score: number;
}

export interface MultiTimeframeBias {
  weekly: string;
  daily: string;
  h4: string;
  h1: string;
  m15: string;
  htf_bias: string;
  ltf_confirmation: string;
  confluence_score: number;
  premium_discount: string;
}

export interface SetupScore {
  structure_score: number;
  liquidity_score: number;
  fvg_score: number;
  order_block_score: number;
  risk_score: number;
  session_score: number;
  confluence_score: number;
  overall_quality: number;
}

export interface ExecutionDecision {
  status: string;
  direction: string | null;
  entry: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  risk_amount: number | null;
  reasoning: string;
  scores: SetupScore;
}

export interface MarketContext {
  symbol: string;
  current_price: number;
  htf_bias: string;
  ltf_bias: string;
  current_structure: Record<string, unknown> | null;
  best_setup: Record<string, unknown> | null;
  premium_discount: string;
  key_levels: number[];
  weak_areas: Record<string, unknown>[];
  invalidation_levels: number[];
  confluence: number;
  session_info: Record<string, unknown> | null;
  recent_events: Record<string, unknown>[];
  reasoning: string;
}

export interface ICTAnalysisRequest {
  symbol: string;
  timeframe: string;
  bars: OHLCBar[];
  include_fvg?: boolean;
  include_order_blocks?: boolean;
  include_liquidity?: boolean;
  include_sessions?: boolean;
  include_models?: boolean;
  include_scoring?: boolean;
  detect_swing_bars?: number;
}

export interface ICTAnalysisResponse {
  symbol: string;
  timeframe: string;
  structure: StructureAnalysis;
  fvg: FVGAnalysis;
  order_blocks: OrderBlockAnalysis;
  liquidity: LiquidityAnalysis;
  sessions: SessionAnalysis;
  models: ICTModelResult[];
  multi_timeframe: MultiTimeframeBias;
  scores: SetupScore;
  execution: ExecutionDecision;
  market_context: MarketContext;
  analysis_time_ms: number;
}

export interface ICTMarketBias {
  id: string;
  project_id: string;
  symbol: string;
  snapshot_time: string;
  weekly_bias: string | null;
  daily_bias: string | null;
  h4_bias: string | null;
  h1_bias: string | null;
  m15_bias: string | null;
  htf_bias: string | null;
  ltf_confirmation: string | null;
  confluence_score: number;
  current_price: number | null;
  premium_discount_status: string | null;
}

export interface ICTExecutionSignal {
  id: string;
  project_id: string;
  symbol: string;
  setup_id: string | null;
  status: string;
  direction: string;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  risk_amount: number | null;
  reasoning: string | null;
  timestamp: string;
  executed: boolean;
}

export interface AIContext {
  symbol: string;
  bias: ICTMarketBias | null;
  best_setup: Record<string, unknown> | null;
  recent_events: Record<string, unknown>[];
  active_signal: ICTExecutionSignal | null;
  summary: string;
}

export interface ICTFullContext {
  structures: Record<string, unknown>[];
  events: Record<string, unknown>[];
  fvgs: Record<string, unknown>[];
  order_blocks: Record<string, unknown>[];
  liquidity: Record<string, unknown>[];
  setups: Record<string, unknown>[];
  bias: { current: ICTMarketBias | null };
  signals: ICTExecutionSignal[];
}

// ----------------------------------------------
// AI TRADING BRAIN TYPES
// ----------------------------------------------

export interface TraderDNA {
  id: string;
  project_id: string;
  trading_style: string | null;
  preferred_session: string | null;
  preferred_markets: string[] | null;
  preferred_rr: number | null;
  preferred_timeframes: string[] | null;
  best_models: { name: string; win_rate: number; total_pnl: number; occurrences: number }[] | null;
  worst_models: { name: string; win_rate: number; total_pnl: number; occurrences: number }[] | null;
  best_timeframe: string | null;
  worst_timeframe: string | null;
  best_holding_time: number | null;
  best_execution_window: string | null;
  risk_behavior: string | null;
  discipline_score: number | null;
  psychology_score: number | null;
  patience_index: number | null;
  learning_progress: Record<string, unknown> | null;
  mistake_frequency: number | null;
  mistake_trend: { period: string; mistake_count: number; improvement_rate: number }[] | null;
  improvement_timeline: { month: string; improvements: number }[] | null;
  dna_summary: {
    style: string;
    best_session: string | null;
    win_rate: number;
    total_trades: number;
    discipline_level: string;
    psychology_level: string;
    strengths: string[];
    areas_to_improve: string[];
  } | null;
  raw_insights: string[] | null;
  total_trades_analyzed: number;
  last_updated: string | null;
  created_at: string | null;
}

export interface BrainMemory {
  id: string;
  project_id: string;
  memory_type: string;
  key: string;
  title: string | null;
  content: Record<string, unknown> | null;
  text_content: string | null;
  importance: string;
  tags: string[] | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  is_archived: boolean;
  expires_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ReasoningStep {
  step: string;
  status: string;
  data: Record<string, unknown> | null;
  duration_ms: number;
  error: string | null;
}

export interface BrainAskResponse {
  decision_id: string;
  question: string;
  verdict: string | null;
  confidence_score: number | null;
  recommendation: string | null;
  reasoning: string | null;
  scores: Record<string, number> | null;
  reasoning_steps: ReasoningStep[] | null;
  evidence_sources: Record<string, unknown>[] | null;
}

export interface BrainDecision {
  id: string;
  project_id: string;
  question: string;
  context_snapshot: Record<string, unknown> | null;
  reasoning_steps: ReasoningStep[] | null;
  evidence_sources: Record<string, unknown>[] | null;
  scores: Record<string, number> | null;
  verdict: string | null;
  confidence_score: number | null;
  recommendation: string | null;
  reasoning: string | null;
  actual_outcome: string | null;
  user_feedback: string | null;
  learning_result: string | null;
  created_at: string | null;
}

export interface LearningObservation {
  id: string;
  project_id: string;
  observation_type: string;
  title: string;
  description: string | null;
  category: string | null;
  severity: string | null;
  confidence: number | null;
  evidence: Record<string, unknown> | null;
  related_entities: Record<string, unknown>[] | null;
  is_actionable: boolean;
  is_dismissed: boolean;
  created_at: string | null;
}

export interface PersonalInsight {
  id: string;
  project_id: string;
  category: string;
  title: string;
  description: string | null;
  impact: string | null;
  confidence: number | null;
  supporting_data: Record<string, unknown> | null;
  source: string | null;
  is_dismissed: boolean;
  created_at: string | null;
}

export interface BrainCoaching {
  id: string;
  project_id: string;
  coaching_type: string;
  title: string;
  summary: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  observations: { observation: string; category: string }[] | null;
  action_items: { action: string; priority: string; deadline: string }[] | null;
  metrics_snapshot: Record<string, unknown> | null;
  score: number | null;
  is_completed: boolean;
  period_start: string | null;
  period_end: string | null;
  created_at: string | null;
}

export interface BrainDashboard {
  dna: TraderDNA | null;
  recent_decisions: BrainDecision[];
  top_insights: PersonalInsight[];
  active_observations: LearningObservation[];
  latest_coaching: BrainCoaching | null;
  memory_summary: {
    total: number;
    by_type: Record<string, number>;
    importance_distribution: Record<string, number>;
    expired: number;
    active: number;
  } | null;
  today_intelligence: {
    style: string | null;
    best_session: string | null;
    overall_score: number;
    psychology_score: number;
    risk_behavior: string | null;
    insights: string[];
  } | null;
}

// -- Intelligence Agents (Phase 4.6) --

export interface AgentTask {
  id: string;
  project_id: string;
  agent_name: string;
  task_type: string;
  title: string;
  description: string | null;
  input_data: Record<string, unknown> | null;
  status: string;
  priority: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  workflow_id: string | null;
  workflow_step: number | null;
  depends_on: string | null;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  execution_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AgentExecution {
  id: string;
  project_id: string;
  task_id: string | null;
  agent_name: string;
  task_type: string;
  status: string;
  reasoning: string | null;
  confidence: number | null;
  discoveries: Record<string, unknown>[] | null;
  evidence: Record<string, unknown>[] | null;
  output_summary: string | null;
  output_data: Record<string, unknown> | null;
  duration_ms: number | null;
  sources_consulted: string[] | null;
  memories_created: number;
  error_message: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface AgentStatus {
  agent_name: string;
  display_name: string;
  description: string;
  capabilities: string[];
  is_available: boolean;
  total_tasks_run: number;
  last_execution: AgentExecution | null;
  avg_confidence: number | null;
  success_rate: number | null;
}

export interface AgentWorkflow {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: string;
  steps: Record<string, unknown>[] | null;
  trigger_type: string | null;
  trigger_config: Record<string, unknown> | null;
  total_runs: number;
  last_run_at: string | null;
  last_run_status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AgentDashboard {
  agents: AgentStatus[];
  pending_tasks: AgentTask[];
  recent_executions: AgentExecution[];
  workflows: AgentWorkflow[];
  total_tasks_today: number;
  total_discoveries: number;
  avg_confidence: number | null;
  success_rate: number | null;
}

/* ── Playbooks ── */
export interface PlaybookStep {
  id: string;
  title: string;
  description?: string;
  type: 'entry' | 'exit' | 'confirmation' | 'invalidation' | 'risk' | 'management' | 'psychology' | 'note';
  action?: string;
  conditions?: string[];
  expected?: string;
  validation?: { metric: string; operator: string; value: number }[];
}

export interface PlaybookBase {
  name: string;
  description?: string;
  category?: string;
  status?: string;
  tags?: string[];
  steps?: PlaybookStep[];
  linked_trades?: string[];
  linked_research?: string[];
  linked_documents?: string[];
}

export interface PlaybookCreate extends PlaybookBase {
  name: string;
}

export type PlaybookUpdate = Partial<PlaybookBase>;

export interface PlaybookRead extends PlaybookBase {
  id: string;
  project_id: string;
  created_at: string;
  updated_at: string;
}

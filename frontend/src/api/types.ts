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
  monthly_returns: MonthlyReturn[];
  rolling_10: RollingStats;
  rolling_50: RollingStats;
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
  result?: string;
  status?: string;
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
  result?: string;
  status?: string;
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
  result?: string;
  status?: string;
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
  provider: string;
  event_name: string;
  country: string;
  currency: string;
  category: string;
  importance: string;
  actual?: number;
  forecast?: number;
  previous?: number;
  unit: string;
  release_time?: string;
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
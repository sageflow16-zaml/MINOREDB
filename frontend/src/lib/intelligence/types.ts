import type { TradingScores } from '../trading-score/index';
import type { TraderDNAProfile } from '../trading-dna/index';
import type { ConceptMastery, LearningPath } from '../adaptive-learning/index';
import type { CopilotBrief } from '../research-copilot/index';
import type { EvidenceItem } from '../trust/evidence';
import type { ConfidenceResult } from '../trust/confidence';
import type { ValidationResult } from '../trust/types';
import type { DashboardData, TraderProfile, TradeDebrief, PersonalPattern, PersonalRule } from '../../api/traderIntelligence';

export interface RawIntelligenceData {
  projectId: string;
  dashboard: DashboardData | null;
  debriefs: TradeDebrief[];
  patterns: PersonalPattern[];
  rules: PersonalRule[];
  profile: TraderProfile | null;
  trades: any[];
  notes?: any[];
  bookmarks?: any[];
  documents?: any[];
  charts?: any[];
  backtests?: any[];
  recentConversations?: any[];
  recentSearches?: any[];
  openTasks?: any[];
}

export interface IntelligenceContext {
  projectId: string;
  metadata: {
    fetchedAt: string;
    dataFreshness: 'fresh' | 'stale';
  };
  scores: TradingScores;
  dna: TraderDNAProfile;
  concepts: ConceptMastery[];
  learningPath: LearningPath;
  copilot: CopilotBrief;
  patterns: PersonalPattern[];
  rules: PersonalRule[];
  debriefs: TradeDebrief[];
  trades: any[];
  profile: TraderProfile | null;
  dashboard: DashboardData | null;
  trust: {
    confidence: ConfidenceResult;
    evidence: EvidenceItem[];
  };
  validation: ValidationResult;
}

export type RecommendationProvider =
  | 'adaptive-learning'
  | 'trading-dna'
  | 'research-copilot'
  | 'pattern-engine'
  | 'validation-engine'
  | 'knowledge-engine';

export type RecommendationCategory =
  | 'study'
  | 'review'
  | 'backtest'
  | 'journal'
  | 'research'
  | 'discipline'
  | 'psychology'
  | 'risk'
  | 'planning';

export interface UnifiedRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  reason: string;
  evidence: string[];
  estimatedMinutes: number;
  category: RecommendationCategory;
  source: RecommendationProvider;
  completed: boolean;
  dismissed: boolean;
  createdAt: string;
}

export interface ActionPlan {
  id: string;
  objective: string;
  steps: PlanStep[];
  totalMinutes: number;
  progress: number;
  relatedResources: string[];
  successCriteria: string[];
  source: string;
  createdAt: string;
  completedAt?: string;
}

export interface PlanStep {
  order: number;
  action: string;
  detail: string;
  estimatedMinutes: number;
  dependencies: number[];
  completed: boolean;
  resourceUrl?: string;
}

export type PatternCategory = 'preparation' | 'psychology' | 'discipline' | 'execution' | 'risk' | 'learning' | 'research';

export interface BehavioralPattern {
  id: string;
  description: string;
  evidence: string[];
  confidence: number;
  affectedMetrics: string[];
  suggestedImprovement: string;
  category: PatternCategory;
  frequency: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface LongTermMemory {
  frequentlyStudiedConcepts: string[];
  frequentlyIgnoredConcepts: string[];
  completedLearningPaths: string[];
  completedRecommendations: string[];
  rejectedRecommendations: string[];
  recurringMistakes: string[];
  recurringStrengths: string[];
  favoriteSessions: string[];
  preferredAssets: string[];
  learningSpeed: 'fast' | 'moderate' | 'slow';
  behaviorTrends: Record<string, 'improving' | 'stable' | 'declining'>;
  lastUpdated: string;
}

export interface IntelligenceOutput {
  context: IntelligenceContext;
  patterns: BehavioralPattern[];
  recommendations: UnifiedRecommendation[];
  plan: ActionPlan | null;
  memory: LongTermMemory;
  generatedAt: string;
}

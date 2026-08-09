import type { RawIntelligenceData } from '../intelligence/types';


export type ScenarioCategory = 'scores' | 'dna' | 'patterns' | 'recommendations' | 'concepts' | 'confidence' | 'planning';

export interface GroundTruth {
  overallScore?: { min: number; max: number };
  weakestCategory?: string;
  strongestCategory?: string;
  weakestConcept?: string;
  strongestConcept?: string;
  expectedMistake?: string;
  expectedStrength?: string;
  patternIds?: string[];
  recommendationTitles?: string[];
  confidenceMin?: number;
  hasDNAInsights?: boolean;
  conceptCount?: { min: number; max: number };
  dnaFields?: Record<string, string | number>;
  patternCount?: { min: number; max: number };
  recommendationCount?: { min: number; max: number };
}

export interface BenchmarkScenario {
  id: string;
  name: string;
  description: string;
  category: ScenarioCategory;
  data: RawIntelligenceData;
  expected: GroundTruth;
}

export interface MetricResult {
  name: string;
  metric: string;
  expected: unknown;
  actual: unknown;
  score: number;
  passed: boolean;
  weight: number;
}

export interface FailureReport {
  metric: string;
  expected: unknown;
  actual: unknown;
  difference: string;
  possibleCause: string;
  suggestedFix: string;
}

export interface BenchmarkResult {
  scenarioId: string;
  scenarioName: string;
  category: ScenarioCategory;
  passed: boolean;
  metrics: MetricResult[];
  failures: FailureReport[];
  durationMs: number;
  timestamp: string;
}

export interface CategoryScore {
  score: number;
  passed: number;
  total: number;
}

export interface Scorecard {
  overallScore: number;
  categoryScores: Record<string, CategoryScore>;
  metrics: Record<string, number>;
  timestamp: string;
  durationMs: number;
  scenariosPassed: number;
  scenariosTotal: number;
}

export interface EvaluationHistoryEntry {
  version: string;
  timestamp: string;
  scorecard: Scorecard;
  failures: FailureReport[];
}

export interface AISelfReview {
  mostCommonFailure: string;
  weakestCategory: string;
  strongestCategory: string;
  mostAccurateModule: string;
  leastAccurateModule: string;
  modulesRequiringImprovement: string[];
  overallTrend: 'improving' | 'stable' | 'declining';
  recommendationsSinceLastReview: number;
}

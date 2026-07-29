export { runAllBenchmarks, runSingleBenchmark, getRegisteredScenarios, getScenarioCategories } from './benchmark';
export type { BenchmarkScenario } from './types';
export { evaluateAgainstGroundTruth } from './ground-truth';
export { aggregateMetrics, computeRecommendationPrecision, computePatternAccuracy, computeConfidenceCalibration, computeEvidenceCoverage, computeOverallIntelligenceScore } from './metrics';
export { generateScorecard } from './scorecard';
export { generateReport, getHistory, getLatestScore } from './report';
export type { BenchmarkResult, Scorecard, EvaluationHistoryEntry, FailureReport, AISelfReview, GroundTruth } from './types';

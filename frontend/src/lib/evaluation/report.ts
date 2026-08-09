import type { BenchmarkResult, Scorecard, EvaluationHistoryEntry, FailureReport, AISelfReview } from './types';

const HISTORY_KEY = 'minore_evaluation_history';

export function generateReport(
  results: BenchmarkResult[],
  scorecard: Scorecard,
): { failures: FailureReport[]; summary: string; selfReview: AISelfReview } {
  const allFailures = results.flatMap((r) => r.failures);
  const name = results.find((r) => !r.passed)?.scenarioName || 'None';

  const failuresByMetric: Record<string, FailureReport[]> = {};
  for (const f of allFailures) {
    if (!failuresByMetric[f.metric]) failuresByMetric[f.metric] = [];
    failuresByMetric[f.metric].push(f);
  }

  const mostCommonFailure = Object.entries(failuresByMetric)
    .sort(([, a], [, b]) => b.length - a.length)[0]?.[0] || 'No failures';

  const categoryPassRates: Record<string, number> = {};
  for (const [cat, cs] of Object.entries(scorecard.categoryScores)) {
    categoryPassRates[cat] = cs.total > 0 ? (cs.passed / cs.total) * 100 : 0;
  }

  const weakestCategory = Object.entries(categoryPassRates)
    .sort(([, a], [, b]) => a - b)[0]?.[0] || 'none';
  const strongestCategory = Object.entries(categoryPassRates)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

  const moduleScores = {
    scores: scorecard.categoryScores.scores?.score || computeCategoryAvg(results, 'scores'),
    dna: scorecard.categoryScores.dna?.score || computeCategoryAvg(results, 'dna'),
    patterns: scorecard.categoryScores.patterns?.score || computeCategoryAvg(results, 'patterns'),
    recommendations: scorecard.categoryScores.recommendations?.score || computeCategoryAvg(results, 'recommendations'),
  };

  const sortedModules = Object.entries(moduleScores).sort(([, a], [, b]) => b - a);
  const mostAccurateModule = sortedModules[0]?.[0] || 'none';
  const leastAccurateModule = sortedModules[sortedModules.length - 1]?.[0] || 'none';
  const modulesRequiringImprovement = sortedModules
    .filter(([, score]) => score < 70)
    .map(([name]) => name);

  const history = getHistory();
  const previousScore = history.length >= 2 ? history[history.length - 2].scorecard.overallScore : null;
  const overallTrend: 'improving' | 'stable' | 'declining' = previousScore !== null
    ? scorecard.overallScore > previousScore + 2 ? 'improving'
      : scorecard.overallScore < previousScore - 2 ? 'declining'
      : 'stable'
    : 'stable';

  const recommendationsSinceLast = history.length >= 2
    ? results.filter((r) => r.passed).length - history[history.length - 2].scorecard.scenariosPassed
    : results.filter((r) => r.passed).length;

  const summary = [
    `Benchmark: ${scorecard.scenariosPassed}/${scorecard.scenariosTotal} scenarios passed`,
    `Overall: ${scorecard.overallScore}/100`,
    `Weakest: ${weakestCategory} (${Math.round(categoryPassRates[weakestCategory] || 0)}%)`,
    `Top module: ${mostAccurateModule} (${Math.round(moduleScores[mostAccurateModule as keyof typeof moduleScores] || 0)}%)`,
    `Failures: ${allFailures.length}`,
    `Duration: ${(scorecard.durationMs / 1000).toFixed(1)}s`,
  ].join(' · ');

  const selfReview: AISelfReview = {
    mostCommonFailure,
    weakestCategory,
    strongestCategory,
    mostAccurateModule,
    leastAccurateModule,
    modulesRequiringImprovement,
    overallTrend,
    recommendationsSinceLastReview: recommendationsSinceLast,
  };

  return { failures: allFailures, summary, selfReview };
}

export function saveToHistory(version: string, scorecard: Scorecard, results: BenchmarkResult[]): EvaluationHistoryEntry {
  const allFailures = results.flatMap((r) => r.failures);
  const entry: EvaluationHistoryEntry = {
    version,
    timestamp: new Date().toISOString(),
    scorecard,
    failures: allFailures.slice(0, 50),
  };

  try {
    const history = getHistory();
    history.push(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-50)));
  } catch {
    // Storage unavailable
  }

  return entry;
}

export function getHistory(): EvaluationHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getLatestScore(): number | null {
  const history = getHistory();
  return history.length > 0 ? history[history.length - 1].scorecard.overallScore : null;
}

function computeCategoryAvg(results: BenchmarkResult[], category: string): number {
  const catResults = results.filter((r) => r.category === category);
  if (!catResults.length) return 0;
  const scores = catResults.flatMap((r) => r.metrics).map((m) => m.score * m.weight);
  const weights = catResults.flatMap((r) => r.metrics).map((m) => m.weight);
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  return totalWeight > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / totalWeight) : 0;
}

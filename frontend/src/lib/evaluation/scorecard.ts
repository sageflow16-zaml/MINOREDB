import type { BenchmarkResult, Scorecard, CategoryScore } from './types';
import {aggregateMetrics} from './metrics';

export function generateScorecard(results: BenchmarkResult[], totalDurationMs: number): Scorecard {
  const passed = results.filter((r) => r.passed);
  const categoryScores: Record<string, CategoryScore> = {};

  for (const r of results) {
    if (!categoryScores[r.category]) categoryScores[r.category] = { score: 0, passed: 0, total: 0 };
    categoryScores[r.category].total++;
    if (r.passed) categoryScores[r.category].passed++;
  }

  for (const key of Object.keys(categoryScores)) {
    const cs = categoryScores[key];
    const avg = results
      .filter((r) => r.category === key)
      .flatMap((r) => r.metrics)
      .reduce((s, m) => s + m.score * m.weight, 0) / Math.max(1,
        results.filter((r) => r.category === key).flatMap((r) => r.metrics).reduce((s, m) => s + m.weight, 0)
      );
    cs.score = Math.round(avg);
  }

  const allMetricsScore = results.flatMap((r) => r.metrics)
    .reduce((s, m) => s + m.score * m.weight, 0) / Math.max(1,
      results.flatMap((r) => r.metrics).reduce((s, m) => s + m.weight, 0)
    );

  return {
    overallScore: Math.round(allMetricsScore),
    categoryScores,
    metrics: aggregateMetrics(results),
    timestamp: new Date().toISOString(),
    durationMs: totalDurationMs,
    scenariosPassed: passed.length,
    scenariosTotal: results.length,
  };
}

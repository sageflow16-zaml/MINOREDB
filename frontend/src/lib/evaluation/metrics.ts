import {BenchmarkResult, Scorecard} from './types';

export function aggregateMetrics(results: BenchmarkResult[]): Record<string, number> {
  const metricGroups: Record<string, { total: number; count: number }> = {};

  for (const result of results) {
    for (const m of result.metrics) {
      if (!metricGroups[m.metric]) metricGroups[m.metric] = { total: 0, count: 0 };
      metricGroups[m.metric].total += m.score * m.weight;
      metricGroups[m.metric].count += m.weight;
    }
  }

  const aggregated: Record<string, number> = {};
  for (const [key, val] of Object.entries(metricGroups)) {
    aggregated[key] = val.count > 0 ? Math.round(val.total / val.count) : 0;
  }

  return aggregated;
}

export function computeCategoryAverages(results: BenchmarkResult[]): Record<string, number> {
  const byCategory: Record<string, number[]> = {};
  for (const r of results) {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    const avg = r.metrics.length > 0
      ? r.metrics.reduce((s, m) => s + m.score * m.weight, 0) / r.metrics.reduce((s, m) => s + m.weight, 0)
      : 0;
    byCategory[r.category].push(avg);
  }

  const averages: Record<string, number> = {};
  for (const [cat, scores] of Object.entries(byCategory)) {
    averages[cat] = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  }
  return averages;
}

export function computeRecommendationPrecision(results: BenchmarkResult[]): number {
  let total = 0;
  let correct = 0;
  for (const r of results) {
    for (const m of r.metrics) {
      if (m.metric.startsWith('recommendation')) {
        total++;
        if (m.passed) correct++;
      }
    }
  }
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export function computePatternAccuracy(results: BenchmarkResult[]): number {
  let total = 0;
  let correct = 0;
  for (const r of results) {
    for (const m of r.metrics) {
      if (m.metric.startsWith('pattern') || m.metric.startsWith('expectedMistake')) {
        total++;
        if (m.passed) correct++;
      }
    }
  }
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export function computeConfidenceCalibration(results: BenchmarkResult[]): number {
  let total = 0;
  let sum = 0;
  for (const r of results) {
    const confMetric = r.metrics.find((m) => m.metric === 'confidenceMin');
    if (confMetric) {
      total++;
      sum += confMetric.score;
    }
  }
  return total > 0 ? Math.round(sum / total) : 0;
}

export function computeEvidenceCoverage(results: BenchmarkResult[]): number {
  let totalMetrics = 0;
  let passed = 0;
  for (const r of results) {
    for (const m of r.metrics) {
      totalMetrics++;
      if (m.passed) passed++;
    }
  }
  return totalMetrics > 0 ? Math.round((passed / totalMetrics) * 100) : 0;
}

export function computeOverallIntelligenceScore(scorecard: Scorecard, results: BenchmarkResult[]): number {
  const precision = computeRecommendationPrecision(results);
  const patterns = computePatternAccuracy(results);
  const calibration = computeConfidenceCalibration(results);
  const coverage = computeEvidenceCoverage(results);
  const passRate = scorecard.scenariosTotal > 0
    ? (scorecard.scenariosPassed / scorecard.scenariosTotal) * 100
    : 0;

  return Math.round(
    precision * 0.2 +
    patterns * 0.2 +
    calibration * 0.15 +
    coverage * 0.15 +
    scorecard.overallScore * 0.15 +
    passRate * 0.15
  );
}

import type { GroundTruth, MetricResult, FailureReport } from './types';
import type { IntelligenceOutput } from '../intelligence/types';

export function evaluateAgainstGroundTruth(
  output: IntelligenceOutput,
  expected: GroundTruth,
): { metrics: MetricResult[]; failures: FailureReport[] } {
  const metrics: MetricResult[] = [];
  const failures: FailureReport[] = [];
  const { context, patterns, recommendations } = output;

  const addMetric = (name: string, metric: string, passed: boolean, expectedVal: unknown, actualVal: unknown, score: number, weight = 1) => {
    const result: MetricResult = { name, metric, expected: expectedVal, actual: actualVal, score, passed, weight };
    metrics.push(result);
    if (!passed) {
      failures.push({
        metric,
        expected: expectedVal,
        actual: actualVal,
        difference: `Expected ${JSON.stringify(expectedVal)}, got ${JSON.stringify(actualVal)}`,
        possibleCause: 'Intelligence output does not match expected range or value',
        suggestedFix: 'Review the relevant engine logic for this metric',
      });
    }
  };

  // Overall Score
  if (expected.overallScore) {
    const score = context.scores.overall;
    const passed = score >= expected.overallScore.min && score <= expected.overallScore.max;
    const range = expected.overallScore.max - expected.overallScore.min;
    const mid = (expected.overallScore.min + expected.overallScore.max) / 2;
    const distance = Math.abs(score - mid);
    const scoreVal = Math.max(0, Math.min(100, Math.round(100 - (distance / range) * 50)));
    addMetric('Overall Score Range', 'overallScore', passed, expected.overallScore, score, passed ? scoreVal : Math.min(scoreVal, 40));
  }

  // Weakest Category
  if (expected.weakestCategory) {
    const weakest = context.scores.categories.reduce((min, c) => c.score < min.score ? c : min, context.scores.categories[0]);
    const matched = weakest.label.toLowerCase().includes(expected.weakestCategory.toLowerCase());
    addMetric('Weakest Category Detection', 'weakestCategory', matched, expected.weakestCategory, weakest.label, matched ? 100 : 0);
  }

  // Strongest Category
  if (expected.strongestCategory) {
    const strongest = context.scores.categories.reduce((max, c) => c.score > max.score ? c : max, context.scores.categories[0]);
    const matched = strongest.label.toLowerCase().includes(expected.strongestCategory.toLowerCase());
    addMetric('Strongest Category Detection', 'strongestCategory', matched, expected.strongestCategory, strongest.label, matched ? 100 : 0);
  }

  // Weakest Concept
  if (expected.weakestConcept) {
    const sorted = [...context.concepts].sort((a, b) => a.understanding - b.understanding);
    const weakest = sorted[0];
    const matched = weakest?.name.toLowerCase().includes(expected.weakestConcept.toLowerCase());
    addMetric('Weakest Concept Detection', 'weakestConcept', !!matched, expected.weakestConcept, weakest?.name || 'none', matched ? 100 : 0);
  }

  // Strongest Concept
  if (expected.strongestConcept) {
    const sorted = [...context.concepts].sort((a, b) => b.understanding - a.understanding);
    const strongest = sorted[0];
    const matched = strongest?.name.toLowerCase().includes(expected.strongestConcept.toLowerCase());
    addMetric('Strongest Concept Detection', 'strongestConcept', !!matched, expected.strongestConcept, strongest?.name || 'none', matched ? 100 : 0);
  }

  // Expected Mistake
  if (expected.expectedMistake) {
    const found = patterns.some((p) =>
      p.description.toLowerCase().includes(expected.expectedMistake!.toLowerCase()) ||
      p.evidence.some((e) => e.toLowerCase().includes(expected.expectedMistake!.toLowerCase()))
    );
    addMetric('Expected Mistake Detection', 'expectedMistake', found, expected.expectedMistake, found ? 'detected' : 'not detected', found ? 100 : 0);
  }

  // Expected Strength
  if (expected.expectedStrength) {
    const dnaStrength = context.dna.insights.some((i) => i.title.toLowerCase().includes(expected.expectedStrength!.toLowerCase()));
    const patternStrength = patterns.some((p) => p.description.toLowerCase().includes(expected.expectedStrength!.toLowerCase()));
    const found = dnaStrength || patternStrength;
    addMetric('Expected Strength Detection', 'expectedStrength', found, expected.expectedStrength, found ? 'detected' : 'not detected', found ? 100 : 0);
  }

  // Pattern Count
  if (expected.patternCount) {
    const count = patterns.length;
    const passed = count >= expected.patternCount.min && count <= expected.patternCount.max;
    const countScore = expected.patternCount.max > 0
      ? Math.max(0, Math.min(100, Math.round(100 - Math.abs(count - (expected.patternCount.min + expected.patternCount.max) / 2) * 5)))
      : count === 0 ? 100 : 0;
    addMetric('Pattern Count Range', 'patternCount', passed, expected.patternCount, count, passed ? countScore : Math.min(countScore, 40));
  }

  // Recommendation Count
  if (expected.recommendationCount) {
    const count = recommendations.length;
    const passed = count >= expected.recommendationCount.min && count <= expected.recommendationCount.max;
    const countScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(count - (expected.recommendationCount.min + expected.recommendationCount.max) / 2) * 3)));
    addMetric('Recommendation Count Range', 'recommendationCount', passed, expected.recommendationCount, count, passed ? countScore : Math.min(countScore, 40));
  }

  // DNA Insights Presence
  if (expected.hasDNAInsights !== undefined) {
    const has = context.dna.insights.length > 0;
    addMetric('DNA Insights Generated', 'hasDNAInsights', has === expected.hasDNAInsights, expected.hasDNAInsights, has, has === expected.hasDNAInsights ? 100 : 0);
  }

  // Concept Count
  if (expected.conceptCount) {
    const count = context.concepts.length;
    const passed = count >= expected.conceptCount.min && count <= expected.conceptCount.max;
    addMetric('Concept Count Range', 'conceptCount', passed, expected.conceptCount, count, passed ? 100 : 50);
  }

  // Confidence Minimum
  if (expected.confidenceMin !== undefined) {
    const passed = context.trust.confidence.score >= expected.confidenceMin;
    addMetric('Minimum Confidence', 'confidenceMin', passed, expected.confidenceMin, context.trust.confidence.score, passed ? 100 : Math.round(context.trust.confidence.score));
  }

  // DNA Fields
  if (expected.dnaFields) {
    for (const [field, val] of Object.entries(expected.dnaFields)) {
      const actual = (context.dna as any)[field];
      const strExpected = String(val).toLowerCase();
      const strActual = String(actual).toLowerCase();
      const matched = strActual.includes(strExpected) || strExpected.includes(strActual);
      addMetric(`DNA Field: ${field}`, `dnaField.${field}`, matched, val, actual, matched ? 100 : 0, 0.5);
    }
  }

  return { metrics, failures };
}

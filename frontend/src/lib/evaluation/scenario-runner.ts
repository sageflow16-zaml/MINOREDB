import { buildContext, detectPatterns, generateRecommendations, createPlan } from '../intelligence/index';
import { evaluateAgainstGroundTruth } from './ground-truth';
import type { BenchmarkScenario, BenchmarkResult } from './types';

export function runScenario(scenario: BenchmarkScenario): BenchmarkResult {
  const startTime = performance.now();

  try {
    const context = buildContext(scenario.data);
    const patterns = detectPatterns(context);
    const recommendations = generateRecommendations(context, patterns);
    const plan = createPlan(recommendations);

    const output = {
      context,
      patterns,
      recommendations,
      plan,
      memory: {} as any,
      generatedAt: new Date().toISOString(),
    };

    const { metrics, failures } = evaluateAgainstGroundTruth(output, scenario.expected);
    const passed = failures.length === 0;
    const durationMs = Math.round(performance.now() - startTime);

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      category: scenario.category,
      passed,
      metrics,
      failures,
      durationMs,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      category: scenario.category,
      passed: false,
      metrics: [],
      failures: [{
        metric: 'runtime',
        expected: 'no errors',
        actual: String(err),
        difference: `Scenario threw an exception: ${err}`,
        possibleCause: 'Unexpected error in Intelligence Core modules',
        suggestedFix: 'Check that all data structures match expected types',
      }],
      durationMs,
      timestamp: new Date().toISOString(),
    };
  }
}

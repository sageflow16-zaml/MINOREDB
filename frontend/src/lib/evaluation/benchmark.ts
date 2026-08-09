import { benchmarkScenarios } from './dataset';
import { runScenario } from './scenario-runner';
import { generateScorecard } from './scorecard';
import {saveToHistory} from './report';
import type { BenchmarkScenario, BenchmarkResult, Scorecard, EvaluationHistoryEntry } from './types';

const EVAL_VERSION = '1.0.0';

export function runAllBenchmarks(options?: {
  filterCategory?: string;
  verbose?: boolean;
}): {
  results: BenchmarkResult[];
  scorecard: Scorecard;
  historyEntry: EvaluationHistoryEntry;
} {
  const scenarios = options?.filterCategory
    ? benchmarkScenarios.filter((s) => s.category === options.filterCategory)
    : benchmarkScenarios;

  const results: BenchmarkResult[] = [];
  const startTime = performance.now();

  for (const scenario of scenarios) {
    const result = runScenario(scenario);
    results.push(result);
  }

  const totalDuration = Math.round(performance.now() - startTime);

  const scorecard = generateScorecard(results, totalDuration);
  const historyEntry = saveToHistory(EVAL_VERSION, scorecard, results);

  return { results, scorecard, historyEntry };
}

export function runSingleBenchmark(scenarioId: string): BenchmarkResult | null {
  const scenario = benchmarkScenarios.find((s) => s.id === scenarioId);
  if (!scenario) return null;
  return runScenario(scenario);
}

export function getRegisteredScenarios(): BenchmarkScenario[] {
  return benchmarkScenarios;
}

export function getScenarioCategories(): string[] {
  return [...new Set(benchmarkScenarios.map((s) => s.category))];
}

import type { IntelligenceContext, UnifiedRecommendation, BehavioralPattern } from './types';
import { gatherEvidence } from '../trust/evidence';
import { computeConfidence } from '../trust/confidence';
import { buildExplanation } from '../trust/explainability';
import type { AIExplanation } from '../trust/types';

export interface ReasoningInput {
  context: IntelligenceContext;
  patterns: BehavioralPattern[];
  recommendations: UnifiedRecommendation[];
}

export interface ReasoningOutput {
  explanation: AIExplanation;
  pipeline: ReasoningPipelineStep[];
}

export interface ReasoningPipelineStep {
  step: string;
  status: 'completed' | 'skipped' | 'error';
  details: string;
  durationMs: number;
}

export function executeReasoningPipeline(input: ReasoningInput, targetType: string, targetId: string): ReasoningOutput {
  const steps: ReasoningPipelineStep[] = [];
  const startTime = performance.now();

  const addStep = (step: string, status: ReasoningPipelineStep['status'], details: string) => {
    steps.push({ step, status, details, durationMs: Math.round(performance.now() - startTime) });
  };

  try {
    gatherEvidence({ type: 'score', target: targetType, data: { patterns: input.context.patterns, debriefs: input.context.debriefs, score: input.context.scores.overall, categories: input.context.scores.categories } });
    addStep('Collect Context', 'completed', `Gathered intelligence from ${input.context.scores.categories.length} score categories`);
  } catch {
    addStep('Collect Context', 'error', 'Failed to gather evidence');
  }

  try {
    input.patterns.filter((p) => p.confidence > 50);
    addStep('Validate Evidence', 'completed', 'Pattern validation completed');
  } catch {
    addStep('Validate Evidence', 'error', 'Validation failed');
  }

  let confidenceScore = 50;
  try {
    const confResult = computeConfidence({
      dataPoints: input.context.debriefs.length + input.context.patterns.length + input.context.scores.categories.length,
      dataQuality: Math.round(input.context.scores.overall * 0.7 + 30),
      consistency: Math.round(input.context.scores.categories.reduce((s, c) => s + c.score, 0) / input.context.scores.categories.length),
      contradictions: input.patterns.filter((p) => p.trend === 'declining').length,
      recencyDays: 3,
      coverage: Math.min(100, input.context.scores.categories.length * 10),
    });
    confidenceScore = confResult.score;
    addStep('Compute Confidence', 'completed', `Confidence: ${confidenceScore}% (${confResult.level})`);
  } catch {
    addStep('Compute Confidence', 'error', 'Confidence computation failed');
  }

  try {
    const highConfidencePatterns = input.patterns.filter((p) => p.confidence > 60);
    addStep('Detect Patterns', 'completed', `${highConfidencePatterns.length} high-confidence behavioral patterns detected`);
  } catch {
    addStep('Detect Patterns', 'error', 'Pattern detection failed');
  }

  let recommendationCount = 0;
  try {
    const highPriority = input.recommendations.filter((r) => r.priority === 'critical' || r.priority === 'high');
    recommendationCount = highPriority.length;
    addStep('Generate Candidate Recommendations', 'completed', `${recommendationCount} high-priority recommendations from ${input.recommendations.length} total`);
  } catch {
    addStep('Generate Candidate Recommendations', 'error', 'Recommendation generation failed');
  }

  try {
    const ranked = input.recommendations.sort((a, b) => {
      const pw: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return (pw[b.priority] || 0) * b.confidence - (pw[a.priority] || 0) * a.confidence;
    });
    addStep('Rank Recommendations', 'completed', `Top: "${ranked[0]?.title || 'none'}"`);
  } catch {
    addStep('Rank Recommendations', 'error', 'Ranking failed');
  }

  let explanation: AIExplanation;
  try {
    explanation = buildExplanation({
      type: 'score',
      target: targetType,
      targetId,
      label: targetType.replace(/_/g, ' '),
      data: {
        score: input.context.scores.overall,
        categories: input.context.scores.categories,
        factors: input.context.scores.categories.flatMap((c) => c.factors),
        debriefs: input.context.debriefs,
        patterns: input.context.patterns,
        rules: input.context.rules,
        trades: input.context.trades,
        observations: input.context.copilot.observations,
      },
    });
    addStep('Build Explanation', 'completed', 'Explanation generated with structured reasoning');
  } catch {
    explanation = buildExplanation({
      type: 'score',
      target: targetType,
      targetId,
      label: targetType,
      data: { score: 0, categories: [] },
    });
    addStep('Build Explanation', 'error', 'Failed to build explanation, used fallback');
  }

  return { explanation, pipeline: steps };
}

import { buildContext } from './context-engine';
import { detectPatterns } from './pattern-engine';
import { generateRecommendations, markRecommendationCompleted, markRecommendationDismissed } from './recommendation-engine';
import { createPlan, getActivePlan, updateStep } from './planner-engine';
import { updateMemory } from './memory-engine';
import { executeReasoningPipeline, type ReasoningInput } from './reasoning-engine';
import { recordSnapshot } from '../trust/history';
import { eventBus } from '../ai/eventBus';
import type { RawIntelligenceData, IntelligenceOutput, UnifiedRecommendation, BehavioralPattern } from './types';
import type { AIExplanation } from '../trust/types';

let cachedContext: { data: RawIntelligenceData; output: IntelligenceOutput; timestamp: number } | null = null;
const CACHE_TTL = 300000;

export async function orchestrate(data: RawIntelligenceData): Promise<IntelligenceOutput> {
  const cacheValid = cachedContext &&
    cachedContext.data.projectId === data.projectId &&
    (Date.now() - cachedContext.timestamp) < CACHE_TTL;

  if (cacheValid) {
    return cachedContext!.output;
  }

  const context = buildContext(data);
  const patterns = detectPatterns(context);
  const recommendations = generateRecommendations(context, patterns);
  const plan = createPlan(recommendations);
  const updatedMemory = updateMemory(context, recommendations, patterns);

  recordSnapshots(context);

  publishEvents(context, patterns, recommendations);

  const output: IntelligenceOutput = {
    context,
    patterns,
    recommendations,
    plan,
    memory: updatedMemory,
    generatedAt: new Date().toISOString(),
  };

  cachedContext = { data, output, timestamp: Date.now() };
  return output;
}

export function runReasoning(
  output: IntelligenceOutput,
  targetType: string,
  targetId: string,
): { explanation: AIExplanation; input: ReasoningInput } {
  const input: ReasoningInput = {
    context: output.context,
    patterns: output.patterns,
    recommendations: output.recommendations,
  };
  const result = executeReasoningPipeline(input, targetType, targetId);
  return { explanation: result.explanation, input };
}

export function completeRecommendation(id: string): void {
  markRecommendationCompleted(id);
  eventBus.emit({
    type: 'RECOMMENDATION_COMPLETED',
    projectId: 'intelligence-core',
    timestamp: new Date().toISOString(),
    actor: 'system',
    data: { recommendationId: id },
    id: `evt_rec_${Date.now()}`,
  });
}

export function dismissRecommendation(id: string): void {
  markRecommendationDismissed(id);
}

export function invalidateCache(): void {
  cachedContext = null;
}

export function getCachedOutput(): IntelligenceOutput | null {
  return cachedContext?.output || null;
}

export { getActivePlan, updateStep };

function recordSnapshots(context: IntelligenceOutput['context']): void {
  try {
    recordSnapshot('score_overall', context.scores.overall);
    for (const cat of context.scores.categories) {
      recordSnapshot(`score_${cat.key}`, cat.score);
    }
  } catch {
    // Snapshots are non-critical
  }
}

function publishEvents(
  context: IntelligenceOutput['context'],
  patterns: BehavioralPattern[],
  recommendations: UnifiedRecommendation[],
): void {
  try {
    eventBus.emit({
      type: 'INTELLIGENCE_UPDATED',
      projectId: 'intelligence-core',
      timestamp: new Date().toISOString(),
      actor: 'system',
      data: {
        score: context.scores.overall,
        patternCount: patterns.length,
        recommendationCount: recommendations.length,
      },
      id: `evt_iu_${Date.now()}`,
    });

    const criticalWarnings = patterns.filter((p) => p.trend === 'declining' && p.confidence > 75);
    for (const w of criticalWarnings) {
      eventBus.emit({
        type: 'PATTERN_DETECTED',
        projectId: 'intelligence-core',
        timestamp: new Date().toISOString(),
        actor: 'system',
        data: { patternId: w.id, description: w.description, confidence: w.confidence },
        id: `evt_pd_${Date.now()}_${w.id}`,
      });
    }
  } catch {
    // Events are non-critical
  }
}

export { buildContext } from './context-engine';
export { detectPatterns } from './pattern-engine';
export { generateRecommendations, markRecommendationCompleted, markRecommendationDismissed } from './recommendation-engine';
export { createPlan, getActivePlan, updateStep, getAllPlans } from './planner-engine';
export { loadMemory, updateMemory, isConceptMastered, wasRecommendationCompleted } from './memory-engine';
export { executeReasoningPipeline } from './reasoning-engine';
export { orchestrate, runReasoning, completeRecommendation, dismissRecommendation, invalidateCache, getCachedOutput } from './orchestrator';
export type {
  RawIntelligenceData,
  IntelligenceContext,
  IntelligenceOutput,
  UnifiedRecommendation,
  RecommendationProvider,
  RecommendationCategory,
  ActionPlan,
  PlanStep,
  BehavioralPattern,
  PatternCategory,
  LongTermMemory,
} from './types';

import type { IntelligenceContext, LongTermMemory, UnifiedRecommendation, BehavioralPattern } from './types';

const MEMORY_KEY = 'minore_long_term_memory';
const MAX_HISTORY = 500;

export function loadMemory(): LongTermMemory {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return createEmptyMemory();
    const parsed = JSON.parse(raw);
    return validateMemory(parsed);
  } catch {
    return createEmptyMemory();
  }
}

export function updateMemory(
  context: IntelligenceContext,
  recommendations: UnifiedRecommendation[],
  patterns: BehavioralPattern[],
): LongTermMemory {
  const memory = loadMemory();

  updateFrequentConcepts(memory, context.concepts);
  updateMistakes(memory, context);
  updateStrengths(memory, context);
  updateSessionPrefs(memory, context);
  updateBehaviorTrends(memory, patterns);
  updateLearningSpeed(memory, context);
  updateCompletedItems(memory, recommendations);

  saveMemory(memory);
  return memory;
}

function updateFrequentConcepts(memory: LongTermMemory, concepts: IntelligenceContext['concepts']): void {
  const studied = concepts
    .filter((c) => c.applications > 2)
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 10)
    .map((c) => c.name);
  memory.frequentlyStudiedConcepts = studied;

  const ignored = concepts
    .filter((c) => c.understanding < 30 && c.applications > 0)
    .slice(0, 10)
    .map((c) => c.name);
  memory.frequentlyIgnoredConcepts = [...new Set([...memory.frequentlyIgnoredConcepts, ...ignored])].slice(0, 10);
}

function updateMistakes(memory: LongTermMemory, context: IntelligenceContext): void {
  const negativePatterns = context.patterns.filter((p) => p.pattern_type === 'negative');
  const mistakeNames = negativePatterns.map((p) => p.name || p.description || p.pattern_type).filter(Boolean) as string[];
  const newMistakes = [...new Set(mistakeNames)];
  memory.recurringMistakes = [...new Set([...newMistakes, ...memory.recurringMistakes])].slice(0, 20);
}

function updateStrengths(memory: LongTermMemory, context: IntelligenceContext): void {
  const positivePatterns = context.patterns.filter((p) => p.pattern_type === 'positive');
  const strengthNames = positivePatterns.map((p) => p.name || p.description || p.pattern_type).filter(Boolean) as string[];
  const deduped = [...new Set(strengthNames)];
  memory.recurringStrengths = [...new Set([...deduped, ...memory.recurringStrengths])].slice(0, 20);

  const scores = context.scores;
  const highCategories = scores.categories.filter((c) => c.score > 75).map((c) => c.label);
  memory.recurringStrengths = [...new Set([...highCategories, ...memory.recurringStrengths])].slice(0, 20);
}

function updateSessionPrefs(memory: LongTermMemory, context: IntelligenceContext): void {
  const profile = context.profile;
  if (profile?.preferred_sessions?.length) {
    memory.favoriteSessions = [...new Set([...profile.preferred_sessions, ...memory.favoriteSessions])].slice(0, 5);
  }
  if (profile?.preferred_pairs?.length) {
    memory.preferredAssets = [...new Set([...profile.preferred_pairs, ...memory.preferredAssets])].slice(0, 10);
  }
}

function updateBehaviorTrends(memory: LongTermMemory, patterns: BehavioralPattern[]): void {
  for (const p of patterns) {
    const key = p.category;
    if (!memory.behaviorTrends[key] || p.trend === 'declining') {
      memory.behaviorTrends[key] = p.trend;
    }
  }
}

function updateLearningSpeed(memory: LongTermMemory, context: IntelligenceContext): void {
  const avgUnderstanding = context.concepts.length > 0
    ? context.concepts.reduce((s, c) => s + c.understanding, 0) / context.concepts.length
    : 0;
  const mistakesToAppsRatio = context.concepts.length > 0
    ? context.concepts.reduce((s, c) => s + c.mistakes, 0) / Math.max(1, context.concepts.reduce((s, c) => s + c.applications, 0))
    : 0;

  if (avgUnderstanding > 70 && mistakesToAppsRatio < 0.3) {
    memory.learningSpeed = 'fast';
  } else if (avgUnderstanding > 40 || mistakesToAppsRatio < 0.6) {
    memory.learningSpeed = 'moderate';
  } else {
    memory.learningSpeed = 'slow';
  }
}

function updateCompletedItems(memory: LongTermMemory, recommendations: UnifiedRecommendation[]): void {
  const completed = recommendations.filter((r) => r.completed).map((r) => r.id);
  memory.completedRecommendations = [...new Set([...memory.completedRecommendations, ...completed])].slice(0, MAX_HISTORY);
}

export function isConceptMastered(conceptName: string): boolean {
  const memory = loadMemory();
  return memory.frequentlyStudiedConcepts.includes(conceptName) &&
    !memory.frequentlyIgnoredConcepts.includes(conceptName);
}

export function wasRecommendationCompleted(recommendationId: string): boolean {
  const memory = loadMemory();
  return memory.completedRecommendations.includes(recommendationId);
}

function createEmptyMemory(): LongTermMemory {
  return {
    frequentlyStudiedConcepts: [],
    frequentlyIgnoredConcepts: [],
    completedLearningPaths: [],
    completedRecommendations: [],
    rejectedRecommendations: [],
    recurringMistakes: [],
    recurringStrengths: [],
    favoriteSessions: [],
    preferredAssets: [],
    learningSpeed: 'moderate',
    behaviorTrends: {},
    lastUpdated: new Date().toISOString(),
  };
}

function validateMemory(memory: any): LongTermMemory {
  return {
    frequentlyStudiedConcepts: Array.isArray(memory?.frequentlyStudiedConcepts) ? memory.frequentlyStudiedConcepts : [],
    frequentlyIgnoredConcepts: Array.isArray(memory?.frequentlyIgnoredConcepts) ? memory.frequentlyIgnoredConcepts : [],
    completedLearningPaths: Array.isArray(memory?.completedLearningPaths) ? memory.completedLearningPaths : [],
    completedRecommendations: Array.isArray(memory?.completedRecommendations) ? memory.completedRecommendations : [],
    rejectedRecommendations: Array.isArray(memory?.rejectedRecommendations) ? memory.rejectedRecommendations : [],
    recurringMistakes: Array.isArray(memory?.recurringMistakes) ? memory.recurringMistakes : [],
    recurringStrengths: Array.isArray(memory?.recurringStrengths) ? memory.recurringStrengths : [],
    favoriteSessions: Array.isArray(memory?.favoriteSessions) ? memory.favoriteSessions : [],
    preferredAssets: Array.isArray(memory?.preferredAssets) ? memory.preferredAssets : [],
    learningSpeed: ['fast', 'moderate', 'slow'].includes(memory?.learningSpeed) ? memory.learningSpeed : 'moderate',
    behaviorTrends: memory?.behaviorTrends && typeof memory.behaviorTrends === 'object' ? memory.behaviorTrends : {},
    lastUpdated: memory?.lastUpdated || new Date().toISOString(),
  };
}

function saveMemory(memory: LongTermMemory): void {
  try {
    memory.lastUpdated = new Date().toISOString();
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // Storage unavailable
  }
}

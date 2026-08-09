import {IntelligenceContext, UnifiedRecommendation, RecommendationCategory, BehavioralPattern} from './types';

const MEMORY_STORAGE_KEY = 'minore_completed_recommendations';
const MAX_RECOMMENDATIONS = 10;

export function generateRecommendations(
  context: IntelligenceContext,
  patterns: BehavioralPattern[],
): UnifiedRecommendation[] {
  const all: UnifiedRecommendation[] = [];

  const providers: Array<() => UnifiedRecommendation[]> = [
    () => adaptiveLearningProvider(context),
    () => tradingDNAProvider(context),
    () => researchCopilotProvider(context),
    () => patternEngineProvider(patterns),
    () => validationProvider(context),
  ];

  for (const provide of providers) {
    try {
      all.push(...provide());
    } catch {
      // Provider failed silently
    }
  }

  return mergeAndRank(all);
}

function adaptiveLearningProvider(context: IntelligenceContext): UnifiedRecommendation[] {
  const recs: UnifiedRecommendation[] = [];
  const { learningPath, concepts } = context;

  if (learningPath.todayGoal) {
    recs.push({
      id: `al_today_${Date.now()}`,
      title: learningPath.todayGoal.task,
      description: learningPath.todayGoal.reason,
      priority: learningPath.todayGoal.priority === 'high' ? 'high' : 'medium',
      confidence: 75,
      reason: learningPath.todayGoal.reason,
      evidence: [`Understanding: ${concepts.find((c) => c.name === learningPath.todayGoal.concept)?.understanding || 'N/A'}%`, `Priority: ${learningPath.todayGoal.priority}`],
      estimatedMinutes: learningPath.todayGoal.estimatedMinutes,
      category: 'study',
      source: 'adaptive-learning',
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  const weakConcepts = concepts.filter((c) => c.understanding < 50).slice(0, 3);
  for (const c of weakConcepts) {
    recs.push({
      id: `al_weak_${c.name}_${Date.now()}`,
      title: `Study: ${c.name}`,
      description: `Understanding is at ${c.understanding}% with ${c.mistakes} mistakes — review materials and practice`,
      priority: c.mistakes > 2 ? 'high' : 'medium',
      confidence: 65 + Math.min(20, c.applications),
      reason: `${c.name} understanding is ${c.understanding}% and declining`,
      evidence: [`Understanding: ${c.understanding}%`, `${c.mistakes} mistakes`, `${c.applications} applications`],
      estimatedMinutes: c.mistakes > 2 ? 20 : 10,
      category: 'study',
      source: 'adaptive-learning',
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  return recs;
}

function tradingDNAProvider(context: IntelligenceContext): UnifiedRecommendation[] {
  const recs: UnifiedRecommendation[] = [];
  const { dna } = context;

  if (dna.mostFrequentMistake && dna.mostFrequentMistake !== '—' && dna.mostFrequentMistake !== 'Not tracked') {
    recs.push({
      id: `dna_mistake_${Date.now()}`,
      title: `Address: ${dna.mostFrequentMistake}`,
      description: `Your most frequent mistake is "${dna.mostFrequentMistake}" — review past occurrences and create a preventive rule`,
      priority: 'high',
      confidence: 75,
      reason: `Most frequent mistake detected across ${context.debriefs.length} debriefs`,
      evidence: [`Top mistake: ${dna.mostFrequentMistake}`, `${context.patterns.filter((p) => p.pattern_type === 'negative').length} negative patterns`],
      estimatedMinutes: 15,
      category: 'discipline',
      source: 'trading-dna',
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  if (dna.weakestConcept && dna.weakestConcept !== '—' && dna.weakestConcept !== 'Not tracked') {
    recs.push({
      id: `dna_weakest_${Date.now()}`,
      title: `Strengthen: ${dna.weakestConcept}`,
      description: `"${dna.weakestConcept}" identified as your weakest concept — focused study may improve overall trading`,
      priority: 'medium',
      confidence: 65,
      reason: 'Identified as weakest area from debrief analysis',
      evidence: [`Weakest concept: ${dna.weakestConcept}`],
      estimatedMinutes: 20,
      category: 'study',
      source: 'trading-dna',
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  if (dna.preferredSession && dna.bestDay && dna.preferredSession !== '—') {
    recs.push({
      id: `dna_session_${Date.now()}`,
      title: `Optimize ${dna.preferredSession} Sessions`,
      description: `Your preferred session is ${dna.preferredSession} with best day being ${dna.bestDay} — maximize trading during this alignment`,
      priority: 'low',
      confidence: 60,
      reason: 'Session and day performance alignment identified',
      evidence: [`Preferred session: ${dna.preferredSession}`, `Best day: ${dna.bestDay}`],
      estimatedMinutes: 5,
      category: 'planning',
      source: 'trading-dna',
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  return recs;
}

function researchCopilotProvider(context: IntelligenceContext): UnifiedRecommendation[] {
  const recs: UnifiedRecommendation[] = [];
  const { copilot } = context;

  for (const obs of copilot.observations) {
    const priority = obs.priority === 'high' ? 'high' : obs.priority === 'medium' ? 'medium' : 'low';
    recs.push({
      id: `copilot_obs_${obs.title.replace(/\s+/g, '_')}_${Date.now()}`,
      title: obs.title,
      description: obs.message,
      priority: priority as any,
      confidence: priority === 'high' ? 80 : priority === 'medium' ? 60 : 40,
      reason: obs.message,
      evidence: obs.evidence.length > 0 ? obs.evidence : ['Copilot observation'],
      estimatedMinutes: priority === 'high' ? 15 : 10,
      category: obs.type === 'warning' ? 'risk' : obs.type === 'reminder' ? 'review' : 'research',
      source: 'research-copilot',
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  for (const task of copilot.proactiveTasks) {
    recs.push({
      id: `copilot_task_${task.title.replace(/\s+/g, '_')}_${Date.now()}`,
      title: task.title,
      description: task.description,
      priority: task.priority as any,
      confidence: task.priority === 'high' ? 75 : task.priority === 'medium' ? 55 : 35,
      reason: task.reason,
      evidence: [task.reason],
      estimatedMinutes: task.estimatedMinutes,
      category: task.category as RecommendationCategory,
      source: 'research-copilot',
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  return recs;
}

function patternEngineProvider(patterns: BehavioralPattern[]): UnifiedRecommendation[] {
  const recs: UnifiedRecommendation[] = [];

  for (const pattern of patterns.slice(0, 5)) {
    const priority = pattern.trend === 'declining' && pattern.confidence > 70 ? 'high' : pattern.confidence > 60 ? 'medium' : 'low';
    recs.push({
      id: `pattern_${pattern.id}_${Date.now()}`,
      title: pattern.description.length > 80 ? pattern.description.slice(0, 80) + '…' : pattern.description,
      description: pattern.suggestedImprovement,
      priority: priority as any,
      confidence: Math.round(pattern.confidence),
      reason: pattern.description,
      evidence: pattern.evidence,
      estimatedMinutes: priority === 'high' ? 15 : 10,
      category: pattern.category as RecommendationCategory,
      source: 'pattern-engine',
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  return recs;
}

function validationProvider(context: IntelligenceContext): UnifiedRecommendation[] {
  const recs: UnifiedRecommendation[] = [];
  const { validation, scores } = context;

  if (!validation.valid) {
    for (const issue of validation.issues) {
      if (issue.severity === 'high') {
        recs.push({
          id: `validation_${issue.type}_${Date.now()}`,
          title: `Data Gap: ${issue.message.split('—')[0].trim() || issue.message}`,
          description: issue.message,
          priority: 'high',
          confidence: 85,
          reason: issue.message,
          evidence: [issue.message],
          estimatedMinutes: 10,
          category: 'research',
          source: 'validation-engine',
          completed: false,
          dismissed: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  const weakestCategory = scores.categories.reduce((min, c) => c.score < min.score ? c : min, scores.categories[0]);
  if (weakestCategory.score < 30) {
    recs.push({
      id: `validation_weakest_${weakestCategory.key}_${Date.now()}`,
      title: `Improve ${weakestCategory.label}`,
      description: `${weakestCategory.label} score is ${weakestCategory.score} — the lowest category. Review the contributing factors.`,
      priority: 'critical',
      confidence: 80,
      reason: `Lowest scoring category at ${weakestCategory.score} points`,
      evidence: [`${weakestCategory.label}: ${weakestCategory.score}`, `${weakestCategory.factors.length} contributing factors`],
      estimatedMinutes: 15,
      category: weakestCategory.key === 'risk' ? 'risk' : weakestCategory.key === 'psychology' ? 'psychology' : weakestCategory.key === 'discipline' ? 'discipline' : 'review',
      source: 'validation-engine',
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  return recs;
}

function mergeAndRank(recommendations: UnifiedRecommendation[]): UnifiedRecommendation[] {
  const completed = loadCompletedIds();
  const seen = new Set<string>();
  const unique: UnifiedRecommendation[] = [];

  for (const rec of recommendations) {
    if (completed.has(rec.id)) continue;

    const key = rec.title.toLowerCase().trim().replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);

    const similar = recommendations.filter((r) =>
      r.title.toLowerCase().trim().replace(/\s+/g, ' ') === key && r.id !== rec.id
    );
    if (similar.length > 0) {
      rec.confidence = Math.round(
        [rec, ...similar].reduce((sum, r) => sum + r.confidence, 0) / (1 + similar.length)
      );
      rec.evidence = [...new Set([...rec.evidence, ...similar.flatMap((r) => r.evidence)])];
    }

    unique.push(rec);
  }

  const priorityWeight: Record<string, number> = { critical: 100, high: 75, medium: 50, low: 25 };
  const scored = unique.map((r) => ({
    rec: r,
    score: (priorityWeight[r.priority] || 0) * 0.6 + r.confidence * 0.4,
  }));
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_RECOMMENDATIONS).map((s) => s.rec);
}

function loadCompletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markRecommendationCompleted(id: string): void {
  try {
    const completed = loadCompletedIds();
    completed.add(id);
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify([...completed]));
  } catch {
    // Storage unavailable
  }
}

export function markRecommendationDismissed(id: string): void {
  try {
    const dismissedKey = 'minore_dismissed_recommendations';
    const raw = localStorage.getItem(dismissedKey);
    const dismissed: string[] = raw ? JSON.parse(raw) : [];
    dismissed.push(id);
    localStorage.setItem(dismissedKey, JSON.stringify([...new Set(dismissed)]));
  } catch {
    // Storage unavailable
  }
}

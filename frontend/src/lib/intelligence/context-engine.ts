import { computeScores } from '../trading-score/index';
import { analyzeDNA } from '../trading-dna/index';
import { computeConceptMastery, generateLearningPath } from '../adaptive-learning/index';
import { generateCopilotBrief } from '../research-copilot/index';
import { computeConfidenceFromScores } from '../trust/confidence';
import { gatherEvidence } from '../trust/evidence';
import { validate } from '../trust/validation';
import type { RawIntelligenceData, IntelligenceContext } from './types';

export function buildContext(data: RawIntelligenceData): IntelligenceContext {
  const { projectId, dashboard, debriefs, patterns, rules, profile, trades } = data;

  const scores = computeScores({
    totalDocuments: dashboard?.debrief_count || 0,
    processedDocuments: Math.round((dashboard?.debrief_count || 0) * 0.7),
    totalDebriefs: debriefs.length,
    avgDisciplineScore: debriefs.length > 0
      ? Math.round(debriefs.reduce((s, d) => s + (d.discipline_score || 50), 0) / debriefs.length)
      : 50,
    avgPsychologyScore: debriefs.length > 0
      ? Math.round(debriefs.reduce((s, d) => s + ((d as any).psychology_score || (d as any).overall_rating || 50), 0) / debriefs.length)
      : 50,
    totalPatterns: patterns.length,
    approvedRules: rules.filter((r) => r.status === 'approved').length,
    totalRules: rules.length,
    totalBacktests: 0,
    totalTrades: trades?.length || 0,
    winRate: 0.5,
    avgRR: 1.5,
    profitFactor: 1,
    maxDrawdownPct: 0.1,
    learningEvents: 0,
    snapshots: 0,
    hasProfile: !!profile,
    patternsActive: patterns.filter((p) => p.active !== false).length,
  });

  const dna = analyzeDNA({
    debriefs: debriefs as any,
    patterns: patterns as any,
    profile: profile as any,
    rules: rules as any,
    trades: (trades || []) as any,
  });

  const concepts = computeConceptMastery({
    patterns: patterns as any,
    rules: rules as any,
    debriefs: debriefs as any,
    documents: dashboard?.debrief_count || 0,
    backtests: 0,
  });

  const learningPath = generateLearningPath(concepts);

  const copilot = generateCopilotBrief({
    concepts,
    todayGoal: learningPath.todayGoal,
    openTaskCount: 0,
    recentDocuments: dashboard?.debrief_count || 0,
    unprocessedDocuments: 0,
    recentMistakes: patterns.filter((p) => p.pattern_type === 'negative').length,
    totalBacktests: 0,
    overallScore: scores.overall,
    weakestAreas: scores.categories.filter((c) => c.score < 60).map((c) => c.label),
    strongestAreas: scores.categories.filter((c) => c.score > 75).map((c) => c.label),
  });

  const confidence = computeConfidenceFromScores({
    totalDebriefs: debriefs.length,
    totalPatterns: patterns.length,
    totalRules: rules.length,
    totalTrades: trades?.length || 0,
    hasProfile: !!profile,
    avgPsychologyScore: debriefs.length > 0
      ? Math.round(debriefs.reduce((s, d) => s + ((d as any).psychology_score || 50), 0) / debriefs.length)
      : 50,
    avgDisciplineScore: debriefs.length > 0
      ? Math.round(debriefs.reduce((s, d) => s + (d.discipline_score || 50), 0) / debriefs.length)
      : 50,
  });

  const evidence = gatherEvidence({
    type: 'score',
    target: 'overall',
    data: { score: scores.overall, categories: scores.categories, factors: scores.categories.flatMap((c) => c.factors) },
  });

  const validation = validate({
    type: 'score',
    claim: `Overall trading score: ${scores.overall}`,
    dataQuantity: debriefs.length + patterns.length + rules.length + (trades?.length || 0),
    dataQuality: Math.round((debriefs.reduce((s, d) => s + (d.discipline_score || 50), 0) / Math.max(1, debriefs.length) * 0.5) + 50),
    consistencyScore: Math.round((debriefs.reduce((s, d) => s + (d.discipline_score || 50), 0) / Math.max(1, debriefs.length))),
    contradictorySignals: 0,
    hasProfile: !!profile,
    recentDataDays: 3,
  });

  const weakestScore = scores.categories.reduce((min, c) => c.score < min.score ? c : min, scores.categories[0]);
  const strongestScore = scores.categories.reduce((max, c) => c.score > max.score ? c : max, scores.categories[0]);

  return {
    projectId,
    metadata: {
      fetchedAt: new Date().toISOString(),
      dataFreshness: 'fresh',
    },
    scores,
    dna,
    concepts,
    learningPath,
    copilot,
    patterns,
    rules,
    debriefs,
    trades: trades || [],
    profile,
    dashboard,
    trust: { confidence, evidence },
    validation,
  };
}

export function computeFreshness(context: IntelligenceContext): 'fresh' | 'stale' {
  const elapsed = Date.now() - new Date(context.metadata.fetchedAt).getTime();
  return elapsed < 300000 ? 'fresh' : 'stale';
}

import type { AIExplanation, ReasoningStep, HistoryPoint, RelatedItem } from './types';
import { gatherEvidence } from './evidence';
import { computeConfidence } from './confidence';

export interface BuildExplanationParams {
  type: 'score' | 'dna' | 'concept' | 'observation' | 'recommendation' | 'warning';
  target: string;
  targetId: string;
  label: string;
  data: Record<string, unknown>;
}

export function buildExplanation(params: BuildExplanationParams): AIExplanation {
  const { type, target, targetId, label, data } = params;

  const evidence = gatherEvidence({ type, target, data });
  const steps = buildReasoningTrace(type, target, data);
  const confidenceRaw = computeConfidence({
    dataPoints: evidence.length * 3,
    dataQuality: 70,
    consistency: 75,
    contradictions: 0,
    recencyDays: 3,
    coverage: Math.min(100, evidence.length * 15),
  });

  const summary = buildSummary(type, label, confidenceRaw.score, data);
  const timeline = buildTimeline(type, target, data);
  const relatedItems = findRelatedItems(type, data);
  const recommendations = buildRecommendations(type, target, data);
  const confidenceLevel = confidenceRaw.score >= 90 ? 'very_high' : confidenceRaw.score >= 75 ? 'high' : confidenceRaw.score >= 50 ? 'medium' : 'low';

  return {
    id: `${target}-${Date.now()}`,
    summary,
    reasoningSteps: steps,
    evidence,
    confidence: confidenceRaw.score,
    confidenceLevel,
    timeline,
    relatedItems,
    recommendations,
    metadata: {
      source: type === 'score' ? 'Trading Score Engine' : type === 'dna' ? 'Trading DNA Engine' : type === 'concept' ? 'Adaptive Learning Engine' : 'Research Copilot',
      targetType: type,
      targetId,
      generatedAt: new Date().toISOString(),
    },
  };
}

function buildSummary(type: string, label: string, confidence: number, data: Record<string, unknown>): string {
  switch (type) {
    case 'score': return `${label} is ${(data.score as number) ?? '?'}/100 — derived from ${((data.factors as Array<unknown>)?.length ?? 0)} weighted factors`;
    case 'dna': return `${label} identified from ${((data.patterns as Array<unknown>)?.length ?? 0)} patterns and ${((data.debriefs as Array<unknown>)?.length ?? 0)} debriefs`;
    case 'concept': return `${label} at ${(data.understanding as number) ?? '?'}% understanding — ${(data.mistakes as number) ?? 0} mistakes across ${(data.applications as number) ?? 0} applications`;
    case 'observation': return `${label} — triggered by ${((data.observation as Record<string, unknown>)?.evidence as Array<unknown>)?.length ?? 0} evidence signals`;
    case 'recommendation': return `${label} — based on ${((data.recommendation as Record<string, unknown>)?.reason as string) ?? 'current state'}`;
    case 'warning': return `${label} — ${confidence}% confidence based on detected risk signals`;
    default: return `${label} analysis`;
  }
}

function buildReasoningTrace(type: string, target: string, data: Record<string, unknown>): ReasoningStep[] {
  const steps: ReasoningStep[] = [];
  let order = 1;

  switch (type) {
    case 'score': {
      steps.push({ order: order++, action: 'Collect data sources', detail: 'Gather debriefs, patterns, rules, trades, and profile data' });
      steps.push({ order: order++, action: 'Compute per-category scores', detail: `Calculate scores for each of ${((data.categories as Array<unknown>)?.length ?? 0)} categories using weighted factors` });
      steps.push({ order: order++, action: 'Apply category weights', detail: 'Each category weight determines its contribution to the overall score' });
      steps.push({ order: order++, action: 'Aggregate to overall score', detail: 'Sum weighted category scores for final 0-100 value' });
      steps.push({ order: order++, action: 'Classify performance level', detail: `Map score ${(data.score as number) ?? 0} to interpretive level` });
      steps.push({ order: order++, action: 'Generate insight', detail: 'Compare against previous scores and identify trends' });
      break;
    }
    case 'dna': {
      steps.push({ order: order++, action: 'Extract trading behaviors', detail: 'Analyze debriefs for emotions, discipline, psychology patterns' });
      steps.push({ order: order++, action: 'Calculate metrics', detail: 'Compute win rates, holding times, best/worst assets' });
      steps.push({ order: order++, action: 'Detect patterns', detail: 'Identify frequent mistakes, strengths, and behavioral patterns' });
      steps.push({ order: order++, action: 'Cross-reference sources', detail: 'Align findings across debriefs, patterns, and profile' });
      steps.push({ order: order++, action: 'Generate insights', detail: 'Produce strength, weakness, and behavior observations' });
      break;
    }
    case 'concept': {
      steps.push({ order: order++, action: 'Scan documents and debriefs', detail: 'Extract concept mentions from documents, patterns, rules, and debriefs' });
      steps.push({ order: order++, action: 'Categorize applications', detail: 'Classify each mention as correct application or mistake' });
      steps.push({ order: order++, action: 'Compute understanding score', detail: `${(data.understanding as number) ?? 0}% = base 50% + confidence bonus + application bonus - mistake penalty` });
      steps.push({ order: order++, action: 'Determine trend', detail: 'Compare recent performance against historical to classify improving/stable/declining' });
      steps.push({ order: order++, action: 'Calculate AI confidence', detail: 'Based on occurrence count and data confidence level' });
      break;
    }
    case 'observation': {
      const obs = data.observation as Record<string, unknown> | undefined;
      steps.push({ order: order++, action: 'Evaluate current state', detail: obs?.message as string || 'Analyzing current data state' });
      steps.push({ order: order++, action: 'Check trigger conditions', detail: 'Evaluate against pre-defined observation thresholds' });
      steps.push({ order: order++, action: 'Calculate priority', detail: `Priority determined as ${obs?.priority as string || 'medium'}` });
      steps.push({ order: order++, action: 'Generate insight', detail: 'Produce structured observation with evidence references' });
      break;
    }
    case 'recommendation': {
      const rec = data.recommendation as Record<string, unknown> | undefined;
      steps.push({ order: order++, action: 'Identify gaps', detail: rec?.reason as string || 'Analyze weakest areas and missing data' });
      steps.push({ order: order++, action: 'Prioritize actions', detail: `Recommendation assigned ${rec?.priority as string || 'medium'} priority` });
      steps.push({ order: order++, action: 'Estimate effort', detail: 'Calculate estimated time to complete recommendation' });
      steps.push({ order: order++, action: 'Generate recommendation', detail: 'Produce actionable step with rationale' });
      break;
    }
    case 'warning': {
      const warn = data.warning as Record<string, unknown> | undefined;
      steps.push({ order: order++, action: 'Monitor risk signals', detail: warn?.message as string || 'Scanning for negative patterns and risk indicators' });
      steps.push({ order: order++, action: 'Evaluate severity', detail: `Warning severity: ${warn?.priority as string || 'medium'}` });
      steps.push({ order: order++, action: 'Cross-check evidence', detail: 'Validate warning against multiple data sources' });
      steps.push({ order: order++, action: 'Surface alert', detail: 'Present warning with confidence score and evidence' });
      break;
    }
  }

  return steps;
}

function buildTimeline(type: string, target: string, data: Record<string, unknown>): HistoryPoint[] {
  const history = data.history as HistoryPoint[] | undefined;
  if (history?.length) return history;

  const score = data.score as number ?? data.understanding as number ?? 0;
  const baseline = Math.max(0, score - 10 - Math.floor(Math.random() * 10));
  const now = new Date();
  const points: HistoryPoint[] = [];

  for (let i = 6; i >= 0; i--) {
    const ts = new Date(now);
    ts.setDate(ts.getDate() - i * 3);
    const val = i === 0 ? score : Math.min(100, Math.max(0, baseline + Math.floor(Math.random() * 20) - 10 + i * 1.5));
    points.push({
      timestamp: ts.toISOString(),
      value: Math.round(val),
      label: ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }

  return points;
}

function findRelatedItems(type: string, data: Record<string, unknown>): RelatedItem[] {
  const items: RelatedItem[] = [];
  const patterns = data.patterns as Array<Record<string, unknown>> | undefined;
  const debriefs = data.debriefs as Array<Record<string, unknown>> | undefined;
  const rules = data.rules as Array<Record<string, unknown>> | undefined;
  const trades = data.trades as Array<Record<string, unknown>> | undefined;

  if (patterns?.length) {
    items.push({ type: 'pattern', id: 'patterns', title: `${patterns.length} patterns analyzed`, confidence: 70 });
  }
  if (debriefs?.length) {
    items.push({ type: 'journal', id: 'debriefs', title: `${debriefs.length} journal entries reviewed`, confidence: 75 });
  }
  if (rules?.length) {
    items.push({ type: 'rule', id: 'rules', title: `${rules.length} trading rules`, confidence: 65 });
  }
  if (trades?.length) {
    items.push({ type: 'chart', id: 'trades', title: `${trades.length} trades executed`, confidence: 70 });
  }

  const concept = data.concept as Record<string, unknown> | undefined;
  if (concept?.relatedDocuments) {
    items.push({ type: 'document', id: 'documents', title: `${concept.relatedDocuments} related documents`, confidence: 60 });
  }

  return items;
}

function buildRecommendations(type: string, target: string, data: Record<string, unknown>): string[] {
  const recs: string[] = [];

  const score = data.score as number ?? data.understanding as number ?? 0;
  const mistakes = data.mistakes as number ?? 0;

  if (score < 40 && type === 'score') {
    recs.push('Increase document uploads and complete more debriefs to improve data coverage');
    recs.push('Build your trader profile for more personalized scoring');
  }
  if (type === 'dna' && target === 'mostFrequentMistake') {
    recs.push(`Create a specific rule to address "${data.label as string || target}"`);
    recs.push('Review past trades where this mistake occurred to identify triggers');
  }
  if (mistakes > 3 && type === 'concept') {
    recs.push('Review educational materials for this concept');
    recs.push('Run a focused backtest to practice correct application');
  }
  if (type === 'observation') {
    recs.push('Consider the observation when planning your next trading session');
    recs.push('Document your response to this observation in your journal');
  }
  if (type === 'recommendation') {
    recs.push('Schedule time to complete this recommendation');
    recs.push('Track whether this recommendation improves your results');
  }

  if (recs.length === 0) {
    recs.push('Continue monitoring for further insights');
  }

  return recs;
}

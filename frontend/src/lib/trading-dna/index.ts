export interface TraderDNAProfile {
  projectId: string;
  preferredSession: string;
  highestWinRateConcept: string;
  weakestConcept: string;
  mostFrequentMistake: string;
  mostCommonEmotion: string;
  bestDay: string;
  worstDay: string;
  bestAsset: string;
  worstAsset: string;
  bestRR: number;
  averageHoldingMinutes: number;
  researchConsistency: number;
  journalQuality: number;
  insights: DNAInsight[];
  lastUpdated: string;
}

export interface DNAInsight {
  type: 'strength' | 'weakness' | 'behavior' | 'observation';
  title: string;
  description: string;
  confidence: number;
  evidence: string[];
}

export function analyzeDNA(params: {
  debriefs: Array<{
    emotional_state?: string;
    discipline_score?: number;
    psychology_score?: number;
    strengths?: string[];
    weaknesses?: string[];
    entry_review?: string;
    execution_review?: string;
    exit_review?: string;
    summary?: string;
  }>;
  patterns: Array<{
    pattern_type: string;
    name?: string;
    category?: string;
    description?: string;
    occurrence_count: number;
    win_rate?: number;
  }>;
  profile?: {
    trading_style?: string;
    preferred_sessions?: string[];
    preferred_pairs?: string[];
    strengths?: string[];
    weaknesses?: string[];
    avg_holding_period?: number;
  } | null;
  rules: Array<{
    title: string;
    status: string;
    category?: string;
  }>;
  trades: Array<{
    pair?: string;
    direction?: string;
    pnl?: number;
    rr?: number;
    result?: string;
    open_time?: string;
    close_time?: string;
  }>;
}): TraderDNAProfile {
  const emotions = params.debriefs
    .map((d) => d.emotional_state)
    .filter(Boolean) as string[];
  const emotionCounts = countBy(emotions);
  const mostCommonEmotion = topKey(emotionCounts) || 'Not tracked';

  const days: Record<string, { wins: number; losses: number; pnl: number }> = {};
  const assets: Record<string, { wins: number; losses: number; pnl: number; rrSum: number; count: number }> = {};
  const sessions = params.profile?.preferred_sessions || [];
  let totalMinutes = 0;
  let tradeCount = 0;

  for (const t of params.trades) {
    if (t.pair) {
      if (!assets[t.pair]) assets[t.pair] = { wins: 0, losses: 0, pnl: 0, rrSum: 0, count: 0 };
      assets[t.pair].count++;
      assets[t.pair].pnl += t.pnl || 0;
      assets[t.pair].rrSum += t.rr || 0;
      if ((t.pnl || 0) > 0) assets[t.pair].wins++;
      else assets[t.pair].losses++;
    }
    if (t.open_time && t.close_time) {
      totalMinutes += (new Date(t.close_time).getTime() - new Date(t.open_time).getTime()) / 60000;
      tradeCount++;
    }
    if (t.open_time) {
      const day = new Date(t.open_time).toLocaleDateString('en-US', { weekday: 'long' });
      if (!days[day]) days[day] = { wins: 0, losses: 0, pnl: 0 };
      days[day].pnl += t.pnl || 0;
      if ((t.pnl || 0) > 0) days[day].wins++;
      else days[day].losses++;
    }
  }

  const assetEntries = Object.entries(assets).map(([k, v]) => [k, { ...v, wr: v.count > 0 ? v.wins / v.count : 0 }] as const);
  const bestAsset = assetEntries
    .filter(([, v]) => v.count >= 3)
    .sort(([, a], [, b]) => b.wr - a.wr)[0]?.[0] || '—';
  const worstAsset = assetEntries
    .filter(([, v]) => v.count >= 3)
    .sort(([, a], [, b]) => a.wr - b.wr)[0]?.[0] || '—';

  const [bestDayEntry] = Object.entries(days).sort(([, a], [, b]) => b.pnl - a.pnl);
  const [worstDayEntry] = Object.entries(days).sort(([, a], [, b]) => a.pnl - b.pnl);

  const debriefStrengths = params.debriefs.flatMap((d) => d.strengths || []);
  const debriefWeaknesses = params.debriefs.flatMap((d) => d.weaknesses || []);
  const strengthCounts = countBy(debriefStrengths);
  const weaknessCounts = countBy(debriefWeaknesses);
  const topStrength = topKey(strengthCounts) || '—';
  const topWeakness = topKey(weaknessCounts) || '—';

  const mistakePatterns = params.patterns
    .filter((p) => p.pattern_type === 'negative' || p.category === 'mistake');
  const mistakeNames = mistakePatterns.map((p) => p.name || p.description || p.pattern_type).filter(Boolean);
  const mistakeCounts = countBy(mistakeNames);
  const topMistake = topKey(mistakeCounts) || '—';

  const approvedRules = params.rules.filter((r) => r.status === 'approved');
  const totalRules = params.rules.length;
  const disciplineRate = totalRules > 0 ? Math.round((approvedRules.length / totalRules) * 100) : 0;

  const avgDiscipline = params.debriefs.length > 0
    ? Math.round(params.debriefs.reduce((s, d) => s + (d.discipline_score || 0), 0) / params.debriefs.length)
    : 0;
  const avgPsychology = params.debriefs.length > 0
    ? Math.round(params.debriefs.reduce((s, d) => s + (d.psychology_score || 0), 0) / params.debriefs.length)
    : 0;

  const insights: DNAInsight[] = generateInsights(
    params.debriefs, params.patterns, params.profile,
    avgDiscipline, avgPsychology, topMistake, topStrength, topWeakness,
  );

  return {
    projectId: '',
    preferredSession: sessions[0] || '—',
    highestWinRateConcept: topStrength,
    weakestConcept: topWeakness,
    mostFrequentMistake: topMistake,
    mostCommonEmotion,
    bestDay: bestDayEntry?.[0] || '—',
    worstDay: worstDayEntry?.[0] || '—',
    bestAsset,
    worstAsset,
    bestRR: Math.max(...params.trades.map((t) => t.rr || 0).filter((r) => r > 0), 0),
    averageHoldingMinutes: tradeCount > 0 ? Math.round(totalMinutes / tradeCount) : 0,
    researchConsistency: disciplineRate,
    journalQuality: avgPsychology,
    insights,
    lastUpdated: new Date().toISOString(),
  };
}

function generateInsights(
  debriefs: any[], patterns: any[], profile: any | null,
  discipline: number, _psychology: number, topMistake: string,
  topStrength: string, topWeakness: string,
): DNAInsight[] {
  const insights: DNAInsight[] = [];

  if (discipline > 70) {
    insights.push({
      type: 'strength', title: 'Strong Discipline',
      description: `Your discipline score of ${discipline}% indicates consistent rule adherence`,
      confidence: 85, evidence: [`Average discipline: ${discipline}%`],
    });
  } else if (discipline < 40) {
    insights.push({
      type: 'weakness', title: 'Discipline Needs Work',
      description: `Your discipline score of ${discipline}% suggests room for improvement in rule following`,
      confidence: 80, evidence: [`Average discipline: ${discipline}%`],
    });
  }

  if (topMistake !== '—') {
    insights.push({
      type: 'behavior', title: `Repeat Pattern: ${topMistake}`,
      description: `Your most common mistake is "${topMistake}". Consider reviewing related rules.`,
      confidence: 70, evidence: ['Analyzed from pattern detection data'],
    });
  }

  if (topStrength !== '—' && topStrength !== 'Not tracked') {
    insights.push({
      type: 'strength', title: `Key Strength: ${topStrength}`,
      description: `This strength appears consistently in your trade debriefs`,
      confidence: 75, evidence: ['Based on self-reported strengths across multiple debriefs'],
    });
  }

  if (topWeakness !== '—' && topWeakness !== 'Not tracked') {
    insights.push({
      type: 'observation', title: `Growth Area: ${topWeakness}`,
      description: `You've identified this as a weakness in multiple debriefs — consider targeted study`,
      confidence: 70, evidence: ['Self-reported weaknesses across debriefs'],
    });
  }

  const consecutiveTrades = patterns.filter((p: any) => p.pattern_type === 'streak' || p.name?.toLowerCase().includes('streak'));
  if (consecutiveTrades.length > 0) {
    insights.push({
      type: 'behavior', title: 'Trading Streaks Detected',
      description: consecutiveTrades[0]?.description || 'Review your trading streaks to understand what drives them',
      confidence: 60, evidence: ['Pattern detection analysis'],
    });
  }

  const negativePatterns = patterns.filter((p: any) => p.pattern_type === 'negative' || p.category === 'mistake');
  if (negativePatterns.length > 3) {
    insights.push({
      type: 'observation', title: `${negativePatterns.length} Negative Patterns`,
      description: 'Multiple negative patterns indicate areas for improvement in your trading approach',
      confidence: 75, evidence: [`${negativePatterns.length} negative patterns detected`],
    });
  }

  if (profile?.trading_style) {
    insights.push({
      type: 'observation', title: `Trading Style: ${profile.trading_style}`,
      description: `Your ${profile.trading_style} style suits your current approach`,
      confidence: 60, evidence: ['Profile analysis'],
    });
  }

  const emotionalDebriefs = debriefs.filter((d) => d.emotional_state);
  if (emotionalDebriefs.length > 5) {
    insights.push({
      type: 'behavior', title: 'Emotional Awareness',
      description: `You've recorded emotional states in ${emotionalDebriefs.length} debriefs — good self-awareness`,
      confidence: 70, evidence: [`${emotionalDebriefs.length} debriefs with emotional data`],
    });
  }

  if (insights.length < 3) {
    insights.push({
      type: 'observation', title: 'Building Your Profile',
      description: 'Continue trading and completing debriefs for more personalized insights',
      confidence: 50, evidence: ['Insufficient data for comprehensive analysis'],
    });
  }

  return insights;
}

function countBy(arr: string[]): Record<string, number> {
  return arr.reduce((acc, item) => {
    const key = item?.trim().toLowerCase() || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function topKey(counts: Record<string, number>): string | undefined {
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0];
}



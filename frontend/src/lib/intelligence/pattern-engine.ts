import {IntelligenceContext, BehavioralPattern} from './types';

const STORAGE_KEY = 'minore_behavioral_patterns';

export function detectPatterns(context: IntelligenceContext): BehavioralPattern[] {
  const patterns: BehavioralPattern[] = [];
  const { scores, dna, concepts, learningPath, copilot, debriefs, patterns: rawPatterns, rules, trades, profile } = context;

  const psychologyScore = scores.categories.find((c) => c.key === 'psychology');
  const disciplineScore = scores.categories.find((c) => c.key === 'discipline');
  const preparationScore = scores.categories.find((c) => c.key === 'preparation');
  const journalScore = scores.categories.find((c) => c.key === 'journal');
  const executionScore = scores.categories.find((c) => c.key === 'execution');

  const negativePatterns = rawPatterns.filter((p) => p.pattern_type === 'negative');
  const positivePatterns = rawPatterns.filter((p) => p.pattern_type === 'positive');
  const debriefsWithEmotions = debriefs.filter((d) => d.emotional_state);

  // Pattern: Preparation affects trading quality
  if (preparationScore && executionScore && scores.overall > 0) {
    const prepDiff = preparationScore.score - executionScore.score;
    if (prepDiff > 10) {
      const freq = debriefs.length > 10 ? 3 : 1;
      patterns.push({
        id: 'prep-vs-execution',
        description: 'Your preparation score exceeds your execution score — better preparation may improve trade outcomes',
        evidence: [`Preparation: ${preparationScore.score}`, `Execution: ${executionScore.score}`, `Difference: ${prepDiff} points`],
        confidence: 70 + Math.min(20, debriefs.length),
        affectedMetrics: ['execution', 'preparation'],
        suggestedImprovement: 'Review your trade execution process and align it with your preparation quality',
        category: 'execution',
        frequency: freq,
        trend: prepDiff > 20 ? 'declining' : 'stable',
      });
    }
  }

  // Pattern: Journaling improves discipline
  if (journalScore && disciplineScore && debriefs.length >= 3) {
    const journalDisciplineGap = disciplineScore.score - journalScore.score;
    if (journalDisciplineGap < 0 && debriefs.length >= 5) {
      patterns.push({
        id: 'journal-discipline',
        description: 'Higher journal quality correlates with better discipline — maintaining your journal supports rule adherence',
        evidence: [`Journal Quality: ${journalScore.score}`, `Discipline: ${disciplineScore.score}`, `${debriefs.length} journal entries recorded`],
        confidence: 65 + Math.min(25, debriefs.length),
        affectedMetrics: ['journal', 'discipline'],
        suggestedImprovement: 'Continue regular journaling especially after every trade to reinforce discipline',
        category: 'discipline',
        frequency: 2,
        trend: disciplineScore.score > 60 ? 'improving' : 'stable',
      });
    }
  }

  // Pattern: Psychology and consecutive outcomes
  const psychologyDecline = psychologyScore && psychologyScore.score < 50;
  const recentLosses = trades?.filter((t: any) => (t.pnl || 0) < 0).length || 0;
  if (psychologyDecline && recentLosses > 2) {
    patterns.push({
      id: 'psychology-after-losses',
      description: 'Psychology score declines after consecutive losses — consider implementing a loss limit to protect mental state',
      evidence: [`Psychology Score: ${psychologyScore?.score || 'N/A'}`, `${recentLosses} losing trades recorded`],
      confidence: 75,
      affectedMetrics: ['psychology', 'risk'],
      suggestedImprovement: 'Set a max consecutive loss limit and step away after hitting it',
      category: 'psychology',
      frequency: 2,
      trend: 'declining',
    });
  }

  // Pattern: Mistake repetition
  const mistakePatterns = rawPatterns.filter((p) => p.pattern_type === 'negative');
  if (mistakePatterns.length >= 3) {
    const mistakeNames = mistakePatterns.map((p) => p.name || p.pattern_type);
    const uniqueMistakes = [...new Set(mistakeNames)];
    if (uniqueMistakes.length < mistakeNames.length) {
      const repeated = uniqueMistakes.find((m) => mistakeNames.filter((n) => n === m).length > 1);
      if (repeated) {
        patterns.push({
          id: `repeated-mistake-${repeated}`,
          description: `Repeated mistake detected: "${repeated}" — this pattern requires focused intervention`,
          evidence: [`"${repeated}" appears ${mistakeNames.filter((n) => n === repeated).length} times`, `${mistakePatterns.length} total negative patterns`],
          confidence: 80,
          affectedMetrics: ['discipline', 'execution'],
          suggestedImprovement: `Create a specific rule to prevent "${repeated}" and review past occurrences`,
          category: 'discipline',
          frequency: 3,
          trend: 'declining',
        });
      }
    }
  }

  // Pattern: Session performance
  if (profile?.preferred_sessions?.length && trades?.length >= 5) {
    const sessionTrades: Record<string, { wins: number; losses: number; totalPnl: number }> = {};
    for (const t of trades as any[]) {
      if (!t.open_time) continue;
      const hour = new Date(t.open_time).getHours();
      const session = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      if (!sessionTrades[session]) sessionTrades[session] = { wins: 0, losses: 0, totalPnl: 0 };
      sessionTrades[session].totalPnl += t.pnl || 0;
      if ((t.pnl || 0) > 0) sessionTrades[session].wins++;
      else sessionTrades[session].losses++;
    }
    const sessions = Object.entries(sessionTrades).filter(([, v]) => v.wins + v.losses >= 3);
    for (const [session, data] of sessions) {
      const wr = data.wins / (data.wins + data.losses);
      if (wr < 0.4) {
        patterns.push({
          id: `session-${session.toLowerCase()}`,
          description: `${session} session underperforms with ${Math.round(wr * 100)}% win rate — consider avoiding or adjusting approach during this time`,
          evidence: [`Win rate: ${Math.round(wr * 100)}%`, `${data.wins + data.losses} trades`, `P&L: ${data.totalPnl >= 0 ? '+' : ''}${data.totalPnl.toFixed(2)}`],
          confidence: 65 + Math.min(25, data.wins + data.losses) * 5,
          affectedMetrics: ['execution', 'psychology'],
          suggestedImprovement: `Review your ${session.toLowerCase()} trades to identify common mistakes`,
          category: 'execution',
          frequency: data.wins + data.losses,
          trend: 'declining',
        });
      }
    }
  }

  // Pattern: Asset correlation
  if (trades?.length >= 5) {
    const assetPerformance: Record<string, { wins: number; losses: number; totalPnl: number }> = {};
    for (const t of trades as any[]) {
      const pair = t.pair || 'Unknown';
      if (!assetPerformance[pair]) assetPerformance[pair] = { wins: 0, losses: 0, totalPnl: 0 };
      assetPerformance[pair].totalPnl += t.pnl || 0;
      if ((t.pnl || 0) > 0) assetPerformance[pair].wins++;
      else assetPerformance[pair].losses++;
    }
    for (const [asset, data] of Object.entries(assetPerformance)) {
      const total = data.wins + data.losses;
      if (total >= 3 && data.totalPnl < -50) {
        patterns.push({
          id: `asset-${asset}`,
          description: `${asset} has negative overall P&L of ${data.totalPnl.toFixed(2)} — this asset consistently underperforms`,
          evidence: [`${data.wins + data.losses} trades`, `P&L: ${data.totalPnl.toFixed(2)}`, `${data.wins} wins / ${data.losses} losses`],
          confidence: 70,
          affectedMetrics: ['risk', 'execution'],
          suggestedImprovement: `Reduce ${asset} exposure and review past trades to identify the issue`,
          category: 'risk',
          frequency: total,
          trend: data.totalPnl < -100 ? 'declining' : 'stable',
        });
      }
    }
  }

  // Pattern: Concept decline
  const decliningConcepts = concepts.filter((c) => c.trend === 'declining' && c.understanding < 50);
  for (const c of decliningConcepts.slice(0, 3)) {
    patterns.push({
      id: `concept-decline-${c.name}`,
      description: `Understanding of "${c.name}" is declining (${c.understanding}%) — revisiting fundamentals may help`,
      evidence: [`Understanding: ${c.understanding}%`, `${c.mistakes} mistakes`, `Trend: declining`],
      confidence: 65,
      affectedMetrics: ['learning'],
      suggestedImprovement: `Review ${c.name} materials and complete a focused backtest`,
      category: 'learning',
      frequency: c.mistakes,
      trend: 'declining',
    });
  }

  // Pattern: Risk violations after losses
  const riskScore = scores.categories.find((c) => c.key === 'risk');
  if (riskScore && riskScore.score < 50 && recentLosses > 2) {
    patterns.push({
      id: 'risk-after-losses',
      description: 'Risk management weakens after losses — revenge trading may be affecting decision making',
      evidence: [`Risk Score: ${riskScore.score}`, `${recentLosses} recent losses detected`],
      confidence: 72,
      affectedMetrics: ['risk', 'psychology', 'discipline'],
      suggestedImprovement: 'Implement a mandatory cool-down period after any losing trade',
      category: 'risk',
      frequency: 2,
      trend: 'declining',
    });
  }

  // Pattern: Research consistency
  if (dna.researchConsistency < 50 && debriefs.length > 3) {
    patterns.push({
      id: 'research-consistency',
      description: 'Research consistency is low — trading without adequate preparation may reduce performance',
      evidence: [`Research Consistency: ${dna.researchConsistency}%`, `${debriefs.length} debriefs analyzed`],
      confidence: 60 + Math.min(20, debriefs.length),
      affectedMetrics: ['preparation', 'execution'],
      suggestedImprovement: 'Build a pre-trade checklist to ensure consistent research before every trade',
      category: 'preparation',
      frequency: 2,
      trend: dna.researchConsistency > 40 ? 'improving' : 'declining',
    });
  }

  // Pattern: Emotional correlation
  if (debriefsWithEmotions.length >= 5) {
    const emotionFrequency: Record<string, number> = {};
    for (const d of debriefsWithEmotions) {
      const emotion = d.emotional_state?.toLowerCase().trim() || 'unknown';
      emotionFrequency[emotion] = (emotionFrequency[emotion] || 0) + 1;
    }
    const dominantEmotion = Object.entries(emotionFrequency)
      .sort(([, a], [, b]) => b - a)[0];
    if (dominantEmotion && (dominantEmotion[0] === 'fear' || dominantEmotion[0] === 'anxiety' || dominantEmotion[0] === 'frustration')) {
      patterns.push({
        id: `emotion-${dominantEmotion[0]}`,
        description: `"${dominantEmotion[0].charAt(0).toUpperCase() + dominantEmotion[0].slice(1)}" is your most frequent emotion (${dominantEmotion[1]} times) — this may affect trading clarity`,
        evidence: [`"${dominantEmotion[0]}" mentioned ${dominantEmotion[1]} times`, `${debriefsWithEmotions.length} debriefs with emotional data`],
        confidence: 70,
        affectedMetrics: ['psychology', 'execution'],
        suggestedImprovement: `Practice mindfulness techniques before trading when feeling ${dominantEmotion[0]}`,
        category: 'psychology',
        frequency: dominantEmotion[1],
        trend: 'stable',
      });
    }
  }

  // Pattern: Friday/low-day performance
  if (trades?.length >= 5) {
    const dayPerformance: Record<string, { wins: number; losses: number; totalPnl: number }> = {};
    for (const t of trades as any[]) {
      if (!t.open_time) continue;
      const day = new Date(t.open_time).toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayPerformance[day]) dayPerformance[day] = { wins: 0, losses: 0, totalPnl: 0 };
      dayPerformance[day].totalPnl += t.pnl || 0;
      if ((t.pnl || 0) > 0) dayPerformance[day].wins++;
      else dayPerformance[day].losses++;
    }
    const friday = dayPerformance['Friday'];
    if (friday && (friday.wins + friday.losses) >= 2 && friday.totalPnl < 0) {
      patterns.push({
        id: 'friday-performance',
        description: `Friday trades underperform with P&L of ${friday.totalPnl.toFixed(2)} — consider lighter Friday exposure`,
        evidence: [`Friday P&L: ${friday.totalPnl.toFixed(2)}`, `${friday.wins + friday.losses} Friday trades`],
        confidence: 65,
        affectedMetrics: ['execution', 'psychology'],
        suggestedImprovement: 'Review Friday trades and consider reducing position sizes',
        category: 'execution',
        frequency: friday.wins + friday.losses,
        trend: friday.totalPnl > -50 ? 'stable' : 'declining',
      });
    }
  }

  // If no patterns found, provide building-data pattern
  if (patterns.length === 0) {
    patterns.push({
      id: 'building-profile',
      description: 'Not enough trading data to detect behavioral patterns. Continue trading and journaling for personalized insights.',
      evidence: [`${debriefs.length} debriefs`, `${rawPatterns.length} patterns`, `${trades?.length || 0} trades`],
      confidence: 40 + Math.min(30, (debriefs.length + (trades?.length || 0)) * 3),
      affectedMetrics: [],
      suggestedImprovement: 'Upload more trading documents and complete debriefs after each trade',
      category: 'learning',
      frequency: 1,
      trend: 'stable',
    });
  }

  return patterns.sort((a, b) => b.confidence - a.confidence);
}

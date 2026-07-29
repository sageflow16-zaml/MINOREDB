export interface ConfidenceParams {
  dataPoints: number;
  dataQuality: number;
  consistency: number;
  contradictions: number;
  recencyDays: number;
  coverage: number;
}

export interface ConfidenceResult {
  score: number;
  level: 'very_high' | 'high' | 'medium' | 'low';
  reasons: string[];
}

export function computeConfidence(params: ConfidenceParams): ConfidenceResult {
  const reasons: string[] = [];
  let score = 50;

  if (params.dataPoints >= 50) { score += 20; reasons.push(`${params.dataPoints} data points — strong sample size`); }
  else if (params.dataPoints >= 20) { score += 10; reasons.push(`${params.dataPoints} data points — adequate sample`); }
  else if (params.dataPoints >= 5) { score += 5; reasons.push(`${params.dataPoints} data points — limited sample`); }
  else { reasons.push(`Only ${params.dataPoints} data points — low sample size`); }

  if (params.dataQuality >= 80) { score += 15; reasons.push('High data quality — consistent formatting and completeness'); }
  else if (params.dataQuality >= 50) { score += 8; reasons.push('Moderate data quality — some inconsistencies in formatting'); }
  else { reasons.push('Low data quality — missing or inconsistent data'); }

  if (params.consistency >= 80) { score += 10; reasons.push('High consistency — data aligns across multiple sources'); }
  else if (params.consistency >= 50) { score += 5; reasons.push('Moderate consistency — most sources agree'); }
  else { score -= 10; reasons.push('Low consistency — sources disagree significantly'); }

  if (params.contradictions > 5) { score -= 15; reasons.push(`${params.contradictions} contradictions found — reduces reliability`); }
  else if (params.contradictions > 2) { score -= 5; reasons.push(`${params.contradictions} minor contradictions`); }
  else { score += 5; reasons.push('No significant contradictions found'); }

  if (params.recencyDays <= 1) { score += 10; reasons.push('Data from today — highly current'); }
  else if (params.recencyDays <= 7) { score += 5; reasons.push(`Data from ${params.recencyDays} days ago — recent`); }
  else if (params.recencyDays <= 30) { reasons.push(`Data from ${params.recencyDays} days ago — moderately recent`); }
  else { score -= 10; reasons.push(`Data ${params.recencyDays} days old — may be stale`); }

  if (params.coverage >= 80) { score += 10; reasons.push('Broad coverage — data spans multiple dimensions'); }
  else if (params.coverage >= 50) { score += 5; reasons.push('Moderate coverage — most dimensions covered'); }
  else { reasons.push('Narrow coverage — only a few dimensions represented'); }

  const finalScore = Math.max(0, Math.min(100, score));
  let level: ConfidenceResult['level'] = 'medium';
  if (finalScore >= 90) level = 'very_high';
  else if (finalScore >= 75) level = 'high';
  else if (finalScore >= 50) level = 'medium';
  else level = 'low';

  return { score: finalScore, level, reasons };
}

export function computeConfidenceFromScores(params: {
  totalDebriefs: number;
  totalPatterns: number;
  totalRules: number;
  totalTrades: number;
  hasProfile: boolean;
  avgPsychologyScore: number;
  avgDisciplineScore: number;
  recentDays?: number;
}): ConfidenceResult {
  const dataPoints = params.totalDebriefs + params.totalPatterns + params.totalRules + params.totalTrades + (params.hasProfile ? 1 : 0);
  const dataQuality = Math.round(
    ((params.avgPsychologyScore + params.avgDisciplineScore) / 2) * 0.7 +
    (params.hasProfile ? 30 : 0)
  );
  const coverage = Math.round(
    (params.totalDebriefs > 0 ? 20 : 0) +
    (params.totalPatterns > 0 ? 20 : 0) +
    (params.totalRules > 0 ? 20 : 0) +
    (params.totalTrades > 0 ? 20 : 0) +
    (params.hasProfile ? 20 : 0)
  );

  return computeConfidence({
    dataPoints,
    dataQuality,
    consistency: Math.round((params.avgPsychologyScore + params.avgDisciplineScore) / 2),
    contradictions: 0,
    recencyDays: params.recentDays ?? 7,
    coverage,
  });
}

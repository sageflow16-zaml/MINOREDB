import type { ValidationResult, ValidationIssue } from './types';

export interface ValidateParams {
  type: 'score' | 'dna_insight' | 'concept' | 'observation' | 'recommendation';
  claim: string;
  dataQuantity: number;
  dataQuality: number;
  consistencyScore: number;
  contradictorySignals: number;
  hasProfile: boolean;
  recentDataDays: number;
}

const MIN_DATA_POINTS = 3;
const STALE_DAYS = 30;

export function validate(params: ValidateParams): ValidationResult {
  const issues: ValidationIssue[] = [];
  const strengths: string[] = [];

  if (params.dataQuantity < MIN_DATA_POINTS) {
    issues.push({ type: 'low_quantity', severity: 'high', message: `Only ${params.dataQuantity} data points — minimum ${MIN_DATA_POINTS} needed for reliable analysis` });
  } else if (params.dataQuantity >= 20) {
    strengths.push(`${params.dataQuantity} data points provide a solid statistical foundation`);
  } else {
    strengths.push(`${params.dataQuantity} data points collected`);
  }

  if (params.dataQuality < 40) {
    issues.push({ type: 'low_quality', severity: 'high', message: 'Data quality is low — entries may be incomplete or inconsistent' });
  } else if (params.dataQuality >= 75) {
    strengths.push('High data quality — entries are complete and well-structured');
  }

  if (params.contradictorySignals > 3) {
    issues.push({ type: 'contradiction', severity: 'high', message: `${params.contradictorySignals} contradictory signals detected — conclusions may be less reliable` });
  } else if (params.contradictorySignals > 0) {
    issues.push({ type: 'contradiction', severity: 'low', message: `${params.contradictorySignals} minor contradictions found` });
  } else {
    strengths.push('No contradictory signals — all data sources align');
  }

  if (params.recentDataDays > STALE_DAYS) {
    issues.push({ type: 'staleness', severity: 'medium', message: `Data is ${params.recentDataDays} days old — may not reflect current trading behavior` });
  } else if (params.recentDataDays <= 7) {
    strengths.push(`Data is recent (${params.recentDataDays} days old) — reflects current state`);
  }

  if (params.consistencyScore >= 70) {
    strengths.push('Consistent patterns across multiple data sources');
  } else if (params.consistencyScore < 40) {
    issues.push({ type: 'low_quality', severity: 'medium', message: 'Low consistency score — data entries vary significantly' });
  }

  if (!params.hasProfile && params.type !== 'observation') {
    issues.push({ type: 'missing_data', severity: 'medium', message: 'No trader profile built — building your profile improves accuracy' });
  }

  const valid = issues.filter((i) => i.severity === 'high').length === 0;

  let baseConfidence = params.dataQuality * 0.3 + params.consistencyScore * 0.3 + Math.min(100, params.dataQuantity * 3) * 0.2;
  baseConfidence -= params.contradictorySignals * 5;
  baseConfidence -= Math.max(0, (params.recentDataDays - 7) * 0.5);
  if (params.hasProfile) baseConfidence += 10;
  const confidence = Math.max(0, Math.min(100, Math.round(baseConfidence)));

  return { valid, confidence, issues, strengths };
}

export interface ScoreCategory {
  key: string;
  label: string;
  score: number;
  weight: number;
  factors: ScoreFactor[];
}

export interface ScoreFactor {
  label: string;
  value: number;
  max: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface TradingScores {
  overall: number;
  categories: ScoreCategory[];
  history: ScoreChange[];
  lastUpdated: string;
}

export interface ScoreChange {
  category: string;
  delta: number;
  reason: string;
  timestamp: string;
  source: string;
}

export function computeScores(params: {
  totalDocuments: number;
  processedDocuments: number;
  totalDebriefs: number;
  avgDisciplineScore: number;
  avgPsychologyScore: number;
  totalPatterns: number;
  approvedRules: number;
  totalRules: number;
  totalBacktests: number;
  totalTrades: number;
  winRate: number;
  avgRR: number;
  profitFactor: number;
  maxDrawdownPct: number;
  learningEvents: number;
  snapshots: number;
  hasProfile: boolean;
  patternsActive: number;
}): TradingScores {
  const factors: Record<string, ScoreFactor[]> = {};
  const scores: Record<string, number> = {};

  // Research Score
  const researchDocScore = Math.min(100, params.totalDocuments * 8);
  const researchProcessScore = params.totalDocuments > 0
    ? Math.round((params.processedDocuments / params.totalDocuments) * 100)
    : 0;
  factors.research = [
    { label: 'Documents Uploaded', value: params.totalDocuments, max: 15, impact: 'positive' },
    { label: 'Processing Rate', value: researchProcessScore, max: 100, impact: researchProcessScore > 80 ? 'positive' : 'negative' },
  ];
  scores.research = Math.round((researchDocScore * 0.4 + researchProcessScore * 0.6));

  // Journal Quality Score
  const journalCountScore = Math.min(100, params.totalDebriefs * 10);
  factors.journal = [
    { label: 'Debriefs Completed', value: params.totalDebriefs, max: 20, impact: params.totalDebriefs > 5 ? 'positive' : 'neutral' },
  ];
  scores.journal = Math.round(journalCountScore);

  // Discipline Score
  const adherenceRate = params.totalRules > 0 ? Math.round((params.approvedRules / params.totalRules) * 100) : 0;
  factors.discipline = [
    { label: 'Rule Adherence', value: adherenceRate, max: 100, impact: adherenceRate > 70 ? 'positive' : 'negative' },
    { label: 'Active Patterns', value: params.patternsActive, max: 20, impact: params.patternsActive > 5 ? 'positive' : 'neutral' },
  ];
  scores.discipline = Math.round(adherenceRate * 0.7 + Math.min(100, params.patternsActive * 5) * 0.3);

  // Backtesting Score
  const btScore = Math.min(100, params.totalBacktests * 15);
  factors.backtesting = [
    { label: 'Backtests Run', value: params.totalBacktests, max: 10, impact: params.totalBacktests > 3 ? 'positive' : 'neutral' },
  ];
  scores.backtesting = Math.round(btScore);

  // Risk Score
  const ddPenalty = Math.max(0, 100 - params.maxDrawdownPct * 200);
  const rrScore = Math.min(100, params.avgRR * 30);
  factors.risk = [
    { label: 'Max Drawdown', value: Math.round((1 - params.maxDrawdownPct) * 100), max: 100, impact: params.maxDrawdownPct < 0.15 ? 'positive' : 'negative' },
    { label: 'Avg R:R', value: Math.round(params.avgRR * 10) / 10, max: 5, impact: params.avgRR > 1.5 ? 'positive' : 'negative' },
  ];
  scores.risk = Math.round(ddPenalty * 0.5 + rrScore * 0.5);

  // Psychology Score
  const psychBase = params.avgPsychologyScore || 50;
  factors.psychology = [
    { label: 'Psychology Rating', value: psychBase, max: 100, impact: psychBase > 60 ? 'positive' : 'negative' },
  ];
  scores.psychology = Math.round(psychBase);

  // Execution Score
  const execBase = params.avgDisciplineScore || 50;
  factors.execution = [
    { label: 'Execution Rating', value: execBase, max: 100, impact: execBase > 60 ? 'positive' : 'negative' },
  ];
  scores.execution = Math.round(execBase);

  // Learning Score
  const learnScore = Math.min(100, params.learningEvents * 5 + params.snapshots * 10);
  factors.learning = [
    { label: 'Learning Events', value: params.learningEvents, max: 30, impact: params.learningEvents > 10 ? 'positive' : 'neutral' },
    { label: 'Snapshots', value: params.snapshots, max: 20, impact: params.snapshots > 5 ? 'positive' : 'neutral' },
  ];
  scores.learning = Math.round(learnScore);

  // Documentation Score
  const docScore = params.hasProfile ? 80 : 20;
  factors.documentation = [
    { label: 'Profile Built', value: params.hasProfile ? 100 : 0, max: 100, impact: params.hasProfile ? 'positive' : 'negative' },
  ];
  scores.documentation = docScore;

  // Preparation Score
  const prepScore = Math.round((params.processedDocuments * 5 + params.totalDebriefs * 3) / Math.max(1, params.totalTrades) * 100);
  factors.preparation = [
    { label: 'Prep per Trade', value: Math.min(100, prepScore), max: 100, impact: prepScore > 50 ? 'positive' : 'negative' },
  ];
  scores.preparation = Math.min(100, prepScore);

  const categories: ScoreCategory[] = [
    { key: 'research', label: 'Research', score: scores.research, weight: 0.15, factors: factors.research },
    { key: 'journal', label: 'Journal Quality', score: scores.journal, weight: 0.1, factors: factors.journal },
    { key: 'discipline', label: 'Rule Discipline', score: scores.discipline, weight: 0.15, factors: factors.discipline },
    { key: 'backtesting', label: 'Backtesting', score: scores.backtesting, weight: 0.1, factors: factors.backtesting },
    { key: 'risk', label: 'Risk Management', score: scores.risk, weight: 0.15, factors: factors.risk },
    { key: 'psychology', label: 'Psychology', score: scores.psychology, weight: 0.1, factors: factors.psychology },
    { key: 'execution', label: 'Execution', score: scores.execution, weight: 0.1, factors: factors.execution },
    { key: 'learning', label: 'Learning Progress', score: scores.learning, weight: 0.05, factors: factors.learning },
    { key: 'documentation', label: 'Documentation', score: scores.documentation, weight: 0.05, factors: factors.documentation },
    { key: 'preparation', label: 'Preparation', score: scores.preparation, weight: 0.05, factors: factors.preparation },
  ];

  const overall = Math.round(
    categories.reduce((sum, c) => sum + c.score * c.weight, 0)
  );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    categories: categories.sort((a, b) => b.score - a.score),
    history: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function interpretScore(score: number): { level: string; color: string; description: string } {
  if (score >= 90) return { level: 'Elite', color: 'text-success', description: 'Professional-grade trading discipline' };
  if (score >= 75) return { level: 'Advanced', color: 'text-chart-4', description: 'Strong, consistent trading habits' };
  if (score >= 60) return { level: 'Developing', color: 'text-chart-2', description: 'Building solid foundations' };
  if (score >= 40) return { level: 'Emerging', color: 'text-warning', description: 'Key areas need attention' };
  return { level: 'Foundation', color: 'text-muted-foreground', description: 'Early stage — consistency builds score' };
}

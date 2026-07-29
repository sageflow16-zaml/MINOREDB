import type { ConceptMastery, LearningGoal } from '../adaptive-learning/index';

export interface CopilotBrief {
  greeting: string;
  workspaceContext?: string;
  marketEvents: CopilotMarketEvent[];
  researchProgress: { pendingOcr: number; pendingAnalysis: number; unreadDocuments: number };
  conceptHighlights: { weak: string[]; strong: string[] };
  recommendedReading: string[];
  recommendedBacktest: string;
  recommendedJournalReview: string;
  todayGoal: string;
  todayRisk: string;
  confidenceLevel: number;
  observations: CopilotObservation[];
  proactiveTasks: CopilotTask[];
  generatedAt: string;
}

export interface CopilotMarketEvent {
  title: string;
  impact: 'high' | 'medium' | 'low';
  time?: string;
}

export interface CopilotObservation {
  type: 'insight' | 'warning' | 'reminder' | 'discovery';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  evidence: string[];
}

export interface CopilotTask {
  title: string;
  description: string;
  category: 'study' | 'review' | 'backtest' | 'journal' | 'research';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimatedMinutes: number;
}

export function generateCopilotBrief(params: {
  concepts: ConceptMastery[];
  todayGoal?: LearningGoal;
  openTaskCount: number;
  recentDocuments: number;
  unprocessedDocuments: number;
  recentMistakes: number;
  totalBacktests: number;
  overallScore: number;
  preferredSession?: string;
  weakestAreas: string[];
  strongestAreas: string[];
}): CopilotBrief {
  const weakConcepts = params.concepts.filter((c) => c.understanding < 50).slice(0, 3);
  const strongConcepts = params.concepts.filter((c) => c.understanding > 75).slice(0, 3);

  const observations: CopilotObservation[] = generateObservations(params);
  const proactiveTasks = generateTasks(params, weakConcepts);

  const timeOfDay = getTimeOfDay();
  const greeting = timeOfDay === 'morning' ? 'Good morning' : timeOfDay === 'afternoon' ? 'Good afternoon' : 'Good evening';
  const confidenceLevel = computeConfidence(params);

  return {
    greeting,
    marketEvents: [],
    researchProgress: {
      pendingOcr: params.unprocessedDocuments,
      pendingAnalysis: params.concepts.length > 0 ? 0 : 1,
      unreadDocuments: params.recentDocuments,
    },
    conceptHighlights: { weak: weakConcepts.map((c) => c.name), strong: strongConcepts.map((c) => c.name) },
    recommendedReading: params.weakestAreas.slice(0, 2),
    recommendedBacktest: params.totalBacktests < 3 ? 'Run your first backtest to validate your understanding' : 'Review recent backtests for consistency',
    recommendedJournalReview: params.recentMistakes > 3 ? 'Review recent mistakes and update your trading rules' : 'Continue maintaining your trading journal',
    todayGoal: params.todayGoal?.task || 'Continue building your knowledge base',
    todayRisk: params.weakestAreas[0] || 'Stay focused on your process',
    confidenceLevel,
    observations,
    proactiveTasks,
    generatedAt: new Date().toISOString(),
  };
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function computeConfidence(params: {
  overallScore: number;
  recentMistakes: number;
  openTaskCount: number;
}): number {
  let base = params.overallScore;
  base -= params.recentMistakes * 3;
  base -= params.openTaskCount * 2;
  return Math.max(10, Math.min(100, base));
}

function generateObservations(params: {
  concepts: ConceptMastery[];
  recentMistakes: number;
  totalBacktests: number;
  openTaskCount: number;
  weakestAreas: string[];
  strongestAreas: string[];
  recentDocuments: number;
  unprocessedDocuments: number;
}): CopilotObservation[] {
  const obs: CopilotObservation[] = [];

  if (params.recentMistakes > 3) {
    obs.push({
      type: 'warning', title: 'Repeated Mistakes',
      message: `You've made ${params.recentMistakes} recent mistakes — review your rules and consider pausing to reflect`,
      priority: 'high', evidence: [`${params.recentMistakes} mistakes recorded`],
    });
  }

  if (params.totalBacktests < 2) {
    obs.push({
      type: 'reminder', title: 'Backtest Your Concepts',
      message: 'You have few backtests — try validating your understanding with quantitative tests',
      priority: 'medium', evidence: [`${params.totalBacktests} backtests completed`],
    });
  }

  const staleConcepts = params.concepts.filter(
    (c) => c.lastStudied && daysSince(c.lastStudied) > 7 && c.understanding > 60
  );
  if (staleConcepts.length > 0) {
    obs.push({
      type: 'reminder', title: `Review ${staleConcepts[0].name}`,
      message: `You haven't reviewed ${staleConcepts[0].name} in ${daysSince(staleConcepts[0].lastStudied!)} days`,
      priority: 'medium', evidence: [`Last studied: ${staleConcepts[0].lastStudied!}`],
    });
  }

  if (params.unprocessedDocuments > 0) {
    obs.push({
      type: 'insight', title: `${params.unprocessedDocuments} Document${params.unprocessedDocuments > 1 ? 's' : ''} Pending`,
      message: 'Uploaded documents waiting for AI processing — start extraction to grow your knowledge base',
      priority: 'medium', evidence: ['Document processing queue'],
    });
  }

  if (params.openTaskCount > 5) {
    obs.push({
      type: 'warning', title: `${params.openTaskCount} Open Tasks`,
      message: 'Your task queue is growing — consider prioritizing and completing high-impact items',
      priority: 'low', evidence: ['Task queue analysis'],
    });
  }

  if (params.strongestAreas.length > 0) {
    obs.push({
      type: 'insight', title: `Strength: ${params.strongestAreas[0]}`,
      message: `Your strongest area is ${params.strongestAreas[0]} — consider sharing your knowledge through journal entries`,
      priority: 'low', evidence: ['Strength analysis from trading data'],
    });
  }

  if (obs.length === 0) {
    obs.push({
      type: 'discovery', title: 'Building Your Profile',
      message: 'Continue using Minore to receive personalized observations',
      priority: 'low', evidence: [],
    });
  }

  return obs;
}

function generateTasks(params: {
  recentMistakes: number;
  weakestAreas: string[];
  totalBacktests: number;
  openTaskCount: number;
}, weakConcepts: ConceptMastery[]): CopilotTask[] {
  const tasks: CopilotTask[] = [];

  if (weakConcepts.length > 0) {
    tasks.push({
      title: `Study: ${weakConcepts[0].name}`,
      description: `Review materials for ${weakConcepts[0].name} (understanding: ${weakConcepts[0].understanding}%)`,
      category: 'study', priority: 'high',
      reason: `Weakest concept at ${weakConcepts[0].understanding}% understanding`,
      estimatedMinutes: 15,
    });
  }

  if (params.recentMistakes > 2) {
    tasks.push({
      title: 'Review Recent Mistakes',
      description: 'Analyze your last few mistakes and update your rules',
      category: 'review', priority: 'high',
      reason: `${params.recentMistakes} recent mistakes detected`,
      estimatedMinutes: 10,
    });
  }

  if (params.totalBacktests < 3) {
    tasks.push({
      title: 'Run a Backtest',
      description: 'Validate your understanding with a quantitative backtest',
      category: 'backtest', priority: 'medium',
      reason: 'Fewer than 3 backtests completed',
      estimatedMinutes: 20,
    });
  }

  if (params.weakestAreas.length > 1) {
    tasks.push({
      title: `Research: ${params.weakestAreas[1]}`,
      description: `Deep dive into ${params.weakestAreas[1]} — upload related documents`,
      category: 'research', priority: 'medium',
      reason: 'Identified as a growth area',
      estimatedMinutes: 25,
    });
  }

  tasks.push({
    title: 'Complete a Journal Entry',
    description: 'Document your latest analysis or trade',
    category: 'journal', priority: 'low',
    reason: 'Regular journaling improves self-awareness',
    estimatedMinutes: 5,
  });

  return tasks;
}

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

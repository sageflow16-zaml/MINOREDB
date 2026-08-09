import { aiMemory } from './memory';
import { getTimeline, getTasks } from './workflowEngine';
import {AIContextSnapshot} from './types';

export function buildAIContext(projectId: string, overrides?: Partial<AIContextSnapshot>): AIContextSnapshot {
  const strengths = aiMemory.getStrengths();
  const weaknesses = aiMemory.getWeaknesses();
  const preferences = aiMemory.getPreferences();
  const recentActivity = getTimeline(20);
  const openTasks = getTasks(projectId, true);
  const mistakes = aiMemory.getMistakes();

  const ctx: AIContextSnapshot = {
    projectId,
    strengths,
    weaknesses,
    preferences,
    recentActivity,
    openTasks,
    topConcepts: [],
    recentMistakes: mistakes.length,
    learningVelocity: 0,
    studyConsistency: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
  return ctx;
}

export function buildDecisionContext(projectId: string, _question: string): string[] {
  const ctx = buildAIContext(projectId);
  const parts: string[] = ['Context for decision analysis:'];
  if (ctx.strengths.length) parts.push(`Strengths: ${ctx.strengths.join(', ')}`);
  if (ctx.weaknesses.length) parts.push(`Weaknesses: ${ctx.weaknesses.join(', ')}`);
  if (ctx.recentMistakes > 0) parts.push(`Recent mistakes: ${ctx.recentMistakes}`);
  if (ctx.openTasks.length) parts.push(`Open tasks: ${ctx.openTasks.length}`);
  if (ctx.recentActivity.length) parts.push(`Recent activity: ${ctx.recentActivity.length} events`);
  return parts;
}

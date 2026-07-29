import type { UnifiedRecommendation, ActionPlan, PlanStep } from './types';

const PLANS_KEY = 'minore_action_plans';

export function createPlan(
  recommendations: UnifiedRecommendation[],
  objective?: string,
): ActionPlan | null {
  if (!recommendations.length) return null;

  const topRecs = recommendations.filter((r) => r.priority === 'critical' || r.priority === 'high').slice(0, 5);
  if (!topRecs.length) return null;

  const steps: PlanStep[] = topRecs.map((rec, i) => ({
    order: i + 1,
    action: rec.title,
    detail: rec.description,
    estimatedMinutes: rec.estimatedMinutes,
    dependencies: i > 0 ? [i] : [],
    completed: false,
    resourceUrl: undefined,
  }));

  const totalMinutes = steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);

  const plan: ActionPlan = {
    id: `plan_${Date.now()}`,
    objective: objective || `Complete ${topRecs.length} high-priority actions`,
    steps,
    totalMinutes,
    progress: 0,
    relatedResources: [...new Set(topRecs.flatMap((r) => r.evidence))],
    successCriteria: topRecs.map((r) => `Complete: ${r.title}`),
    source: 'intelligence-core',
    createdAt: new Date().toISOString(),
  };

  savePlan(plan);
  return plan;
}

export function getActivePlan(): ActionPlan | null {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    if (!raw) return null;
    const plans: ActionPlan[] = JSON.parse(raw);
    const active = plans
      .filter((p) => !p.completedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return active || null;
  } catch {
    return null;
  }
}

export function updateStep(planId: string, stepOrder: number, completed: boolean): ActionPlan | null {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    if (!raw) return null;
    const plans: ActionPlan[] = JSON.parse(raw);
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return null;

    const step = plan.steps.find((s) => s.order === stepOrder);
    if (!step) return null;

    step.completed = completed;
    const done = plan.steps.filter((s) => s.completed).length;
    plan.progress = Math.round((done / plan.steps.length) * 100);

    if (plan.progress >= 100) {
      plan.completedAt = new Date().toISOString();
    }

    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
    return plan;
  } catch {
    return null;
  }
}

export function getAllPlans(): ActionPlan[] {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function savePlan(plan: ActionPlan): void {
  try {
    const plans = getAllPlans();
    plans.push(plan);
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  } catch {
    // Storage unavailable
  }
}

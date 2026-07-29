import { createEvent, eventBus } from './eventBus';
import { EventType, Workflow, WorkflowStep, TimelineEntry, AITask, SmartRecommendation } from './types';

type WorkflowDefinition = {
  trigger: EventType | EventType[];
  steps: Array<{
    type: string;
    action: (event: any) => Promise<{
      timeline?: Omit<TimelineEntry, 'id'>[];
      tasks?: Omit<AITask, 'id' | 'createdAt'>[];
      recommendations?: Omit<SmartRecommendation, 'id' | 'createdAt'>[];
      eventToEmit?: { type: EventType; data: Record<string, unknown> };
    }>;
  }>;
};

const workflows = new Map<string, WorkflowDefinition>();

function registerWorkflow(name: string, def: WorkflowDefinition) {
  workflows.set(name, def);
  const triggers = Array.isArray(def.trigger) ? def.trigger : [def.trigger];
  triggers.forEach((trigger) => {
    eventBus.on(trigger, async (event) => {
      const wf: Workflow = {
        id: `wf_${Date.now()}`,
        triggerEvent: trigger,
        steps: [],
        status: 'running',
        projectId: event.projectId,
        createdAt: new Date().toISOString(),
      };
      for (const stepDef of def.steps) {
        const step: WorkflowStep = {
          id: `step_${Date.now()}`,
          type: stepDef.type,
          status: 'running',
          startedAt: new Date().toISOString(),
        };
        wf.steps.push(step);
        try {
          const result = await stepDef.action(event);
          step.status = 'completed';
          step.completedAt = new Date().toISOString();
          step.result = result;
          if (result.timeline) result.timeline.forEach((t) => publishTimelineEntry(event.projectId, { ...t }));
          if (result.tasks) result.tasks.forEach((t) => publishTask(event.projectId, { ...t }));
          if (result.recommendations) result.recommendations.forEach((r) => publishRecommendation(event.projectId, { ...r }));
          if (result.eventToEmit) {
            await eventBus.emit(createEvent(result.eventToEmit.type, event.projectId, result.eventToEmit.data, 'system'));
          }
        } catch (err: unknown) {
          step.status = 'failed';
          step.error = err instanceof Error ? err.message : 'Unknown error';
          step.completedAt = new Date().toISOString();
          wf.status = 'failed';
        }
      }
      if (wf.steps.every((s) => s.status === 'completed')) wf.status = 'completed';
      wf.completedAt = new Date().toISOString();
      onWorkflowComplete(wf);
    });
  });
}

let timelineStore: TimelineEntry[] = [];
let taskStore: AITask[] = [];
let recommendationStore: SmartRecommendation[] = [];

function publishTimelineEntry(projectId: string, entry: Omit<TimelineEntry, 'id'>) {
  const full: TimelineEntry = { id: `tl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, ...entry };
  timelineStore.unshift(full);
  if (timelineStore.length > 200) timelineStore = timelineStore.slice(0, 200);
  eventBus.emit(createEvent('MENTOR_MESSAGE', projectId, { entry: full }, 'system'));
}

function publishTask(projectId: string, task: Omit<AITask, 'id' | 'createdAt'>) {
  const full: AITask = { id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), ...task };
  taskStore.unshift(full);
  if (taskStore.length > 100) taskStore = taskStore.slice(0, 100);
}

function publishRecommendation(projectId: string, rec: Omit<SmartRecommendation, 'id' | 'createdAt'>) {
  const full: SmartRecommendation = { id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), ...rec };
  recommendationStore.unshift(full);
  if (recommendationStore.length > 100) recommendationStore = recommendationStore.slice(0, 100);
}

function onWorkflowComplete(wf: Workflow) {
  eventBus.emit(createEvent('RECOMMENDATION_GENERATED', wf.projectId, { workflow: wf }, 'system'));
}

export function getTimeline(limit = 50): TimelineEntry[] {
  return timelineStore.slice(0, limit);
}

export function getTasks(projectId?: string, incompleteOnly = true): AITask[] {
  let tasks = projectId ? taskStore.filter((t) => t.id.includes(projectId)) : taskStore;
  if (incompleteOnly) tasks = tasks.filter((t) => !t.completed);
  return tasks;
}

export function completeTask(taskId: string) {
  const task = taskStore.find((t) => t.id === taskId);
  if (task) {
    task.completed = true;
    task.completedAt = new Date().toISOString();
  }
}

export function getRecommendations(projectId?: string): SmartRecommendation[] {
  return projectId ? recommendationStore.filter((r) => !r.dismissed) : recommendationStore.filter((r) => !r.dismissed);
}

export function dismissRecommendation(recId: string) {
  const rec = recommendationStore.find((r) => r.id === recId);
  if (rec) rec.dismissed = true;
}

function setupDefaultWorkflows() {
  registerWorkflow('document-processed', {
    trigger: 'DOCUMENT_PROCESSED',
    steps: [
      { type: 'extract-rules', action: async (e) => ({ eventToEmit: { type: 'RULE_EXTRACTED', data: { documentId: e.data.documentId } } }) },
      { type: 'generate-tags', action: async (e) => ({ timeline: [{ type: 'event', eventType: 'DOCUMENT_PROCESSED', title: 'Document Processed', description: 'AI analysis complete', timestamp: new Date().toISOString(), actor: 'ai' }] }) },
    ],
  });
  registerWorkflow('backtest-completed', {
    trigger: 'BACKTEST_COMPLETED',
    steps: [
      { type: 'analyze-results', action: async (e) => ({
        timeline: [{ type: 'milestone', eventType: 'BACKTEST_COMPLETED', title: 'Backtest Complete', description: `Results ready for ${e.data.backtestName || 'backtest'}`, timestamp: new Date().toISOString(), actor: 'ai', actionable: true }],
        tasks: [{ title: 'Review Backtest Results', description: `Review the completed backtest`, priority: 'medium', reason: 'Backtest completed and ready for review', relatedDocuments: [], estimatedMinutes: 10, completed: false, category: 'review' }],
      })},
    ],
  });
  registerWorkflow('pattern-detected', {
    trigger: 'PATTERN_DETECTED',
    steps: [
      { type: 'generate-insight', action: async (e) => ({
        timeline: [{ type: 'observation', eventType: 'PATTERN_DETECTED', title: 'Pattern Detected', description: `${e.data.patternCount || 'New'} behavioral pattern${(e.data.patternCount as number) !== 1 ? 's' : ''} identified`, timestamp: new Date().toISOString(), actor: 'ai', confidence: e.data.confidence as number }],
        recommendations: (e.data.negativePatterns as number) > 0 ? [{ type: 'journal_review', title: 'Review Negative Patterns', description: `${e.data.negativePatterns} negative patterns need attention`, reason: 'Patterns detected in trading behavior', confidence: 75, evidence: ['Behavioral pattern analysis'], relatedEntities: [], priority: 'high', dismissed: false }] : [],
      })},
    ],
  });
  registerWorkflow('journal-created', {
    trigger: 'JOURNAL_CREATED',
    steps: [
      { type: 'check-consistency', action: async (e) => ({
        timeline: [{ type: 'action', eventType: 'JOURNAL_CREATED', title: 'Journal Updated', description: 'Journal entry recorded', timestamp: new Date().toISOString(), actor: 'user' }],
        tasks: [{ title: 'Review Recent Trades', description: 'Review trades linked to this journal entry', priority: 'low', reason: 'Journal entry recorded — review for patterns', relatedDocuments: [], estimatedMinutes: 5, completed: false, category: 'journal' }],
      })},
    ],
  });
  registerWorkflow('trade-recorded', {
    trigger: 'TRADE_RECORDED',
    steps: [
      { type: 'update-statistics', action: async (e) => ({
        timeline: [{ type: 'action', eventType: 'TRADE_RECORDED', title: 'Trade Recorded', description: `Trade ${e.data.symbol || ''} recorded`, timestamp: new Date().toISOString(), actor: 'user' }],
      })},
    ],
  });
  registerWorkflow('daily-brief', {
    trigger: 'DAILY_BRIEF_GENERATED',
    steps: [
      { type: 'update-timeline', action: async (e) => ({
        timeline: [{ type: 'milestone', eventType: 'DAILY_BRIEF_GENERATED', title: 'Daily Brief Ready', description: 'Today\'s personalized briefing has been generated', timestamp: new Date().toISOString(), actor: 'ai', actionable: true }],
      })},
    ],
  });
}

setupDefaultWorkflows();

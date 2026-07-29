import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { eventBus, createEvent } from '../lib/ai/eventBus';
import { aiMemory } from '../lib/ai/memory';
import { buildAIContext, buildDecisionContext } from '../lib/ai/context';
import { notificationService } from '../lib/ai/notifications';
import {
  getTimeline, getTasks, getRecommendations, completeTask as completeTaskAction,
  dismissRecommendation as dismissRecAction,
} from '../lib/ai/workflowEngine';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type {
  TimelineEntry, AITask, SmartRecommendation, DailyBrief,
  DecisionResult, ConceptMastery, AIMemoryEntry, EventType,
} from '../lib/ai/types';

export function useEventBus() {
  const subscribe = useCallback((type: EventType, handler: (event: any) => void) => {
    return eventBus.on(type, handler);
  }, []);
  const emit = useCallback((type: EventType, projectId: string, data?: Record<string, unknown>, actor?: 'user' | 'system' | 'ai') => {
    eventBus.emit(createEvent(type, projectId, data, actor));
  }, []);
  return { subscribe, emit, history: eventBus.getHistory() };
}

export function useMentorTimeline(limit = 50) {
  const [entries, setEntries] = useState<TimelineEntry[]>(() => getTimeline(limit));
  useEffect(() => {
    const unsub = eventBus.onAny(() => setEntries(getTimeline(limit)));
    const interval = setInterval(() => setEntries(getTimeline(limit)), 5000);
    return () => { unsub(); clearInterval(interval); };
  }, [limit]);
  return entries;
}

export function useAITasks(projectId?: string) {
  const [tasks, setTasks] = useState<AITask[]>(() => getTasks(projectId));
  useEffect(() => {
    const unsub = eventBus.on('RECOMMENDATION_GENERATED', () => setTasks(getTasks(projectId)));
    return unsub;
  }, [projectId]);
  const complete = useCallback((taskId: string) => {
    completeTaskAction(taskId);
    setTasks(getTasks(projectId));
  }, [projectId]);
  return { tasks, completeTask: complete };
}

export function useSmartRecommendations(projectId?: string) {
  const [recs, setRecs] = useState<SmartRecommendation[]>(() => getRecommendations(projectId));
  useEffect(() => {
    const unsub = eventBus.on('RECOMMENDATION_GENERATED', () => setRecs(getRecommendations(projectId)));
    return unsub;
  }, [projectId]);
  const dismiss = useCallback((recId: string) => {
    dismissRecAction(recId);
    setRecs(getRecommendations(projectId));
  }, [projectId]);
  return { recommendations: recs, dismiss };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState(() => notificationService.getAll());
  useEffect(() => {
    const unsub = eventBus.onAny(() => setNotifications(notificationService.getAll()));
    const interval = setInterval(() => setNotifications(notificationService.getAll()), 10000);
    return () => { unsub(); clearInterval(interval); };
  }, []);
  return {
    notifications,
    unread: notificationService.getUnread(),
    markRead: notificationService.markRead.bind(notificationService),
    markAllRead: notificationService.markAllRead.bind(notificationService),
    dismiss: notificationService.dismiss.bind(notificationService),
  };
}

export function useDailyBrief(projectId: string) {
  return useQuery({
    queryKey: ['ai', projectId, 'daily-brief'],
    queryFn: async (): Promise<DailyBrief | null> => {
      try {
        return await callEdgeFunction('ai', {
          operation: 'daily-brief',
          project_id: projectId,
          data: { context: buildAIContext(projectId) },
        });
      } catch {
        return generateFallbackBrief(projectId);
      }
    },
    enabled: !!projectId,
    refetchInterval: 300000,
  });
}

function generateFallbackBrief(projectId: string): DailyBrief {
  const tasks = getTasks(projectId, true);
  const weaknesses = aiMemory.getWeaknesses();
  const strengths = aiMemory.getStrengths();
  const now = new Date();
  return {
    date: now.toISOString(),
    projectId,
    economicEvents: [],
    pendingResearch: 0,
    unreadDocuments: 0,
    incompleteProcessing: 0,
    journalReminder: false,
    backtestReminder: false,
    mostImportantConcept: { name: 'Getting Started', reason: 'Begin building your knowledge base' },
    currentWeaknesses: weaknesses.length ? weaknesses : ['No weaknesses tracked yet'],
    currentStrengths: strengths.length ? strengths : ['Getting started with Minore'],
    recommendedTask: tasks[0] || {
      id: 'default', title: 'Upload a document', description: 'Start by uploading a trading document',
      priority: 'high', reason: 'Build your knowledge base', relatedDocuments: [],
      estimatedMinutes: 5, completed: false, createdAt: now.toISOString(), category: 'research',
    },
    learningObjective: 'Upload and process your first document',
    recentUploads: [],
    generatedAt: now.toISOString(),
  };
}

export function useConceptMastery(projectId: string) {
  return useQuery({
    queryKey: ['ai', projectId, 'concept-mastery'],
    queryFn: async (): Promise<ConceptMastery[]> => {
      try {
        return await callEdgeFunction('ai', { operation: 'concept-mastery', project_id: projectId });
      } catch {
        return [];
      }
    },
    enabled: !!projectId,
  });
}

export function useDecisionEngine(projectId: string) {
  const decide = useMutation({
    mutationFn: async (question: string): Promise<DecisionResult> => {
      const context = buildDecisionContext(projectId, question);
      return callEdgeFunction('ai', {
        operation: 'decide',
        project_id: projectId,
        data: { question, context },
      });
    },
  });
  return { decide, result: decide.data, isLoading: decide.isPending, error: decide.error };
}

export function useAIMemory() {
  const [entries, setEntries] = useState<AIMemoryEntry[]>(() => aiMemory.getAll());
  const refresh = useCallback(() => setEntries(aiMemory.getAll()), []);
  return {
    entries,
    strengths: aiMemory.getStrengths(),
    weaknesses: aiMemory.getWeaknesses(),
    mistakes: aiMemory.getMistakes(),
    preferences: aiMemory.getPreferences(),
    add: (entry: Omit<AIMemoryEntry, 'timestamp'>) => { aiMemory.add(entry); refresh(); },
    search: (q: string) => aiMemory.search(q),
    refresh,
  };
}

export type EventType =
  | 'DOCUMENT_UPLOADED' | 'DOCUMENT_PROCESSED' | 'DOCUMENT_DELETED'
  | 'RULE_EXTRACTED' | 'CONCEPT_EXTRACTED' | 'CLAIM_CREATED'
  | 'CHAT_CREATED' | 'NOTE_CREATED' | 'BOOKMARK_CREATED'
  | 'JOURNAL_CREATED' | 'TRADE_RECORDED' | 'BACKTEST_CREATED'
  | 'BACKTEST_COMPLETED' | 'MODEL_UPDATED' | 'PATTERN_DETECTED'
  | 'REPORT_GENERATED' | 'GRAPH_UPDATED' | 'WORKSPACE_CREATED'
  | 'SEARCH_PERFORMED' | 'KNOWLEDGE_LINKED' | 'LEARNING_EVENT'
  | 'PROFILE_ANALYZED' | 'TASK_COMPLETED' | 'RECOMMENDATION_GENERATED'
  | 'CONTEXT_BUILT' | 'DAILY_BRIEF_GENERATED'
  | 'MENTOR_MESSAGE' | 'AI_RESPONSE' | 'DECISION_MADE';

export interface WorkflowEvent {
  type: EventType;
  projectId: string;
  timestamp: string;
  actor: 'user' | 'system' | 'ai';
  data: Record<string, unknown>;
  id: string;
}

export interface WorkflowStep {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
  duration?: number;
}

export interface Workflow {
  id: string;
  triggerEvent: EventType;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  projectId: string;
  createdAt: string;
  completedAt?: string;
  summary?: string;
}

export interface AIMemoryEntry {
  key: string;
  category: 'strength' | 'weakness' | 'preference' | 'behavior' | 'fact' | 'mistake' | 'achievement';
  content: string;
  confidence: number;
  evidence: string[];
  timestamp: string;
  source: string;
}

export interface AIContextSnapshot {
  projectId: string;
  strengths: string[];
  weaknesses: string[];
  preferences: Record<string, unknown>;
  recentActivity: TimelineEntry[];
  openTasks: AITask[];
  topConcepts: ConceptMastery[];
  currentWorkspace?: string;
  selectedDocuments?: string[];
  lastBrief?: DailyBrief;
  recentMistakes: number;
  learningVelocity: number;
  studyConsistency: number;
  lastDecision?: DecisionResult;
  createdAt: string;
}

export interface TimelineEntry {
  id: string;
  type: 'action' | 'event' | 'milestone' | 'recommendation' | 'observation' | 'task' | 'alert';
  eventType: EventType;
  title: string;
  description: string;
  timestamp: string;
  actor: 'user' | 'system' | 'ai';
  confidence?: number;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionable?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AITask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  relatedDocuments: string[];
  estimatedMinutes: number;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  category: 'study' | 'review' | 'backtest' | 'journal' | 'research' | 'practice';
}

export interface DailyBrief {
  date: string;
  projectId: string;
  marketStatus?: string;
  economicEvents: { title: string; impact: 'high' | 'medium' | 'low'; time?: string }[];
  pendingResearch: number;
  unreadDocuments: number;
  incompleteProcessing: number;
  journalReminder: boolean;
  backtestReminder: boolean;
  mostImportantConcept: { name: string; reason: string };
  currentWeaknesses: string[];
  currentStrengths: string[];
  recommendedTask: AITask;
  learningObjective: string;
  recentUploads: { title: string; id: string }[];
  generatedAt: string;
}

export interface ConceptMastery {
  conceptId: string;
  conceptName: string;
  category: string;
  understanding: number;
  applications: number;
  mistakes: number;
  backtests: number;
  relatedDocuments: number;
  relatedJournalEntries: number;
  aiConfidence: 'high' | 'medium' | 'low';
  lastStudied?: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface DecisionResult {
  question: string;
  verdict: string;
  confidence: number;
  scores: Record<string, number>;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  riskFactors: string[];
  recommendedPreparation: string[];
  contextUsed: string[];
  createdAt: string;
}

export interface SmartRecommendation {
  id: string;
  type: 'document' | 'book' | 'note' | 'backtest' | 'strategy' | 'journal_review' | 'model' | 'chart' | 'concept';
  title: string;
  description: string;
  reason: string;
  confidence: number;
  evidence: string[];
  relatedEntities: { type: string; id: string; title: string }[];
  priority: 'high' | 'medium' | 'low';
  dismissed: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'alert' | 'reminder' | 'insight' | 'milestone' | 'recommendation';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  actionable: boolean;
  actionLabel?: string;
  actionPath?: string;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}

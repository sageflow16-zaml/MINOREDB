export interface AIExplanation {
  id: string;
  summary: string;
  reasoningSteps: ReasoningStep[];
  evidence: EvidenceItem[];
  confidence: number;
  confidenceLevel: 'very_high' | 'high' | 'medium' | 'low';
  timeline: HistoryPoint[];
  relatedItems: RelatedItem[];
  recommendations: string[];
  metadata: {
    source: string;
    targetType: string;
    targetId: string;
    generatedAt: string;
  };
}

export interface ReasoningStep {
  order: number;
  action: string;
  detail: string;
}

export interface HistoryPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface RelatedItem {
  type: 'document' | 'journal' | 'backtest' | 'rule' | 'pattern' | 'chart' | 'knowledge_graph' | 'recommendation';
  id: string;
  title: string;
  confidence?: number;
}

export interface FeedbackRating {
  id: string;
  source: string;
  targetType: string;
  targetId: string;
  rating: 'correct' | 'helpful' | 'not_helpful' | 'incorrect';
  comment?: string;
  timestamp: string;
}

export interface ValidationResult {
  valid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  strengths: string[];
}

export interface ValidationIssue {
  type: 'missing_data' | 'low_quantity' | 'contradiction' | 'staleness' | 'low_quality';
  severity: 'high' | 'medium' | 'low';
  message: string;
}

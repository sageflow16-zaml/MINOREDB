export type KnowledgeEntityType =
  | 'document' | 'research_session' | 'journal_entry' | 'backtest'
  | 'strategy' | 'model' | 'trading_rule' | 'concept' | 'claim'
  | 'pattern' | 'mistake' | 'tag' | 'note' | 'bookmark'
  | 'chart' | 'economic_event';

export type RelationshipType =
  | 'supports' | 'contradicts' | 'explains' | 'references'
  | 'derived_from' | 'related_to' | 'used_by' | 'mentioned_in'
  | 'validated_by' | 'broken_by';

export interface KnowledgeEntity {
  id: string;
  type: KnowledgeEntityType;
  title: string;
  subtitle?: string;
  description?: string;
  timestamp?: string;
  confidence?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface RelatedItem {
  entity: KnowledgeEntity;
  relationship: RelationshipType;
  strength: number;
  evidence?: string;
  citation?: string;
}

export interface EntityConnection {
  source: KnowledgeEntity;
  target: KnowledgeEntity;
  relationship: RelationshipType;
  strength: number;
  confidence: number;
  evidence?: string;
}

export interface EvidenceSource {
  title: string;
  content: string;
  source: string;
  relevance: number;
  confidence: number;
  documentId?: string;
}

export interface AIExplanation {
  summary: string;
  reasoning: string[];
  evidence: EvidenceSource[];
  confidence: number;
}

export interface DiscoveryItem {
  type: 'gap' | 'contradiction' | 'repeated_mistake' | 'successful_behavior' | 'hidden_relationship';
  title: string;
  description: string;
  entities: KnowledgeEntity[];
  severity: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface KnowledgeSearchResult {
  entity: KnowledgeEntity;
  relevance: number;
  matchContext: string;
  connections: number;
}

export const ENTITY_COLORS: Record<KnowledgeEntityType, string> = {
  document: 'hsl(var(--chart-1))',
  research_session: 'hsl(var(--chart-2))',
  journal_entry: 'hsl(var(--chart-3))',
  backtest: 'hsl(var(--chart-4))',
  strategy: 'hsl(var(--chart-5))',
  model: 'hsl(217, 91%, 60%)',
  trading_rule: 'hsl(142, 71%, 45%)',
  concept: 'hsl(271, 91%, 65%)',
  claim: 'hsl(326, 100%, 60%)',
  pattern: 'hsl(35, 100%, 55%)',
  mistake: 'hsl(0, 84%, 60%)',
  tag: 'hsl(200, 100%, 50%)',
  note: 'hsl(160, 100%, 40%)',
  bookmark: 'hsl(50, 100%, 50%)',
  chart: 'hsl(310, 100%, 60%)',
  economic_event: 'hsl(20, 100%, 50%)',
};

export const ENTITY_LABELS: Record<KnowledgeEntityType, string> = {
  document: 'Document',
  research_session: 'Research Session',
  journal_entry: 'Journal Entry',
  backtest: 'Backtest',
  strategy: 'Strategy',
  model: 'Model',
  trading_rule: 'Trading Rule',
  concept: 'Concept',
  claim: 'Claim',
  pattern: 'Pattern',
  mistake: 'Mistake',
  tag: 'Tag',
  note: 'Note',
  bookmark: 'Bookmark',
  chart: 'Chart',
  economic_event: 'Economic Event',
};

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  supports: 'Supports',
  contradicts: 'Contradicts',
  explains: 'Explains',
  references: 'References',
  derived_from: 'Derived From',
  related_to: 'Related To',
  used_by: 'Used By',
  mentioned_in: 'Mentioned In',
  validated_by: 'Validated By',
  broken_by: 'Broken By',
};

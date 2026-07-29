export interface ConceptMastery {
  name: string;
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

export interface LearningPath {
  focusConcepts: ConceptMastery[];
  todayGoal: LearningGoal;
  weeklyPlan: LearningGoal[];
}

export interface LearningGoal {
  concept: string;
  task: string;
  estimatedMinutes: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  relatedDocuments: number;
  relatedNotes: number;
  relatedJournalEntries: number;
  completed: boolean;
}

export function computeConceptMastery(params: {
  patterns: Array<{
    name?: string;
    category?: string;
    description?: string;
    occurrence_count: number;
    win_count?: number;
    loss_count?: number;
    win_rate?: number;
    confidence?: number;
    pattern_type: string;
  }>;
  rules: Array<{
    title: string;
    category?: string;
    status: string;
  }>;
  debriefs: Array<{
    strengths?: string[];
    weaknesses?: string[];
    lessons_learned?: string | string[];
    mistakes_identified?: string[];
  }>;
  documents: number;
  backtests: number;
}): ConceptMastery[] {
  const conceptMap = new Map<string, {
    category: string;
    occurrences: number;
    wins: number;
    losses: number;
    mistakes: number;
    docRefs: number;
    journalRefs: number;
    btRefs: number;
    confidence: number;
    lastSeen?: string;
    trend: 'improving' | 'stable' | 'declining';
  }>();

  const addConcept = (name: string, category: string, type: 'pattern' | 'rule' | 'debrief' | 'document' | 'backtest', isMistake: boolean, confidence: number) => {
    const key = name.toLowerCase().trim();
    if (!conceptMap.has(key)) {
      conceptMap.set(key, { category, occurrences: 0, wins: 0, losses: 0, mistakes: 0, docRefs: 0, journalRefs: 0, btRefs: 0, confidence: 0, trend: 'stable' });
    }
    const c = conceptMap.get(key)!;
    c.occurrences++;
    c.confidence = (c.confidence + confidence) / 2;
    if (isMistake) c.mistakes++;
    if (type === 'pattern') { if (isMistake) c.losses++; else c.wins++; }
    if (type === 'document') c.docRefs++;
    if (type === 'debrief') { c.journalRefs++; if (isMistake) c.mistakes++; }
    if (type === 'backtest') c.btRefs++;
    c.lastSeen = new Date().toISOString();
  };

  for (const p of params.patterns) {
    const name = p.name || p.description || p.pattern_type;
    if (name) addConcept(name, p.category || 'behavior', 'pattern', p.pattern_type === 'negative' || (p.win_rate != null && p.win_rate < 0.4), p.confidence || 50);
  }

  for (const r of params.rules) {
    addConcept(r.title, r.category || 'rule', 'rule', r.status === 'rejected', 60);
  }

  for (const d of params.debriefs) {
    const lessons = typeof d.lessons_learned === 'string' ? [d.lessons_learned] : d.lessons_learned || [];
    [...(d.strengths || []), ...(d.weaknesses || []), ...lessons, ...(d.mistakes_identified || [])].forEach((item) => {
      if (item) addConcept(item, 'trading', 'debrief', (d.weaknesses || []).includes(item) || (d.mistakes_identified || []).includes(item), 50);
    });
  }

  const concepts: ConceptMastery[] = [];
  for (const [key, val] of conceptMap) {
    const totalApplications = val.wins + val.losses;
    const winRate = totalApplications > 0 ? val.wins / totalApplications : 0.5;
    const mistakePenalty = Math.min(50, val.mistakes * 8);
    const confidenceBonus = val.confidence * 0.3;
    const applicationBonus = Math.min(30, totalApplications * 3);
    const rawUnderstanding = 50 + confidenceBonus + applicationBonus - mistakePenalty;
    const understanding = Math.max(5, Math.min(98, Math.round(rawUnderstanding)));

    let aiConfidence: 'high' | 'medium' | 'low' = 'medium';
    if (val.occurrences >= 10 && val.confidence >= 70 && understanding > 75) aiConfidence = 'high';
    else if (val.occurrences < 3 || val.confidence < 40) aiConfidence = 'low';

    concepts.push({
      name: key,
      category: val.category,
      understanding,
      applications: totalApplications + val.docRefs + val.btRefs,
      mistakes: val.mistakes,
      backtests: val.btRefs,
      relatedDocuments: val.docRefs,
      relatedJournalEntries: val.journalRefs,
      aiConfidence,
      lastStudied: val.lastSeen,
      trend: val.trend,
    });
  }

  return concepts.sort((a, b) => b.understanding - a.understanding);
}

export function generateLearningPath(concepts: ConceptMastery[], weakThreshold = 50): LearningPath {
  const weak = concepts.filter((c) => c.understanding < weakThreshold);
  const declining = concepts.filter((c) => c.trend === 'declining');
  const frequentlyMistaken = concepts.filter((c) => c.mistakes > 2);

  const targetConcepts = [
    ...new Set([
      ...declining.map((c) => c.name),
      ...frequentlyMistaken.map((c) => c.name),
      ...weak.map((c) => c.name),
    ]),
  ];

  const focusConcepts = targetConcepts.length > 0
    ? concepts.filter((c) => targetConcepts.slice(0, 5).includes(c.name))
    : concepts.slice(0, 3);

  const today: LearningGoal = focusConcepts[0]
    ? {
      concept: focusConcepts[0].name,
      task: `Review: ${focusConcepts[0].name}`,
      estimatedMinutes: focusConcepts[0].mistakes > 2 ? 15 : 10,
      reason: focusConcepts[0].mistakes > 0
        ? `You've made ${focusConcepts[0].mistakes} mistake${focusConcepts[0].mistakes > 1 ? 's' : ''} with this concept`
        : `Understanding is at ${focusConcepts[0].understanding}% — room for improvement`,
      priority: focusConcepts[0].understanding < 40 ? 'high' : 'medium',
      relatedDocuments: focusConcepts[0].relatedDocuments,
      relatedNotes: 0,
      relatedJournalEntries: focusConcepts[0].relatedJournalEntries,
      completed: false,
    }
    : {
      concept: 'Getting Started', task: 'Upload and study your first trading document',
      estimatedMinutes: 10, reason: 'Build your foundation', priority: 'high',
      relatedDocuments: 0, relatedNotes: 0, relatedJournalEntries: 0, completed: false,
    };

  const weekly: LearningGoal[] = focusConcepts.slice(1, 4).map((c) => ({
    concept: c.name,
    task: `Study: ${c.name} — Review related documents and backtests`,
    estimatedMinutes: 20,
    reason: c.mistakes > 1 ? `${c.mistakes} mistake${c.mistakes > 1 ? 's' : ''} recorded — needs attention` : `Understanding at ${c.understanding}%`,
    priority: c.understanding < 40 ? 'high' : 'medium',
    relatedDocuments: c.relatedDocuments,
    relatedNotes: 0,
    relatedJournalEntries: c.relatedJournalEntries,
    completed: false,
  }));

  return { focusConcepts, todayGoal: today, weeklyPlan: weekly };
}

export interface EvidenceItem {
  title: string;
  content: string;
  source?: string;
  confidence?: number;
  sourceUrl?: string;
}

export interface EvidenceGatherParams {
  type: 'score' | 'dna' | 'concept' | 'observation' | 'recommendation' | 'warning';
  target: string;
  data: Record<string, unknown>;
}

export function gatherEvidence(params: EvidenceGatherParams): EvidenceItem[] {
  const { type, target, data } = params;
  const items: EvidenceItem[] = [];

  switch (type) {
    case 'score': {
      const factors = data.factors as Array<{ label: string; value: number; max: number; impact: string }> | undefined;
      if (factors) {
        for (const f of factors) {
          items.push({
            title: f.label,
            content: `${f.value}/${f.max} — ${f.impact === 'positive' ? 'Positive impact' : f.impact === 'negative' ? 'Negative impact' : 'Neutral impact'}`,
            source: 'Score computation',
            confidence: Math.round((f.value / Math.max(1, f.max)) * 100),
          });
        }
      }
      if (target === 'overall') {
        const categories = data.categories as Array<{ label: string; score: number; weight: number }> | undefined;
        if (categories) {
          for (const c of categories) {
            items.push({
              title: c.label,
              content: `Score: ${c.score} · Weight: ${Math.round(c.weight * 100)}% — contributes ${Math.round(c.score * c.weight)} points to overall`,
              source: 'Weighted average computation',
              confidence: c.score,
            });
          }
        }
      }
      break;
    }

    case 'dna': {
      const profile = data.profile as Record<string, unknown> | undefined;
      const rawInsight = data.insight as { title?: string; description?: string; confidence?: number; evidence?: string[] } | undefined;
      if (rawInsight?.evidence) {
        for (const e of rawInsight.evidence) {
          items.push({
            title: 'AI Analysis',
            content: e,
            source: 'DNA analysis engine',
            confidence: rawInsight.confidence,
          });
        }
      }
      if (profile && target === 'preferredSession') {
        const sessions = profile.preferred_sessions as string[] | undefined;
        if (sessions?.length) {
          items.push({ title: 'Preferred Sessions', content: sessions.join(', '), source: 'User profile' });
        }
      }
      if (profile && target === 'mostFrequentMistake') {
        const patterns = data.patterns as Array<{ pattern_type: string; name?: string; occurrence_count: number }> | undefined;
        if (patterns) {
          const mistakes = patterns.filter((p) => p.pattern_type === 'negative').sort((a, b) => b.occurrence_count - a.occurrence_count);
          for (const m of mistakes.slice(0, 3)) {
            items.push({ title: m.name || m.pattern_type, content: `${m.occurrence_count} occurrences`, source: 'Pattern detection' });
          }
        }
      }
      break;
    }

    case 'concept': {
      const concept = data.concept as { name?: string; understanding?: number; applications?: number; mistakes?: number; relatedDocuments?: number; relatedJournalEntries?: number; lastStudied?: string } | undefined;
      if (concept) {
        items.push({ title: 'Mentioned In', content: `${concept.relatedDocuments || 0} documents`, source: 'Document corpus' });
        items.push({ title: 'Applied Correctly', content: `${(concept.applications || 0) - (concept.mistakes || 0)} times`, source: 'Pattern + debrief analysis' });
        items.push({ title: 'Applied Incorrectly', content: `${concept.mistakes || 0} times`, source: 'Mistake tracking' });
        if (concept.lastStudied) {
          const daysSince = Math.floor((Date.now() - new Date(concept.lastStudied).getTime()) / 86400000);
          items.push({ title: 'Last Reviewed', content: `${daysSince} days ago`, source: 'Activity log' });
        }
      }
      break;
    }

    case 'observation': {
      const obs = data.observation as { type?: string; title?: string; message?: string; evidence?: string[]; priority?: string } | undefined;
      if (obs?.evidence) {
        for (const e of obs.evidence) {
          items.push({
            title: obs.title || 'Observation',
            content: e,
            source: typeof obs.type === 'string' ? `${obs.type} analysis` : 'AI analysis',
            confidence: obs.priority === 'high' ? 80 : obs.priority === 'medium' ? 60 : 40,
          });
        }
      }
      if (!obs?.evidence?.length && obs?.message) {
        items.push({ title: obs.title || 'Observation', content: obs.message, source: 'Copilot analysis', confidence: 50 });
      }
      break;
    }

    case 'recommendation': {
      const rec = data.recommendation as { title?: string; reason?: string; category?: string; priority?: string } | undefined;
      if (rec?.reason) {
        items.push({ title: 'Why this recommendation', content: rec.reason, source: `${rec.category || 'AI'} analysis`, confidence: rec.priority === 'high' ? 80 : 60 });
      }
      break;
    }

    case 'warning': {
      const warn = data.warning as { title?: string; message?: string; priority?: string; evidence?: string[] } | undefined;
      if (warn?.evidence) {
        for (const e of warn.evidence) {
          items.push({ title: warn.title || 'Warning', content: e, source: 'Risk detection', confidence: warn.priority === 'high' ? 85 : 65 });
        }
      }
      break;
    }
  }

  return items;
}

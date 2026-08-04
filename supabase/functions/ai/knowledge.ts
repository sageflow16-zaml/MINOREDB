import { callAI, isAiError, generateEmbedding, openaiApiKey, openaiBaseUrl, aiNotConfiguredMsg } from './index.ts';

function chunkTextAdvanced(text: string, maxTokens = 500, overlap = 50): { chunks: string[]; sections: string[] } {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  const sections: string[] = [];

  let currentChunk: string[] = [];
  let currentTokens = 0;
  let lastSectionTitle = '';

  for (const para of paragraphs) {
    const sectionMatch = para.match(/^#{1,3}\s+(.+)/m);
    if (sectionMatch) lastSectionTitle = sectionMatch[1].trim();

    const paraTokens = para.split(/\s+/).reduce((sum, w) => sum + Math.ceil(w.length / 4) || 1, 0);

    if (currentTokens + paraTokens > maxTokens && currentChunk.length > 0) {
      const chunkText = currentChunk.join('\n\n');
      chunks.push(chunkText);
      sections.push(lastSectionTitle);

      if (overlap > 0) {
        const overlapWords = chunkText.split(/\s+/).slice(-overlap);
        currentChunk = [overlapWords.join(' ')];
        currentTokens = overlapWords.reduce((sum, w) => sum + Math.ceil(w.length / 4) || 1, 0);
      } else {
        currentChunk = [];
        currentTokens = 0;
      }
    }
    currentChunk.push(para);
    currentTokens += paraTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
    sections.push(lastSectionTitle);
  }

  return { chunks, sections };
}

function chunkText(text: string, maxTokens = 500): string[] {
  return chunkTextAdvanced(text, maxTokens, 0).chunks;
}

export async function extractClaims(supabase: any, projectId: string, sourceId: string) {
  const { data: source } = await supabase.from('source').select('*').eq('id', sourceId).single();
  if (!source) throw new Error('Source not found');
  const text = source.normalized_text || source.raw_text;
  if (!text) return { claims_created: 0, warning: 'Source has no text content' };

  const result = await callAI(
    'You are a claim extraction expert. Extract factual claims from the given text. Return a JSON array of objects with keys: verbatim_text (exact quote), source_location (approximate location).',
    `Extract claims from this text:\n\n${text.substring(0, 8000)}`
  );
  if (isAiError(result)) return { claims_created: 0, warning: JSON.parse(result)._error };

  let claimList: any[];
  try { claimList = JSON.parse(result); } catch { return { claims_created: 0, warning: 'Failed to parse AI response' }; }
  if (!Array.isArray(claimList)) return { claims_created: 0, warning: 'AI returned unexpected format' };
  let created = 0;
  for (const claim of claimList) {
    const { error: insertError } = await supabase.from('claim').insert({
      project_id: projectId,
      source_id: sourceId,
      verbatim_text: claim.verbatim_text,
    });
    if (!insertError) created++;
  }
  return { claims_created: created };
}

export async function extractConcepts(supabase: any, projectId: string, claimId: string) {
  const { data: claim } = await supabase.from('claim').select('*').eq('id', claimId).single();
  if (!claim) throw new Error('Claim not found');

  const result = await callAI(
    'You are a concept extraction expert. Extract key concepts from a claim. Return a JSON array of objects with keys: conceptual_term (short term), definition (brief definition).',
    `Extract concepts from this claim:\n\n${claim.verbatim_text}`
  );
  if (isAiError(result)) return { concepts_created: 0, warning: JSON.parse(result)._error };

  const concepts = JSON.parse(result);
  const created = [];
  for (const c of concepts) {
    const { data: concept } = await supabase.from('concept').insert({
      project_id: projectId,
      conceptual_term: c.conceptual_term,
      definition: c.definition,
    }).select().single();
    if (concept) {
      await supabase.from('association').insert({
        project_id: projectId,
        claim_id: claimId,
        concept_id: concept.id,
      });
      created.push(concept);
    }
  }
  return { concepts_created: created.length };
}

export async function detectConflicts(supabase: any, projectId: string, sourceId: string) {
  const { data: claims } = await supabase.from('claim').select('*').eq('source_id', sourceId).is('deleted_at', null);
  if (!claims || claims.length < 2) {
    return { conflicts_created: 0, warning: 'Need at least 2 claims to detect conflicts' };
  }

  const claimsText = claims.map((c: any) => `[${c.id}] ${c.verbatim_text}`).join('\n');
  const result = await callAI(
    'You are a conflict detection expert. Analyze claims for logical contradictions or disagreements. Return a JSON array of objects with keys: claim_ids (array of 2+ claim IDs), conflict_classification (type of conflict), contextual_applicability_check (notes).',
    `Analyze these claims for conflicts:\n\n${claimsText}`
  );
  if (isAiError(result)) return { conflicts_created: 0, warning: JSON.parse(result)._error };

  let conflicts: any[];
  try { conflicts = JSON.parse(result); } catch { return { conflicts_created: 0, warning: 'Failed to parse AI response' }; }
  if (!Array.isArray(conflicts)) return { conflicts_created: 0, warning: 'AI returned unexpected format' };
  for (const conflict of conflicts) {
    const { data: c } = await supabase.from('conflict').insert({
      project_id: projectId,
      conflict_classification: conflict.conflict_classification,
      contextual_applicability_check: conflict.contextual_applicability_check || '',
    }).select().single();
    if (c) {
      for (const claimId of conflict.claim_ids) {
        await supabase.from('claim_conflict').insert({
          project_id: projectId,
          claim_id: claimId,
          conflict_id: c.id,
        });
      }
    }
  }
  return { conflicts_created: conflicts.length };
}

export async function interpretClaim(supabase: any, projectId: string, claimId: string) {
  const { data: claim } = await supabase.from('claim').select('*').eq('id', claimId).single();
  if (!claim) throw new Error('Claim not found');
  const { data: associations } = await supabase.from('association').select('concept_id').eq('claim_id', claimId);
  const conceptIds = (associations || []).map((a: any) => a.concept_id);
  let conceptsContext = '';
  if (conceptIds.length > 0) {
    const { data: concepts } = await supabase.from('concept').select('*').in('id', conceptIds);
    conceptsContext = (concepts || []).map((c: any) => `${c.conceptual_term}: ${c.definition}`).join('\n');
  }

  const result = await callAI(
    'You are an interpretation expert. Generate an interpretation that explains the significance and implications of a claim. Return JSON with keys: interpretation_statement, reasoning_chain, interpretation_foundation.',
    `Claim: ${claim.verbatim_text}\n\nRelated concepts:\n${conceptsContext || 'None'}\n\nGenerate an interpretation.`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const interpretation = JSON.parse(result);
  const { data: created } = await supabase.from('interpretation').insert({
    project_id: projectId,
    claim_id: claimId,
    interpretation_statement: interpretation.interpretation_statement,
    reasoning_chain: interpretation.reasoning_chain || '',
    interpretation_foundation: interpretation.interpretation_foundation || '',
  }).select().single();
  return created;
}

export async function generateQuestion(supabase: any, projectId: string, conflictId: string) {
  const { data: conflict } = await supabase.from('conflict').select('*').eq('id', conflictId).single();
  if (!conflict) throw new Error('Conflict not found');

  const result = await callAI(
    'You are a research question generator. Given a conflict between claims, generate research questions that could help resolve it. Return JSON with keys: question_statement, inquiry_origin, domain_relevance.',
    `Conflict: ${conflict.conflict_classification}\nDetails: ${conflict.contextual_applicability_check || ''}\n\nGenerate a research question.`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const question = JSON.parse(result);
  const { data: created } = await supabase.from('research_question').insert({
    project_id: projectId,
    conflict_id: conflictId,
    question_statement: question.question_statement,
    inquiry_origin: question.inquiry_origin || '',
    domain_relevance: question.domain_relevance || '',
  }).select().single();
  return created;
}

export async function generateHypothesis(supabase: any, projectId: string, questionId: string) {
  const { data: question } = await supabase.from('research_question').select('*').eq('id', questionId).single();
  if (!question) throw new Error('Research question not found');

  const result = await callAI(
    'You are a hypothesis generator. Generate a testable hypothesis from a research question. Return JSON with keys: hypothesis_statement, variable_specification, measurement_specification.',
    `Question: ${question.question_statement}\n\nGenerate a hypothesis.`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const hypothesis = JSON.parse(result);
  const { data: created } = await supabase.from('hypothesis').insert({
    project_id: projectId,
    research_question_id: questionId,
    hypothesis_statement: hypothesis.hypothesis_statement,
    variable_specification: hypothesis.variable_specification || '',
    measurement_specification: hypothesis.measurement_specification || '',
  }).select().single();
  return created;
}

export async function generateInsights(supabase: any, projectId: string) {
  const { data: trades } = await supabase.from('trade').select('pair, direction, result, pnl, rr, entry_price, exit_price, notes').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false }).limit(20);
  if (!trades || trades.length === 0) return { insights: [], warning: 'Not enough trades to generate insights' };

  const result = await callAI(
    'You are a trading insight generator. Analyze recent trades and generate actionable insights. Return a JSON array of objects with keys: title (short title), description (1-2 sentence insight), category (one of: pattern, risk, psychology, strategy, execution, market), priority (high/medium/low).',
    `Generate insights from these recent trades:\n\n${JSON.stringify(trades)}`
  );
  if (isAiError(result)) return { insights: [], warning: JSON.parse(result)._error };

  let insightList: any[];
  try { insightList = JSON.parse(result); } catch { return { insights: [], warning: 'Failed to parse AI response' }; }
  if (!Array.isArray(insightList)) return { insights: [], warning: 'AI returned unexpected format' };

  const created = [];
  for (const insight of insightList) {
    const { data: row } = await supabase.from('ai_insight').insert({
      project_id: projectId,
      title: insight.title,
      description: insight.description,
      category: insight.category || 'general',
      priority: insight.priority || 'medium',
      source: 'ai',
    }).select().single();
    if (row) created.push(row);
  }
  return { insights: created };
}

export async function detectObservations(supabase: any, projectId: string) {
  const { data: trades } = await supabase.from('trade').select('pair, direction, result, pnl, rr, entry_price, exit_price, notes, created_at').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false }).limit(30);
  if (!trades || trades.length < 3) return { observations: [], warning: 'Not enough trades to detect patterns' };

  const result = await callAI(
    'You are a trading psychology analyst. Analyze recent trades and identify behavioral patterns and observations. Return a JSON array of objects with keys: title (short title), description (1-2 sentence observation), category (one of: behavior, psychology, habit, pattern, risk, discipline), severity (high/medium/low).',
    `Analyze these trades for behavioral observations:\n\n${JSON.stringify(trades)}`
  );
  if (isAiError(result)) return { observations: [], warning: JSON.parse(result)._error };

  let obsList: any[];
  try { obsList = JSON.parse(result); } catch { return { observations: [], warning: 'Failed to parse AI response' }; }
  if (!Array.isArray(obsList)) return { observations: [], warning: 'AI returned unexpected format' };

  const created = [];
  for (const obs of obsList) {
    const { data: row } = await supabase.from('learning_observation').insert({
      project_id: projectId,
      title: obs.title,
      description: obs.description,
      category: obs.category || 'behavior',
      severity: obs.severity || 'medium',
      source: 'ai',
    }).select().single();
    if (row) created.push(row);
  }
  return { observations: created };
}

export async function refreshKnowledgeRules(supabase: any, projectId: string) {
  const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).limit(200);
  if (!trades || trades.length < 3) throw new Error('Not enough trades');

  const summary = trades.map((t: any) =>
    `${t.pair} ${t.direction} ${t.result} PnL:${t.pnl} RR:${t.rr}`
  ).join('\n');

  const result = await callAI(
    'You are a knowledge discovery engine. Analyze trade data to discover trading rules/knowledge. Return a JSON array of rule objects with keys: title, description, category, confidence (0-1), wins, losses, avg_rr, signature (string).',
    `Discover knowledge from these trades:\n\n${summary}`
  );
  if (isAiError(result)) return { rules_created: 0, warning: JSON.parse(result)._error };

  const rules = JSON.parse(result);
  const created = [];
  for (const r of rules) {
    const { data: rule } = await supabase.from('knowledge_rule').insert({
      project_id: projectId,
      name: r.title,
      title: r.title,
      description: r.description || '',
      category: r.category || 'discovered',
      confidence: r.confidence != null ? Math.round(r.confidence * 100) : 50,
      wins: typeof r.wins === 'number' ? r.wins : 0,
      losses: typeof r.losses === 'number' ? r.losses : 0,
      avg_rr: typeof r.avg_rr === 'number' ? r.avg_rr : 0,
      signature: r.signature || '',
    }).select().single();
    if (rule) created.push(rule);
  }
  return { rules_created: created.length };
}

export async function refreshKnowledgeGraph(supabase: any, projectId: string) {
  const { data: sources } = await supabase.from('source').select('id, normalized_text').eq('project_id', projectId).limit(50);
  const { data: claims } = await supabase.from('claim').select('id, verbatim_text').eq('project_id', projectId).limit(100);
  const { data: concepts } = await supabase.from('concept').select('id, conceptual_term').eq('project_id', projectId).limit(100);

  const existingCount = (concepts || []).length;
  const result = await callAI(
    'You are a knowledge graph builder. Given sources, claims, and concepts, identify important relationships to build a knowledge graph. Return a JSON array of edge objects with keys: source (concept name), target (concept name), relationship (string), strength (0-1).',
    `Build knowledge graph edges from:\nConcepts: ${(concepts || []).map((c: any) => c.conceptual_term).join(', ')}`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const edges = JSON.parse(result);

  const created = [];
  for (const e of edges) {
    const getOrCreateNode = async (name: string) => {
      const { data: existing } = await supabase.from('knowledge_node').select('id').eq('project_id', projectId).eq('name', name).maybeSingle();
      if (existing) return existing;
      const { data: node } = await supabase.from('knowledge_node').insert({
        project_id: projectId, type: 'concept', name,
      }).select().single();
      return node;
    };

    const sourceNode = await getOrCreateNode(e.source);
    const targetNode = await getOrCreateNode(e.target);
    if (sourceNode && targetNode) {
      await supabase.from('knowledge_edge').upsert({
        project_id: projectId,
        source_node_id: sourceNode.id,
        target_node_id: targetNode.id,
        relationship: e.relationship || 'CORRELATED',
        strength: e.strength || 0.5,
      }, { onConflict: 'source_node_id,target_node_id,relationship' });
      created.push({ source: e.source, target: e.target, relationship: e.relationship });
    }
  }

  await supabase.from('knowledge_graph_snapshot').insert({
    project_id: projectId,
    total_nodes: existingCount,
    total_edges: created.length,
    summary: `Graph built from ${existingCount} concepts and ${created.length} relationships`,
  });

  return { nodes: existingCount, edges_created: created.length };
}

export async function ingestDocument(supabase: any, projectId: string, sourceId: string) {
  const { data: source } = await supabase.from('source').select('*').eq('id', sourceId).single();
  if (!source) throw new Error('Source not found');

  const text = source.normalized_text || source.raw_text;
  if (!text) return { chunks_created: 0, warning: 'Source has no text content' };

  const wordCount = text.split(/\s+/).length;
  const pageEstimate = Math.ceil(wordCount / 300) || 1;
  const { chunks, sections } = chunkTextAdvanced(text, 500, 50);
  if (chunks.length === 0) return { chunks_created: 0, warning: 'Text too short to chunk' };

  const filename = source.source_metadata?.original_name ?? source.id;

  const { data: ingestion, error: ingestError } = await supabase.from('ai_document_ingestion').insert({
    project_id: projectId,
    source_id: sourceId,
    filename,
    source_type: 'source',
    status: 'processing',
    progress: { stage: 'chunking', pct: 10 },
    page_count: pageEstimate,
    word_count: wordCount,
  }).select().single();

  if (ingestError || !ingestion) throw new Error('Failed to create ingestion record');

  let created = 0;
  const batchSize = 5;
  for (let i = 0; i < chunks.length; i += batchSize) {
    await supabase.from('ai_document_ingestion').update({
      progress: { stage: 'embeddings', pct: Math.round(10 + (i / chunks.length) * 80) },
    }).eq('id', ingestion.id);

    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await Promise.all(batch.map(c => generateEmbedding(c)));

    for (let j = 0; j < batch.length; j++) {
      const idx = i + j;
      const pageNum = Math.min(Math.ceil((chunks.slice(0, idx + 1).join(' ').split(/\s+/).length) / 300) || 1, pageEstimate);
      const { error: chunkError } = await supabase.from('ai_document_chunk').insert({
        project_id: projectId,
        ingestion_id: ingestion.id,
        chunk_index: idx,
        content: batch[j],
        page: pageNum,
        section_title: sections[idx] || null,
        embedding: embeddings[j] ?? undefined,
        token_count: Math.ceil(batch[j].split(/\s+/).length),
      });
      if (!chunkError) created++;
    }
  }

  await supabase.from('ai_document_ingestion').update({
    status: 'completed',
    chunk_count: created,
    progress: { stage: 'indexed', pct: 100 },
  }).eq('id', ingestion.id);

  const docIds = [sourceId];

  const autoExtract = async (label: string, fn: () => Promise<any>) => {
    try {
      const result = await fn();
      await supabase.from('learning_event').insert({
        project_id: projectId, event_type: 'document_analysis', entity_type: 'source',
        status: 'completed', summary: `${label}: ${JSON.stringify(result).substring(0, 200)}`,
      });
    } catch (e: any) {
      await supabase.from('learning_event').insert({
        project_id: projectId, event_type: 'document_analysis', entity_type: 'source',
        status: 'failed', summary: `${label}: ${e?.message || 'unknown error'}`,
      });
    }
  };

  await Promise.allSettled([
    autoExtract('Summary', () => {
      const prompt = `Summarize this trading document concisely. Extract: summary (2-3 sentences), keywords (up to 10), trading_relevance (high/medium/low), action_items (array of strings). Return JSON.`;
      return callAI(prompt, text.substring(0, 6000), undefined, 1024);
    }),
    autoExtract('Rules', () => extractRules(supabase, projectId, sourceId)),
    autoExtract('Flashcards', () => generateFlashcards(supabase, projectId, docIds)),
    autoExtract('Questions', () => suggestQuestions(supabase, projectId, sourceId)),
    autoExtract('StudyNotes', () => generateStudyNotes(supabase, projectId, docIds)),
  ]);

  await supabase.from('learning_event').insert({
    project_id: projectId, event_type: 'document_ingested', entity_type: 'source',
    entity_id: sourceId, status: 'completed',
    summary: `Ingested document with ${created} chunks, ${pageEstimate} pages`,
    metadata_json: { chunk_count: created, page_count: pageEstimate, word_count: wordCount, filename },
  });

  refreshKnowledgeGraph(supabase, projectId).catch(() => {});

  return {
    chunks_created: created,
    total_chunks: chunks.length,
    ingestion_id: ingestion.id,
    page_count: pageEstimate,
    word_count: wordCount,
  };
}

export async function journalAnalyze(supabase: any, projectId: string, documentId: string) {
  const { data: source } = await supabase.from('source').select('*').eq('id', documentId).single();
  if (!source) throw new Error('Source not found');
  const text = source.normalized_text || source.raw_text;
  if (!text) return { warning: 'No text content' };

  const result = await callAI(
    `You are a trading journal analyst. Analyze this journal entry and identify:
1. Repeated mistakes - list each mistake with specific examples from the text
2. Trading patterns - identify recurring patterns in behavior
3. Psychological observations - note emotional/psychological patterns
4. Strengths - what the trader does well
5. Actionable improvements - specific recommendations

Return a JSON object with keys: mistakes (array of {mistake, examples[], severity}), patterns (array of {pattern, frequency, impact}), psychology (array of {observation, evidence}), strengths (array of string), improvements (array of string).`,
    `Analyze this trading journal:\n\n${text.substring(0, 8000)}`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  try {
    const analysis = JSON.parse(result);
    const { data: stored } = await supabase.from('document_journal_analysis').insert({
      project_id: projectId,
      document_id: documentId,
      analysis_type: 'journal_analysis',
      content: analysis,
    }).select().single();
    return { analysis: stored || analysis };
  } catch {
    return { analysis: { raw: result } };
  }
}

export async function generateFlashcards(supabase: any, projectId: string, documentIds: string[]) {
  let context = '';
  for (const docId of documentIds) {
    const { data: source } = await supabase.from('source').select('*').eq('id', docId).single();
    if (source) {
      context += `\n\n--- ${source.name || docId} ---\n${(source.normalized_text || source.raw_text || '').substring(0, 3000)}`;
    }
  }
  if (!context) return { flashcards: [], warning: 'No document content found' };

  const result = await callAI(
    'You are a flashcard generator. Create study flashcards from the provided document content. Return a JSON array of objects with keys: front (question/concept), back (answer/definition), topic, difficulty (beginner/intermediate/advanced). Generate 10-20 flashcards.',
    `Generate flashcards from:\n${context}`
  );
  if (isAiError(result)) return { flashcards: [], warning: JSON.parse(result)._error };
  try { return { flashcards: JSON.parse(result) }; } catch { return { flashcards: [], warning: 'Failed to parse AI response' }; }
}

export async function compareDocuments(supabase: any, projectId: string, documentIds: string[]) {
  let contexts: any[] = [];
  for (const docId of documentIds) {
    const { data: source } = await supabase.from('source').select('*').eq('id', docId).single();
    if (source) {
      contexts.push({
        id: source.id,
        name: source.name || source.id,
        text: (source.normalized_text || source.raw_text || '').substring(0, 4000),
      });
    }
  }
  if (contexts.length < 2) return { comparison: null, warning: 'Need at least 2 documents to compare' };

  const docsText = contexts.map(d => `--- Document: ${d.name} ---\n${d.text}`).join('\n\n');
  const result = await callAI(
    `You are a document comparison expert. Compare the provided documents and identify:
1. Key similarities between documents
2. Key differences
3. Complementary information (what each document adds)
4. Contradictions or conflicts
5. Synthesis - integrated summary

Return a JSON object with keys: similarities (array), differences (array), complementary (array), contradictions (array), synthesis (string).`,
    `Compare these documents:\n\n${docsText}`
  );
  if (isAiError(result)) return { comparison: null, warning: JSON.parse(result)._error };
  try { return { comparison: JSON.parse(result) }; } catch { return { comparison: null, warning: 'Failed to parse AI response' }; }
}

export async function extractRules(supabase: any, projectId: string, documentId: string) {
  const { data: source } = await supabase.from('source').select('*').eq('id', documentId).single();
  if (!source) throw new Error('Source not found');
  const text = source.normalized_text || source.raw_text;
  if (!text) return { rules: [], warning: 'No text content' };

  const result = await callAI(
    'You are a trading rules extraction expert. Extract every trading rule, principle, and key concept from the document. Return a JSON array of objects with keys: rule (the rule statement), category (entry/exit/risk/psychology/management/confluence/other), page (approximate page number if inferable), importance (critical/important/supplementary).',
    `Extract trading rules from:\n\n${text.substring(0, 8000)}`
  );
  if (isAiError(result)) return { rules: [], warning: JSON.parse(result)._error };
  try { return { rules: JSON.parse(result) }; } catch { return { rules: [], warning: 'Failed to parse AI response' }; }
}

export async function generateQuiz(supabase: any, projectId: string, documentIds: string[]) {
  let context = '';
  for (const docId of documentIds) {
    const { data: source } = await supabase.from('source').select('*').eq('id', docId).single();
    if (source) context += `\n\n--- ${source.name || docId} ---\n${(source.normalized_text || source.raw_text || '').substring(0, 3000)}`;
  }
  if (!context) return { questions: [], warning: 'No document content found' };

  const result = await callAI(
    'You are a quiz generator. Create test questions from the provided document content. Generate 10 questions with varying difficulty. Return a JSON array of objects with keys: question (string), options (array of 4 strings), correct_index (0-3), explanation (string), topic (string), difficulty (easy/medium/hard).',
    `Generate quiz questions from:\n${context}`
  );
  if (isAiError(result)) return { questions: [], warning: JSON.parse(result)._error };
  try { return { questions: JSON.parse(result) }; } catch { return { questions: [], warning: 'Failed to parse AI response' }; }
}

export async function generateStudyNotes(supabase: any, projectId: string, documentIds: string[]) {
  let context = '';
  for (const docId of documentIds) {
    const { data: source } = await supabase.from('source').select('*').eq('id', docId).single();
    if (source) context += `\n\n--- ${source.name || docId} ---\n${(source.normalized_text || source.raw_text || '').substring(0, 4000)}`;
  }
  if (!context) return { notes: null, warning: 'No document content found' };

  const result = await callAI(
    `You are a study notes generator. Create comprehensive, well-structured study notes from the provided documents. Organize by topics and subtopics. Include key concepts, definitions, examples, and important quotes.

Return a JSON object with keys: title (string), topics (array of {topic, subtopics: array of {subtopic, content, key_points: string[], quotes: string[]}}), summary (string), key_takeaways (string[]).`,
    `Generate study notes from:\n${context}`
  );
  if (isAiError(result)) return { notes: null, warning: JSON.parse(result)._error };
  try { return { notes: JSON.parse(result) }; } catch { return { notes: null, warning: 'Failed to parse AI response' }; }
}

export async function findConfluences(supabase: any, projectId: string, documentIds: string[]) {
  let context = '';
  for (const docId of documentIds) {
    const { data: source } = await supabase.from('source').select('*').eq('id', docId).single();
    if (source) context += `\n\n--- ${source.name || docId} ---\n${(source.normalized_text || source.raw_text || '').substring(0, 3000)}`;
  }
  if (!context) return { confluences: [], warning: 'No document content found' };
  if (documentIds.length < 2) return { confluences: [], warning: 'Need at least 2 documents to find confluences' };

  const result = await callAI(
    `You are a trading confluence analyst. Analyze the provided documents and identify areas of confluence (agreement/correlation) between them.

For example, if one document talks about liquidity sweeps and another discusses entries after sweeps, that's a confluence.

Return a JSON array of objects with keys: concept (string), documents (string[] - document names), description (string), confidence (0-1), trading_application (string).`,
    `Find confluences across these documents:\n${context}`
  );
  if (isAiError(result)) return { confluences: [], warning: JSON.parse(result)._error };
  try { return { confluences: JSON.parse(result) }; } catch { return { confluences: [], warning: 'Failed to parse AI response' }; }
}

export async function suggestQuestions(supabase: any, projectId: string, documentId: string) {
  const { data: source } = await supabase.from('source').select('*').eq('id', documentId).single();
  if (!source) return { questions: [], warning: 'Document not found' };
  const text = (source.normalized_text || source.raw_text || '').substring(0, 4000);

  const result = await callAI(
    `You are an AI research assistant. Given a document, generate 6-8 specific, insightful questions that a trader could ask about this document to deepen their understanding.

Return ONLY a JSON array of strings. Each question should:
- Be specific to the document content (not generic)
- Test understanding of key concepts
- Ask about practical trading applications
- Probe for contradictions or unclear points
- Challenge assumptions in the document

Example: "How does the concept of liquidity sweeps in this document differ from conventional ICT teachings when applied to lower timeframes?"`,
    `Generate suggested questions for this document (${source.name || 'Untitled'}):\n\n${text}`
  );
  if (isAiError(result)) return { questions: [], warning: JSON.parse(result)._error };
  try { const parsed = JSON.parse(result); return { questions: Array.isArray(parsed) ? parsed : parsed.questions || [] }; }
  catch { return { questions: [], warning: 'Failed to parse AI response' }; }
}

export async function findRelatedDocuments(supabase: any, projectId: string, documentId: string) {
  const { data: source } = await supabase.from('source').select('*').eq('id', documentId).single();
  if (!source) return { related: [], warning: 'Document not found' };

  const query = (source.normalized_text || source.raw_text || '').substring(0, 2000);
  if (!openaiApiKey) return { related: [], method: 'disabled' };

  const embeddingResponse = await fetch(`${openaiBaseUrl}/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
  });
  if (!embeddingResponse.ok) return { related: [], method: 'disabled' };
  const embedJson = await embeddingResponse.json();
  const embedding = embedJson.data[0].embedding;

  const { data: results } = await supabase.rpc('search_documents', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 10,
    p_project_id: projectId,
  });

  const { data: ingestions } = await supabase.from('ai_document_ingestion')
    .select('id, source_id').in('id', (results || []).map((r: any) => r.id));
  const ingMap = new Map((ingestions || []).map((i: any) => [i.id, i.source_id]));

  const related = (results || [])
    .map((r: any) => ({ ...r, src: ingMap.get(r.id) }))
    .filter((r: any) => r.src && r.src !== documentId)
    .map((r: any) => ({
      source_id: r.src,
      title: r.filename || (r.src || '').slice(0, 8),
      similarity: r.similarity,
      snippet: r.content?.substring(0, 200) || '',
    }));

  return { related, method: 'vector' };
}

export async function crossDocumentReasoning(supabase: any, projectId: string, documentIds: string[]) {
  let context = '';
  for (const docId of documentIds) {
    const { data: source } = await supabase.from('source').select('*').eq('id', docId).single();
    if (source) context += `\n\n--- ${source.name || docId} ---\n${(source.normalized_text || source.raw_text || '').substring(0, 2500)}`;
  }
  if (!context) return { reasoning: null, warning: 'No document content found' };

  const result = await callAI(
    `You are a cross-document reasoning engine for trading research. Analyze the provided documents and produce a structured analysis.

Return ONLY valid JSON with this structure:
{
  "shared_concepts": [{"concept": "string", "documents": ["doc1", "doc2"], "explanation": "string"}],
  "contradictions": [{"concept": "string", "docs_disagreeing": ["doc1", "doc2"], "explanation": "string", "resolution_suggestion": "string"}],
  "complementary_insights": [{"insight": "string", "source_docs": ["doc1"], "supported_by": ["doc2"], "trading_application": "string"}],
  "synthesis": "string - a unified summary that integrates all documents",
  "gaps": ["string - areas not covered that would be useful to research"]
}`,
    `Perform cross-document reasoning on these documents:\n${context}`
  );
  if (isAiError(result)) return { reasoning: null, warning: JSON.parse(result)._error };
  try { return { reasoning: JSON.parse(result) }; }
  catch { return { reasoning: null, warning: 'Failed to parse AI response' }; }
}

export async function getRecommendations(supabase: any, projectId: string, documentIds: string[]) {
  let context = '';
  const { data: allSources } = await supabase.from('source')
    .select('*')
    .eq('project_id', projectId)
    .limit(10);
  const docsToAnalyze = documentIds.length > 0
    ? (allSources || []).filter((s: any) => documentIds.includes(s.id))
    : (allSources || []).slice(0, 5);

  for (const source of docsToAnalyze) {
    context += `\n\n--- ${source.name || source.id} (${source.origin_type || 'unknown'}) ---\n${(source.normalized_text || source.raw_text || '').substring(0, 2000)}`;
  }
  if (!context) return { recommendations: [], warning: 'No documents available for analysis' };

  const result = await callAI(
    `You are a trading intelligence AI. Based on the user's uploaded documents (trading journals, educational materials, research papers), generate personalized actionable recommendations.

Return ONLY valid JSON with this structure:
{
  "recommendations": [
    {
      "category": "trading_rule|risk_management|psychology|strategy|learning",
      "priority": "high|medium|low",
      "title": "string",
      "description": "string",
      "rationale": "string - why this recommendation is relevant to THIS trader's specific materials",
      "document_references": ["document names that support this"],
      "action_items": ["specific actionable step 1", "step 2"]
    }
  ],
  "summary": "string - a brief summary of the overall recommendation theme"
}

Generate 3-6 recommendations. Be specific to the content, not generic advice.`,
    `Analyze these uploaded documents and generate personalized trading recommendations:\n${context}`
  );
  if (isAiError(result)) return { recommendations: [], warning: JSON.parse(result)._error };
  try { const parsed = JSON.parse(result); return { recommendations: parsed.recommendations || [], summary: parsed.summary || '' }; }
  catch { return { recommendations: [], warning: 'Failed to parse AI response' }; }
}

export async function getKnowledgeGraphData(supabase: any, projectId: string) {
  const { data: nodes } = await supabase.from('knowledge_node')
    .select('id, name, type')
    .eq('project_id', projectId)
    .limit(100);
  const { data: edges } = await supabase.from('knowledge_edge')
    .select('id, source_node_id, target_node_id, relationship, strength')
    .eq('project_id', projectId)
    .limit(200);

  if (!nodes || nodes.length === 0) {
    const { data: concepts } = await supabase.from('knowledge_concept')
      .select('id, title, summary, category_id, knowledge_category!inner(name, color)')
      .eq('project_id', projectId)
      .limit(100);
    const { data: relationships } = await supabase.from('knowledge_relationship')
      .select('id, source_concept_id, target_concept_id, relationship_type, strength')
      .eq('project_id', projectId)
      .limit(200);

    const graphNodes = (concepts || []).map((c: any) => ({
      id: c.id,
      name: c.title,
      type: 'concept',
      category: c.knowledge_category?.name || 'General',
      color: c.knowledge_category?.color || '#6366f1',
      summary: c.summary || '',
    }));
    const graphEdges = (relationships || []).map((r: any) => ({
      id: r.id,
      source: r.source_concept_id,
      target: r.target_concept_id,
      relationship: r.relationship_type,
      strength: r.strength || 0.5,
    }));
    return { nodes: graphNodes, edges: graphEdges };
  }

  return {
    nodes: nodes.map((n: any) => ({ id: n.id, name: n.name, type: n.type })),
    edges: edges.map((e: any) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      relationship: e.relationship,
      strength: e.strength,
    })),
  };
}

export async function autoLink(supabase: any, projectId: string) {
  const { data: claims } = await supabase.from('claim')
    .select('id, verbatim_text, source_id').eq('project_id', projectId).is('deleted_at', null).limit(50);
  const { data: trades } = await supabase.from('trade')
    .select('id, pair, notes, result').eq('project_id', projectId).is('deleted_at', null).limit(50);
  const { data: concepts } = await supabase.from('knowledge_concept')
    .select('id, title, summary').eq('project_id', projectId).limit(50);

  const linkPairs: { source: string; sourceId: string; target: string; targetId: string; relationship: string }[] = [];

  for (const claim of claims || []) {
    for (const trade of trades || []) {
      if (trade.notes && claim.verbatim_text && trade.notes.toLowerCase().includes(claim.verbatim_text.substring(0, 20).toLowerCase())) {
        linkPairs.push({ source: 'claim', sourceId: claim.id, target: 'trade', targetId: trade.id, relationship: 'informs' });
      }
    }
    for (const concept of concepts || []) {
      if (concept.title && claim.verbatim_text && claim.verbatim_text.toLowerCase().includes(concept.title.toLowerCase())) {
        linkPairs.push({ source: 'claim', sourceId: claim.id, target: 'concept', targetId: concept.id, relationship: 'references' });
      }
    }
  }

  let linked = 0;
  for (const pair of linkPairs) {
    const { error } = await supabase.from('knowledge_link').upsert({
      project_id: projectId, source_type: pair.source, source_id: pair.sourceId,
      target_type: pair.target, target_id: pair.targetId,
      relationship: pair.relationship, strength: 0.5,
    }, { onConflict: 'source_type,source_id,target_type,target_id' });
    if (!error) linked++;
  }

  return { links_created: linked, total_candidates: linkPairs.length };
}

export async function rebuildLearning(supabase: any, projectId: string) {
  const [tRes, sRes, clRes, coRes, iRes, pRes, mRes] = await Promise.all([
    supabase.from('trade').select('id').eq('project_id', projectId).is('deleted_at', null),
    supabase.from('source').select('id').eq('project_id', projectId).is('deleted_at', null),
    supabase.from('claim').select('id').eq('project_id', projectId).is('deleted_at', null),
    supabase.from('concept').select('id').eq('project_id', projectId).is('deleted_at', null),
    supabase.from('interpretation').select('id').eq('project_id', projectId).is('deleted_at', null),
    supabase.from('personal_pattern').select('id').eq('project_id', projectId),
    supabase.from('market_structure').select('id').eq('project_id', projectId),
  ]);
  const totals = {
    total_trades: (tRes.data || []).length,
    total_patterns: (pRes.data || []).length,
    total_claims: (clRes.data || []).length,
    total_concepts: (coRes.data || []).length,
    total_sources: (sRes.data || []).length,
    total_interpretations: (iRes.data || []).length,
    total_similarities: 0,
  };
  const startedAt = Date.now();
  const { data: snapshot } = await supabase.from('knowledge_snapshot').insert({
    project_id: projectId,
    ...totals,
    win_rate: 0, avg_rr: 0, expectancy: 0, knowledge_growth: 0,
  }).select().single();
  const { data: event } = await supabase.from('learning_event').insert({
    project_id: projectId, event_type: 'rebuild', entity_type: 'knowledge_snapshot', status: 'SUCCESS', duration_ms: Date.now() - startedAt, summary: `Rebuilt knowledge: ${JSON.stringify(totals)}`,
  }).select().single();
  return {
    event_id: event?.id || '',
    status: 'SUCCESS',
    duration_ms: Date.now() - startedAt,
    steps_completed: ['count_trades', 'count_sources', 'count_claims', 'count_concepts', 'count_interpretations', 'count_patterns', 'count_market_structures', 'create_snapshot', 'log_event'],
    errors: [],
  };
}

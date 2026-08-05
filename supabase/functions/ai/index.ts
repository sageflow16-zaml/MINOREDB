import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { logger, CircuitBreaker, RetryStrategy, isRetryableError } from '../_shared/logging.ts';
import {
  extractClaims, extractConcepts, detectConflicts, interpretClaim, generateQuestion,
  generateHypothesis, generateInsights, detectObservations, refreshKnowledgeRules,
  refreshKnowledgeGraph, ingestDocument, journalAnalyze, generateFlashcards,
  compareDocuments, extractRules, generateQuiz, generateStudyNotes, findConfluences,
  suggestQuestions, findRelatedDocuments, crossDocumentReasoning, getRecommendations,
  getKnowledgeGraphData, autoLink, rebuildLearning,
} from './knowledge.ts';
import {
  generateDebrief, detectPatterns, generateRules, buildProfile, generateCoaching,
  generateTradeMemory, analyzeTrade, evaluateCurrent, learningStatus,
  analyzeProfile, generateRecommendations, generatePerformanceSummary, buildContext,
} from './trading.ts';
import {
  ragChat, ragSearch, researchChat, semanticSearch, getRelevantMemories, storeMemory,
} from './rag.ts';
import {
  copilotChat, listCopilotTools, executeCopilotTool, copilotSearch,
  copilotIngest, executeCopilotWorkflow, getMessageCitations,
} from './copilot.ts';
import {
  askPortfolioAI, detectMarketRegime, checkMarketAlerts,
  autoPopulateTimeline, marketAIContext,
} from './market.ts';

export const openaiApiKey = Deno.env.get('OPENROUTER_API_KEY') || '';
export const openaiBaseUrl = Deno.env.get('OPENAI_BASE_URL') || 'https://openrouter.ai/api/v1';
export const defaultModel = Deno.env.get('AI_MODEL') || 'openrouter/auto';

const openaiCircuitBreaker = new CircuitBreaker('openai', 5, 60000, 60000);

function getSupabaseClient(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

export function aiNotConfiguredMsg() {
  return 'AI service is not configured. Set OPENROUTER_API_KEY in your project secrets to enable AI features.';
}

export async function callAI(systemPrompt: string, userPrompt: string, model = defaultModel, maxTokens = 2048) {
  if (!openaiApiKey) {
    return JSON.stringify({ _error: aiNotConfiguredMsg() });
  }

  try {
    const result = await openaiCircuitBreaker.call(() =>
      RetryStrategy.withBackoff(
        async () => {
          const response = await fetch(`${openaiBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiApiKey}`,
              'HTTP-Referer': 'https://minoredb.vercel.app',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              max_tokens: maxTokens,
              temperature: 0.3,
            }),
          });

          if (!response.ok) {
            const err = await response.text();
            const retryable = response.status >= 500 || response.status === 429;
            logger.error('AI API error', {
              status: response.status,
              retryable,
              model,
              error_preview: err.slice(0, 200),
            });

            if (response.status === 429 || response.status >= 500) {
              const error = new Error(`AI service error (${response.status})`) as Error & { status: number; retryable: boolean };
              error.status = response.status;
              error.retryable = retryable;
              throw error;
            }

            return JSON.stringify({ _error: `AI service error (${response.status}). Please try again later.` });
          }

          const json = await response.json();
          return json.choices[0].message.content;
        },
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          maxDelayMs: 10000,
          shouldRetry: (err) => {
            const e = err as Error & { status?: number; retryable?: boolean };
            return e.retryable ?? isRetryableError(err);
          },
          onRetry: (err, attempt) => {
            logger.warn('AI API retry', { attempt, error: (err as Error).message });
          },
        }
      )
    );

    if (typeof result === 'string' && result.includes('_error')) {
      return result;
    }

    const content = typeof result === 'string' ? result : result.choices?.[0]?.message?.content;
    if (!content) {
      return JSON.stringify({ _error: 'AI response was empty. Please try again.' });
    }
    const trimmed = content.trim();
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    return match ? match[1].trim() : trimmed;
  } catch (err) {
    if (openaiCircuitBreaker.currentFailure > 0) {
      return JSON.stringify({ _error: 'AI service temporarily unavailable due to repeated failures. Please try again in a minute.' });
    }
    logger.error('AI API fatal error', { error: (err as Error).message, stack: (err as Error).stack });
    return JSON.stringify({ _error: 'AI service error. Please try again later.' });
  }
}

export function isAiError(result: string): boolean {
  try {
    const parsed = JSON.parse(result);
    return parsed && typeof parsed === 'object' && '_error' in parsed;
  } catch {
    return false;
  }
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!openaiApiKey) return null;
  try {
    const resp = await fetch(`${openaiBaseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
        'HTTP-Referer': 'https://minoredb.vercel.app',
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    return json.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

async function generateSummary(supabase: any, projectId: string, summaryType: string, period: string) {
  const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).limit(100);

  const stats = {
    total: (trades || []).length,
    wins: (trades || []).filter((t: any) => t.result === 'WIN').length,
    losses: (trades || []).filter((t: any) => t.result === 'LOSS').length,
    totalPnl: (trades || []).reduce((s: number, t: any) => s + (t.pnl || 0), 0),
  };

  const result = await callAI(
    'You are a trading summary generator. Create a concise performance summary. Return JSON with keys: content (detailed), text_summary (one paragraph), keywords (array), sentiment (positive/neutral/negative), importance (high/medium/low).',
    `Generate a ${summaryType} summary for ${period} period.\n\nStats: ${JSON.stringify(stats)}`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const summary = JSON.parse(result);
  const { data: created } = await supabase.from('ai_summary').insert({
    project_id: projectId,
    summary_type: summaryType,
    period: period,
    content: summary.content || '',
    text_summary: summary.text_summary || '',
    keywords: summary.keywords || [],
    sentiment: summary.sentiment || 'neutral',
    importance: summary.importance || 'medium',
  }).select().single();
  return created;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const timer = logger.time('ai-function');
  try {
    const { operation, project_id, data } = await req.json() as { operation: string; project_id: string; data?: Record<string, any> };
    if (!operation) return errorResponse('Missing operation');
    if (!project_id) return errorResponse('Missing project_id');

    const supabase = getSupabaseClient(req);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse('Unauthorized', 401);

    const log = logger.with({ project_id, operation, user_id: user.id });

    try {
      switch (operation) {
      case 'chat': {
        const message = data?.message;
        if (!message) return errorResponse('Missing message');
        const result = await copilotChat(supabase, project_id, message, data?.conversation_id, data?.agent_type, data?.options || {});
        return successResponse(result);
      }
      case 'list-tools': {
        const result = await listCopilotTools();
        return successResponse(result);
      }
      case 'execute-tool': {
        const toolName = data?.tool_name;
        if (!toolName) return errorResponse('Missing tool_name');
        const result = await executeCopilotTool(supabase, project_id, toolName, data?.params || {});
        return successResponse(result);
      }
      case 'search': {
        const query = data?.query;
        if (!query) return errorResponse('Missing query');
        const result = await copilotSearch(supabase, project_id, query, data?.source_type, data?.limit);
        return successResponse(result);
      }
      case 'ingest': {
        const result = await copilotIngest(supabase, project_id);
        return successResponse(result);
      }
      case 'execute-workflow': {
        const workflowId = data?.workflow_id;
        if (!workflowId) return errorResponse('Missing workflow_id');
        const result = await executeCopilotWorkflow(supabase, project_id, workflowId);
        return successResponse(result);
      }
      case 'citations': {
        const messageId = data?.message_id;
        if (!messageId) return errorResponse('Missing message_id');
        const result = await getMessageCitations(supabase, project_id, messageId);
        return successResponse(result);
      }
      case 'context': {
        const result = await buildContext(supabase, project_id, data?.options || {});
        return successResponse(result);
      }
      case 'ask': {
        const question = data?.question;
        if (!question) return errorResponse('Missing question');
        const result = await askPortfolioAI(supabase, project_id, question);
        return successResponse(result);
      }
      case 'detect-regime': {
        const result = await detectMarketRegime(supabase, project_id, data?.symbol, data?.metrics);
        return successResponse(result);
      }
      case 'check-news-alerts': {
        const result = await checkMarketAlerts(supabase, project_id);
        return successResponse(result);
      }
      case 'auto-populate-timeline': {
        const result = await autoPopulateTimeline(supabase, project_id);
        return successResponse(result);
      }
      case 'market-context': {
        const result = await marketAIContext(supabase, project_id);
        return successResponse(result);
      }
      case 'extract-claims': {
        const sourceId = data?.source_id;
        if (!sourceId) return errorResponse('Missing source_id');
        const result = await extractClaims(supabase, project_id, sourceId);
        return successResponse(result);
      }
      case 'extract-concepts': {
        const claimId = data?.claim_id;
        if (!claimId) return errorResponse('Missing claim_id');
        const result = await extractConcepts(supabase, project_id, claimId);
        return successResponse(result);
      }
      case 'detect-conflicts': {
        const sourceId = data?.source_id;
        if (!sourceId) return errorResponse('Missing source_id');
        const result = await detectConflicts(supabase, project_id, sourceId);
        return successResponse(result);
      }
      case 'interpret': {
        const claimId = data?.claim_id;
        if (!claimId) return errorResponse('Missing claim_id');
        const result = await interpretClaim(supabase, project_id, claimId);
        return successResponse(result);
      }
      case 'generate-question': {
        const conflictId = data?.conflict_id;
        if (!conflictId) return errorResponse('Missing conflict_id');
        const result = await generateQuestion(supabase, project_id, conflictId);
        return successResponse(result);
      }
      case 'generate-hypothesis': {
        const questionId = data?.research_question_id;
        if (!questionId) return errorResponse('Missing research_question_id');
        const result = await generateHypothesis(supabase, project_id, questionId);
        return successResponse(result);
      }
      case 'generate-debrief': {
        const tradeId = data?.trade_id;
        if (!tradeId) return errorResponse('Missing trade_id');
        const result = await generateDebrief(supabase, project_id, tradeId);
        return successResponse(result);
      }
      case 'generate-insights': {
        const result = await generateInsights(supabase, project_id);
        return successResponse(result);
      }
      case 'detect-observations': {
        const result = await detectObservations(supabase, project_id);
        return successResponse(result);
      }
      case 'generate-coaching': {
        const coachingType = data?.session_type ?? data?.coaching_type;
        const sessionDate = data?.date;
        const result = await generateCoaching(supabase, project_id, coachingType, sessionDate);
        return successResponse(result);
      }
      case 'detect-patterns': {
        const result = await detectPatterns(supabase, project_id);
        return successResponse(result);
      }
      case 'generate-rules': {
        const result = await generateRules(supabase, project_id);
        return successResponse(result);
      }
      case 'build-profile': {
        const result = await buildProfile(supabase, project_id);
        return successResponse(result);
      }
      case 'analyze-profile': {
        const result = await analyzeProfile(supabase, project_id);
        return successResponse(result);
      }
      case 'evaluate-trade': {
        const tradeId = data?.trade_id;
        if (!tradeId) return errorResponse('Missing trade_id');
        const result = await analyzeTrade(supabase, project_id, tradeId);
        return successResponse(result);
      }
      case 'generate-recommendations': {
        const result = await generateRecommendations(supabase, project_id);
        return successResponse(result);
      }
      case 'generate-performance-summary': {
        const result = await generatePerformanceSummary(supabase, project_id);
        return successResponse(result);
      }
      case 'build-context': {
        const result = await buildContext(supabase, project_id, data ?? {});
        return successResponse(result);
      }
      case 'generate-trade-memory': {
        const tradeId = data?.trade_id;
        if (!tradeId) return errorResponse('Missing trade_id');
        const result = await generateTradeMemory(supabase, project_id, tradeId);
        return successResponse(result);
      }
      case 'rag-chat': {
        const message = data?.message;
        if (!message) return errorResponse('Missing message');
        let conversationId = data?.conversation_id;
        if (!conversationId) {
          const { data: conv, error: convErr } = await supabase.from('ai_conversation').insert({
            project_id,
            title: message.substring(0, 80),
          }).select().single();
          if (convErr || !conv) return errorResponse(convErr?.message || 'Failed to create conversation', 400);
          conversationId = conv.id;
        }
        const result = await ragChat(supabase, project_id, conversationId, message);
        if (result?.warning) return errorResponse(result.warning, 503);
        return successResponse({
          ...result,
          answer: result?.assistant_message?.content ?? '',
          sources: [],
          evidence: [],
          conversation_id: conversationId,
        });
      }
      case 'rag-search': {
        const query = data?.query;
        if (!query) return errorResponse('Missing query');
        const result = await ragSearch(supabase, project_id, query);
        return successResponse(result);
      }
      case 'analyze-trade': {
        const tradeId = data?.trade_id;
        if (!tradeId) return errorResponse('Missing trade_id');
        const result = await analyzeTrade(supabase, project_id, tradeId);
        return successResponse(result);
      }
      case 'generate-summary': {
        const summaryType = data?.summary_type;
        const period = data?.period;
        if (!summaryType || !period) return errorResponse('Missing summary_type or period');
        const result = await generateSummary(supabase, project_id, summaryType, period);
        return successResponse(result);
      }
      case 'refresh-knowledge-rules': {
        const result = await refreshKnowledgeRules(supabase, project_id);
        return successResponse(result);
      }
      case 'ingest-document': {
        const sourceId = data?.source_id;
        if (!sourceId) return errorResponse('Missing source_id');
        const result = await ingestDocument(supabase, project_id, sourceId);
        return successResponse(result);
      }
      case 'research-chat': {
        const conversationId = data?.conversation_id;
        const message = data?.message;
        const documentIds = data?.document_ids;
        if (!conversationId || !message) return errorResponse('Missing conversation_id or message');
        const result = await researchChat(supabase, project_id, conversationId, message, documentIds);
        return successResponse(result);
      }
      case 'semantic-search': {
        const query = data?.query;
        const docIds = data?.document_ids;
        if (!query) return errorResponse('Missing query');
        const result = await semanticSearch(supabase, project_id, query, docIds);
        return successResponse(result);
      }
      case 'journal-analyze': {
        const docId = data?.document_id;
        if (!docId) return errorResponse('Missing document_id');
        const result = await journalAnalyze(supabase, project_id, docId);
        return successResponse(result);
      }
      case 'generate-flashcards': {
        const flashDocIds = data?.document_ids;
        if (!flashDocIds || !Array.isArray(flashDocIds)) return errorResponse('Missing document_ids array');
        const result = await generateFlashcards(supabase, project_id, flashDocIds);
        return successResponse(result);
      }
      case 'compare-documents': {
        const compDocIds = data?.document_ids;
        if (!compDocIds || !Array.isArray(compDocIds) || compDocIds.length < 2) return errorResponse('Need at least 2 document_ids');
        const compResult = await compareDocuments(supabase, project_id, compDocIds);
        return successResponse(compResult);
      }
      case 'extract-rules': {
        const ruleDocId = data?.document_id;
        if (!ruleDocId) return errorResponse('Missing document_id');
        const ruleResult = await extractRules(supabase, project_id, ruleDocId);
        return successResponse(ruleResult);
      }
      case 'generate-quiz': {
        const quizDocIds = data?.document_ids;
        if (!quizDocIds || !Array.isArray(quizDocIds)) return errorResponse('Missing document_ids array');
        const quizResult = await generateQuiz(supabase, project_id, quizDocIds);
        return successResponse(quizResult);
      }
      case 'generate-study-notes': {
        const notesDocIds = data?.document_ids;
        if (!notesDocIds || !Array.isArray(notesDocIds)) return errorResponse('Missing document_ids array');
        const notesResult = await generateStudyNotes(supabase, project_id, notesDocIds);
        return successResponse(notesResult);
      }
      case 'find-confluences': {
        const confDocIds = data?.document_ids;
        if (!confDocIds || !Array.isArray(confDocIds) || confDocIds.length < 2) return errorResponse('Need at least 2 document_ids');
        const confResult = await findConfluences(supabase, project_id, confDocIds);
        return successResponse(confResult);
      }
      case 'knowledge-graph-data':
      case 'knowledge-graph': {
        const graphResult = await getKnowledgeGraphData(supabase, project_id);
        return successResponse(graphResult);
      }
      case 'suggest-questions': {
        const suggestDocId = data?.document_id;
        if (!suggestDocId) return errorResponse('Missing document_id');
        const questionsResult = await suggestQuestions(supabase, project_id, suggestDocId);
        return successResponse(questionsResult);
      }
      case 'find-related': {
        const relatedDocId = data?.document_id;
        if (!relatedDocId) return errorResponse('Missing document_id');
        const relatedResult = await findRelatedDocuments(supabase, project_id, relatedDocId);
        return successResponse(relatedResult);
      }
      case 'cross-document-reasoning': {
        const crossDocIds = data?.document_ids;
        if (!crossDocIds || !Array.isArray(crossDocIds) || crossDocIds.length < 2) return errorResponse('Need at least 2 document_ids');
        const crossResult = await crossDocumentReasoning(supabase, project_id, crossDocIds);
        return successResponse(crossResult);
      }
      case 'get-recommendations': {
        const recDocIds = data?.document_ids || [];
        const recResult = await getRecommendations(supabase, project_id, recDocIds);
        return successResponse(recResult);
      }
      case 'refresh-knowledge-graph': {
        const result = await refreshKnowledgeGraph(supabase, project_id);
        return successResponse(result);
      }
      case 'evaluate-current': {
        const env = data?.environment;
        if (!env) return errorResponse('Missing environment');
        const result = await evaluateCurrent(supabase, project_id, env);
        return successResponse(result);
      }
      case 'learning-status': {
        const result = await learningStatus(supabase, project_id);
        return successResponse(result);
      }
      case 'relevant-memories': {
        const memQuery = data?.query || '';
        const memLimit = data?.limit || 10;
        const memResult = await getRelevantMemories(supabase, project_id, memQuery, memLimit);
        return successResponse(memResult);
      }
      case 'store-memory': {
        const memKey = data?.key;
        const memValue = data?.value;
        const memCategory = data?.category || 'observation';
        const memImportance = data?.importance || 1;
        if (!memKey || !memValue) return errorResponse('Missing key or value');
        const stResult = await storeMemory(supabase, project_id, memKey, memValue, memCategory, memImportance);
        return successResponse(stResult);
      }
      case 'auto-link': {
        const result = await autoLink(supabase, project_id);
        return successResponse(result);
      }
      case 'rebuild-learning': {
        const result = await rebuildLearning(supabase, project_id);
        return successResponse(result);
      }
      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
    } catch (err) {
      log.error('Operation failed', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
      return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
    } finally {
      timer.end();
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

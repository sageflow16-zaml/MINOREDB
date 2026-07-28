import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { ResearchDetail, ResearchSession } from './types';

export { ResearchDetail, ResearchSession };
export type { };

export const researchService = {
  run: async (projectId: string, question: string): Promise<{ session_id: string; status: string; message: string }> => {
    try {
      return await callEdgeFunction('ai', { operation: 'rag-chat', project_id: projectId, data: { conversation_id: '', message: question } });
    } catch {
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversation')
        .insert({ project_id: projectId, title: question, metadata: {} })
        .select()
        .single();
      if (convError || !conversation) throw convError || new Error('Failed to create conversation');
      const { error: msgError } = await supabase
        .from('ai_message')
        .insert({ conversation_id: conversation.id, role: 'user', content: question });
      if (msgError) throw msgError;
      return { session_id: conversation.id, status: 'created', message: 'Conversation created (offline mode)' };
    }
  },

  getSession: async (projectId: string, sessionId: string): Promise<ResearchDetail> => {
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversation')
      .select('*')
      .eq('id', sessionId)
      .eq('project_id', projectId)
      .maybeSingle();
    if (convError) throw convError;
    if (!conversation) {
      return { id: sessionId, project_id: projectId, question: '', status: 'unknown' };
    }

    const { data: messages } = await supabase
      .from('ai_message')
      .select('*')
      .eq('conversation_id', sessionId)
      .order('created_at', { ascending: true });

    const userMsg = (messages ?? []).find((m: any) => m.role === 'user');
    const assistantMsgs = (messages ?? []).filter((m: any) => m.role === 'assistant');
    const lastAnswer = assistantMsgs.length > 0 ? assistantMsgs[assistantMsgs.length - 1].content : undefined;

    return {
      id: sessionId,
      project_id: projectId,
      question: userMsg?.content ?? conversation.title ?? '',
      status: assistantMsgs.length > 0 ? 'completed' : 'running',
      answer: lastAnswer,
      sources: [],
      session: conversation.metadata ?? {},
      tasks: [],
      report: lastAnswer ? { summary: lastAnswer, findings: [], recommendations: [], confidence: null, sources: [] } : undefined,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
    };
  },

  getHistory: async (projectId: string): Promise<ResearchSession[]> => {
    const { data: conversations, error } = await supabase
      .from('ai_conversation')
      .select('id, project_id, title, created_at, updated_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    const ids = (conversations ?? []).map(c => c.id);
    if (ids.length === 0) return [];

    const { data: firstMessages } = await supabase
      .from('ai_message')
      .select('conversation_id, content, created_at')
      .in('conversation_id', ids)
      .eq('role', 'user')
      .order('created_at', { ascending: true });

    const { data: lastAssistant } = await supabase
      .from('ai_message')
      .select('conversation_id, created_at')
      .in('conversation_id', ids)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false });

    const firstByConv: Record<string, any> = {};
    (firstMessages ?? []).forEach(m => { if (!firstByConv[m.conversation_id]) firstByConv[m.conversation_id] = m; });
    const lastByConv: Record<string, any> = {};
    (lastAssistant ?? []).forEach(m => { if (!lastByConv[m.conversation_id]) lastByConv[m.conversation_id] = m; });

    return (conversations ?? []).map(conv => {
      const first = firstByConv[conv.id];
      const last = lastByConv[conv.id];
      const duration = first && last
        ? (new Date(last.created_at).getTime() - new Date(first.created_at).getTime()) / 1000
        : null;
      return {
        id: conv.id,
        project_id: projectId,
        title: conv.title ?? undefined,
        question: first?.content ?? conv.title ?? '',
        duration,
        status: last ? 'completed' : 'running',
        created_at: conv.created_at,
        updated_at: conv.updated_at,
      } as ResearchSession;
    });
  },
};

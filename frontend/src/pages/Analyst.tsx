import { useParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAnalystQuery } from '../hooks/useAnalyst';
import { PageHeader } from '../components/PageHeader';
import { LoadingSpinner } from '../components/ui/Feedback';
import type { EvidenceItem } from '../api/analyst';

interface ChatMessage {
  role: 'user' | 'analyst';
  question?: string;
  answer?: string;
  confidence?: number;
  sources?: string[];
  evidence?: EvidenceItem[];
}

const SOURCE_BADGES: Record<string, string> = {
  statistics: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  knowledge_rules: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  knowledge_graph: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  patterns: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  trade_memory: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  similarity: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  macro: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  learning: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
};

function EvidencePanel({ evidence }: { evidence: EvidenceItem[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        Evidence ({evidence.length})
      </h3>
      {evidence.map((item, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_BADGES[item.source] || 'bg-slate-100 text-slate-700'}`}>
            {item.source.replace(/_/g, ' ')}
          </span>
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400">
            {JSON.stringify(item.data, null, 1).slice(0, 1000)}
            {JSON.stringify(item.data, null, 1).length > 1000 ? '...' : ''}
          </pre>
        </div>
      ))}
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors = SOURCE_BADGES[source] || SOURCE_BADGES.learning;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
      {source.replace(/_/g, ' ')}
    </span>
  );
}

export default function AnalystPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mutation = useAnalystQuery();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !projectId) return;

    const userMsg: ChatMessage = { role: 'user', question: question.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');

    mutation.mutate(
      { projectId, question: question.trim() },
      {
        onSuccess: (data) => {
          const analystMsg: ChatMessage = {
            role: 'analyst',
            answer: data.answer,
            confidence: data.confidence,
            sources: data.sources,
            evidence: data.evidence,
          };
          setMessages((prev) => [...prev, analystMsg]);
        },
        onError: () => {
          const analystMsg: ChatMessage = {
            role: 'analyst',
            answer: 'There is insufficient historical evidence.',
            confidence: 0,
            sources: [],
            evidence: [],
          };
          setMessages((prev) => [...prev, analystMsg]);
        },
      },
    );
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      <PageHeader
        title="AI Research Analyst"
        description="Ask questions about your trading performance, patterns, and market connections."
      />

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex flex-1 flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-sm text-slate-400 dark:text-slate-500">
                  <p className="mb-2 text-lg">Ask a question about your trading data.</p>
                  <p className="text-xs">Examples: "How am I performing overall?" "Why did my last trade win?" "What patterns are working?"</p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'user' && (
                  <div className="flex justify-end">
                    <div className="max-w-lg rounded-2xl rounded-br-md bg-blue-600 px-4 py-2 text-sm text-white">
                      {msg.question}
                    </div>
                  </div>
                )}
                {msg.role === 'analyst' && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                      AI
                    </div>
                    <div className="max-w-xl space-y-2">
                      <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        <div className="whitespace-pre-wrap">{msg.answer}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {msg.confidence != null && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            msg.confidence >= 60 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            msg.confidence >= 30 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            Confidence: {msg.confidence}%
                          </span>
                        )}
                        {msg.sources?.map((s) => (
                          <SourceBadge key={s} source={s} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {mutation.isPending && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  AI
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2 dark:bg-slate-800">
                  <LoadingSpinner />
                  <span className="text-sm text-slate-500">Analyzing...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4 dark:border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask the analyst a question..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                disabled={mutation.isPending}
              />
              <button
                type="submit"
                disabled={mutation.isPending || !question.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Ask
              </button>
            </div>
          </form>
        </div>

        <div className="w-80 shrink-0 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-center text-xs text-slate-400">
              Evidence will appear here after you ask a question.
            </div>
          )}
          {messages
            .filter((m) => m.role === 'analyst' && m.evidence && m.evidence.length > 0)
            .slice(-1)
            .map((msg, i) => (
              <EvidencePanel key={i} evidence={msg.evidence!} />
            ))}
        </div>
      </div>
    </div>
  );
}

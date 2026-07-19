import { useParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalystQuery } from '../hooks/useAnalyst';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, EmptyState } from '../components/ui/Feedback';
import { Send, Bot, User, Sparkles, BarChart3, Brain, LineChart, BookOpen, Network, Globe, Layers, AlertCircle, Lightbulb, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';
import type { EvidenceItem } from '../api/analyst';

interface ChatMessage {
  role: 'user' | 'analyst';
  question?: string;
  answer?: string;
  confidence?: number;
  sources?: string[];
  evidence?: EvidenceItem[];
}

const SOURCE_CONFIG: Record<string, { label: string; icon: typeof Brain; color: string }> = {
  statistics: { label: 'Statistics', icon: BarChart3, color: 'text-chart-1 bg-chart-1/10' },
  knowledge_rules: { label: 'Knowledge Rules', icon: BookOpen, color: 'text-chart-3 bg-chart-3/10' },
  knowledge_graph: { label: 'Knowledge Graph', icon: Network, color: 'text-chart-3 bg-chart-3/10' },
  patterns: { label: 'Patterns', icon: LineChart, color: 'text-chart-2 bg-chart-2/10' },
  trade_memory: { label: 'Trade Memory', icon: Brain, color: 'text-chart-4 bg-chart-4/10' },
  similarity: { label: 'Similarity', icon: LineChart, color: 'text-chart-2 bg-chart-2/10' },
  macro: { label: 'Macro', icon: Globe, color: 'text-chart-5 bg-chart-5/10' },
  learning: { label: 'Learning', icon: Layers, color: 'text-muted-foreground bg-muted' },
};

function getConfidenceVariant(confidence: number) {
  if (confidence >= 60) return 'success';
  if (confidence >= 30) return 'warning';
  return 'destructive';
}

function SourceBadge({ source }: { source: string }) {
  const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.learning;
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function EvidencePanel({ evidence }: { evidence: EvidenceItem[] }) {
  if (!evidence.length) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        Evidence ({evidence.length})
      </h4>
      {evidence.map((item, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-2.5">
          <SourceBadge source={item.source} />
          <pre className="mt-1.5 max-h-32 overflow-auto rounded bg-muted/30 p-2 text-[10px] text-muted-foreground font-mono">
            {JSON.stringify(item.data, null, 1).slice(0, 800)}
            {JSON.stringify(item.data, null, 1).length > 800 ? '...' : ''}
          </pre>
        </div>
      ))}
    </div>
  );
}

const suggestions = [
  'How am I performing overall?',
  'What patterns are working best?',
  'Why did my last trade win?',
  'Analyze my risk management',
  'What market conditions suit me?',
];

export default function AnalystPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showEvidence, setShowEvidence] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mutation = useAnalystQuery();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim() || !projectId) return;

    const userMsg: ChatMessage = { role: 'user', question: question.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');

    mutation.mutate(
      { projectId, question: question.trim() },
      {
        onSuccess: (data) => {
          setMessages((prev) => [...prev, {
            role: 'analyst',
            answer: data.answer,
            confidence: data.confidence,
            sources: data.sources,
            evidence: data.evidence,
          }]);
        },
        onError: () => {
          setMessages((prev) => [...prev, {
            role: 'analyst',
            answer: 'There is insufficient historical evidence.',
            confidence: 0,
            sources: [],
            evidence: [],
          }]);
        },
      },
    );
  };

  const lastAnalystMsg = messages.filter(m => m.role === 'analyst' && m.evidence && m.evidence.length > 0).slice(-1)[0];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader
        title="AI Research Analyst"
        description="Ask questions about your trading performance and patterns"
      />

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Chat Area */}
        <div className="flex flex-1 flex-col rounded-xl border border-border bg-card shadow-sm">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full items-center justify-center"
                >
                  <div className="text-center max-w-md">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Ask the AI Analyst anything</p>
                    <p className="text-xs text-muted-foreground mb-4">Examples: performance, patterns, risk analysis</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setQuestion(s); }}
                          className="rounded-full border border-border bg-muted/30 px-3 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {msg.role === 'user' && (
                  <div className="flex justify-end">
                    <div className="flex items-start gap-2 max-w-lg">
                      <div className="rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                        {msg.question}
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>
                )}
                {msg.role === 'analyst' && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-chart-3/10 mt-1">
                      <Bot className="h-4 w-4 text-chart-3" />
                    </div>
                    <div className="max-w-xl space-y-2">
                      <div className="rounded-2xl rounded-bl-md bg-muted/50 px-4 py-2.5 text-sm text-foreground">
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.answer}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {msg.confidence != null && (
                          <Badge variant={getConfidenceVariant(msg.confidence)} size="sm">
                            Confidence: {msg.confidence}%
                          </Badge>
                        )}
                        {msg.sources?.map((s) => (
                          <SourceBadge key={s} source={s} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {mutation.isPending && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-chart-3/10">
                  <Bot className="h-4 w-4 text-chart-3" />
                </div>
                <div className="flex items-center gap-3 rounded-2xl rounded-bl-md bg-muted/50 px-4 py-3">
                  <LoadingSpinner size="sm" />
                  <span className="text-xs text-muted-foreground">Analyzing your data...</span>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={messages.length === 0 ? 'Ask the analyst a question...' : 'Follow-up question...'}
                  className="h-10 w-full rounded-lg border border-input bg-background px-4 pr-4 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={mutation.isPending}
                />
              </div>
              <Button type="submit" disabled={mutation.isPending || !question.trim()} isLoading={mutation.isPending}>
                <Send className="mr-1.5 h-4 w-4" /> Ask
              </Button>
            </form>
          </div>
        </div>

        {/* Evidence Panel */}
        {lastAnalystMsg && (
          <div className="hidden lg:block w-72 shrink-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-xs font-medium">Evidence</CardTitle>
                <Button variant="ghost" size="icon-sm" onClick={() => {}}>
                  <X className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <EvidencePanel evidence={lastAnalystMsg.evidence ?? []} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

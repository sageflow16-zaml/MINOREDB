import { AlertTriangle, Lightbulb, CheckCircle, XCircle, Brain, FileText, MessageSquare, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Badge } from './badge';
import { MetricCard } from './metrics';
import { cn } from '../../lib/utils';

const sectionColors: Record<string, { border: string; bg: string; text: string; icon: typeof CheckCircle }> = {
  success: { border: 'border-success/20', bg: 'bg-success/5', text: 'text-success', icon: CheckCircle },
  destructive: { border: 'border-destructive/20', bg: 'bg-destructive/5', text: 'text-destructive', icon: XCircle },
  warning: { border: 'border-warning/20', bg: 'bg-warning/5', text: 'text-warning', icon: AlertTriangle },
  info: { border: 'border-chart-1/20', bg: 'bg-chart-1/5', text: 'text-chart-1', icon: Lightbulb },
};

interface FeedbackBlockProps {
  title: string;
  items: string[];
  variant: 'success' | 'destructive' | 'warning' | 'info';
}

export function FeedbackBlock({ title, items, variant }: FeedbackBlockProps) {
  const c = sectionColors[variant];
  const Icon = c.icon;
  if (!items?.length) return null;
  return (
    <div className={cn('rounded-lg border p-3', c.border, c.bg)}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-3.5 w-3.5" />
        <h4 className={cn('text-xs font-semibold', c.text)}>{title}</h4>
      </div>
      <ul className="space-y-1">
        {items.map((item: string, i: number) => (
          <li key={i} className="flex items-start gap-1.5 text-3xs text-muted-foreground">
            <Icon className={cn('h-3 w-3 shrink-0 mt-0.5', c.text)} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface TradeMemoryCardProps {
  pair?: string;
  direction?: string;
  session?: string;
  created_at?: string;
  confidence?: number;
  result?: string;
  summary?: string;
  metrics: { label: string; value: string | number; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }[];
  strengths?: string[];
  weaknesses?: string[];
  mistakes?: string[];
  lessons?: string[];
  tags?: string[];
}

export function TradeMemoryCard({
  pair, direction, session, created_at, confidence, result,
  summary, metrics, strengths, weaknesses, mistakes, lessons, tags,
}: TradeMemoryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary-text" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                {pair || 'Unknown'} — {direction || 'N/A'}
              </CardTitle>
              <p className="text-3xs text-muted-foreground mt-0.5">
                {session && `Session: ${session.replace(/_/g, ' / ')}`}
                {created_at && ` — ${new Date(created_at).toLocaleDateString()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {confidence != null && (
              <Badge variant="default" size="sm">Confidence: {confidence}%</Badge>
            )}
            <Badge variant={result === 'WIN' ? 'success' : result === 'LOSS' ? 'destructive' : 'default'} size="sm">
              {result || 'OPEN'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">{summary}</p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map((m: any, i: number) => (
            <MetricCard key={i} label={m.label} value={m.value} variant={m.variant || 'default'} size="sm" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {strengths && <FeedbackBlock title="Strengths" items={strengths} variant="success" />}
          {weaknesses && <FeedbackBlock title="Weaknesses" items={weaknesses} variant="destructive" />}
          {mistakes && <FeedbackBlock title="Mistakes" items={mistakes} variant="warning" />}
          {lessons && <FeedbackBlock title="Lessons" items={lessons} variant="info" />}
        </div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, i) => (
              <Badge key={i} variant="secondary" size="sm">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export interface JournalEntryCardProps {
  title: string;
  date?: string;
  type?: string;
  content?: string;
  metrics?: { label: string; value: string | number }[];
  tags?: string[];
}

export function JournalEntryCard({ title, date, type, content, metrics, tags }: JournalEntryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-chart-3/10">
              <FileText className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              {date && <p className="text-3xs text-muted-foreground mt-0.5">{date}</p>}
            </div>
          </div>
          {type && <Badge variant="info" size="sm">{type}</Badge>}
        </div>
      </CardHeader>
      {(content || metrics || tags) && (
        <CardContent className="space-y-3">
          {content && (
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">{content}</p>
            </div>
          )}
          {metrics && metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {metrics.map((m, i) => (
                <MetricCard key={i} label={m.label} value={m.value} size="sm" />
              ))}
            </div>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" size="sm">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export interface ResearchTaskCardProps {
  step: string | number;
  tool?: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | string;
  evidence_count?: number;
}

export function ResearchTaskCard({ step, tool, description, status, evidence_count }: ResearchTaskCardProps) {
  const statusVariant: Record<string, 'default' | 'warning' | 'success' | 'destructive'> = {
    pending: 'default',
    running: 'warning',
    completed: 'success',
    failed: 'destructive',
  };
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/20">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-3xs font-bold text-primary-text">
        {step}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {tool && (
            <span className="inline-flex items-center gap-1 rounded-full bg-chart-3/10 px-2 py-0.5 text-3xs font-medium text-chart-3">
              <Sparkles className="h-2.5 w-2.5" />
              {tool}
            </span>
          )}
          <Badge variant={statusVariant[status] || 'default'} size="sm">{status}</Badge>
        </div>
        <p className="text-xs text-foreground">{description}</p>
      </div>
      {evidence_count != null && (
        <div className="flex items-center gap-1 text-3xs text-muted-foreground shrink-0">
          <MessageSquare className="h-3 w-3" />
          {evidence_count}
        </div>
      )}
    </div>
  );
}

export interface ResearchReportProps {
  summary: string;
  findings: string[];
  recommendations: string[];
}

export function ResearchReport({ summary, findings, recommendations }: ResearchReportProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="rounded-lg bg-success/5 border border-success/20 p-3">
          <p className="text-xs text-foreground leading-relaxed">{summary}</p>
        </div>
        {findings.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2">Findings</h4>
            <ul className="space-y-1">
              {findings.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-3xs text-muted-foreground">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-chart-1" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
        {recommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-3xs text-muted-foreground">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export interface ChatBubbleProps {
  role: 'user' | 'analyst';
  content: string;
  confidence?: number;
  sources?: { label: string }[];
  suggestions?: string[];
}

export function ChatBubble({ role, content, confidence, sources, suggestions }: ChatBubbleProps) {
  const isUser = role === 'user';
  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-chart-3/10 text-chart-3',
      )}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className={cn('max-w-lg', isUser && 'items-end flex flex-col')}>
        <div className={cn(
          'rounded-2xl px-4 py-2.5 text-xs leading-relaxed',
          isUser
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md bg-muted/50 text-foreground',
        )}>
          {content}
        </div>
        {!isUser && (
          <div className="mt-2 flex flex-wrap gap-2">
            {confidence != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-chart-1/10 px-2 py-0.5 text-3xs font-medium text-chart-1">
                {confidence}% confidence
              </span>
            )}
            {sources?.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-3xs font-medium text-muted-foreground">
                <FileText className="h-2.5 w-2.5" />
                {s.label}
              </span>
            ))}
          </div>
        )}
        {!isUser && suggestions && suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2.5 py-1 text-3xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

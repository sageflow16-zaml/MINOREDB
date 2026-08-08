import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { cn } from '../lib/utils';
import {
  useChat, useConversations, useCreateConversation, useConversationMessages,
  usePinConversation, useUnpinConversation, useDeleteConversation,
  useAgents, usePrompts, useSearchConversations, useIngestAll,
} from '../hooks/useCopilot';
import type { AIMessage, AIConversation, AICitation, AIAgentConfig, AIPrompt } from '../api/types';
import {
  MessageSquare, Sparkles, Send, Plus, Trash2, Pin, PinOff, Bot,
  User, Search, PanelLeft, PanelRight, Clock, Star, Archive,
  BookOpen, Brain, Target, Shield, TrendingUp, Globe, Activity,
  FileText, Link2, AlertTriangle, RefreshCw, ChevronDown,
  Folders, X, Copy, Check,
} from 'lucide-react';

const AGENT_ICONS: Record<string, typeof Bot> = {
  trading_coach: Brain, psychology_coach: Star, risk_coach: Shield,
  research_assistant: Search, strategy_reviewer: Target,
  trade_reviewer: Activity, performance_analyst: TrendingUp,
  market_analyst: Globe, macro_analyst: Activity,
  knowledge_assistant: BookOpen,
};

const AGENT_COLORS: Record<string, string> = {
  trading_coach: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  psychology_coach: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  risk_coach: 'bg-red-500/15 text-red-400 border-red-500/30',
  research_assistant: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  strategy_reviewer: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  trade_reviewer: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  performance_analyst: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  market_analyst: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  macro_analyst: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  knowledge_assistant: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function CitationBadge({ citation }: { citation: AICitation }) {
  const typeLabels: Record<string, string> = {
    trade: 'Trade', journal: 'Journal', strategy: 'Strategy', replay: 'Replay',
    research: 'Research', obsidian: 'Obsidian', planning: 'Planning',
    risk: 'Risk', market_intel: 'Market', knowledge: 'Knowledge',
  };
  const typeIcons: Record<string, typeof FileText> = {
    trade: TrendingUp, journal: BookOpen, strategy: Target, research: Search,
    obsidian: FileText, planning: Clock, risk: Shield,
    market_intel: Globe, knowledge: Link2,
  };
  const Icon = typeIcons[citation.source_type] ?? FileText;
  return (
    <a href={citation.url ?? '#'}
      className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/50 px-2.5 py-1 text-3xs text-muted-foreground hover:text-foreground transition-colors group">
      <Icon className="h-3 w-3" />
      <span className="truncate max-w-[120px]">{citation.source_title ?? typeLabels[citation.source_type] ?? citation.source_type}</span>
      <span className="opacity-0 group-hover:opacity-100">#{citation.source_id.slice(0, 6)}</span>
    </a>
  );
}

function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div variants={item} className={cn('flex gap-3', isUser ? 'flex-row-reverse' : '')}>
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
        isUser ? 'bg-primary/10' : 'bg-zinc-500/10')}>
        {isUser ? <User className="h-4 w-4 text-primary-text" /> : <Bot className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className={cn('flex-1 max-w-[80%] space-y-2', isUser ? 'items-end' : '')}>
        <div className={cn(
          'rounded-2xl px-4 py-3 text-sm',
          isUser ? 'bg-primary/10 text-foreground rounded-tr-md' : 'bg-card border border-border/50 rounded-tl-md',
        )}>
          <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {message.citations.map((c) => (
              <CitationBadge key={`${c.source_type}:${c.source_id}`} citation={c} />
            ))}
          </div>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-2 px-1">
          {!isUser && message.model && (
            <Badge variant="outline" className="text-3xs px-1.5 py-0">{message.model}</Badge>
          )}
          {!isUser && message.total_tokens && (
            <span className="text-3xs text-muted-foreground">{message.total_tokens} tokens</span>
          )}
          {!isUser && message.latency_ms && (
            <span className="text-3xs text-muted-foreground">{(message.latency_ms / 1000).toFixed(1)}s</span>
          )}
          <button onClick={handleCopy} className="ml-auto p-0.5 rounded hover:bg-card/50 text-muted-foreground">
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function AgentCard({ agent, active, onClick }: { agent: AIAgentConfig; active: boolean; onClick: () => void }) {
  const Icon = AGENT_ICONS[agent.agent_type] ?? Bot;
  return (
    <button onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors w-full',
        active ? 'border-primary bg-primary/5 text-primary-text' : 'border-border/50 hover:border-border text-foreground',
      )}>
      <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', AGENT_COLORS[agent.agent_type] ?? 'bg-zinc-500/15')}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{agent.display_name}</p>
        {agent.description && <p className="text-3xs text-muted-foreground truncate">{agent.description}</p>}
      </div>
    </button>
  );
}

export default function CopilotWorkspace() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAgentPanel, setShowAgentPanel] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAgent, setActiveAgent] = useState<string | undefined>(undefined);
  const [showNewConv, setShowNewConv] = useState(false);
  const [newConvTitle, setNewConvTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useConversations(projectId!);
  const { data: messages = [] } = useConversationMessages(projectId!, activeConvId ?? undefined);
  const { data: agents = [] } = useAgents(projectId!);
  const { data: prompts = [] } = usePrompts(projectId!);
  const { data: searchResults = [] } = useSearchConversations(projectId!, searchQuery);
  const chatMutation = useChat(projectId!);
  const createConvMutation = useCreateConversation(projectId!);
  const pinMutation = usePinConversation(projectId!);
  const unpinMutation = useUnpinConversation(projectId!);
  const deleteMutation = useDeleteConversation(projectId!);
  const ingestMutation = useIngestAll(projectId!);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Select first conversation if none active
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  const handleSend = () => {
    if (!input.trim() || !projectId) return;
    const data: { message: string; conversation_id?: string; agent_type?: string } = { message: input, agent_type: activeAgent };
    if (activeConvId) data.conversation_id = activeConvId;
    chatMutation.mutate(data, {
      onSuccess: (result) => {
        if (result.message?.conversation_id) setActiveConvId(result.message.conversation_id);
      },
    });
    setInput('');
  };

  const handleNewConversation = () => {
    const title = newConvTitle.trim() || `Chat ${conversations.length + 1}`;
    createConvMutation.mutate({ title, agent_type: activeAgent }, {
      onSuccess: (conv) => { setActiveConvId(conv.id); setShowNewConv(false); setNewConvTitle(''); },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const pinned = conversations.filter((c: AIConversation) => c.is_pinned);
  const recent = conversations.filter((c: AIConversation) => !c.is_pinned).slice(0, 10);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0">
      {/* Left sidebar — conversations */}
      {showSidebar && (
        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }}
          className="w-[280px] shrink-0 border-r border-border/50 flex flex-col bg-card/30">
          <div className="p-3 border-b border-border/30">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground"
                placeholder="Search conversations..." />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <Button size="sm" className="w-full mb-2" onClick={() => setShowNewConv(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Chat
            </Button>

            {pinned.length > 0 && (
              <>
                <p className="text-3xs font-medium text-muted-foreground uppercase px-2 py-1">Pinned</p>
                {pinned.map((c: AIConversation) => (
                  <ConvRow key={c.id} conv={c} active={c.id === activeConvId}
                    onClick={() => setActiveConvId(c.id)} onPin={() => unpinMutation.mutate(c.id)}
                    onDelete={() => deleteMutation.mutate(c.id)} pinned />
                ))}
              </>
            )}

            <p className="text-3xs font-medium text-muted-foreground uppercase px-2 py-1">Recent</p>
            {recent.length === 0 && !searchQuery && (
              <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>
            )}
            {(searchQuery ? searchResults : recent).map((c: AIConversation) => (
              <ConvRow key={c.id} conv={c} active={c.id === activeConvId}
                onClick={() => setActiveConvId(c.id)} onPin={() => pinMutation.mutate(c.id)}
                onDelete={() => deleteMutation.mutate(c.id)} />
            ))}
          </div>

          <div className="p-2 border-t border-border/30">
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => ingestMutation.mutate()}
              disabled={ingestMutation.isPending}>
              <RefreshCw className={cn('h-3 w-3 mr-1.5', ingestMutation.isPending && 'animate-spin')} />
              Ingest All Data
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" aria-label="Toggle conversation sidebar" onClick={() => setShowSidebar((s) => !s)}>
              <PanelLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-foreground">
              {conversations.find((c: AIConversation) => c.id === activeConvId)?.title ?? 'AI Research Copilot'}
            </span>
            {activeAgent && (
              <Badge variant="outline" className="text-3xs">{agents.find((a: AIAgentConfig) => a.agent_type === activeAgent)?.display_name ?? activeAgent}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" aria-label="Toggle AI agents panel" onClick={() => setShowAgentPanel((s) => !s)}>
              <Bot className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeConvId && messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">AI Research Copilot</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask questions about your trading data. The AI searches across trades, journal, strategies,
                  research, obsidian notes, and market intelligence to find relevant context.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {prompts.slice(0, 6).map((p: AIPrompt) => (
                    <button key={p.id} onClick={() => setInput(p.content)}
                      className="rounded-lg border border-border/50 bg-card/50 p-2 text-left text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {messages.map((msg: AIMessage) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </motion.div>
          {chatMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pl-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce delay-0" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce delay-150" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce delay-300" />
              </div>
              <span>Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border/30 p-4">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Ask about your trading data..."
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
            <Button aria-label="Send message" onClick={handleSend} disabled={!input.trim() || chatMutation.isPending} className="shrink-0 h-[52px]">
              {chatMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Right panel — agents */}
      {showAgentPanel && (
        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }}
          className="w-[240px] shrink-0 border-l border-border/50 flex flex-col bg-card/30">
          <div className="p-3 border-b border-border/30">
            <h3 className="text-xs font-semibold text-foreground">AI Agents</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            <button onClick={() => setActiveAgent(undefined)}
              className={cn('flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors w-full',
                !activeAgent ? 'border-primary bg-primary/5 text-primary-text' : 'border-border/50 hover:border-border text-foreground'
              )}>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-500/15">
                <Sparkles className="h-3 w-3" />
              </div>
              <span className="font-medium">Auto (Smart Router)</span>
            </button>
            {agents.map((agent: AIAgentConfig) => (
              <AgentCard key={agent.agent_type} agent={agent}
                active={activeAgent === agent.agent_type}
                onClick={() => setActiveAgent(agent.agent_type === activeAgent ? undefined : agent.agent_type)} />
            ))}
          </div>
        </motion.div>
      )}

      {/* New conversation dialog */}
      {showNewConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-foreground">New Chat</h3>
            <input placeholder="Conversation title" value={newConvTitle}
              onChange={(e) => setNewConvTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleNewConversation()} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewConv(false)}>Cancel</Button>
              <Button onClick={handleNewConversation}>Create</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ConvRow({ conv, active, onClick, onPin, onDelete, pinned }: {
  conv: AIConversation; active: boolean; onClick: () => void;
  onPin: () => void; onDelete: () => void; pinned?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center gap-1 rounded-lg p-2 text-xs transition-colors cursor-pointer group',
      active ? 'bg-primary/5 text-primary-text' : 'hover:bg-card/50 text-foreground',
    )} onClick={onClick}>
      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">{conv.title}</span>
      <span className="text-3xs text-muted-foreground shrink-0">{conv.message_count}</span>
      <div className="hidden group-hover:flex items-center gap-0.5">
        <button onClick={(e) => { e.stopPropagation(); onPin(); }}
          className="p-0.5 rounded hover:bg-card/50 text-muted-foreground">
          {pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

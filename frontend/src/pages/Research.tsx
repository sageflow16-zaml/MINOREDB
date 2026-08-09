import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSources, useUploadSource } from '../hooks/useSources';
import {
  useResearchChat,
  useConversation,
  useConversations,
  useCreateConversation,
  useFlashcards,
  useCompareDocuments,
  useConfluences,
  useStudyNotes,
  useGenerateQuiz,
  useDocumentNotes,
  useBookmarks,
  useSuggestedQuestions,
  useRelatedDocuments,
  useRecommendations,
  useResearchSession,
} from '../hooks/useResearchV3';
import { cn } from '../lib/utils';
import { extractTextFromFile } from '../lib/textExtraction';
import toast from 'react-hot-toast';
import {Brain, Send, Plus, MessageSquare, Search, FileText, FileSpreadsheet, FileJson, File, Sparkles, BookOpen, GitCompare, Network, GraduationCap, StickyNote, Loader2, Lightbulb, Target, AlertCircle, Layers, PanelLeftClose, PanelLeft, CheckCircle, Quote, Bookmark, PanelRightClose, Upload, Library, StickyNote as StickyNoteIcon} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { AccordionItem, AccordionGroup } from '../components/ui/accordion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import { normalizeLibraryDocument, getSourceDisplayName } from '../lib/libraryDocument';
import type { SourceRead, AIMessage, AICitation } from '../api/types';
import type { FlashCard, QuizQuestion, StudyNotes, DocumentComparison } from '../api/researchV3';

const QUICK_ACTIONS = [
  { id: 'summarize', label: 'Summarize', icon: BookOpen, prompt: 'Summarize the key concepts from these documents' },
  { id: 'extract-rules', label: 'Extract Rules', icon: Target, prompt: 'Extract every trading rule, principle, and key concept from these documents' },
  { id: 'journal-analysis', label: 'Journal Analysis', icon: Layers, prompt: 'Analyze this trading journal for repeated mistakes and patterns' },
  { id: 'confluences', label: 'Find Confluences', icon: Network, prompt: 'Find confluences and agreements between these documents' },
  { id: 'compare', label: 'Compare', icon: GitCompare, prompt: 'Compare and contrast these documents' },
];

const QUICK_TOOLS = [
  { id: 'flashcards', label: 'Flashcards', icon: BookOpen, needsDocs: true, minDocs: 1 },
  { id: 'compare-docs', label: 'Compare Documents', icon: GitCompare, needsDocs: true, minDocs: 2 },
  { id: 'confluences-tool', label: 'Find Confluences', icon: Network, needsDocs: true, minDocs: 2 },
  { id: 'quiz', label: 'Generate Quiz', icon: GraduationCap, needsDocs: true, minDocs: 1 },
  { id: 'study-notes', label: 'Study Notes', icon: StickyNote, needsDocs: true, minDocs: 1 },
];

function getFileIcon(source: SourceRead | undefined | null) {
  const name = getSourceDisplayName(source);
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['csv', 'xls', 'xlsx'].includes(ext)) return <FileSpreadsheet className="h-3.5 w-3.5 text-success" />;
  if (['json'].includes(ext)) return <FileJson className="h-3.5 w-3.5 text-warning" />;
  if (['pdf'].includes(ext)) return <FileText className="h-3.5 w-3.5 text-danger-text" />;
  if (['txt', 'md'].includes(ext)) return <FileText className="h-3.5 w-3.5 text-primary-text" />;
  return <File className="h-3.5 w-3.5 text-muted" />;
}

function getSourceName(source: SourceRead | undefined | null) {
  return getSourceDisplayName(source);
}

function getSourceType(source: SourceRead | undefined | null) {
  if (!source) return 'text';
  return source.origin_type || 'text';
}

function formatDate(value?: string) {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function CitationBadge({ citation, onClick }: { citation: AICitation; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-3xs font-medium text-primary-text border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
    >
      <Bookmark className="h-2.5 w-2.5" />
      {citation.source_title || citation.source_type || 'Source'}
      {citation.page != null && <span className="opacity-70">p.{citation.page}</span>}
      {citation.relevance_score != null && (
        <span className="ml-0.5 opacity-70">{(citation.relevance_score * 100).toFixed(0)}%</span>
      )}
    </span>
  );
}

interface FlashcardViewProps { flashcards: FlashCard[]; }
function FlashcardView({ flashcards }: FlashcardViewProps) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  if (!flashcards?.length) return <p className="text-sm text-muted">No flashcards generated.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {flashcards.map((card, i) => (
        <motion.button key={i} onClick={() => setFlipped(prev => ({ ...prev, [i]: !prev[i] }))}
          className="relative h-48 w-full rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary/30 hover:shadow-sm"
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        >
          <AnimatePresence mode="wait">
            {flipped[i] ? (
              <motion.div key="back" initial={{ opacity: 0, rotateY: 90 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: -90 }} transition={{ duration: 0.2 }} className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" size="sm">{card.topic || 'General'}</Badge>
                  <Badge variant="secondary" size="sm">{card.difficulty || 'Medium'}</Badge>
                </div>
                <p className="text-xs text-secondary leading-relaxed flex-1">{card.back}</p>
                <p className="text-3xs text-primary-text mt-2">Tap to flip back</p>
              </motion.div>
            ) : (
              <motion.div key="front" initial={{ opacity: 0, rotateY: -90 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: 90 }} transition={{ duration: 0.2 }} className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" size="sm">{card.topic || 'General'}</Badge>
                  <Badge variant="secondary" size="sm">{card.difficulty || 'Medium'}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground flex-1">{card.front}</p>
                <p className="text-3xs text-muted mt-2">Tap to reveal answer</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      ))}
    </div>
  );
}

interface QuizViewProps { questions: QuizQuestion[]; }
function QuizView({ questions }: QuizViewProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  if (!questions?.length) return <p className="text-sm text-muted">No quiz questions generated.</p>;
  const handleSelect = (qIdx: number, optIdx: number) => { if (submitted[qIdx]) return; setAnswers(prev => ({ ...prev, [qIdx]: optIdx })); };
  const handleSubmit = (qIdx: number) => { if (answers[qIdx] == null) return; setSubmitted(prev => ({ ...prev, [qIdx]: true })); };
  return (
    <div className="space-y-6">
      {questions.map((q, qIdx) => {
        const selected = answers[qIdx]; const isSubmitted = submitted[qIdx]; const isCorrect = selected === q.correct_index;
        return (
          <div key={qIdx} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" size="sm">{q.topic || 'General'}</Badge>
              <Badge variant="secondary" size="sm">{q.difficulty || 'Medium'}</Badge>
              <span className="text-3xs text-muted">Question {qIdx + 1}/{questions.length}</span>
            </div>
            <p className="text-sm font-medium text-foreground mt-2 mb-4">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oIdx) => (
                <button key={oIdx} onClick={() => handleSelect(qIdx, oIdx)}
                  className={cn('w-full text-left rounded-lg border px-4 py-2.5 text-xs transition-all',
                    isSubmitted && oIdx === q.correct_index && 'border-success/40 bg-success/5 text-success',
                    isSubmitted && oIdx === selected && oIdx !== q.correct_index && 'border-danger/40 bg-danger/5 text-danger-text',
                    !isSubmitted && selected === oIdx && 'border-primary/40 bg-primary/5 text-primary-text',
                    !isSubmitted && selected !== oIdx && 'border-border text-secondary hover:border-secondary',
                    isSubmitted && oIdx !== selected && oIdx !== q.correct_index && 'border-border text-muted opacity-60',
                  )}
                >
                  <span className="inline-block w-5 text-muted">{String.fromCharCode(65 + oIdx)}.</span>
                  {opt}
                </button>
              ))}
            </div>
            {isSubmitted ? (
              <div className={cn('mt-3 rounded-lg p-3 text-xs', isCorrect ? 'bg-success/5 text-success border border-success/20' : 'bg-danger/5 text-danger-text border border-danger/20')}>
                <div className="flex items-center gap-1.5 mb-1 font-medium">
                  {isCorrect ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </div>
                <p className="text-secondary">{q.explanation}</p>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => handleSubmit(qIdx)} disabled={selected == null}>Submit Answer</Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ComparisonViewProps { comparison: DocumentComparison; }
function ComparisonView({ comparison }: ComparisonViewProps) {
  if (!comparison) return <p className="text-sm text-muted">No comparison data available.</p>;
  const sections = [
    { title: 'Similarities', items: comparison.similarities, color: 'text-success', border: 'border-success/20', bg: 'bg-success/5' },
    { title: 'Differences', items: comparison.differences, color: 'text-warning', border: 'border-warning/20', bg: 'bg-warning/5' },
    { title: 'Complementary Insights', items: comparison.complementary, color: 'text-primary-text', border: 'border-primary/20', bg: 'bg-primary/5' },
    { title: 'Contradictions', items: comparison.contradictions, color: 'text-danger-text', border: 'border-danger/20', bg: 'bg-danger/5' },
  ];
  return (
    <div className="space-y-4">
      {sections.map(section => section.items?.length > 0 && (
        <div key={section.title} className={cn('rounded-xl border p-4', section.border, section.bg)}>
          <h4 className={cn('text-xs font-semibold mb-2', section.color)}>{section.title} ({section.items.length})</h4>
          <ul className="space-y-1.5">
            {section.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-secondary">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />{item}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {comparison.synthesis && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-xs font-semibold text-foreground mb-2">Synthesis</h4>
          <p className="text-xs text-secondary leading-relaxed">{comparison.synthesis}</p>
        </div>
      )}
    </div>
  );
}

interface StudyNotesViewProps { notes: StudyNotes; }
function StudyNotesView({ notes }: StudyNotesViewProps) {
  if (!notes) return <p className="text-sm text-muted">No study notes available.</p>;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">{notes.title}</h3>
        <p className="text-xs text-secondary leading-relaxed">{notes.summary}</p>
      </div>
      {notes.key_takeaways?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-warning mb-2 flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" />Key Takeaways</h4>
          <ul className="space-y-1">
            {notes.key_takeaways.map((k, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-secondary"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning/50" />{k}</li>
            ))}
          </ul>
        </div>
      )}
      {notes.topics?.map((topic, tIdx) => (
        <div key={tIdx}>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-primary-text" />{topic.topic}</h4>
          {topic.subtopics?.map((sub, sIdx) => (
            <div key={sIdx} className="ml-4 mt-3 rounded-lg border border-border bg-background p-3">
              <h5 className="text-xs font-medium text-foreground mb-1">{sub.subtopic}</h5>
              <p className="text-xs text-secondary leading-relaxed">{sub.content}</p>
              {sub.key_points?.length > 0 && (
                <div className="mt-2">
                  <p className="text-3xs font-medium text-muted mb-1">Key Points:</p>
                  <ul className="space-y-0.5">
                    {sub.key_points.map((kp, kIdx) => (
                      <li key={kIdx} className="flex items-start gap-1.5 text-2xs text-secondary"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary/50" />{kp}</li>
                    ))}
                  </ul>
                </div>
              )}
              {sub.quotes?.length > 0 && (
                <div className="mt-2">
                  <p className="text-3xs font-medium text-muted mb-1 flex items-center gap-1"><Quote className="h-3 w-3" />Quotes</p>
                  {sub.quotes.map((q, qIdx) => (
                    <p key={qIdx} className="text-2xs text-primary-text italic border-l-2 border-primary/30 pl-2 mt-1">&ldquo;{q}&rdquo;</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ResearchPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState<AIMessage[]>([]);
  const [docFilter, setDocFilter] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [centerTab, setCenterTab] = useState<'chat' | 'notes' | 'bookmarks'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: sources = [], isLoading: sourcesLoading } = useSources(projectId!);
  const { data: conversations = [], isLoading: convosLoading } = useConversations(projectId!);
  const { data: conversationData, isLoading: conversationLoading } = useConversation(activeConversationId);
  const researchChat = useResearchChat(projectId!);
  const createConversation = useCreateConversation(projectId!);
  const uploadSource = useUploadSource(projectId!);
  const flashcardsMutation = useFlashcards();
  const compareMutation = useCompareDocuments();
  const confluencesMutation = useConfluences();
  const quizMutation = useGenerateQuiz();
  const studyNotesMutation = useStudyNotes();

  const suggestQuestionsMut = useSuggestedQuestions();
  const relatedDocsMut = useRelatedDocuments();
  const recommendationsMut = useRecommendations();
  const { session: researchSession, saveSession: saveResearchSession } = useResearchSession(projectId!);

  const firstSelectedDocId = selectedDocIds[0] || null;
  const { data: documentNotesData = [] } = useDocumentNotes(firstSelectedDocId);
  const { data: bookmarksData = [] } = useBookmarks(firstSelectedDocId);

  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [relatedDocs, setRelatedDocs] = useState<any[]>([]);
  const [showRelatedDocs, setShowRelatedDocs] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<Record<string, string>>({});

  const [flashcardsData, setFlashcardsData] = useState<FlashCard[]>([]);
  const [comparisonData, setComparisonData] = useState<DocumentComparison | null>(null);
  const [confluencesData, setConfluencesData] = useState<any>(null);
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [studyNotesData, setStudyNotesData] = useState<StudyNotes | null>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSource, setViewerSource] = useState<{ sourceTitle: string; page?: number; relevance?: number; excerpt?: string; sourceId?: string; sourceText?: string } | null>(null);

  const ALLOWED_EXTENSIONS = ['.txt', '.pdf', '.docx', '.png', '.jpg', '.jpeg', '.gif'];
  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  useEffect(() => {
    if (conversationData?.messages) {
      setLocalMessages(conversationData.messages);
    }
  }, [conversationData]);

  useEffect(() => {
    if (activeConversationId == null) setLocalMessages([]);
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  // Restore session state on mount
  useEffect(() => {
    if (researchSession?.document_ids && researchSession.document_ids.length > 0) {
      setSelectedDocIds(researchSession.document_ids);
    }
  }, [researchSession]);

  // Auto-save session when selections change
  useEffect(() => {
    if (!projectId) return;
    const timer = setTimeout(() => {
      saveResearchSession.mutate({ documentIds: selectedDocIds, title: `Research - ${new Date().toLocaleDateString()}` });
    }, 2000);
    return () => clearTimeout(timer);
  }, [selectedDocIds, projectId, saveResearchSession]);

  // Auto-suggest questions when a single document is selected
  useEffect(() => {
    if (firstSelectedDocId && !suggestQuestionsMut.isPending) {
      suggestQuestionsMut.mutate(
        { projectId: projectId!, documentId: firstSelectedDocId },
        { onSuccess: (data: any) => {
          const qs = data?.questions || [];
          if (qs.length > 0) { setSuggestedQuestions(qs); setShowSuggestions(true); }
        }}
      );
    }
  }, [firstSelectedDocId]);

  // Auto-find related docs when selection changes
  useEffect(() => {
    if (firstSelectedDocId && !relatedDocsMut.isPending) {
      relatedDocsMut.mutate(
        { projectId: projectId!, documentId: firstSelectedDocId },
        { onSuccess: (data: any) => {
          const docs = data?.related || [];
          if (docs.length > 0) { setRelatedDocs(docs); setShowRelatedDocs(true); }
        }}
      );
    }
  }, [firstSelectedDocId]);

  // Auto-get recommendations when sources load for the first time
  useEffect(() => {
    if (sources.length > 0 && !recommendationsMut.isPending && recommendations.length === 0) {
      recommendationsMut.mutate(
        { projectId: projectId!, documentIds: sources.slice(0, 5).map((s: any) => s.id) },
        { onSuccess: (data: any) => {
          const recs = data?.recommendations || [];
          if (recs.length > 0) { setRecommendations(recs); setShowRecommendations(true); }
        }}
      );
    }
  }, [sources.length]);

  const selectedSources = useMemo(() => {
    const selectedSet = new Set(selectedDocIds);
    return sources.filter(s => selectedSet.has(s.id));
  }, [sources, selectedDocIds]);

  const filteredSources = useMemo(() => {
    if (!docFilter.trim()) return sources;
    const q = docFilter.toLowerCase();
    return sources.filter(s => {
      const name = getSourceName(s).toLowerCase();
      const type = (s.origin_type || '').toLowerCase();
      return name.includes(q) || type.includes(q);
    });
  }, [sources, docFilter]);

  const isAiResponding = useMemo(() => {
    const lastMsg = localMessages[localMessages.length - 1];
    return lastMsg?.role === 'user' || conversationLoading;
  }, [localMessages, conversationLoading]);

  const handleCitationClick = useCallback((cit: AICitation) => {
    const sourceDoc = sources.find(s => s.id === cit.source_id);
    const norm = normalizeLibraryDocument(sourceDoc);
    setViewerSource({
      sourceTitle: cit.source_title || norm?.title || 'Source',
      page: cit.page,
      relevance: cit.relevance_score,
      excerpt: cit.excerpt || cit.snippet || '',
      sourceId: cit.source_id,
      sourceText: norm?.rawText || '',
    });
    setViewerOpen(true);
  }, [sources]);

  const toggleDocSelection = useCallback((docId: string) => {
    setSelectedDocIds(prev => prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]);
  }, []);

  const clearSelection = useCallback(() => { setSelectedDocIds([]); }, []);

  const createNewChat = useCallback(() => {
    setActiveConversationId(null);
    setLocalMessages([]);
    setCenterTab('chat');
  }, []);

  const loadConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
    setCenterTab('chat');
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) && !['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
      return `File type "${ext || file.type}" is not supported. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE) return `File exceeds 50 MB limit. Selected file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`;
    return null;
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) { toast.error(validationError); return; }
    const formData = new FormData();
    formData.append('file', file);
    if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      formData.append('raw_text', await file.text());
    } else if (file.name.endsWith('.pdf')) {
      toast.loading('Extracting text from PDF...', { id: 'pdf-extract' });
      try { const text = await extractTextFromFile(file); if (text) formData.append('raw_text', text); }
      catch (err) { console.error('PDF extraction failed:', err); toast.error('Could not extract text from this PDF. Uploading without text.'); }
      toast.dismiss('pdf-extract');
    } else if (file.name.endsWith('.docx')) {
      try { const text = await extractTextFromFile(file); if (text) formData.append('raw_text', text); } catch { }
    }
    uploadSource.mutate(formData);
  }, [validateFile, uploadSource]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { handleUpload(file); e.target.value = ''; }
  }, [handleUpload]);

  const handleSend = useCallback(async (overrideMessage?: string) => {
    const msg = (overrideMessage || message).trim();
    if (!msg || isLoading || !projectId) return;
    setMessage('');
    setIsLoading(true);
    const userMsg: AIMessage = {
      id: `temp-${Date.now()}`, role: 'user', content: msg,
      conversation_id: activeConversationId || '', project_id: projectId,
      created_at: new Date().toISOString(), is_streaming: false, is_error: false,
    };
    setLocalMessages(prev => [...prev, userMsg]);
    try {
      if (!activeConversationId) {
        const newConvo = await createConversation.mutateAsync({ title: msg.substring(0, 100), documentIds: selectedDocIds });
        setActiveConversationId(newConvo.id);
        await researchChat.mutateAsync({ conversationId: newConvo.id, message: msg, documentIds: selectedDocIds });
      } else {
        await researchChat.mutateAsync({ conversationId: activeConversationId, message: msg, documentIds: selectedDocIds });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send message');
      setLocalMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally { setIsLoading(false); }
  }, [message, isLoading, projectId, activeConversationId, selectedDocIds, createConversation, researchChat]);

  const handleQuickAction = useCallback((action: typeof QUICK_ACTIONS[0]) => {
    if (!projectId) return;
    handleSend(action.prompt);
  }, [projectId, handleSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const runTool = useCallback(async (toolId: string) => {
    if (!projectId || selectedDocIds.length === 0) { toast.error('Please select at least one document'); return; }
    if ((toolId === 'compare-docs' || toolId === 'confluences-tool') && selectedDocIds.length < 2) {
      toast.error('This tool requires at least 2 selected documents'); return;
    }
    setActiveModal(toolId);
    try {
      switch (toolId) {
        case 'flashcards': { const r = await flashcardsMutation.mutateAsync({ projectId, documentIds: selectedDocIds }); setFlashcardsData(Array.isArray(r) ? r : r?.flashcards || []); break; }
        case 'compare-docs': { const r = await compareMutation.mutateAsync({ projectId, documentIds: selectedDocIds }); setComparisonData(r?.comparison || r || null); break; }
        case 'confluences-tool': { const r = await confluencesMutation.mutateAsync({ projectId, documentIds: selectedDocIds }); setConfluencesData(r || null); break; }
        case 'quiz': { const r = await quizMutation.mutateAsync({ projectId, documentIds: selectedDocIds }); setQuizData(Array.isArray(r) ? r : r?.questions || []); break; }
        case 'study-notes': { const r = await studyNotesMutation.mutateAsync({ projectId, documentIds: selectedDocIds }); setStudyNotesData(r?.notes || r || null); break; }
      }
    } catch (err: any) { toast.error(err?.message || `Failed to run ${toolId}`); setActiveModal(null); }
  }, [projectId, selectedDocIds, flashcardsMutation, compareMutation, confluencesMutation, quizMutation, studyNotesMutation]);

  const getToolTitle = (id: string | null) => {
    const tool = QUICK_TOOLS.find(t => t.id === id);
    if (tool) return tool.label;
    if (id === 'flashcards') return 'Flashcards';
    if (id === 'compare-docs') return 'Document Comparison';
    if (id === 'confluences-tool') return 'Confluences';
    if (id === 'quiz') return 'Quiz';
    if (id === 'study-notes') return 'Study Notes';
    return 'Results';
  };

  const isToolRunning = flashcardsMutation.isPending || compareMutation.isPending || confluencesMutation.isPending || quizMutation.isPending || studyNotesMutation.isPending;

  const renderModalContent = () => {
    switch (activeModal) {
      case 'flashcards': return <FlashcardView flashcards={flashcardsData} />;
      case 'compare-docs': return <ComparisonView comparison={comparisonData!} />;
      case 'confluences-tool': return <ConfluencesView data={confluencesData} />;
      case 'quiz': return <QuizView questions={quizData} />;
      case 'study-notes': return <StudyNotesView notes={studyNotesData!} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background overflow-hidden">
      {/* LEFT: Library Panel */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="shrink-0 border-r border-border bg-background overflow-hidden"
          >
            <div className="flex flex-col h-full w-[320px]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Library className="h-4 w-4 text-primary-text" />
                  <span className="text-sm font-medium text-foreground">Library</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-xs" aria-label="Upload document" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                  </Button>
                  <input ref={fileInputRef} type="file" hidden accept=".txt,.pdf,.docx,.png,.jpg,.jpeg,.gif" onChange={handleFileSelect} />
                  <Button variant="ghost" size="icon-xs" aria-label="Close library panel" onClick={() => setSidebarOpen(false)}>
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Document Search */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-muted" />
                        Documents
                      </h3>
                      {selectedDocIds.length > 0 && (
                        <Button variant="ghost" size="xs" onClick={clearSelection} className="text-3xs text-muted h-6">
                          Clear ({selectedDocIds.length})
                        </Button>
                      )}
                    </div>

                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                      <Input value={docFilter} onChange={e => setDocFilter(e.target.value)} placeholder="Search documents..." className="h-8 pl-8 text-xs" />
                    </div>

                    {sourcesLoading ? (
                      <div className="space-y-1">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8 rounded-lg" />)}</div>
                    ) : filteredSources.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center">
                        <Upload className="h-8 w-8 text-muted mb-2" />
                        <p className="text-xs text-muted">No documents yet</p>
                        <p className="text-3xs text-muted mt-1">Upload a PDF or text file to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
                        {filteredSources.map(s => {
                          const isSelected = selectedDocIds.includes(s.id);
                          return (
                            <button key={s.id} onClick={() => toggleDocSelection(s.id)}
                              className={cn('w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-all text-xs', isSelected ? 'bg-primary/10 text-primary-text' : 'text-secondary hover:bg-card hover:text-foreground')}
                            >
                              <div className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors', isSelected ? 'bg-primary border-primary' : 'border-border')}>
                                {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                              </div>
                              {getFileIcon(s)}
                              <span className="truncate flex-1">{getSourceName(s)}</span>
                              <span className="shrink-0 text-3xs text-muted">{getSourceType(s)}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Related Documents */}
                  {showRelatedDocs && relatedDocs.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Network className="h-3.5 w-3.5 text-muted" />
                          Related Documents
                        </h3>
                        <button onClick={() => setShowRelatedDocs(false)} className="text-3xs text-muted hover:text-foreground">Hide</button>
                      </div>
                      <div className="space-y-1">
                        {relatedDocs.slice(0, 5).map((rd, i) => (
                          <div key={rd.source_id || i}
                            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-secondary bg-card/50"
                          >
                            <FileText className="h-3 w-3 text-primary-text shrink-0" />
                            <span className="truncate flex-1">{rd.title}</span>
                            <span className="shrink-0 text-3xs text-muted">{(rd.similarity * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conversation History */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-muted" />
                        History
                      </h3>
                      <Button variant="ghost" size="xs" onClick={createNewChat} className="gap-1">
                        <Plus className="h-3 w-3" /> New Chat
                      </Button>
                    </div>
                    {convosLoading ? (
                      <div className="space-y-1">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
                    ) : conversations.length === 0 ? (
                      <p className="text-3xs text-muted py-2 text-center">No conversations yet</p>
                    ) : (
                      <div className="space-y-0.5">
                        {conversations.map(c => {
                          const conv = c as any;
                          const meta = conv.metadata as any;
                          const docCount = meta?.document_ids?.length || 0;
                          return (
                            <button key={conv.id} onClick={() => loadConversation(conv.id)}
                              className={cn('w-full flex items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-all', activeConversationId === conv.id ? 'bg-primary/10 text-primary-text' : 'text-secondary hover:bg-card')}
                            >
                              <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs truncate font-medium">{conv.title || 'Untitled'}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-3xs text-muted">{formatDate(conv.created_at)}</span>
                                  {docCount > 0 && <span className="text-3xs text-muted">{docCount} docs</span>}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Quick Tools */}
                  <AccordionGroup type="single" collapsible>
                    <AccordionItem title="Quick Tools" icon={<Sparkles className="h-3.5 w-3.5 text-warning" />} defaultOpen={false}>
                      <div className="space-y-1.5">
                        {QUICK_TOOLS.map(tool => (
                          <Button key={tool.id} variant="outline" size="sm" className="w-full justify-start gap-2 text-xs"
                            onClick={() => runTool(tool.id)}
                            isLoading={(tool.id === 'flashcards' && flashcardsMutation.isPending) || (tool.id === 'compare-docs' && compareMutation.isPending) || (tool.id === 'confluences-tool' && confluencesMutation.isPending) || (tool.id === 'quiz' && quizMutation.isPending) || (tool.id === 'study-notes' && studyNotesMutation.isPending)}
                            disabled={selectedDocIds.length === 0}
                          >
                            <tool.icon className="h-3.5 w-3.5 shrink-0" />
                            {tool.label}
                          </Button>
                        ))}
                      </div>
                    </AccordionItem>
                  </AccordionGroup>
                </div>
              </ScrollArea>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* CENTER: Chat + Notes/Bookmarks */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background">
          {!sidebarOpen && (
            <Button variant="ghost" size="icon-xs" onClick={() => setSidebarOpen(true)}>
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Brain className="h-5 w-5 text-primary-text shrink-0" />
            <h1 className="text-sm font-semibold text-foreground">Research</h1>
            {selectedDocIds.length > 0 && (
              <Badge variant="secondary" size="sm">{selectedDocIds.length} selected</Badge>
            )}
          </div>
          {showRecommendations && recommendations.length > 0 && (
            <div className="hidden lg:flex items-center gap-1">
              <Badge variant="secondary" size="sm" className="text-warning border-warning/20 bg-warning/5">
                <Sparkles className="h-3 w-3 mr-1" />{recommendations.length} insights
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-1 bg-card rounded-lg p-0.5">
            {(['chat', 'notes', 'bookmarks'] as const).map(tab => (
              <button key={tab} onClick={() => setCenterTab(tab)}
                className={cn('px-2.5 py-1 text-xs rounded-md transition-all capitalize', centerTab === tab ? 'bg-elevated text-foreground' : 'text-muted hover:text-secondary')}
              >
                {tab === 'chat' && <MessageSquare className="h-3 w-3 inline mr-1" />}
                {tab === 'notes' && <StickyNoteIcon className="h-3 w-3 inline mr-1" />}
                {tab === 'bookmarks' && <Bookmark className="h-3 w-3 inline mr-1" />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Center Content */}
        {centerTab === 'chat' ? (
          <>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4 max-w-4xl mx-auto w-full">
                {localMessages.length === 0 && !isLoading ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                      <Brain className="h-7 w-7 text-primary-text" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Research Chat</h2>
                    <p className="text-sm text-muted max-w-md">
                      {selectedDocIds.length > 0
                        ? `${selectedDocIds.length} document${selectedDocIds.length > 1 ? 's' : ''} selected. Ask a question or use quick actions below.`
                        : 'Upload or select documents from the Library to start researching.'}
                    </p>

                    {/* AI Recommendations Panel */}
                    {showRecommendations && recommendations.length > 0 && selectedDocIds.length === 0 && (
                      <div className="w-full max-w-lg mt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-4 w-4 text-warning" />
                          <span className="text-xs font-semibold text-foreground">AI Insights from Your Documents</span>
                        </div>
                        <div className="space-y-2 text-left">
                          {recommendations.slice(0, 4).map((rec, i) => (
                            <div key={i} className="rounded-lg border border-border bg-card p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" size="sm" className="text-3xs capitalize">{rec.category?.replace(/_/g, ' ')}</Badge>
                                <Badge variant="secondary" size="sm" className={cn(
                                  'text-3xs',
                                  rec.priority === 'high' ? 'text-danger-text' : rec.priority === 'medium' ? 'text-warning' : 'text-success'
                                )}>{rec.priority}</Badge>
                              </div>
                              <p className="text-xs font-medium text-foreground">{rec.title}</p>
                              <p className="text-2xs text-secondary mt-1">{rec.description}</p>
                              <button onClick={() => setShowRecommendations(false)}
                                className="text-3xs text-primary-text mt-1 hover:underline">Dismiss</button>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => setShowRecommendations(false)}
                          className="text-xs text-muted mt-3 hover:text-foreground transition-colors">Dismiss all</button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-6">
                      {QUICK_ACTIONS.map(action => (
                        <button key={action.id} onClick={() => handleQuickAction(action)} disabled={selectedDocIds.length === 0}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-secondary transition-all hover:border-secondary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <action.icon className="h-3.5 w-3.5" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : localMessages.length === 0 && selectedDocIds.length > 0 && suggestedQuestions.length > 0 && showSuggestions ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                      <Brain className="h-7 w-7 text-primary-text" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Ready to Research</h2>
                    <p className="text-sm text-muted max-w-md mb-6">
                      {selectedSources.length} document{selectedSources.length > 1 ? 's' : ''} selected. Try asking one of these questions:
                    </p>
                    <div className="flex flex-col gap-2 w-full max-w-lg">
                      {suggestedQuestions.map((q, i) => (
                        <button key={i} onClick={() => { setMessage(q); setShowSuggestions(false); }}
                          className="w-full text-left rounded-lg border border-border bg-card px-4 py-2.5 text-xs text-secondary transition-all hover:border-primary/30 hover:text-foreground hover:bg-primary/5"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <AnimatePresence initial={false}>
                    {localMessages.map((msg, idx) => {
                      const isUser = msg.role === 'user';
                      return (
                        <motion.div key={msg.id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                          className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
                        >
                          <div className={cn('max-w-[80%] rounded-xl px-4 py-3', isUser ? 'bg-primary/20 border border-primary/30' : 'bg-card border border-border')}>
                            {isUser ? (
                              <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Brain className="h-3.5 w-3.5 text-primary-text" />
                                  <span className="text-3xs font-medium text-muted">Research AI</span>
                                  {msg.created_at && <span className="text-3xs text-muted">{formatDate(msg.created_at)}</span>}
                                </div>
                                <div className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                                {msg.citations && msg.citations.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-1 border-t border-border">
                                    {msg.citations.map((cit, cIdx) => (
                                      <CitationBadge key={cit.id || cIdx} citation={cit} onClick={() => handleCitationClick(cit)} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                    {isAiResponding && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                        <div className="max-w-[80%] rounded-xl px-4 py-3 bg-card border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-3xs text-muted">Researching...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border bg-background px-4 py-3">
              <div className="max-w-4xl mx-auto w-full space-y-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {QUICK_ACTIONS.map(action => (
                    <button key={action.id} onClick={() => handleQuickAction(action)} disabled={selectedDocIds.length === 0 || isLoading}
                      className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-3xs text-muted transition-all hover:border-secondary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <action.icon className="h-3 w-3" />
                      {action.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Ask about your documents..." disabled={isLoading} className="h-10 flex-1" />
                  <Button aria-label="Send message" onClick={() => handleSend()} disabled={!message.trim() || isLoading} isLoading={isLoading} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : centerTab === 'notes' ? (
          <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <StickyNoteIcon className="h-4 w-4 text-primary-text" />
                Notes
              </h3>
              {selectedDocIds.length === 0 && <p className="text-3xs text-muted">Select a document to view notes</p>}
            </div>
            {selectedDocIds.length > 0 ? (
              <div className="space-y-3">
                {documentNotesData.length === 0 ? (
                  <p className="text-xs text-muted py-8 text-center">No notes for the selected document</p>
                ) : (
                  documentNotesData.map((note: any) => (
                    <div key={note.id} className="rounded-lg border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-secondary leading-relaxed">{note.text}</p>
                        {note.page != null && <Badge variant="secondary" size="sm">p.{note.page}</Badge>}
                      </div>
                      <p className="text-3xs text-muted mt-2">{formatDate(note.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-xs text-muted py-8 text-center">Select a document from the library to view its notes</p>
            )}
          </div>
        ) : (
          <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-primary-text" />
                Bookmarks
              </h3>
              {selectedDocIds.length === 0 && <p className="text-3xs text-muted">Select a document to view bookmarks</p>}
            </div>
            {selectedDocIds.length > 0 ? (
              <div className="space-y-3">
                {bookmarksData.length === 0 ? (
                  <p className="text-xs text-muted py-8 text-center">No bookmarks for the selected document</p>
                ) : (
                  bookmarksData.map((bm: any) => (
                    <div key={bm.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                      <Bookmark className="h-4 w-4 text-primary-text shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-secondary">{bm.label || `Page ${bm.page}`}</p>
                        {bm.page != null && <span className="text-3xs text-muted">p.{bm.page}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-xs text-muted py-8 text-center">Select a document from the library to view its bookmarks</p>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: Document Viewer Panel */}
      <AnimatePresence>
        {viewerOpen && viewerSource && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 440, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="shrink-0 border-l border-border bg-background overflow-hidden"
          >
            <div className="flex flex-col h-full w-[440px]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="h-4 w-4 text-primary-text shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">{viewerSource.sourceTitle}</span>
                  {viewerSource.page != null && (
                    <Badge variant="secondary" size="sm">p.{viewerSource.page}</Badge>
                  )}
                </div>
                <Button variant="ghost" size="icon-xs" onClick={() => setViewerOpen(false)}>
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Source info */}
                  <div>
                    <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                      <FileText className="h-3.5 w-3.5 text-muted" />
                      Source
                    </h3>
                    <p className="text-sm text-secondary">{viewerSource.sourceTitle}</p>
                    {viewerSource.sourceId && (
                      <p className="text-3xs text-muted mt-1 truncate">ID: {viewerSource.sourceId}</p>
                    )}
                  </div>

                  {/* Relevance */}
                  {viewerSource.relevance != null && (
                    <div>
                      <h3 className="text-xs font-semibold text-foreground mb-1">Relevance</h3>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-elevated overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${viewerSource.relevance * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted">{(viewerSource.relevance * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  )}

                  {/* Highlighted Excerpt */}
                  {viewerSource.excerpt && (
                    <div>
                      <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                        <Quote className="h-3.5 w-3.5 text-muted" />
                        Referenced Text
                        {viewerSource.page != null && <span className="text-3xs text-muted font-normal">(Page {viewerSource.page})</span>}
                      </h3>
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                        <p className="text-xs text-secondary leading-relaxed whitespace-pre-wrap">{viewerSource.excerpt}</p>
                      </div>
                    </div>
                  )}

                  {/* Document Content Preview */}
                  {viewerSource.sourceText && (
                    <div>
                      <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                        <BookOpen className="h-3.5 w-3.5 text-muted" />
                        Full Document Preview
                      </h3>
                      <div className="rounded-lg border border-border bg-card p-3 max-h-[400px] overflow-y-auto">
                        {viewerSource.sourceText.split('\n').slice(0, 100).map((line, i) => {
                          const lineNum = i + 1;
                          const isHighlighted = viewerSource.excerpt && line.toLowerCase().includes(viewerSource.excerpt.slice(0, 50).toLowerCase());
                          return (
                            <div key={i} className={cn('flex gap-2 text-xs leading-relaxed', isHighlighted ? 'bg-primary/10 rounded px-1 -mx-1' : '')}>
                              <span className="text-3xs text-muted w-6 text-right shrink-0 select-none">{lineNum}</span>
                              <span className={cn(isHighlighted ? 'text-primary-text' : 'text-secondary')}>{line || '\u00A0'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}


                </div>
              </ScrollArea>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Tool Results Modal */}
      <Dialog open={!!activeModal && !isToolRunning} onOpenChange={(open) => { if (!open) setActiveModal(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeModal === 'flashcards' && <BookOpen className="h-4 w-4 text-primary-text" />}
              {activeModal === 'compare-docs' && <GitCompare className="h-4 w-4 text-primary-text" />}
              {activeModal === 'confluences-tool' && <Network className="h-4 w-4 text-primary-text" />}
              {activeModal === 'quiz' && <GraduationCap className="h-4 w-4 text-primary-text" />}
              {activeModal === 'study-notes' && <StickyNote className="h-4 w-4 text-primary-text" />}
              {getToolTitle(activeModal)}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">{renderModalContent()}</div>
        </DialogContent>
      </Dialog>

      {/* Loading modal while tools are running */}
      <Dialog open={isToolRunning}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-8 w-8 text-primary-text animate-spin mb-4" />
            <p className="text-sm text-secondary">Processing your request...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfluencesView({ data }: { data: any }) {
  if (!data) return <p className="text-sm text-muted">No confluence data available.</p>;
  const confluences = data?.confluences || data?.matches || Array.isArray(data) ? data : [];
  if (!Array.isArray(confluences) || confluences.length === 0) {
    return (
      <div className="space-y-4">
        {data.summary && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-secondary leading-relaxed">{data.summary}</p>
          </div>
        )}
        {data.agreements && Array.isArray(data.agreements) && data.agreements.length > 0 && (
          <SectionBlock title="Agreements" items={data.agreements} color="text-success" />
        )}
        {data.tensions && Array.isArray(data.tensions) && data.tensions.length > 0 && (
          <SectionBlock title="Tensions" items={data.tensions} color="text-warning" />
        )}
        {!data.summary && !data.agreements && <p className="text-sm text-muted">No structured data available.</p>}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {confluences.map((item: any, i: number) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Network className="h-4 w-4 text-primary-text" />
            <span className="text-xs font-medium text-foreground">{item.title || `Confluence ${i + 1}`}</span>
          </div>
          <p className="text-xs text-secondary leading-relaxed">{item.description || item.content || item.detail || ''}</p>
          {item.confidence != null && (
            <div className="mt-2 flex items-center gap-1">
              <span className="text-3xs text-muted">Confidence:</span>
              <div className="h-1.5 w-20 rounded-full bg-elevated overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${item.confidence * 100}%` }} />
              </div>
              <span className="text-3xs text-muted">{(item.confidence * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SectionBlock({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className={cn('text-xs font-semibold mb-2', color)}>{title} ({items.length})</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-secondary">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />{item}
          </li>
        ))}
      </ul>
    </div>
  );
}

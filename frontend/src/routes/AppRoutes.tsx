import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { LoadingSpinner } from '../components/ui/Feedback';
import { ProtectedRoute } from './ProtectedRoute';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Projects = lazy(() => import('../pages/Projects'));
const Sources = lazy(() => import('../pages/Sources'));
const Claims = lazy(() => import('../pages/Claims'));
const Concepts = lazy(() => import('../pages/Concepts'));
const Associations = lazy(() => import('../pages/Associations'));
const Interpretations = lazy(() => import('../pages/Interpretations'));
const Collectors = lazy(() => import('../pages/Collectors'));
const Statistics = lazy(() => import('../pages/Statistics'));
const Similarity = lazy(() => import('../pages/Similarity'));
const DecisionSupport = lazy(() => import('../pages/DecisionSupport'));
const Learning = lazy(() => import('../pages/Learning'));
const MacroIntelligence = lazy(() => import('../pages/MacroIntelligence'));
const MT5Integration = lazy(() => import('../pages/MT5Integration'));
const TradingViewPage = lazy(() => import('../pages/TradingView'));
const Trades = lazy(() => import('../pages/Trades'));
const MarketStructure = lazy(() => import('../pages/MarketStructure'));
const Conflicts = lazy(() => import('../pages/Conflicts'));
const ResearchQuestions = lazy(() => import('../pages/ResearchQuestions'));
const Hypotheses = lazy(() => import('../pages/Hypotheses'));
const Search = lazy(() => import('../pages/Search'));
const Settings = lazy(() => import('../pages/Settings'));
const GraphExplorer = lazy(() => import('../pages/GraphExplorer'));
const Analytics = lazy(() => import('../pages/Analytics'));
const TradeMemory = lazy(() => import('../pages/TradeMemory'));
const Knowledge = lazy(() => import('../pages/Knowledge'));
const KnowledgeGraph = lazy(() => import('../pages/KnowledgeGraph'));
const Analyst = lazy(() => import('../pages/Analyst'));
const Research = lazy(() => import('../pages/Research'));
// const Replay = lazy(() => import('../pages/Replay'));
const KnowledgeCenter = lazy(() => import('../pages/KnowledgeCenter'));
const TraderIntelligence = lazy(() => import('../pages/TraderIntelligence'));
const Strategies = lazy(() => import('../pages/Strategies'));
const StrategyDetail = lazy(() => import('../pages/StrategyDetail'));
const StrategyBuilder = lazy(() => import('../pages/StrategyBuilder'));
const Playbooks = lazy(() => import('../pages/Playbooks'));
const PlaybookDetail = lazy(() => import('../pages/PlaybookDetail'));
const Performance = lazy(() => import('../pages/Performance'));
const Risk = lazy(() => import('../pages/Risk'));
const Planning = lazy(() => import('../pages/Planning'));
const AIDashboard = lazy(() => import('../pages/AIDashboard'));
const AICoach = lazy(() => import('../pages/AICoach'));
const AIProfile = lazy(() => import('../pages/AIProfile'));
const KnowledgeExplorer = lazy(() => import('../pages/KnowledgeExplorer'));
const KnowledgeEngine = lazy(() => import('../pages/KnowledgeEngine'));
const VaultManager = lazy(() => import('../pages/VaultManager'));
const SyncDashboard = lazy(() => import('../pages/SyncDashboard'));
const NoteExplorer = lazy(() => import('../pages/NoteExplorer'));
const TemplateLibrary = lazy(() => import('../pages/TemplateLibrary'));
const ObsidianSearch = lazy(() => import('../pages/ObsidianSearch'));
const MarketDashboard = lazy(() => import('../pages/MarketDashboard'));
const EconomicCalendar = lazy(() => import('../pages/EconomicCalendar'));
const CorrelationCenter = lazy(() => import('../pages/CorrelationCenter'));
const LiquidityMonitor = lazy(() => import('../pages/LiquidityMonitor'));
const Watchlist = lazy(() => import('../pages/Watchlist'));
const SessionAnalysis = lazy(() => import('../pages/SessionAnalysis'));
const MarketTimeline = lazy(() => import('../pages/MarketTimeline'));
const AlertManager = lazy(() => import('../pages/AlertManager'));
const CopilotWorkspace = lazy(() => import('../pages/CopilotWorkspace'));
const QuantResearchDashboard = lazy(() => import('../pages/QuantResearchDashboard'));
const QuantExperiments = lazy(() => import('../pages/QuantExperiments'));
const QuantBacktestLab = lazy(() => import('../pages/QuantBacktestLab'));
const QuantBacktestDetail = lazy(() => import('../pages/QuantBacktestDetail'));
const QuantSimulationLab = lazy(() => import('../pages/QuantSimulationLab'));
const QuantWalkForwardLab = lazy(() => import('../pages/QuantWalkForwardLab'));
const QuantOptimizationLab = lazy(() => import('../pages/QuantOptimizationLab'));
const QuantEdgeHealth = lazy(() => import('../pages/QuantEdgeHealth'));
const QuantNotebooks = lazy(() => import('../pages/QuantNotebooks'));
const AutomationDashboard = lazy(() => import('../pages/AutomationDashboard'));
const WorkflowList = lazy(() => import('../pages/WorkflowList'));
const WorkflowBuilder = lazy(() => import('../pages/WorkflowBuilder'));
const RuleEngine = lazy(() => import('../pages/RuleEngine'));
const Scheduler = lazy(() => import('../pages/Scheduler'));
const NotificationCenter = lazy(() => import('../pages/NotificationCenter'));
const AutomationTemplates = lazy(() => import('../pages/AutomationTemplates'));
const Connectors = lazy(() => import('../pages/Connectors'));
const AuditLog = lazy(() => import('../pages/AuditLog'));
const AutomationReports = lazy(() => import('../pages/AutomationReports'));
const PortfolioDashboard = lazy(() => import('../pages/PortfolioDashboard'));
const AccountList = lazy(() => import('../pages/AccountList'));
const AccountDetail = lazy(() => import('../pages/AccountDetail'));
const BrokerProfiles = lazy(() => import('../pages/BrokerProfiles'));
const PortfolioAnalytics = lazy(() => import('../pages/PortfolioAnalytics'));
const PortfolioRisk = lazy(() => import('../pages/PortfolioRisk'));
const AllocationManager = lazy(() => import('../pages/AllocationManager'));
const TransferManager = lazy(() => import('../pages/TransferManager'));
const Goals = lazy(() => import('../pages/Goals'));
const PortfolioReports = lazy(() => import('../pages/PortfolioReports'));
const BrokerHub = lazy(() => import('../pages/BrokerHub'));
const BrokerDetail = lazy(() => import('../pages/BrokerDetail'));
const BrokerSetup = lazy(() => import('../pages/BrokerSetup'));
const BrokerAnalyticsPage = lazy(() => import('../pages/BrokerAnalyticsPage'));
const Workspace = lazy(() => import('../pages/Workspace'));
const ICTSmartEngine = lazy(() => import('../pages/ICTSmartEngine'));
const BrainDashboard = lazy(() => import('../pages/BrainDashboard'));
const IntelligenceDashboard = lazy(() => import('../pages/IntelligenceDashboard'));
const CollectionsPage = lazy(() => import('../pages/Collections'));
const NotesPage = lazy(() => import('../pages/Notes'));
const BookmarksPage = lazy(() => import('../pages/Bookmarks'));
const GraphPage = lazy(() => import('../pages/Graph'));
const TimelinePage = lazy(() => import('../pages/Timeline'));

/**
 * Authenticated application routes. Every module under /projects/:projectId is
 * wired to a page; modules that are not yet integrated render a Coming Soon
 * placeholder so the shell stays navigable end-to-end.
 */
export const AppRoutes = () => (
  <MainLayout>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId/dashboard" element={<Dashboard />} />
          <Route path="/projects/:projectId/projects" element={<Projects />} />
          <Route path="/projects/:projectId/sources" element={<Sources />} />
          <Route path="/projects/:projectId/claims" element={<Claims />} />
          <Route path="/projects/:projectId/claims/:claim_id/graph" element={<GraphExplorer />} />
          <Route path="/projects/:projectId/concepts" element={<Concepts />} />
          <Route path="/projects/:projectId/associations" element={<Associations />} />
          <Route path="/projects/:projectId/interpretations" element={<Interpretations />} />
          <Route path="/projects/:projectId/trades" element={<Trades />} />
          <Route path="/projects/:projectId/strategies" element={<Strategies />} />
          <Route path="/projects/:projectId/strategies/new" element={<StrategyBuilder />} />
          <Route path="/projects/:projectId/strategies/:strategyId" element={<StrategyDetail />} />
          <Route path="/projects/:projectId/strategies/:strategyId/edit" element={<StrategyBuilder />} />
          <Route path="/projects/:projectId/playbooks" element={<Playbooks />} />
          <Route path="/projects/:projectId/playbooks/:playbookId" element={<PlaybookDetail />} />
          <Route path="/projects/:projectId/market-structure" element={<MarketStructure />} />
          <Route path="/projects/:projectId/collectors" element={<Collectors />} />
<Route path="/projects/:projectId/statistics" element={<Statistics />} />
          <Route path="/projects/:projectId/performance" element={<Performance />} />
          <Route path="/projects/:projectId/risk" element={<Risk />} />
          <Route path="/projects/:projectId/planning" element={<Planning />} />
          <Route path="/projects/:projectId/similarity" element={<Similarity />} />
          <Route path="/projects/:projectId/decision" element={<DecisionSupport />} />
          <Route path="/projects/:projectId/learning" element={<Learning />} />
          <Route path="/projects/:projectId/macro" element={<MacroIntelligence />} />
          <Route path="/projects/:projectId/mt5" element={<MT5Integration />} />
          <Route path="/projects/:projectId/tradingview" element={<TradingViewPage />} />
          <Route path="/projects/:projectId/conflicts" element={<Conflicts />} />
          <Route path="/projects/:projectId/questions" element={<ResearchQuestions />} />
          <Route path="/projects/:projectId/hypotheses" element={<Hypotheses />} />
          <Route path="/projects/:projectId/search" element={<Search />} />
          <Route path="/projects/:projectId/settings" element={<Settings />} />
          <Route path="/projects/:projectId/analytics" element={<Analytics />} />
          <Route path="/projects/:projectId/memories" element={<TradeMemory />} />
          <Route path="/projects/:projectId/knowledge" element={<Knowledge />} />
          <Route path="/projects/:projectId/knowledge-graph" element={<KnowledgeGraph />} />
          <Route path="/projects/:projectId/knowledge-engine" element={<KnowledgeEngine />} />
          <Route path="/projects/:projectId/analyst" element={<Analyst />} />
          <Route path="/projects/:projectId/research" element={<Research />} />
          {/* <Route path="/projects/:projectId/replay" element={<Replay />} /> */}
          <Route path="/projects/:projectId/trader-intelligence" element={<TraderIntelligence />} />
          <Route path="/projects/:projectId/knowledge-center" element={<KnowledgeCenter />} />
          <Route path="/projects/:projectId/ai" element={<AIDashboard />} />
          <Route path="/projects/:projectId/ai/coach" element={<AICoach />} />
          <Route path="/projects/:projectId/ai/profile" element={<AIProfile />} />
          <Route path="/projects/:projectId/ai/knowledge" element={<KnowledgeExplorer />} />
          <Route path="/projects/:projectId/obsidian/vaults" element={<VaultManager />} />
          <Route path="/projects/:projectId/obsidian/sync" element={<SyncDashboard />} />
          <Route path="/projects/:projectId/obsidian/notes" element={<NoteExplorer />} />
          <Route path="/projects/:projectId/obsidian/templates" element={<TemplateLibrary />} />
          <Route path="/projects/:projectId/obsidian/search" element={<ObsidianSearch />} />
          <Route path="/projects/:projectId/market-intel" element={<MarketDashboard />} />
          <Route path="/projects/:projectId/market-intel/calendar" element={<EconomicCalendar />} />
          <Route path="/projects/:projectId/market-intel/correlations" element={<CorrelationCenter />} />
          <Route path="/projects/:projectId/market-intel/liquidity" element={<LiquidityMonitor />} />
          <Route path="/projects/:projectId/market-intel/watchlist" element={<Watchlist />} />
          <Route path="/projects/:projectId/market-intel/sessions" element={<SessionAnalysis />} />
          <Route path="/projects/:projectId/market-intel/timeline" element={<MarketTimeline />} />
          <Route path="/projects/:projectId/market-intel/alerts" element={<AlertManager />} />
          <Route path="/projects/:projectId/copilot" element={<CopilotWorkspace />} />
          <Route path="/projects/:projectId/quant-research" element={<QuantResearchDashboard />} />
          <Route path="/projects/:projectId/quant-research/experiments" element={<QuantExperiments />} />
          <Route path="/projects/:projectId/quant-research/backtests" element={<QuantBacktestLab />} />
          <Route path="/projects/:projectId/quant-research/backtests/:backtestId" element={<QuantBacktestDetail />} />
          <Route path="/projects/:projectId/quant-research/simulations" element={<QuantSimulationLab />} />
          <Route path="/projects/:projectId/quant-research/walkforward" element={<QuantWalkForwardLab />} />
          <Route path="/projects/:projectId/quant-research/optimization" element={<QuantOptimizationLab />} />
          <Route path="/projects/:projectId/quant-research/edge-health" element={<QuantEdgeHealth />} />
          <Route path="/projects/:projectId/quant-research/notebooks" element={<QuantNotebooks />} />
          <Route path="/projects/:projectId/automation" element={<AutomationDashboard />} />
          <Route path="/projects/:projectId/automation/workflows" element={<WorkflowList />} />
          <Route path="/projects/:projectId/automation/workflows/:workflowId" element={<WorkflowBuilder />} />
          <Route path="/projects/:projectId/automation/rules" element={<RuleEngine />} />
          <Route path="/projects/:projectId/automation/jobs" element={<Scheduler />} />
          <Route path="/projects/:projectId/automation/notifications" element={<NotificationCenter />} />
          <Route path="/projects/:projectId/automation/templates" element={<AutomationTemplates />} />
          <Route path="/projects/:projectId/automation/connectors" element={<Connectors />} />
          <Route path="/projects/:projectId/automation/audit" element={<AuditLog />} />
          <Route path="/projects/:projectId/automation/reports" element={<AutomationReports />} />
          <Route path="/projects/:projectId/portfolio" element={<PortfolioDashboard />} />
          <Route path="/projects/:projectId/portfolio/accounts" element={<AccountList />} />
          <Route path="/projects/:projectId/portfolio/accounts/:accountId" element={<AccountDetail />} />
          <Route path="/projects/:projectId/portfolio/brokers" element={<BrokerProfiles />} />
          <Route path="/projects/:projectId/portfolio/analytics" element={<PortfolioAnalytics />} />
          <Route path="/projects/:projectId/portfolio/risk" element={<PortfolioRisk />} />
          <Route path="/projects/:projectId/portfolio/allocations" element={<AllocationManager />} />
          <Route path="/projects/:projectId/portfolio/transfers" element={<TransferManager />} />
          <Route path="/projects/:projectId/portfolio/goals" element={<Goals />} />
          <Route path="/projects/:projectId/portfolio/reports" element={<PortfolioReports />} />
          <Route path="/projects/:projectId/broker" element={<BrokerHub />} />
          <Route path="/projects/:projectId/broker/setup" element={<BrokerSetup />} />
          <Route path="/projects/:projectId/broker/:connectionId" element={<BrokerDetail />} />
          <Route path="/projects/:projectId/broker/analytics" element={<BrokerAnalyticsPage />} />
          <Route path="/projects/:projectId/workspace" element={<Workspace />} />
          <Route path="/projects/:projectId/ict" element={<ICTSmartEngine />} />
          <Route path="/projects/:projectId/brain" element={<BrainDashboard />} />
          <Route path="/projects/:projectId/intelligence" element={<IntelligenceDashboard />} />
          <Route path="/projects/:projectId/collections" element={<CollectionsPage />} />
          <Route path="/projects/:projectId/notes" element={<NotesPage />} />
          <Route path="/projects/:projectId/bookmarks" element={<BookmarksPage />} />
          <Route path="/projects/:projectId/graph" element={<GraphPage />} />
          <Route path="/projects/:projectId/timeline" element={<TimelinePage />} />
        </Route>
      </Routes>
    </Suspense>
  </MainLayout>
);

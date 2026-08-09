import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { reportError } from '../lib/observability';
import { MainLayout } from '../layouts/MainLayout';
import { LoadingSpinner } from '../components/ui/Feedback';
import { ErrorFallback } from '../components/ui/ErrorFallback';
import { ProtectedRoute } from './ProtectedRoute';
import { ProjectGuard } from './ProjectGuard';

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
const Replay = lazy(() => import('../pages/Replay'));
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
 * wired to a page; every route resolves to a fully implemented module.
 */
const routeErrorHandler = (error: Error, info: { componentStack?: string | null }) => {
  reportError(error, {
    category: 'react-route',
    component: info.componentStack ?? '',
    route: typeof window !== 'undefined' ? window.location.pathname : '',
  });
};

export const AppRoutes = () => (
  <MainLayout>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectGuard />}>
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="dashboard" element={<ErrorBoundary FallbackComponent={ErrorFallback} onError={routeErrorHandler}><Dashboard /></ErrorBoundary>} />
            <Route path="projects" element={<Projects />} />
            <Route path="sources" element={<Sources />} />
            <Route path="claims" element={<Claims />} />
            <Route path="claims/:claim_id/graph" element={<GraphExplorer />} />
            <Route path="concepts" element={<Concepts />} />
            <Route path="associations" element={<Associations />} />
            <Route path="interpretations" element={<Interpretations />} />
            <Route path="trades" element={<Trades />} />
            <Route path="strategies" element={<Strategies />} />
            <Route path="strategies/new" element={<StrategyBuilder />} />
            <Route path="strategies/:strategyId" element={<StrategyDetail />} />
            <Route path="strategies/:strategyId/edit" element={<StrategyBuilder />} />
            <Route path="playbooks" element={<Playbooks />} />
            <Route path="playbooks/:playbookId" element={<PlaybookDetail />} />
            <Route path="market-structure" element={<MarketStructure />} />
            <Route path="collectors" element={<Collectors />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="performance" element={<Performance />} />
            <Route path="risk" element={<Risk />} />
            <Route path="planning" element={<Planning />} />
            <Route path="similarity" element={<Similarity />} />
            <Route path="decision" element={<DecisionSupport />} />
            <Route path="learning" element={<Learning />} />
            <Route path="macro" element={<ErrorBoundary FallbackComponent={ErrorFallback} onError={routeErrorHandler}><MacroIntelligence /></ErrorBoundary>} />
            <Route path="mt5" element={<MT5Integration />} />
            <Route path="tradingview" element={<TradingViewPage />} />
            <Route path="conflicts" element={<Conflicts />} />
            <Route path="questions" element={<ResearchQuestions />} />
            <Route path="hypotheses" element={<Hypotheses />} />
            <Route path="search" element={<Search />} />
            <Route path="settings" element={<Settings />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="memories" element={<TradeMemory />} />
            <Route path="knowledge" element={<Knowledge />} />
            <Route path="knowledge-graph" element={<KnowledgeGraph />} />
            <Route path="knowledge-engine" element={<KnowledgeEngine />} />
            <Route path="analyst" element={<Analyst />} />
            <Route path="research" element={<ErrorBoundary FallbackComponent={ErrorFallback} onError={routeErrorHandler}><Research /></ErrorBoundary>} />
            <Route path="replay" element={<Replay />} />
            <Route path="trader-intelligence" element={<TraderIntelligence />} />
            <Route path="knowledge-center" element={<KnowledgeCenter />} />
            <Route path="ai" element={<ErrorBoundary FallbackComponent={ErrorFallback} onError={routeErrorHandler}><AIDashboard /></ErrorBoundary>} />
            <Route path="ai/coach" element={<AICoach />} />
            <Route path="ai/profile" element={<AIProfile />} />
            <Route path="ai/knowledge" element={<KnowledgeExplorer />} />
            <Route path="obsidian/vaults" element={<VaultManager />} />
            <Route path="obsidian/sync" element={<SyncDashboard />} />
            <Route path="obsidian/notes" element={<NoteExplorer />} />
            <Route path="obsidian/templates" element={<TemplateLibrary />} />
            <Route path="obsidian/search" element={<ObsidianSearch />} />
            <Route path="market-intel" element={<MarketDashboard />} />
            <Route path="market-intel/calendar" element={<EconomicCalendar />} />
            <Route path="market-intel/correlations" element={<CorrelationCenter />} />
            <Route path="market-intel/liquidity" element={<LiquidityMonitor />} />
            <Route path="market-intel/watchlist" element={<Watchlist />} />
            <Route path="market-intel/sessions" element={<SessionAnalysis />} />
            <Route path="market-intel/timeline" element={<MarketTimeline />} />
            <Route path="market-intel/alerts" element={<AlertManager />} />
            <Route path="copilot" element={<CopilotWorkspace />} />
            <Route path="quant-research" element={<QuantResearchDashboard />} />
            <Route path="quant-research/experiments" element={<QuantExperiments />} />
            <Route path="quant-research/backtests" element={<QuantBacktestLab />} />
            <Route path="quant-research/backtests/:backtestId" element={<QuantBacktestDetail />} />
            <Route path="quant-research/simulations" element={<QuantSimulationLab />} />
            <Route path="quant-research/walkforward" element={<QuantWalkForwardLab />} />
            <Route path="quant-research/optimization" element={<QuantOptimizationLab />} />
            <Route path="quant-research/edge-health" element={<QuantEdgeHealth />} />
            <Route path="quant-research/notebooks" element={<QuantNotebooks />} />
            <Route path="automation" element={<AutomationDashboard />} />
            <Route path="automation/workflows" element={<WorkflowList />} />
            <Route path="automation/workflows/:workflowId" element={<WorkflowBuilder />} />
            <Route path="automation/rules" element={<RuleEngine />} />
            <Route path="automation/jobs" element={<Scheduler />} />
            <Route path="automation/notifications" element={<NotificationCenter />} />
            <Route path="automation/templates" element={<AutomationTemplates />} />
            <Route path="automation/connectors" element={<Connectors />} />
            <Route path="automation/audit" element={<AuditLog />} />
            <Route path="automation/reports" element={<AutomationReports />} />
            <Route path="portfolio" element={<PortfolioDashboard />} />
            <Route path="portfolio/accounts" element={<AccountList />} />
            <Route path="portfolio/accounts/:accountId" element={<AccountDetail />} />
            <Route path="portfolio/brokers" element={<BrokerProfiles />} />
            <Route path="portfolio/analytics" element={<PortfolioAnalytics />} />
            <Route path="portfolio/risk" element={<PortfolioRisk />} />
            <Route path="portfolio/allocations" element={<AllocationManager />} />
            <Route path="portfolio/transfers" element={<TransferManager />} />
            <Route path="portfolio/goals" element={<Goals />} />
            <Route path="portfolio/reports" element={<PortfolioReports />} />
            <Route path="broker" element={<BrokerHub />} />
            <Route path="broker/setup" element={<BrokerSetup />} />
            <Route path="broker/:connectionId" element={<BrokerDetail />} />
            <Route path="broker/analytics" element={<BrokerAnalyticsPage />} />
            <Route path="workspace" element={<ErrorBoundary FallbackComponent={ErrorFallback} onError={routeErrorHandler}><Workspace /></ErrorBoundary>} />
            <Route path="ict" element={<ICTSmartEngine />} />
            <Route path="brain" element={<BrainDashboard />} />
            <Route path="intelligence" element={<IntelligenceDashboard />} />
            <Route path="collections" element={<CollectionsPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="bookmarks" element={<BookmarksPage />} />
            <Route path="graph" element={<GraphPage />} />
            <Route path="timeline" element={<TimelinePage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  </MainLayout>
);

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
          <Route path="/projects/:projectId/market-structure" element={<MarketStructure />} />
          <Route path="/projects/:projectId/collectors" element={<Collectors />} />
<Route path="/projects/:projectId/statistics" element={<Statistics />} />
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
        </Route>
      </Routes>
    </Suspense>
  </MainLayout>
);

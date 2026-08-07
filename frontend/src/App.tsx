import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppRoutes } from './routes/AppRoutes';
import { PageLoader } from './components/ui/Spinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ServerError = lazy(() => import('./pages/ServerError'));

function withSuspense(node: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>;
}

/**
 * App-level error boundary keyed on the current pathname. When a lazy
 * chunk fails to load (flaky network, stale chunk after a deploy), the
 * boundary renders its fallback; navigating anywhere (or pressing
 * "Try again") re-mounts it and retries the import — no reload needed.
 */
const AppShell = () => {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      <OfflineBanner />
      <Routes>
        <Route path="/login" element={withSuspense(<Login />)} />
        <Route path="/register" element={withSuspense(<Register />)} />
        <Route path="/forgot-password" element={withSuspense(<ForgotPassword />)} />
        <Route path="/reset-password" element={withSuspense(<ResetPassword />)} />
        <Route path="/500" element={withSuspense(<ServerError />)} />

        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<AppRoutes />} />
        </Route>

        <Route path="*" element={withSuspense(<NotFound />)} />
      </Routes>
    </ErrorBoundary>
  );
};

export const App = () => {
  return <AppShell />;
};

import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
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

export const App = () => {
  return (
    <ErrorBoundary>
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

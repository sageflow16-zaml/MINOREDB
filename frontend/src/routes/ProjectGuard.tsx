import { Navigate, Outlet, useParams } from 'react-router-dom';

/**
 * Centralized guard for every route under /projects/:projectId.
 *
 * The route parameter is guaranteed to be present when React Router matches
 * a `/projects/:projectId/...` path, but it can be an empty string for
 * malformed URLs (e.g. `/projects//dashboard`). Rather than relying on
 * per-page `projectId!` assertions and per-page `!projectId` early returns
 * (which 80+ pages would each have to get right), this single wrapper:
 *
 *   - redirects malformed/param-less URLs to /projects (never renders a page
 *     with an undefined project id, so pages can never spin forever),
 *   - guarantees that every descendant page receives a non-empty projectId
 *     from useParams, making the `projectId!` assertions downstream safe.
 */
export const ProjectGuard = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return <Navigate to="/projects" replace />;
  }

  return <Outlet />;
};

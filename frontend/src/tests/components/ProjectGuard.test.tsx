import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectGuard } from '../../routes/ProjectGuard';

const ProjectsStub = () => <div>PROJECTS_LIST</div>;
const GuardedPage = ({ label }: { label: string }) => (
  <div>{`GUARDED:${label}`}</div>
);

function renderWithGuard(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/projects" element={<ProjectsStub />} />
        <Route path="/projects/:projectId" element={<ProjectGuard />}>
          <Route path="dashboard" element={<GuardedPage label="dashboard" />} />
          <Route path="trades" element={<GuardedPage label="trades" />} />
          <Route index element={<Navigate to="/projects" replace />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('ProjectGuard', () => {
  it('renders the outlet when the project id param is present', () => {
    renderWithGuard('/projects/proj-1/dashboard');
    expect(screen.getByText('GUARDED:dashboard')).toBeInTheDocument();
  });

  it('navigates nested child routes under the guard', () => {
    renderWithGuard('/projects/proj-1/trades');
    expect(screen.getByText('GUARDED:trades')).toBeInTheDocument();
  });

  it('never renders a guarded page for malformed URLs with an empty project id', () => {
    // React Router does not bind an empty segment to :projectId, so the
    // malformed path matches nothing (the app's catch-all NotFound).
    // Invariant: a project page can never mount without a non-empty id.
    renderWithGuard('/projects//dashboard');
    expect(screen.queryByText(/GUARDED:/)).not.toBeInTheDocument();

    renderWithGuard('/projects//trades');
    expect(screen.queryByText(/GUARDED:/)).not.toBeInTheDocument();
  });

  it('redirects a bare /projects/:projectId without children to /projects', () => {
    renderWithGuard('/projects/proj-9');
    expect(screen.getByText('PROJECTS_LIST')).toBeInTheDocument();
    expect(screen.queryByText(/GUARDED:/)).not.toBeInTheDocument();
  });
});

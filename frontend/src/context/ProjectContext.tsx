import React, {createContext, useContext, useState} from 'react';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
}

interface ProjectContextType {
  projectId: string | null;
  setProjectId: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
  const [projectId, setProjectIdState] = useState<string | null>(
    localStorage.getItem('minore_projectId')
  );

  const setProjectId = (id: string | null) => {
    if (id) {
      localStorage.setItem('minore_projectId', id);
    } else {
      localStorage.removeItem('minore_projectId');
    }
    setProjectIdState(id);
  };

  return (
    <ProjectContext.Provider value={{ projectId, setProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

/**
 * Extract the project id from a location pathname, if the path is a
 * project-scoped route (/projects/:projectId/...). Returns null for
 * non-project paths (e.g. /projects list, /login) and for malformed
 * paths where the param is missing or empty.
 *
 * Used to keep the project context in sync with the URL so that deep
 * links, browser back/forward and project switching always land the
 * sidebar/Topbar on the same project the URL points at.
 */
export function projectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  if (!match || !match[1]) return null;
  return match[1];
}

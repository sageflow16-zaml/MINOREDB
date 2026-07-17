import React, { createContext, useContext, useState, useEffect } from 'react';

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

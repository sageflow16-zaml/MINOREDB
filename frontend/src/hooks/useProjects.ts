import { useQuery } from '@tanstack/react-query';
import { projectService } from '../api';
import { Project } from '../context/ProjectContext';

export const useProjects = () => {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => projectService.list(),
  });
};

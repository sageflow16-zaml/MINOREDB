import { useState } from 'react';
import { useCreateProject } from '../hooks/useProjectMutations';
import { Button } from './ui/Button';

export const CreateProjectModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [name, setName] = useState('');
  const createProject = useCreateProject();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Create Project</h2>
        <input 
          className="w-full p-2 mb-4 border rounded dark:bg-slate-800" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          placeholder="Project Name"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { createProject.mutate({ name }); onClose(); }}>Create</Button>
        </div>
      </div>
    </div>
  );
};

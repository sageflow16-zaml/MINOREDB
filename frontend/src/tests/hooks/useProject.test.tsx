import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectProvider, useProject } from '../../context/ProjectContext';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <ProjectProvider>{children}</ProjectProvider>;
}

describe('useProject', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default null projectId', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    expect(result.current.projectId).toBeNull();
  });

  it('sets projectId', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    act(() => {
      result.current.setProjectId('proj-123');
    });
    expect(result.current.projectId).toBe('proj-123');
  });

  it('persists projectId to localStorage', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    act(() => {
      result.current.setProjectId('proj-456');
    });
    expect(localStorage.getItem('minore_projectId')).toBe('proj-456');
  });

  it('clears projectId from localStorage when set to null', () => {
    localStorage.setItem('minore_projectId', 'proj-789');
    const { result } = renderHook(() => useProject(), { wrapper });
    act(() => {
      result.current.setProjectId(null);
    });
    expect(result.current.projectId).toBeNull();
    expect(localStorage.getItem('minore_projectId')).toBeNull();
  });

  it('throws when used outside ProjectProvider', () => {
    expect(() => renderHook(() => useProject())).toThrow(
      'useProject must be used within a ProjectProvider'
    );
  });
});
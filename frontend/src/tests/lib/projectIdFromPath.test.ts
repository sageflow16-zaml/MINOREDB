import { describe, it, expect } from 'vitest';
import { projectIdFromPath } from '../../context/ProjectContext';

describe('projectIdFromPath', () => {
  it('extracts the project id from a deep project route', () => {
    expect(projectIdFromPath('/projects/abc-123/dashboard')).toBe('abc-123');
  });

  it('extracts the project id from a nested route', () => {
    expect(projectIdFromPath('/projects/abc-123/portfolio/accounts/acc-1')).toBe('abc-123');
  });

  it('extracts the project id from the bare project route', () => {
    expect(projectIdFromPath('/projects/abc-123')).toBe('abc-123');
  });

  it('returns null for the project list route', () => {
    expect(projectIdFromPath('/projects')).toBeNull();
    expect(projectIdFromPath('/projects/')).toBeNull();
  });

  it('returns null for malformed URLs with an empty project id', () => {
    expect(projectIdFromPath('/projects//dashboard')).toBeNull();
  });

  it('returns null for non-project routes', () => {
    expect(projectIdFromPath('/login')).toBeNull();
    expect(projectIdFromPath('/')).toBeNull();
    expect(projectIdFromPath('/reset-password')).toBeNull();
  });

  it('handles trailing slashes', () => {
    expect(projectIdFromPath('/projects/abc-123/dashboard/')).toBe('abc-123');
  });
});

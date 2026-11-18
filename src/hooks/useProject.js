import { useContext } from 'react';
import { ProjectContext } from '../context/contexts.js';

/**
 * Access active project data, members, labels, and RBAC permission flags.
 */
export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider.');
  }
  return context;
}

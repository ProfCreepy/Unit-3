// ============================================
// hooks/useProject.js
// Nur der Custom Hook
// ============================================

import { useContext } from 'react';
import { ProjectContext } from './ProjectProvider';

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject muss innerhalb von ProjectProvider verwendet werden');
  }
  return context;
}

// ============================================
// hooks/ProjectProvider.jsx
// Nur die Provider Component
// ============================================

import { createContext, useState, useCallback } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  // UI State
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [activeTool, setActiveTool] = useState(null);

  // Canvas Settings
  const [canvasSettings, setCanvasSettings] = useState({
    width: 1200,
    height: 800,
    gridSize: 20,
    showGrid: true,
    zoom: 100,
  });

  // Theme Settings
  const [themeSettings, setThemeSettings] = useState({
    theme: 'light',
    primaryColor: '#6366F1',
    accentColor: '#EC4899',
  });

  // Project Settings
  const [projectSettings, setProjectSettings] = useState({
    name: 'Untitled Project',
    autoSave: true,
  });

  // Elements
  const [elements, setElements] = useState([]);

  // Extensions
  const [extensions, setExtensions] = useState([]);

  // ===== SIDEBAR =====
  const toggleSidebar = useCallback((sidebarName) => {
    setActiveSidebar(prev => prev === sidebarName ? null : sidebarName);
  }, []);

  const closeSidebar = useCallback(() => {
    setActiveSidebar(null);
  }, []);

  // ===== TOOLS =====
  const selectTool = useCallback((toolName) => {
    setActiveTool(prev => prev === toolName ? null : toolName);
  }, []);

  const closeTool = useCallback(() => {
    setActiveTool(null);
  }, []);

  // ===== CANVAS SETTINGS =====
  const updateCanvasSettings = useCallback((newSettings) => {
    setCanvasSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  // ===== THEME SETTINGS =====
  const updateThemeSettings = useCallback((newSettings) => {
    setThemeSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  // ===== PROJECT SETTINGS =====
  const updateProjectSettings = useCallback((newSettings) => {
    setProjectSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  // ===== ELEMENTS =====
  const addElement = useCallback((element) => {
    setElements(prev => [...prev, { id: Date.now(), ...element }]);
  }, []);

  const removeElement = useCallback((id) => {
    setElements(prev => prev.filter(el => el.id !== id));
  }, []);

  const updateElement = useCallback((id, updates) => {
    setElements(prev =>
      prev.map(el => el.id === id ? { ...el, ...updates } : el)
    );
  }, []);

  // ===== EXTENSIONS =====
  const registerExtension = useCallback((extension) => {
    setExtensions(prev => [...prev, extension]);
  }, []);

  const enableExtension = useCallback((extensionName) => {
    setExtensions(prev =>
      prev.map(ext =>
        ext.name === extensionName ? { ...ext, enabled: true } : ext
      )
    );
  }, []);

  const disableExtension = useCallback((extensionName) => {
    setExtensions(prev =>
      prev.map(ext =>
        ext.name === extensionName ? { ...ext, enabled: false } : ext
      )
    );
  }, []);

  const unregisterExtension = useCallback((extensionName) => {
    setExtensions(prev => prev.filter(ext => ext.name !== extensionName));
  }, []);

  // ===== VALUE =====
  const value = {
    // Sidebar
    activeSidebar,
    toggleSidebar,
    closeSidebar,

    // Tools
    activeTool,
    selectTool,
    closeTool,

    // Canvas Settings
    canvasSettings,
    updateCanvasSettings,

    // Theme Settings
    themeSettings,
    updateThemeSettings,

    // Project Settings
    projectSettings,
    updateProjectSettings,

    // Elements
    elements,
    addElement,
    removeElement,
    updateElement,

    // Extensions
    extensions,
    registerExtension,
    enableExtension,
    disableExtension,
    unregisterExtension,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

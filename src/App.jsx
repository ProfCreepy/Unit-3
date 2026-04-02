import { useState, useEffect } from 'react'
import './App.css'

import Header from './components/Header';
import Tools from './components/Tools';
import Canvas from './components/Canvas';
import Settings from './components/Settings';
import Extensions from './components/Extensions';
import { generateCSSVariables } from './theme';

function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [activeSidebar, setActiveSidebar] = useState(null);

  // Anwenden der CSS-Variablen beim Mount
  useEffect(() => {
    const vars = generateCSSVariables();
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);

  const toggleSidebar = (name) => {
    // Wenn die geklickte Sidebar schon offen ist -> schließen (null), sonst öffnen (name)
    setActiveSidebar(prev => prev === name ? null : name);
  };

  const toggleTool = (toolName) => {
    setActiveTool(prev => prev === toolName ? null : toolName);
  };

  return (
    <div className={`app-grid ${activeSidebar ? 'sidebar-open' : ''}`}>
      <Header onToggle={toggleSidebar} />
      <Tools onToggle={toggleTool} active={activeTool} />
      <Canvas />
      {activeSidebar === 'settings' && <Settings />}
      {activeSidebar === 'extensions' && <Extensions />}
    </div>
  );
}

export default App;

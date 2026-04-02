import { useState } from 'react'
import './App.css'

import Header from './components/Header';
import Tools from './components/Tools';
import Canvas from './components/Canvas';
import Settings from './components/Settings';
import Extensions from './components/Extensions';

function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [activeSidebar, setActiveSidebar] = useState(null);

  const toggleSidebar = (name) => {
    // Wenn die geklickte Sidebar schon offen ist -> schließen (null), sonst öffnen (name)
    setActiveSidebar(prev => prev === name ? null : name);
  };

  return (
    <div className={`app-grid ${activeSidebar ? 'sidebar-open' : ''}`}>
      <Header onToggle={toggleSidebar} />
      <Tools onToggle={setActiveTool} active={activeTool} />
      <Canvas />
      {activeSidebar === 'settings' && <Settings />}
      {activeSidebar === 'extensions' && <Extensions />}
    </div>
  );
}

export default App;
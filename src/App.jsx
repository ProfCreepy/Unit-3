import { useState } from 'react'
import './App.css'
import Divider from './components/Divider';
import Spacer from './components/Spacer';
import { Settings2Icon, ImageIcon, UploadIcon, DownloadIcon, BlocksIcon, PlayIcon, StepForwardIcon, PencilIcon, MousePointer2Icon, PointerIcon } from 'lucide-react';

function Header({ onToggle }) {
  return (
    <header className='header'>
      <h1>Unit 3</h1>

      <Divider />

      <input type='text' placeholder='Project name'></input>

      <Divider />

      <UploadIcon size={40} />
      <DownloadIcon size={40} />
      <ImageIcon size={40} />

      <Divider />

      <Spacer />

      <button
        className="icon-button"
        onClick={() => onToggle('settings')}
        aria-label="open settings"
      >
        <Settings2Icon size={40} />
      </button>

      <button
        className="icon-button"
        onClick={() => onToggle('extensions')}
        aria-label="open extensions"
      >
        <BlocksIcon size={40} />
      </button>
    </header>
  );
}

function Tools() {
  return (
    <section className='tools'>
      <PlayIcon size={40} />
      <StepForwardIcon size={40} />

      <Divider />

      <PencilIcon size={40} />
      <MousePointer2Icon size={40} />
      <PointerIcon size={40} />
    </section>
  );
}

function Canvas() {
  return (
    <main className='canvas'>
      canvas
    </main>
  );
}

function Settings() {
  return (
    <aside className='settings'>
      settings
    </aside>
  );
}

function Extensions() {
  return (
    <aside className='extensions'>
      extensions
    </aside>
  );
}

function App() {
  const [activeSidebar, setActiveSidebar] = useState(null);

  const toggleSidebar = (name) => {
    // Wenn die geklickte Sidebar schon offen ist -> schließen (null), sonst öffnen (name)
    setActiveSidebar(prev => prev === name ? null : name);
  };

  return (
    <>
      <Header onToggle={toggleSidebar} />
      <Tools />
      <Canvas />
      {activeSidebar === 'settings' && <Settings />}
      {activeSidebar === 'extensions' && <Extensions />}
    </>
  );
}

export default App;
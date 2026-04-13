import { useProject } from '../hooks/useProject';
import Divider from './Divider';
import { PlayIcon, StepForwardIcon, RotateCcwIcon, PencilIcon } from 'lucide-react';
import { getToolColor } from '../theme';
import './tools.css';

export default function Tools() {
  const { activeTool, selectTool, elements, removeElement } = useProject();

  const handleReset = () => {
    if (elements.length === 0) return;
    if (window.confirm('Alle Zellen löschen?')) {
      elements.forEach(el => removeElement(el.id));
    }
  };

  const handlePenClick = () => {
    selectTool('pen');
    // Speichere selectedCellType in localStorage für Persistierung
    localStorage.setItem('selectedCellType', selectedCellType);
  };

  return (
    <>
      <section className='tools'>
        <button
          className='icon-button'
          style={{ color: getToolColor('play') }}
          title='Play - Simulation starten'
        >
          <PlayIcon size={40} />
        </button>

        <button
          className='icon-button'
          style={{ color: getToolColor('step') }}
          title='Step - Ein Zyklus'
        >
          <StepForwardIcon size={40} />
        </button>

        <button
          className='icon-button'
          onClick={handleReset}
          style={{ color: '#EF4444' }}
          title='Reset - Alles löschen'
        >
          <RotateCcwIcon size={40} />
        </button>

        <Divider direction='horizontal' />

        <button
          className={`icon-button ${activeTool === 'pen' ? 'active' : ''}`}
          onClick={handlePenClick}
          style={{ color: getToolColor('pen') }}
          title='Pen - Zellen zeichnen'
        >
          <PencilIcon size={40} />
        </button>
      </section>
    </>
  );
}
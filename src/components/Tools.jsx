import Divider from './Divider';
import { PlayIcon, StepForwardIcon, PencilIcon, MousePointer2Icon, PointerIcon } from 'lucide-react';
import { getToolColor, getCellColor } from '../theme';

function PenIcon() {
  return <PencilIcon size={40} strokeWidth={1.5} />;
}

function SelectIcon() {
  return <PointerIcon size={40} strokeWidth={1.5} />;
}

function InteractIcon() {
  return <MousePointer2Icon size={40} strokeWidth={1.5} />;
}

// CellType mit besserer Struktur und dynamischen Farben
function CellTypePicker() {
  const cellTypes = [
    { id: 'cable', label: 'Cable' },
    { id: 'inverter', label: 'Inverter' },
    { id: 'delay', label: 'Delay' },
  ];

  const handleCellTypeClick = (typeId) => {
    console.log(`Selected cell type: ${typeId}`);
    // Hier kann später die Logik hin
  };

  return (
    <div className='cell-type-picker'>
      {cellTypes.map(cell => (
        <button
          key={cell.id}
          className={`cell-type cell-type-${cell.id}`}
          title={cell.label}
          onClick={() => handleCellTypeClick(cell.id)}
          aria-label={cell.label}
          style={{
            borderColor: getCellColor(cell.id),
            color: getCellColor(cell.id),
            backgroundColor: `${getCellColor(cell.id)}15`, // 15% opacity
          }}
        >
          {cell.label.substring(0, 1)}
        </button>
      ))}
    </div>
  );
}

export default function Tools({ onToggle, active }) {
  const iconSize = 40;
  
  return (
    <section className='tools'>
      <button 
        className='icon-button' 
        onClick={() => alert('play')}
        style={{ color: getToolColor('play') }}
        title="Play"
      >
        <PlayIcon size={iconSize} strokeWidth={1.5} />
      </button>

      <button 
        className='icon-button' 
        onClick={() => alert('step')}
        style={{ color: getToolColor('step') }}
        title="Step"
      >
        <StepForwardIcon size={iconSize} strokeWidth={1.5} />
      </button>

      <Divider direction='horizontal' />

      <button
        className={`icon-button ${active === 'pen' ? 'active' : ''}`}
        onClick={() => onToggle('pen')}
        style={{ color: getToolColor('pen') }}
        aria-label="pen tool"
        title="Pen Tool"
      >
        <PenIcon />
      </button>

      {/* CellTypePicker mit Animation */}
      {active === 'pen' && <CellTypePicker />}

      <button
        className={`icon-button ${active === 'select' ? 'active' : ''}`}
        onClick={() => onToggle('select')}
        style={{ color: getToolColor('select') }}
        aria-label="select tool"
        title="Select Tool"
      >
        <SelectIcon />
      </button>

      <button
        className={`icon-button ${active === 'interact' ? 'active' : ''}`}
        onClick={() => onToggle('interact')}
        style={{ color: getToolColor('interact') }}
        aria-label="interact tool"
        title="Interact Tool"
      >
        <InteractIcon />
      </button>
    </section>
  );
}

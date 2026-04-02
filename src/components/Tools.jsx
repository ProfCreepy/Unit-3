import Divider from './Divider';
import { PlayIcon, StepForwardIcon, PencilIcon, MousePointer2Icon, PointerIcon } from 'lucide-react';

function PenIcon() {
  return <PencilIcon size={40} />;
}

function SelectIcon() {
  return <PointerIcon size={40} />;
}

function InteractIcon() {
  return <MousePointer2Icon size={40} />;
}

// CellType mit besserer Struktur
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
        >
        </button>
      ))}
    </div>
  );
}

export default function Tools({ onToggle, active }) {
  return (
    <section className='tools'>
      <button className='icon-button' onClick={() => alert('play')}>
        <PlayIcon size={40} />
      </button>

      <button className='icon-button' onClick={() => alert('step')}>
        <StepForwardIcon size={40} />
      </button>

      <Divider direction='horizontal' />

      <button
        className={`icon-button ${active === 'pen' ? 'active' : ''}`}
        onClick={() => onToggle('pen')}
        aria-label="pen tool"
      >
        <PenIcon />
      </button>

      {/* CellTypePicker mit Animation */}
      {active === 'pen' && <CellTypePicker />}

      <button
        className={`icon-button ${active === 'select' ? 'active' : ''}`}
        onClick={() => onToggle('select')}
        aria-label="select tool"
      >
        <SelectIcon />
      </button>

      <button
        className={`icon-button ${active === 'interact' ? 'active' : ''}`}
        onClick={() => onToggle('interact')}
        aria-label="interact tool"
      >
        <InteractIcon />
      </button>
    </section>
  );
}
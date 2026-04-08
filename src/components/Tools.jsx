import { useProject } from '../hooks/useProject';
import Divider from './Divider';
import { PlayIcon, StepForwardIcon, PencilIcon, MousePointer2Icon, PointerIcon } from 'lucide-react';
import { getToolColor } from '../theme';

export default function Tools() {
  const { activeTool, selectTool } = useProject();

  return (
    <section className='tools'>
      <button className='icon-button' style={{ color: getToolColor('play') }}>
        <PlayIcon size={40} />
      </button>
      <button className='icon-button' style={{ color: getToolColor('step') }}>
        <StepForwardIcon size={40} />
      </button>
      <Divider direction='horizontal' />

      <button
        className={`icon-button ${activeTool === 'pen' ? 'active' : ''}`}
        onClick={() => selectTool('pen')}
        style={{ color: getToolColor('pen') }}
      >
        <PencilIcon size={40} />
      </button>

      <button
        className={`icon-button ${activeTool === 'select' ? 'active' : ''}`}
        onClick={() => selectTool('select')}
        style={{ color: getToolColor('select') }}
      >
        <PointerIcon size={40} />
      </button>

      <button
        className={`icon-button ${activeTool === 'interact' ? 'active' : ''}`}
        onClick={() => selectTool('interact')}
        style={{ color: getToolColor('interact') }}
      >
        <MousePointer2Icon size={40} />
      </button>
    </section>
  );
}

import { useProject } from '../hooks/useProject';
import Divider from './Divider';
import Spacer from './Spacer';
import { Settings2Icon, BlocksIcon } from 'lucide-react';
import { getIconColor } from '../theme';

export default function Header() {
  const { projectSettings, updateProjectSettings, toggleSidebar } = useProject();

  return (
    <header className='header'>
      <h1>Unit 3</h1>
      <Divider />
      <input
        type='text'
        placeholder='Project name'
        value={projectSettings.name}
        onChange={(e) => updateProjectSettings({ name: e.target.value })}
      />
      <Divider />
      <Spacer />
      <button
        className='icon-button'
        onClick={() => toggleSidebar('settings')}
        style={{ color: getIconColor('settings') }}
      >
        <Settings2Icon size={40} />
      </button>
      <button
        className='icon-button'
        onClick={() => toggleSidebar('extensions')}
        style={{ color: getIconColor('extensions') }}
      >
        <BlocksIcon size={40} />
      </button>
    </header>
  );
}

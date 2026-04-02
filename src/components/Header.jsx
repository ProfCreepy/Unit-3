import Divider from './Divider';
import Spacer from './Spacer';
import { Settings2Icon, ImageIcon, UploadIcon, DownloadIcon, BlocksIcon } from 'lucide-react';
import { getIconColor } from '../theme';

export default function Header({ onToggle }) {
  const iconSize = 40;
  
  return (
    <header className='header'>
      <h1>Unit 3</h1>

      <Divider />

      <input type='text' placeholder='Project name'></input>

      <Divider />

      <button 
        className="icon-button" 
        style={{ color: getIconColor('upload') }}
        aria-label="upload project"
        title="Upload Project"
      >
        <UploadIcon size={iconSize} strokeWidth={1.5} />
      </button>
      
      <button 
        className="icon-button" 
        style={{ color: getIconColor('download') }}
        aria-label="download project"
        title="Download Project"
      >
        <DownloadIcon size={iconSize} strokeWidth={1.5} />
      </button>
      
      <button 
        className="icon-button" 
        style={{ color: getIconColor('image') }}
        aria-label="import image"
        title="Import Image"
      >
        <ImageIcon size={iconSize} strokeWidth={1.5} />
      </button>

      <Divider />

      <Spacer />

      <button
        className="icon-button"
        onClick={() => onToggle('settings')}
        style={{ color: getIconColor('settings') }}
        aria-label="open settings"
        title="Settings"
      >
        <Settings2Icon size={iconSize} strokeWidth={1.5} />
      </button>

      <button
        className="icon-button"
        onClick={() => onToggle('extensions')}
        style={{ color: getIconColor('extensions') }}
        aria-label="open extensions"
        title="Extensions"
      >
        <BlocksIcon size={iconSize} strokeWidth={1.5} />
      </button>
    </header>
  );
}

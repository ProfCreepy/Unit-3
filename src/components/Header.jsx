import Divider from './Divider';
import Spacer from './Spacer';
import { Settings2Icon, ImageIcon, UploadIcon, DownloadIcon, BlocksIcon } from 'lucide-react';

export default function Header({ onToggle }) {
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
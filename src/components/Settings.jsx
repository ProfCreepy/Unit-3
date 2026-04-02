import { X } from 'lucide-react';
import './sidebar.css';

export default function Settings() {
  return (
    <aside className='sidebar settings-sidebar'>
      <div className='sidebar-header'>
        <h2>Settings</h2>
        <button className='close-button' aria-label="close settings">
          <X size={20} />
        </button>
      </div>
      
      <div className='sidebar-content'>
        <div className='setting-group'>
          <label>Theme</label>
          <select>
            <option>Light</option>
            <option>Dark</option>
            <option>Auto</option>
          </select>
        </div>
        
        <div className='setting-group'>
          <label>Grid Size</label>
          <input type='number' min='5' max='50' defaultValue='20' />
        </div>
        
        <div className='setting-group'>
          <label>Snap to Grid</label>
          <input type='checkbox' defaultChecked />
        </div>
        
        <div className='setting-group'>
          <label>Auto-save</label>
          <input type='checkbox' defaultChecked />
        </div>
      </div>
    </aside>
  );
}

import { X } from 'lucide-react';
import { useProject } from '../hooks/useProject';
import './sidebar.css';

export default function Settings() {
  const { activeSidebar, closeSidebar, canvasSettings, updateCanvasSettings, themeSettings, updateThemeSettings } = useProject();

  if (activeSidebar !== 'settings') return null;

  return (
    <aside className='sidebar settings-sidebar'>
      <div className='sidebar-header'>
        <h2>Settings</h2>
        <button className='close-button' onClick={closeSidebar}>
          <X size={20} />
        </button>
      </div>

      <div className='sidebar-content'>
        <div className='settings-section'>
          <h3 className='section-title'>Canvas</h3>

          <div className='setting-group'>
            <label>
              <input
                type='checkbox'
                checked={canvasSettings.showGrid}
                onChange={(e) => updateCanvasSettings({ showGrid: e.target.checked })}
              />
              <span>Grid anzeigen</span>
            </label>
          </div>

          <div className='setting-group'>
            <label htmlFor='zoom'>
              Zoom: <span className='value-display'>{canvasSettings.zoom}%</span>
            </label>
            <input
              id='zoom'
              type='range'
              min='25'
              max='400'
              step='25'
              value={canvasSettings.zoom}
              onChange={(e) => updateCanvasSettings({ zoom: parseInt(e.target.value) })}
              className='slider'
            />
          </div>
        </div>

        <div className='settings-section'>
          <h3 className='section-title'>Theme</h3>

          <div className='setting-group'>
            <label htmlFor='theme-select'>Theme</label>
            <select
              id='theme-select'
              value={themeSettings.theme}
              onChange={(e) => updateThemeSettings({ theme: e.target.value })}
            >
              <option value='light'>Light</option>
              <option value='dark'>Dark</option>
              <option value='auto'>Auto</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}

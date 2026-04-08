import { X } from 'lucide-react';
import { useProject } from '../hooks/useProject';
import './sidebar.css';

export default function Extensions() {
  const { activeSidebar, closeSidebar, extensions, enableExtension, disableExtension } = useProject();

  if (activeSidebar !== 'extensions') return null;

  return (
    <aside className='sidebar extensions-sidebar'>
      <div className='sidebar-header'>
        <h2>Extensions</h2>
        <button className='close-button' onClick={closeSidebar}>
          <X size={20} />
        </button>
      </div>

      <div className='sidebar-content'>
        {extensions.length > 0 ? (
          <div className='extensions-list'>
            {extensions.map(ext => (
              <div key={ext.name} className='extension-item'>
                <div>
                  <h4>{ext.name}</h4>
                  <p>{ext.description}</p>
                </div>
                <label className='toggle-switch'>
                  <input
                    type='checkbox'
                    checked={ext.enabled}
                    onChange={() => (ext.enabled ? disableExtension(ext.name) : enableExtension(ext.name))}
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>
            ))}
          </div>
        ) : (
          <p>Keine Extensions installiert</p>
        )}
      </div>
    </aside>
  );
}

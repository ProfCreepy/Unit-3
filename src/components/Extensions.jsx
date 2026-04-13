import { X } from 'lucide-react';
import { useProject } from '../hooks/useProject';
import './sidebar.css';

export default function Extensions() {
  const { activeSidebar, closeSidebar } = useProject();

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
        <div className='settings-section'>
          <h3 className='section-title'>Coming Soon</h3>
          <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
            Extensions werden hier bald hinzugefügt.
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
            💡 Später können User ihre eigenen Extensions installieren.
          </p>
        </div>
      </div>
    </aside>
  );
}
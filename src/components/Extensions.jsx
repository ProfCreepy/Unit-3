import { X, Plus } from 'lucide-react';
import './sidebar.css';

export default function Extensions() {
  const extensions = [
    { id: 1, name: 'Color Extractor', enabled: true, description: 'Extract colors from images' },
    { id: 2, name: 'Grid Analyzer', enabled: true, description: 'Analyze grid patterns' },
    { id: 3, name: 'Export Tools', enabled: false, description: 'Export to various formats' },
  ];

  return (
    <aside className='sidebar extensions-sidebar'>
      <div className='sidebar-header'>
        <h2>Extensions</h2>
        <button className='close-button' aria-label="close extensions">
          <X size={20} />
        </button>
      </div>
      
      <div className='sidebar-content'>
        <button className='add-extension-btn'>
          <Plus size={16} />
          <span>Add Extension</span>
        </button>
        
        <div className='extensions-list'>
          {extensions.map(ext => (
            <div key={ext.id} className='extension-item'>
              <div className='extension-info'>
                <h3>{ext.name}</h3>
                <p>{ext.description}</p>
              </div>
              <input 
                type='checkbox' 
                defaultChecked={ext.enabled}
                className='extension-toggle'
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

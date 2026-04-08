import { useProject } from '../hooks/useProjectContext';
import './canvas.css';

export default function Canvas() {
  const {
    canvasSettings,
    projectData,
    activeTool,
    addElement,
  } = useProject();

  // ===== GRID SNAPPING FUNKTION =====
  // Zellen werden IMMER zum Grid gesnapped!
  const snapToGrid = (value, gridSize) => {
    return Math.round(value / gridSize) * gridSize;
  };

  // ===== CANVAS CLICK HANDLER =====
  const handleCanvasClick = (e) => {
    // Nur wenn Pen Tool aktiv ist
    if (activeTool !== 'pen') return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    
    // Berechne Position relativ zu Canvas
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // ===== WICHTIG: AUTOMATISCHES GRID SNAPPING =====
    // Zellen snappen IMMER zum Grid!
    x = snapToGrid(x, canvasSettings.gridSize);
    y = snapToGrid(y, canvasSettings.gridSize);

    console.log(`Cell placed at (${x}, ${y}) - snapped to grid`);

    // TODO: Später: Frage welcher Zelltyp?
    // Für jetzt nur Platzhalter
    addElement({
      type: 'cable',
      x: x,
      y: y,
      gridSize: canvasSettings.gridSize,
    });
  };

  // ===== GRID ZEICHNEN =====
  const renderGrid = () => {
    const lines = [];
    const gridSize = canvasSettings.gridSize;

    // Vertikale Linien
    for (let i = 0; i <= canvasSettings.width; i += gridSize) {
      lines.push(
        <line
          key={`v-${i}`}
          x1={i}
          y1={0}
          x2={i}
          y2={canvasSettings.height}
          className='grid-line'
        />
      );
    }

    // Horizontale Linien
    for (let i = 0; i <= canvasSettings.height; i += gridSize) {
      lines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={i}
          x2={canvasSettings.width}
          y2={i}
          className='grid-line'
        />
      );
    }

    return lines;
  };

  // ===== ZELLEN ZEICHNEN =====
  const renderElements = () => {
    return projectData.elements.map(el => (
      <g key={el.id}>
        {/* Zelle */}
        <rect
          x={el.x}
          y={el.y}
          width={canvasSettings.gridSize - 2}
          height={canvasSettings.gridSize - 2}
          className={`cell cell-${el.type}`}
          fill={getCellColor(el.type)}
          stroke='#333'
          strokeWidth='2'
        />
        {/* Label */}
        <text
          x={el.x + canvasSettings.gridSize / 2}
          y={el.y + canvasSettings.gridSize / 2}
          textAnchor='middle'
          dominantBaseline='middle'
          className='cell-label'
          fontSize={Math.min(12, canvasSettings.gridSize / 3)}
        >
          {el.type.charAt(0).toUpperCase()}
        </text>
      </g>
    ));
  };

  return (
    <main className='canvas'>
      <div 
        className='canvas-wrapper'
        style={{
          width: `${canvasSettings.width}px`,
          height: `${canvasSettings.height}px`,
          transform: `scale(${canvasSettings.zoom / 100})`,
          transformOrigin: 'top left',
        }}
      >
        <svg
          width={canvasSettings.width}
          height={canvasSettings.height}
          onClick={handleCanvasClick}
          className='canvas-svg'
          style={{
            cursor: activeTool === 'pen' ? 'crosshair' : 'default',
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* Grid anzeigen? */}
          {canvasSettings.showGrid && renderGrid()}

          {/* Zellen anzeigen */}
          {renderElements()}
        </svg>
      </div>

      {/* Info Text */}
      <div className='canvas-info'>
        <p>
          {activeTool === 'pen' 
            ? `🖊️ Pen Tool - Click to place cells (Grid: ${canvasSettings.gridSize}px)`
            : '👀 Select a tool to start'
          }
        </p>
      </div>
    </main>
  );
}

// Hilfsfunktion für Zellfarben
function getCellColor(type) {
  const colors = {
    cable: '#3B82F6',
    inverter: '#F59E0B',
    delay: '#8B5CF6',
  };
  return colors[type] || '#6B7280';
}

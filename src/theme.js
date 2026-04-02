// Color Palette - basierend auf modernem Hex-Design
export const colorPalette = {
  // Primäre Farben - für die Hauptfunktionen
  primary: {
    upload: '#6366F1',      // Indigo
    download: '#8B5CF6',    // Violett
    image: '#EC4899',       // Pink
    settings: '#F59E0B',    // Amber
    extensions: '#10B981',  // Grün
  },
  
  // Sekundäre Farben - für Tools
  tools: {
    play: '#EF4444',        // Rot
    step: '#F97316',        // Orange
    pen: '#3B82F6',         // Blau
    select: '#06B6D4',      // Cyan
    interact: '#8B5CF6',    // Violett
  },
  
  // Cell Types - für die Zelltypen
  cells: {
    cable: '#3B82F6',       // Blau
    inverter: '#F59E0B',    // Amber
    delay: '#8B5CF6',       // Violett
  },
  
  // Hintergrund und Grenzen
  background: '#FFFFFF',
  border: '#E5E7EB',
  text: '#1F2937',
  textMuted: '#6B7280',
};

// Mapping von Icon-Typen zu Farben
export const getIconColor = (iconType) => {
  return colorPalette.primary[iconType] || colorPalette.text;
};

export const getToolColor = (toolType) => {
  return colorPalette.tools[toolType] || colorPalette.text;
};

export const getCellColor = (cellType) => {
  return colorPalette.cells[cellType] || colorPalette.text;
};

// CSS-Variablen generieren
export const generateCSSVariables = () => {
  const vars = {};
  
  Object.entries(colorPalette.primary).forEach(([key, value]) => {
    vars[`--color-${key}`] = value;
  });
  
  Object.entries(colorPalette.tools).forEach(([key, value]) => {
    vars[`--color-tool-${key}`] = value;
  });
  
  Object.entries(colorPalette.cells).forEach(([key, value]) => {
    vars[`--color-cell-${key}`] = value;
  });
  
  return vars;
};

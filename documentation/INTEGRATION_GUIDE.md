# Unit 3 - React Integration Guide

## 📋 Überblick
Du hast dein Projekt auf React umgestellt mit einem modernen Color Scheme basierend auf Hex-Farben. Icons in Menu und Tools werden automatisch mit den richtigen Farben gefärbt.

## 🎨 Color Palette

### Primäre Farben (Header Icons)
- **Upload**: #6366F1 (Indigo)
- **Download**: #8B5CF6 (Violett)
- **Image**: #EC4899 (Pink)
- **Settings**: #F59E0B (Amber)
- **Extensions**: #10B981 (Grün)

### Tool Colors (Linke Toolbar)
- **Play**: #EF4444 (Rot)
- **Step**: #F97316 (Orange)
- **Pen**: #3B82F6 (Blau)
- **Select**: #06B6D4 (Cyan)
- **Interact**: #8B5CF6 (Violett)

### Cell Types
- **Cable**: #3B82F6 (Blau)
- **Inverter**: #F59E0B (Amber)
- **Delay**: #8B5CF6 (Violett)

## 📦 Dateien zum Ersetzen/Hinzufügen

### 1. **theme.js** (NEU)
Definiert alle Farben und Zugriffsfunktionen. Diese Datei ist zentral für das Farbschema.

**Installation:**
```
src/theme.js
```

### 2. **src/components/Header.jsx** (AKTUALISIERT)
- Alle Icons haben automatische Farben basierend auf `getIconColor()`
- Click-Handler für Settings und Extensions
- Verbessertes Styling mit `strokeWidth={1.5}`

### 3. **src/components/Tools.jsx** (AKTUALISIERT)
- Play, Step, Pen, Select, Interact Icons haben ihre eigenen Farben
- CellTypePicker zeigt Colors mit dynamischen Hintergrundfarben
- Automatische Farben durch `getToolColor()` und `getCellColor()`

### 4. **src/components/Settings.jsx** (NEU)
Sidebar mit:
- Theme Selector (Light/Dark/Auto)
- Grid Size Einstellung
- Snap to Grid Toggle
- Auto-save Toggle

### 5. **src/components/Extensions.jsx** (NEU)
Sidebar mit:
- Liste der verfügbaren Extensions
- Add Extension Button
- Toggle für jede Extension

### 6. **src/components/Divider.jsx** (AKTUALISIERT)
Kleine Trennlinien zwischen Sections. Aktualisiert für besseres Styling.

### 7. **src/components/Spacer.jsx** (AKTUALISIERT)
Flexible Space-Komponente für Layout-Abstände.

### 8. **src/components/Canvas.jsx** (AKTUALISIERT)
Hauptarbeitsbereich mit Placeholder-Text.

### 9. **src/App.jsx** (AKTUALISIERT)
- Theme-Variablen beim Mount anwenden
- Besseres Toggle-System für Tools

### 10. **src/App.css** (KOMPLETT ÜBERARBEITET)
- Modernes Design mit Tailwind-ähnlichen Farben
- Bessere Icon-Button Styling
- Responsive Layout
- Scrollbar Styling
- Einheitliche Spacing und Borders

### 11. **src/components/sidebar.css** (NEU)
- Settings und Extensions Sidebar Styling
- Form Controls
- Extension List Styling

## 🚀 Installationsschritte

### Schritt 1: Neue theme.js hinzufügen
Kopiere `theme.js` nach `src/theme.js`

### Schritt 2: Komponenten ersetzen
Ersetze alle Dateien in `src/components/` mit den aktualisierten Versionen:
- Header.jsx
- Tools.jsx
- Settings.jsx
- Extensions.jsx
- Divider.jsx
- Spacer.jsx
- Canvas.jsx

### Schritt 3: CSS aktualisieren
Ersetze:
- `src/App.css` mit der neuen Version
- Füge `src/components/sidebar.css` hinzu

### Schritt 4: App.jsx aktualisieren
Ersetze `src/App.jsx` mit der neuen Version

### Schritt 5: Dependencies überprüfen
Stelle sicher, dass `lucide-react` installiert ist:
```bash
npm install lucide-react
```

## 📚 Feature-Übersicht

### Automatische Icon-Färbung
```javascript
// In Header.jsx
<UploadIcon style={{ color: getIconColor('upload') }} />

// In Tools.jsx
<PlayIcon style={{ color: getToolColor('play') }} />
```

### Responsive Layout
- Mobile: Nur Canvas sichtbar
- Desktop: Tools, Canvas, und optional Sidebar

### Sidebar-System
- Settings Sidebar (Einstellungen)
- Extensions Sidebar (Plugin-Management)
- Toggle-Mechanismus mit Animation

### Grid-System
```
Desktop:           Mobile:
┌─────────────┐   ┌─────────┐
│   Header    │   │ Header  │
├─┬─────────┬─┤   ├─────────┤
│T│ Canvas  │S│   │ Canvas  │
│o│         │i│   │         │
│o│         │d│   └─────────┘
│l│         │e│
│s│         │b│
└─┴─────────┴─┘
```

## 🎯 Nächste Schritte

1. **Canvas-Funktionalität**: Implementiere Zeichnen, Auswahl, Interaktion
2. **Datenverwaltung**: State Management für Projects und Extensions
3. **Export/Import**: Speichern und Laden von Projects
4. **Image Color Extraction**: Integration der Farbextraktion aus Bildern
5. **Keyboard Shortcuts**: Hotkeys für Tools

## 🔧 Anpassung der Farben

Wenn du Farben ändern möchtest, bearbeite einfach `src/theme.js`:

```javascript
export const colorPalette = {
  primary: {
    upload: '#6366F1',    // Deine neue Farbe
    download: '#8B5CF6',
    // ...
  }
};
```

Alle Icons werden automatisch mit den neuen Farben aktualisiert!

## 🐛 Häufige Probleme

**Problem**: Icons haben keine Farbe
- **Lösung**: Stelle sicher, dass `theme.js` in `src/` ist und korrekt importiert wird

**Problem**: Sidebars öffnen sich nicht
- **Lösung**: Überprüfe `App.jsx` - der Toggle-Handler muss korrekt sein

**Problem**: Layout sieht komisch aus
- **Lösung**: Leere den Browser-Cache und erneut laden (Ctrl+Shift+R)

## 📝 Dateistruktur

```
Unit 3 (nach Update)
├── src/
│   ├── theme.js                 ← NEUE Farbdefinitionen
│   ├── App.jsx                  ← Aktualisiert
│   ├── App.css                  ← Komplett überarbeitet
│   ├── main.jsx
│   ├── index.css
│   ├── algorithm/
│   │   ├── algorithm.js
│   │   └── extensions/
│   ├── assets/
│   ├── components/
│   │   ├── Header.jsx           ← Aktualisiert
│   │   ├── Tools.jsx            ← Aktualisiert
│   │   ├── Settings.jsx         ← NEU
│   │   ├── Extensions.jsx       ← NEU
│   │   ├── Canvas.jsx           ← Aktualisiert
│   │   ├── Divider.jsx          ← Aktualisiert
│   │   ├── Spacer.jsx           ← Aktualisiert
│   │   └── sidebar.css          ← NEU
├── public/
├── index.html
├── package.json
└── vite.config.js
```

Viel Spaß mit Unit 3! 🚀

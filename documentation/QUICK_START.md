# Unit 3 - Quick Start Guide ⚡

## 🚀 Installation (5 Minuten)

### 1. Projektverzeichnis vorbereiten
```bash
cd dein-unit3-projekt
```

### 2. Neue Datei: theme.js
```bash
cp /pfad/theme.js src/theme.js
```

### 3. Komponenten aktualisieren
Folgende Dateien in `src/components/` ersetzen:
```bash
- Header.jsx (neu mit Farben)
- Tools.jsx (neu mit Farben)
- Settings.jsx (neu)
- Extensions.jsx (neu)
- Canvas.jsx (aktualisiert)
- Divider.jsx (aktualisiert)
- Spacer.jsx (aktualisiert)
```

### 4. Styles aktualisieren
```bash
- src/App.css (komplett neu)
- src/components/sidebar.css (neu)
```

### 5. App.jsx aktualisieren
```bash
cp /pfad/App.jsx src/App.jsx
```

### 6. Dependencies installieren
```bash
npm install
```

### 7. Starten
```bash
npm run dev
```

✅ Fertig! Die App sollte jetzt mit farbigen Icons laufen.

---

## 📁 Datei-Checklist

### ✅ Muss vorhanden sein (nach Update)
- [ ] `src/theme.js` - Zentrale Farbdefinitionen
- [ ] `src/App.jsx` - Mit Theme-Integration
- [ ] `src/App.css` - Modernes Design
- [ ] `src/components/Header.jsx` - Mit farbigen Icons
- [ ] `src/components/Tools.jsx` - Mit farbigen Icons
- [ ] `src/components/Settings.jsx` - Einstellungen Sidebar
- [ ] `src/components/Extensions.jsx` - Extensions Sidebar
- [ ] `src/components/sidebar.css` - Sidebar Styling
- [ ] `src/components/Canvas.jsx` - Arbeitsbereich
- [ ] `src/components/Divider.jsx` - Trennlinien
- [ ] `src/components/Spacer.jsx` - Layout Spacer

### ❌ Kann gelöscht werden
- [ ] Alte `App.css` (Backup machen!)
- [ ] Alte Komponenten-Versionen

---

## 🎨 So funktionieren die Farben

### Icons färben automatisch sich selbst:

```jsx
// In Header.jsx
<UploadIcon style={{ color: getIconColor('upload') }} />
// Wird automatisch #6366F1 (Indigo)

// In Tools.jsx
<PlayIcon style={{ color: getToolColor('play') }} />
// Wird automatisch #EF4444 (Rot)
```

### Neue Farbe hinzufügen:

1. Bearbeite `src/theme.js`:
```javascript
export const colorPalette = {
  primary: {
    myNewIcon: '#FF0000', // Neue Farbe
  }
};
```

2. Nutze sie im Component:
```jsx
<MyIcon style={{ color: getIconColor('myNewIcon') }} />
```

---

## 🔧 Häufige Anpassungen

### Icon-Größe ändern
In `Header.jsx` und `Tools.jsx`:
```jsx
const iconSize = 40;  // Auf 32, 48, etc. ändern
<UploadIcon size={iconSize} />
```

### Sidebar-Breite ändern
In `src/App.css`:
```css
.app-grid.sidebar-open {
  grid-template-columns: 60px 1fr 300px; /* ← 300px ist die Breite */
}
```

### Color Palette komplett ändern
In `src/theme.js` alle Farben ersetzen:
```javascript
export const colorPalette = {
  primary: {
    upload: '#DEINE_NEUE_FARBE',
    // ...
  }
};
```

---

## 🧪 Testen

### 1. Header Icons
- Upload Icon sollte Indigo (#6366F1) sein
- Download Icon sollte Violett (#8B5CF6) sein
- Image Icon sollte Pink (#EC4899) sein
- Settings Icon sollte Amber (#F59E0B) sein
- Extensions Icon sollte Grün (#10B981) sein

### 2. Tool Icons (Linke Seite)
- Play sollte Rot sein
- Step sollte Orange sein
- Pen sollte Blau sein
- Select sollte Cyan sein
- Interact sollte Violett sein

### 3. Sidebars
- Settings öffnen/schließen sollte funktionieren
- Extensions öffnen/schließen sollte funktionieren
- Sidebar sollte smooth animieren

### 4. Responsive
- Desktop: 60px + Canvas + 300px Sidebar
- Mobile: Nur Canvas (Tools & Sidebar versteckt)

---

## 🐛 Troubleshooting

### Problem: Icons haben keine Farbe
```
✗ Falsch:
- theme.js nicht im richtigen Verzeichnis
- getIconColor() wird nicht importiert

✓ Richtig:
- src/theme.js vorhanden
- import { getIconColor } from '../theme'; in Components
```

### Problem: Sidebars öffnen sich nicht
```
✗ Falsch:
- onToggle Prop nicht korrekt durchgegeben
- Button onClick nicht verbunden

✓ Richtig:
- <Header onToggle={toggleSidebar} />
- Button hat onClick={() => onToggle('settings')}
```

### Problem: CSS sieht komisch aus
```bash
# Browser-Cache leeren
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Oder
npm run dev   # Server neustarten
```

### Problem: Dependencies fehlend
```bash
npm install lucide-react react react-dom
```

---

## 🚀 Nächste Schritte

### Sofort umsetzbar (Level 1)
- [x] Icons haben Farben
- [x] Sidebars funktionieren
- [ ] Canvas mit Zoom
- [ ] Element Selection

### Mittelfristig (Level 2)
- [ ] Drawing/Painting auf Canvas
- [ ] Element Manipulation
- [ ] Undo/Redo System
- [ ] Save/Load Projects

### Langfristig (Level 3)
- [ ] Image Color Extraction
- [ ] Grid & Snap to Grid
- [ ] Animation Timeline
- [ ] Collaboration/Multiplayer

---

## 📚 Referenzen

| Ressource | Link/Info |
|-----------|-----------|
| Color Palette | `COLOR_PALETTE.html` |
| Integration Guide | `INTEGRATION_GUIDE.md` |
| Advanced Features | `ADVANCED_FEATURES.js` |
| Theme Config | `theme.js` |

---

## 💡 Pro-Tipps

1. **Nutze die Color Palette HTML**
   - Öffne `COLOR_PALETTE.html` im Browser
   - Alle Farben mit Copy-Button
   - Perfekt zum Referenzieren

2. **CSS Variables für Farben**
   - In `App.jsx` werden CSS-Variablen gesetzt
   - Kannst du in CSS nutzen: `color: var(--color-upload);`

3. **Component Reusability**
   - Erstelle Icon-Wrapper Components
   - Zentraler Ort für Customization

4. **Performance**
   - Nutze React.memo() für häufig re-rendernde Components
   - useCallback() für Event Handler

---

## 🎯 Ziel erreicht! ✨

Du hast jetzt:
✅ React Setup mit Vite
✅ Modernes Color Scheme
✅ Automatische Icon-Färbung
✅ Arbeitsmenü mit Settings/Extensions
✅ Basis für alle zukünftigen Features

**Viel Spaß mit Unit 3!** 🚀

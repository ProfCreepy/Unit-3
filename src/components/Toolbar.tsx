import { useUIStore }   from '../store/uiStore';
import type { Tool }    from '../canvas/input';

const TOOLS: { id: Tool; icon: string; label: string; shortcut: string; color: string }[] = [
  { id: 'cable',    icon: '━', label: 'Kabel',      shortcut: '1', color: 'var(--cell-cable)'  },
  { id: 'inverter', icon: '◇', label: 'Umkehrer',   shortcut: '2', color: 'var(--cell-inv)'    },
  { id: 'delay',    icon: '▷', label: 'Verzögerer', shortcut: '3', color: 'var(--cell-delay)'  },
  { id: 'delete',   icon: '✕', label: 'Löschen',    shortcut: 'E', color: 'var(--cell-delete)' },
];

/**
 * Werkzeug-Auswahl. Keyboard-Shortcuts werden zentral in App.tsx
 * über useKeyboardShortcuts behandelt — Toolbar.tsx kennt nur noch
 * die Werkzeug-Buttons selbst, keine versteckte Abhängigkeit zu SimBar mehr.
 */
export function Toolbar() {
  const tool    = useUIStore(s => s.tool);
  const setTool = useUIStore(s => s.setTool);

  return (
    <div className="scroll-row" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', flex: '1 1 auto', minWidth: 0 }}>
      <span style={{
        color:       'var(--accent)',
        fontWeight:  'bold',
        fontSize:    14,
        marginRight: 4,
        whiteSpace:  'nowrap',
        flexShrink:  0,
      }}>
        ▣<span className="logo-text"> Unit-3</span>
      </span>

      {TOOLS.map(t => (
        <button
          key={t.id}
          className="tool-btn"
          onClick={() => setTool(t.id)}
          style={{
            background:  tool === t.id ? t.color : 'transparent',
            color:       tool === t.id ? '#000'  : t.color,
            borderColor: tool === t.id ? t.color : t.color + '55',
            fontWeight:  tool === t.id ? 'bold'  : 'normal',
            flexShrink:  0,
          }}
        >
          {t.icon}
          <span className="btn-label"> {t.label}</span>
          <span className="shortcut"> [{t.shortcut}]</span>
        </button>
      ))}
    </div>
  );
}

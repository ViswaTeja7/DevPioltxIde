import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useIDE } from '../context/IDEContext';
import { PanelTab } from '../types';
import { X } from 'lucide-react';
import { TerminalPanel } from './TerminalPanel';

const PANEL_HEIGHT_KEY = 'devpilotx_panel_height';
const MIN_PANEL_HEIGHT = 120;
const DEFAULT_PANEL_HEIGHT = 256;

const readStoredHeight = (): number => {
  try {
    const saved = Number(localStorage.getItem(PANEL_HEIGHT_KEY));
    if (Number.isFinite(saved) && saved >= MIN_PANEL_HEIGHT) return saved;
  } catch {
    // localStorage may be unavailable; fall through to the default.
  }
  return DEFAULT_PANEL_HEIGHT;
};

export const PanelArea = () => {
  const { activePanel, setActivePanel, setIsPanelOpen } = useIDE();
  const [panelHeight, setPanelHeight] = useState<number>(readStoredHeight);
  const dragState = useRef<{ startY: number; startHeight: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(PANEL_HEIGHT_KEY, String(panelHeight));
    } catch {
      // Non-fatal: the height simply will not persist.
    }
  }, [panelHeight]);

  // Dragging the top edge resizes the panel, like a docked terminal in an IDE.
  const handleResizeStart = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      dragState.current = { startY: event.clientY, startHeight: panelHeight };

      const onMove = (moveEvent: MouseEvent) => {
        if (!dragState.current) return;
        const delta = dragState.current.startY - moveEvent.clientY;
        const ceiling = Math.max(MIN_PANEL_HEIGHT, window.innerHeight - 180);
        setPanelHeight(Math.min(Math.max(dragState.current.startHeight + delta, MIN_PANEL_HEIGHT), ceiling));
      };

      const onUp = () => {
        dragState.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [panelHeight]
  );

  const tabs: { id: PanelTab; label: string }[] = [
    { id: 'problems', label: 'PROBLEMS' },
    { id: 'output', label: 'OUTPUT' },
    { id: 'debug', label: 'DEBUG CONSOLE' },
    { id: 'terminal', label: 'TERMINAL' },
  ];

  return (
    <div
      className="bg-[#0D1117] border-t border-[#30363D] flex flex-col shrink-0 text-sm"
      style={{ height: panelHeight }}
    >
      <div
        onMouseDown={handleResizeStart}
        onDoubleClick={() => setPanelHeight(DEFAULT_PANEL_HEIGHT)}
        title="Drag to resize, double-click to reset"
        className="group h-1 shrink-0 cursor-row-resize bg-transparent transition-colors hover:bg-[#58A6FF]"
      />

      <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363D]">
        <div className="flex items-center gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={`py-1 text-[10px] uppercase font-bold transition-colors ${
                activePanel === tab.id
                  ? 'text-white border-b border-white'
                  : 'text-[#8B949E] hover:text-[#C9D1D9] border-b border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[#858585]">
          <button onClick={() => setIsPanelOpen(false)} className="hover:text-white" title="Close panel">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* The terminal fills the panel and owns its own chrome (tabs, search, status). */}
      {activePanel === 'terminal' ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <TerminalPanel />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden p-3 font-mono text-[11px] text-[#8B949E]">
          {activePanel === 'problems' && <div>No problems have been detected in the workspace.</div>}
          {activePanel === 'output' && <div>Log output initialization complete.</div>}
          {activePanel === 'debug' && <div>Debug console is ready.</div>}
        </div>
      )}
    </div>
  );
};

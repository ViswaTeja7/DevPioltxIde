import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    { id: 'problems', label: t('panel.problems') },
    { id: 'output', label: t('panel.output') },
    { id: 'debug', label: t('panel.debugConsole') },
    { id: 'terminal', label: t('panel.terminal') },
  ];

  // Standard WAI-ARIA tablist keyboard behaviour: arrows move between panel tabs.
  const handleTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = event.key === 'ArrowRight'
      ? (index + 1) % tabs.length
      : (index - 1 + tabs.length) % tabs.length;
    setActivePanel(tabs[next].id);
  };

  return (
    <div
      className="bg-[#0D1117] border-t border-[#30363D] flex flex-col shrink-0 text-sm"
      style={{ height: panelHeight }}
    >
      <div
        onMouseDown={handleResizeStart}
        onDoubleClick={() => setPanelHeight(DEFAULT_PANEL_HEIGHT)}
        title={t('panel.resizeHint')}
        className="group h-1 shrink-0 cursor-row-resize bg-transparent transition-colors hover:bg-[#58A6FF]"
      />

      <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#30363D]">
        <div className="flex items-center gap-4" role="tablist" aria-label="Panel views">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              role="tab"
              id={`panel-tab-${tab.id}`}
              aria-selected={activePanel === tab.id}
              aria-controls={`panel-view-${tab.id}`}
              tabIndex={activePanel === tab.id ? 0 : -1}
              onClick={() => setActivePanel(tab.id)}
              onKeyDown={event => handleTabKeyDown(event, index)}
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
          <button
            onClick={() => setIsPanelOpen(false)}
            className="hover:text-white"
            title={t('panel.closePanel')}
            aria-label={t('panel.closePanel')}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* The terminal tab renders the real PTY-backed terminal (xterm.js + node-pty)
          styled after Windows Terminal — tabs, splits, profiles. It gets the full panel
          height with no IDE padding so its tab strip sits flush against the chrome. */}
      {activePanel === 'terminal' ? (
        <div
          className="flex-1 min-h-0"
          role="tabpanel"
          id="panel-view-terminal"
          aria-labelledby="panel-tab-terminal"
        >
          <TerminalPanel />
        </div>
      ) : (
        <div
          className="flex-1 overflow-hidden p-3 font-mono text-[11px] text-[#8B949E]"
          role="tabpanel"
          id={`panel-view-${activePanel}`}
          aria-labelledby={`panel-tab-${activePanel}`}
        >
          {activePanel === 'problems' && <div>{t('panel.noProblems')}</div>}
          {activePanel === 'output' && <div>{t('panel.outputReady')}</div>}
          {activePanel === 'debug' && <div>{t('panel.debugReady')}</div>}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useIDE } from '../context/IDEContext';
import { PanelTab } from '../types';
import { X } from 'lucide-react';
import { TerminalPanel } from './TerminalPanel';

export const PanelArea = () => {
  const { activePanel, setActivePanel, setIsPanelOpen } = useIDE();

  const tabs: { id: PanelTab; label: string }[] = [
    { id: 'problems', label: 'PROBLEMS' },
    { id: 'output', label: 'OUTPUT' },
    { id: 'debug', label: 'DEBUG CONSOLE' },
    { id: 'terminal', label: 'TERMINAL' },
  ];

  return (
    <div className="h-64 bg-[#0D1117] border-t border-[#30363D] flex flex-col shrink-0 text-sm">
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

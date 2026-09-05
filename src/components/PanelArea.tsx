import React, { useState } from 'react';
import { useIDE } from '../context/IDEContext';
import { PanelTab } from '../types';
import { X, ChevronUp, Trash2 } from 'lucide-react';

export const PanelArea = () => {
  const { activePanel, setActivePanel, setIsPanelOpen } = useIDE();
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'DevPilotX Terminal v1.0.0',
    'Starting development server...',
    '> vite',
    '',
    '  VITE v5.0.0  ready in 320 ms',
    '',
    '  ➜  Local:   http://localhost:5173/',
    '  ➜  Network: use --host to expose',
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    setTerminalOutput([...terminalOutput, `$ ${terminalInput}`, 'Command execution simulated.']);
    setTerminalInput('');
  };

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
          <button className="hover:text-white"><ChevronUp size={14} /></button>
          <button onClick={() => setTerminalOutput(['DevPilotX Terminal v1.0.0'])} className="hover:text-white" title="Clear Terminal"><Trash2 size={14} /></button>
          <button onClick={() => setIsPanelOpen(false)} className="hover:text-white"><X size={14} /></button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] text-[#8B949E]">
        {activePanel === 'terminal' && (
          <div className="flex flex-col h-full">
            <div className="flex-1">
              {terminalOutput.map((line, i) => (
                <div key={i} className={line.startsWith('$') ? 'text-white' : line.includes('error') ? 'text-[#FF7B72]' : 'text-[#7EE787]'}>
                  {line || '\u00A0'}
                </div>
              ))}
            </div>
            <form onSubmit={handleTerminalSubmit} className="flex mt-2 items-center gap-1 text-white">
              <span className="text-[#2EA043]">➜</span>
              <span className="bg-[#58A6FF] bg-opacity-20 px-1 text-[#58A6FF]">devpilot-x</span>
              <span className="text-[#58A6FF]">git:(</span><span className="text-[#F78166]">main</span><span className="text-[#58A6FF]">)</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white ml-2"
                autoFocus
              />
            </form>
          </div>
        )}
        {activePanel === 'problems' && (
          <div>No problems have been detected in the workspace.</div>
        )}
        {activePanel === 'output' && (
          <div>Log output initialization complete.</div>
        )}
      </div>
    </div>
  );
};

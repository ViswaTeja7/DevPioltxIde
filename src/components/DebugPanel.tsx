import React, { useState } from 'react';
import { useIDE } from '../context/IDEContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Square, 
  Bug, 
  CheckSquare, 
  Square as SquareIcon, 
  Plus, 
  Terminal, 
  Settings,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export const DebugPanel = () => {
  const { togglePanel, setActivePanel } = useIDE();
  const [isRunning, setIsRunning] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState('Node.js: Launch Dev Server');
  const [breakpoints, setBreakpoints] = useState([
    { id: 'bp-1', file: 'App.tsx', line: 42, enabled: true },
    { id: 'bp-2', file: 'IDEContext.tsx', line: 120, enabled: true },
    { id: 'bp-3', file: 'server.ts', line: 18, enabled: false }
  ]);
  const [watchExpressions, setWatchExpressions] = useState([
    { id: 'w-1', expr: 'activeView', val: '"editor"' },
    { id: 'w-2', expr: 'selectedModel.id', val: '"gemini-3.7-flash"' }
  ]);
  const [newWatch, setNewWatch] = useState('');
  const [isAddingWatch, setIsAddingWatch] = useState(false);

  const configs = [
    'Node.js: Launch Dev Server',
    'Vite: React Preview (Port 3000)',
    'Jest: Run Unit Tests',
    'Full-Stack Express & Monaco API'
  ];

  const handleStartDebug = () => {
    setIsRunning(true);
    setActivePanel('terminal');
    togglePanel('terminal');
  };

  const handleStopDebug = () => {
    setIsRunning(false);
  };

  const toggleBreakpoint = (id: string) => {
    setBreakpoints(prev => prev.map(bp => bp.id === id ? { ...bp, enabled: !bp.enabled } : bp));
  };

  const handleAddWatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatch.trim()) return;
    setWatchExpressions(prev => [...prev, { id: `w-${Date.now()}`, expr: newWatch.trim(), val: 'undefined' }]);
    setNewWatch('');
    setIsAddingWatch(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#161B22] text-[#C9D1D9] text-xs select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#30363D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug size={14} className="text-[#F85149]" />
          <span className="font-semibold text-white">Run and Debug</span>
        </div>
      </div>

      {/* Top Configuration & Play Button */}
      <div className="p-3 border-b border-[#30363D] space-y-2">
        <div className="flex items-center gap-2">
          <select
            value={selectedConfig}
            onChange={(e) => setSelectedConfig(e.target.value)}
            className="flex-1 bg-[#0D1117] text-xs text-white p-1.5 border border-[#30363D] rounded outline-none cursor-pointer"
          >
            {configs.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={isRunning ? handleStopDebug : handleStartDebug}
            className={`p-1.5 rounded flex items-center justify-center transition-colors ${
              isRunning
                ? 'bg-[#F85149] hover:bg-[#DA3633] text-white'
                : 'bg-[#238636] hover:bg-[#2EA043] text-white'
            }`}
            title={isRunning ? 'Stop Debugging' : 'Start Debugging (F5)'}
          >
            {isRunning ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          </button>
        </div>

        {isRunning && (
          <div className="p-2 bg-[#238636]/15 border border-[#238636]/30 rounded text-[11px] text-[#3FB950] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3FB950] animate-pulse"></span>
              Debugger attached (Port 3000)
            </span>
            <button
              onClick={() => {
                setActivePanel('terminal');
                togglePanel('terminal');
              }}
              className="text-white hover:underline flex items-center gap-1"
            >
              <Terminal size={11} /> Output
            </button>
          </div>
        )}
      </div>

      {/* Accordions: Variables, Watch, Call Stack, Breakpoints */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#21262D]">
        {/* Watch */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">
              Watch
            </span>
            <button
              onClick={() => setIsAddingWatch(!isAddingWatch)}
              className="p-0.5 rounded text-[#8B949E] hover:text-white"
              title="Add Expression"
            >
              <Plus size={13} />
            </button>
          </div>

          {isAddingWatch && (
            <form onSubmit={handleAddWatch} className="mb-2">
              <input
                type="text"
                autoFocus
                placeholder="Expression to watch..."
                value={newWatch}
                onChange={(e) => setNewWatch(e.target.value)}
                className="w-full bg-[#0D1117] text-xs p-1 border border-[#58A6FF] rounded outline-none text-white font-mono"
              />
            </form>
          )}

          <div className="space-y-1 font-mono text-[11px]">
            {watchExpressions.map((w) => (
              <div key={w.id} className="flex items-center justify-between hover:bg-[#21262D] px-1 py-0.5 rounded">
                <span className="text-[#58A6FF]">{w.expr}:</span>
                <span className="text-[#3FB950] truncate">{w.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakpoints */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">
              Breakpoints
            </span>
            <span className="text-[10px] text-[#8B949E]">{breakpoints.filter(b => b.enabled).length} active</span>
          </div>

          <div className="space-y-1">
            {breakpoints.map((bp) => (
              <div
                key={bp.id}
                onClick={() => toggleBreakpoint(bp.id)}
                className="flex items-center gap-2 hover:bg-[#21262D] p-1 rounded cursor-pointer"
              >
                <button className="text-[#F85149]">
                  {bp.enabled ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F85149]" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full border border-[#8B949E]" />
                  )}
                </button>
                <span className="font-mono text-xs text-white">{bp.file}</span>
                <span className="font-mono text-[11px] text-[#8B949E]">:{bp.line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call Stack */}
        <div className="p-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B949E] block mb-1.5">
            Call Stack
          </span>
          <div className="text-[11px] text-[#8B949E] italic space-y-1">
            {isRunning ? (
              <div className="font-mono text-[11px] not-italic text-[#C9D1D9] space-y-0.5">
                <div className="text-[#58A6FF]">Main Thread (Suspended at Vite HMR proxy)</div>
                <div className="text-[#8B949E] pl-2">at startServer (server.ts:32)</div>
                <div className="text-[#8B949E] pl-2">at Object.&lt;anonymous&gt; (server.ts:45)</div>
              </div>
            ) : (
              <p>Not currently debugging</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

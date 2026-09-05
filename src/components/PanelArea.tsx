import React, { useEffect, useRef, useState } from 'react';
import { useIDE } from '../context/IDEContext';
import { PanelTab } from '../types';
import { X, ChevronUp, Trash2 } from 'lucide-react';

const terminalSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/terminal`;
};

export const PanelArea = () => {
  const { activePanel, setActivePanel, setIsPanelOpen } = useIDE();
  const [terminalOutput, setTerminalOutput] = useState('');
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'closed'>('connecting');
  const socketRef = useRef<WebSocket | null>(null);
  const terminalInputRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = new WebSocket(terminalSocketUrl());
    socketRef.current = socket;
    setConnectionState('connecting');

    socket.onopen = () => setConnectionState('connected');
    socket.onmessage = event => {
      try {
        const message = JSON.parse(event.data) as { type?: string; data?: string; message?: string };
        if (message.type === 'output' || message.type === 'ready' || message.type === 'exit' || message.type === 'error') {
          setTerminalOutput(previous => previous + (message.data || message.message || ''));
        }
      } catch {
        setTerminalOutput(previous => previous + String(event.data));
      }
    };
    socket.onclose = () => setConnectionState('closed');
    socket.onerror = () => setConnectionState('closed');
    terminalInputRef.current?.focus();

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const sendInput = (data: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'input', data }));
    }
  };

  const handleTerminalKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.key === 'Enter') sendInput('\r');
    else if (event.key === 'Backspace') sendInput('\b');
    else if (event.key === 'Tab') sendInput('\t');
    else if (event.key === 'ArrowUp') sendInput('\u001b[A');
    else if (event.key === 'ArrowDown') sendInput('\u001b[B');
    else if (event.key === 'ArrowRight') sendInput('\u001b[C');
    else if (event.key === 'ArrowLeft') sendInput('\u001b[D');
    else if (event.key === 'Escape') sendInput('\u001b');
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) sendInput(event.key);
    else if (event.ctrlKey && event.key.toLowerCase() === 'c') sendInput('\u0003');
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
          <span className={`text-[10px] ${connectionState === 'connected' ? 'text-[#3FB950]' : 'text-[#E3B341]'}`}>
            {connectionState === 'connected' ? 'LIVE SHELL' : connectionState.toUpperCase()}
          </span>
          <button className="hover:text-white"><ChevronUp size={14} /></button>
          <button onClick={() => setTerminalOutput('')} className="hover:text-white" title="Clear Terminal"><Trash2 size={14} /></button>
          <button onClick={() => setIsPanelOpen(false)} className="hover:text-white"><X size={14} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-3 font-mono text-[11px] text-[#8B949E]">
        {activePanel === 'terminal' && (
          <div className="flex flex-col h-full" onClick={() => terminalInputRef.current?.focus()}>
            <div
              ref={terminalInputRef}
              tabIndex={0}
              role="textbox"
              aria-label="Terminal input"
              onKeyDown={handleTerminalKeyDown}
              onPaste={event => {
                event.preventDefault();
                sendInput(event.clipboardData.getData('text'));
              }}
              className="flex-1 overflow-y-auto whitespace-pre-wrap break-words text-[#C9D1D9] outline-none"
            >
              {terminalOutput || 'Connecting to the workspace shell...'}
            </div>
          </div>
        )}
        {activePanel === 'problems' && <div>No problems have been detected in the workspace.</div>}
        {activePanel === 'output' && <div>Log output initialization complete.</div>}
        {activePanel === 'debug' && <div>Debug console is ready.</div>}
      </div>
    </div>
  );
};

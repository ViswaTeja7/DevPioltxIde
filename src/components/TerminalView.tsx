import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { X, ChevronUp, ChevronDown, Search } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

const terminalSocketUrl = (shellId?: string) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const query = shellId ? `?shell=${encodeURIComponent(shellId)}` : '';
  return `${protocol}//${window.location.host}/ws/terminal${query}`;
};

const THEME = {
  background: '#0D1117',
  foreground: '#C9D1D9',
  cursor: '#58A6FF',
  cursorAccent: '#0D1117',
  selectionBackground: '#264F78',
  black: '#484F58',
  red: '#FF7B72',
  green: '#3FB950',
  yellow: '#D29922',
  blue: '#58A6FF',
  magenta: '#BC8CFF',
  cyan: '#39C5CF',
  white: '#B1BAC4',
  brightBlack: '#6E7681',
  brightRed: '#FFA198',
  brightGreen: '#56D364',
  brightYellow: '#E3B341',
  brightBlue: '#79C0FF',
  brightMagenta: '#D2A8FF',
  brightCyan: '#56D4DD',
  brightWhite: '#F0F6FC'
};

export type TerminalState = 'connecting' | 'connected' | 'closed';

interface TerminalViewProps {
  active: boolean;
  shellId?: string;
  onStateChange?: (state: TerminalState) => void;
  onTitleChange?: (title: string) => void;
  onShellLabel?: (label: string) => void;
}

export const TerminalView = ({
  active,
  shellId,
  onStateChange,
  onTitleChange,
  onShellLabel
}: TerminalViewProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const searchRef = useRef<SearchAddon | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const activeRef = useRef(active);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  activeRef.current = active;

  const pushResize = useCallback(() => {
    const term = termRef.current;
    const socket = socketRef.current;
    if (!term || socket?.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
  }, []);

  const refit = useCallback(() => {
    const fit = fitRef.current;
    const term = termRef.current;
    if (!fit || !term) return;
    const host = hostRef.current;
    if (!host || host.clientWidth === 0 || host.clientHeight === 0) return;
    try {
      fit.fit();
      pushResize();
    } catch {
      // Ignore transient layout races while the panel is animating.
    }
  }, [pushResize]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const term = new XTerm({
      fontFamily: '"Cascadia Mono", "Consolas", "Menlo", "DejaVu Sans Mono", monospace',
      fontSize: 12,
      lineHeight: 1.2,
      cursorBlink: true,
      scrollback: 5000,
      allowProposedApi: true,
      theme: THEME
    });

    const fit = new FitAddon();
    const search = new SearchAddon();
    term.loadAddon(fit);
    term.loadAddon(search);
    term.open(host);
    termRef.current = term;
    fitRef.current = fit;
    searchRef.current = search;

    try {
      fit.fit();
    } catch {
      // Host may still be zero-sized on first paint.
    }

    const socket = new WebSocket(terminalSocketUrl(shellId));
    socketRef.current = socket;
    onStateChange?.('connecting');

    socket.onopen = () => {
      onStateChange?.('connected');
      term.focus();
      pushResize();
    };

    socket.onmessage = event => {
      let message: { type?: string; data?: string; message?: string };
      try {
        message = JSON.parse(event.data);
      } catch {
        term.write(String(event.data));
        return;
      }
      if (message.type === 'output' && message.data) {
        term.write(message.data);
      } else if (message.type === 'shell') {
        // The requested shell may have fallen back to the platform default.
        onShellLabel?.(message.data || '');
      } else if (message.type === 'exit') {
        term.write(`\r\n\x1b[33m${message.data || '[process exited]'}\x1b[0m`);
        onStateChange?.('closed');
      } else if (message.type === 'error') {
        term.write(`\r\n\x1b[31m${message.message || message.data || 'terminal error'}\x1b[0m\r\n`);
      }
    };

    socket.onclose = () => onStateChange?.('closed');
    socket.onerror = () => onStateChange?.('closed');

    const dataSubscription = term.onData(data => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'input', data }));
      }
    });

    const titleSubscription = term.onTitleChange(title => onTitleChange?.(title));

    // Terminal keybindings follow Windows Terminal conventions.
    term.attachCustomKeyEventHandler(event => {
      if (event.type !== 'keydown') return true;
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
        const selection = term.getSelection();
        if (selection) void navigator.clipboard.writeText(selection).catch(() => undefined);
        return false;
      }
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyV') {
        void navigator.clipboard
          .readText()
          .then(text => {
            if (text && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'input', data: text }));
            }
          })
          .catch(() => undefined);
        return false;
      }
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyF') {
        setSearchOpen(true);
        return false;
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        return true;
      }
      return true;
    });

    const observer = new ResizeObserver(() => {
      if (!activeRef.current) return;
      refit();
    });
    observer.observe(host);

    return () => {
      observer.disconnect();
      dataSubscription.dispose();
      titleSubscription.dispose();
      socket.close();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
      searchRef.current = null;
    };
  }, [shellId, onStateChange, onTitleChange, onShellLabel, pushResize, refit]);

  // A tab that was hidden has no measurable size, so it must be refitted when it becomes visible.
  useEffect(() => {
    if (!active) return;
    const raf = requestAnimationFrame(() => {
      refit();
      termRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [active, refit]);

  useEffect(() => {
    if (searchOpen) {
      const raf = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [searchOpen]);

  return (
    <div className="relative flex h-full w-full flex-col bg-[#0D1117]">
      {searchOpen && (
        <div className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded border border-[#30363D] bg-[#161B22] px-2 py-1 shadow-lg">
          <Search size={12} className="text-[#8B949E]" />
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={event => {
              setSearchTerm(event.target.value);
              if (event.target.value) {
                searchRef.current?.findNext(event.target.value, { incremental: true });
              }
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                if (event.shiftKey) searchRef.current?.findPrevious(searchTerm);
                else searchRef.current?.findNext(searchTerm);
              } else if (event.key === 'Escape') {
                setSearchOpen(false);
              }
            }}
            placeholder="Find in terminal"
            className="w-44 bg-transparent text-[11px] text-white outline-none placeholder:text-[#484F58]"
          />
          <button
            onClick={() => searchRef.current?.findPrevious(searchTerm)}
            className="text-[#8B949E] hover:text-white"
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp size={13} />
          </button>
          <button
            onClick={() => searchRef.current?.findNext(searchTerm)}
            className="text-[#8B949E] hover:text-white"
            title="Next match (Enter)"
          >
            <ChevronDown size={13} />
          </button>
          <button onClick={() => setSearchOpen(false)} className="text-[#8B949E] hover:text-white" title="Close">
            <X size={13} />
          </button>
        </div>
      )}
      <div ref={hostRef} className="h-full w-full overflow-hidden" />
    </div>
  );
};

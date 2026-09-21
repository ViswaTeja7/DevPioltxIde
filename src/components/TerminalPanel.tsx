import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { TerminalView, TerminalState } from './TerminalView';

interface ShellOption {
  id: string;
  label: string;
}

interface Session {
  id: string;
  title: string;
  state: TerminalState;
  shellId?: string;
}

let sessionCounter = 0;

const createSession = (shellId?: string, title?: string): Session => {
  sessionCounter += 1;
  return {
    id: `terminal-${sessionCounter}`,
    title: title || `terminal ${sessionCounter}`,
    state: 'connecting',
    shellId
  };
};

interface TerminalTabProps {
  session: Session;
  active: boolean;
  onState: (id: string, state: TerminalState) => void;
  onTitle: (id: string, title: string) => void;
  onShellLabel: (id: string, label: string) => void;
}

// Each tab memoizes its own callbacks, because TerminalView tears down and reconnects its
// shell whenever its handler props change identity.
const TerminalTab = React.memo(
  ({ session, active, onState, onTitle, onShellLabel }: TerminalTabProps) => {
    const handleState = useCallback((state: TerminalState) => onState(session.id, state), [onState, session.id]);
    const handleTitle = useCallback((title: string) => onTitle(session.id, title), [onTitle, session.id]);
    const handleShell = useCallback((label: string) => onShellLabel(session.id, label), [onShellLabel, session.id]);

    return (
      <div className={`h-full w-full ${active ? '' : 'invisible absolute inset-0 -z-10'}`}>
        <TerminalView
          active={active}
          shellId={session.shellId}
          onStateChange={handleState}
          onTitleChange={handleTitle}
          onShellLabel={handleShell}
        />
      </div>
    );
  }
);
TerminalTab.displayName = 'TerminalTab';

export const TerminalPanel = () => {
  const initialised = useRef<Session[] | null>(null);
  if (!initialised.current) initialised.current = [createSession()];

  const [sessions, setSessions] = useState<Session[]>(initialised.current);
  const [activeId, setActiveId] = useState<string>(initialised.current[0].id);
  const [shells, setShells] = useState<ShellOption[]>([]);
  const [selectedShellId, setSelectedShellId] = useState<string>('');

  // The shell list comes from the server, which resolves ids against its own allowlist.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/shells')
      .then(response => (response.ok ? response.json() : null))
      .then((data: { shells?: ShellOption[]; defaultId?: string | null } | null) => {
        if (cancelled || !data?.shells?.length) return;
        setShells(data.shells);
        setSelectedShellId(previous => previous || data.defaultId || data.shells![0].id);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const handleState = useCallback((id: string, state: TerminalState) => {
    setSessions(previous => previous.map(session => (session.id === id ? { ...session, state } : session)));
  }, []);

  const handleTitle = useCallback((id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSessions(previous =>
      previous.map(session => (session.id === id ? { ...session, title: trimmed } : session))
    );
  }, []);

  // The server reports the shell it actually started, which may differ from the request.
  const handleShellLabel = useCallback((id: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setSessions(previous =>
      previous.map(session =>
        session.id === id && session.title.startsWith('terminal') ? { ...session, title: trimmed } : session
      )
    );
  }, []);

  const addSession = useCallback(() => {
    const shellId = selectedShellId || undefined;
    const label = shells.find(shell => shell.id === shellId)?.label;
    const session = createSession(shellId, label);
    setSessions(previous => [...previous, session]);
    setActiveId(session.id);
  }, [selectedShellId, shells]);

  const closeSession = useCallback((id: string) => {
    setSessions(previous => {
      if (previous.length <= 1) return previous;
      const remaining = previous.filter(session => session.id !== id);
      setActiveId(current => {
        if (current !== id) return current;
        const index = previous.findIndex(session => session.id === id);
        return (remaining[index] ?? remaining[remaining.length - 1]).id;
      });
      return remaining;
    });
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b border-[#30363D] bg-[#0D1117] px-1">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {sessions.map(session => {
            const isActive = session.id === activeId;
            return (
              <div
                key={session.id}
                onClick={() => setActiveId(session.id)}
                title={session.title}
                className={`group flex cursor-pointer items-center gap-1.5 rounded-t px-2 py-1 text-[11px] transition-colors ${
                  isActive
                    ? 'bg-[#161B22] text-[#C9D1D9]'
                    : 'text-[#8B949E] hover:bg-[#161B22]/60 hover:text-[#C9D1D9]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    session.state === 'connected'
                      ? 'bg-[#3FB950]'
                      : session.state === 'connecting'
                        ? 'bg-[#E3B341]'
                        : 'bg-[#F85149]'
                  }`}
                />
                <span className="max-w-[140px] truncate">{session.title}</span>
                {sessions.length > 1 && (
                  <button
                    onClick={event => {
                      event.stopPropagation();
                      closeSession(session.id);
                    }}
                    className="text-[#8B949E] opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                    title="Close terminal"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={addSession}
            className="ml-1 shrink-0 rounded p-1 text-[#8B949E] hover:bg-[#21262D] hover:text-white"
            title="New terminal"
          >
            <Plus size={13} />
          </button>
        </div>

        {shells.length > 1 && (
          <select
            value={selectedShellId}
            onChange={event => setSelectedShellId(event.target.value)}
            title="Shell for new terminals"
            className="mr-1 shrink-0 rounded border border-[#30363D] bg-[#161B22] px-1 py-0.5 text-[10px] text-[#C9D1D9] outline-none"
          >
            {shells.map(shell => (
              <option key={shell.id} value={shell.id}>
                {shell.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        {sessions.map(session => (
          <TerminalTab
            key={session.id}
            session={session}
            active={session.id === activeId}
            onState={handleState}
            onTitle={handleTitle}
            onShellLabel={handleShellLabel}
          />
        ))}
      </div>
    </div>
  );
};

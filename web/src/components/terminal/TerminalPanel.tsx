import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  X,
  SplitSquareHorizontal,
  RotateCw,
  ChevronDown,
  SquareTerminal
} from 'lucide-react';
import { TerminalView, TerminalState } from './TerminalView';

interface ShellOption {
  id: string;
  label: string;
}

interface Pane {
  id: string;
  shellId?: string;
  state: TerminalState;
  // Incrementing the generation remounts TerminalView, which spawns a fresh shell on a
  // new WebSocket — this is how "Relaunch" resurrects a pane whose process exited.
  generation: number;
}

interface Session {
  id: string;
  title: string;
  panes: Pane[];
}

const MAX_PANES_PER_SESSION = 4;

let sessionCounter = 0;
let paneCounter = 0;

const createPane = (shellId?: string): Pane => {
  paneCounter += 1;
  return { id: `pane-${paneCounter}`, shellId, state: 'connecting', generation: 0 };
};

const createSession = (shellId?: string, title?: string): Session => {
  sessionCounter += 1;
  return {
    id: `terminal-${sessionCounter}`,
    title: title || `terminal ${sessionCounter}`,
    panes: [createPane(shellId)]
  };
};

// A tab's status dot reflects its worst pane: any pane still connecting wins over all
// connected, and every pane closed means the session is dead.
const sessionState = (session: Session): TerminalState => {
  if (session.panes.some(pane => pane.state === 'connecting')) return 'connecting';
  if (session.panes.some(pane => pane.state === 'connected')) return 'connected';
  return 'closed';
};

interface TerminalPaneProps {
  sessionId: string;
  pane: Pane;
  sessionActive: boolean;
  showChrome: boolean;
  canSplit: boolean;
  onState: (sessionId: string, paneId: string, state: TerminalState) => void;
  onTitle: (sessionId: string, title: string) => void;
  onShellLabel: (sessionId: string, label: string) => void;
  onSplit: (sessionId: string) => void;
  onRelaunch: (sessionId: string, paneId: string) => void;
  onClosePane: (sessionId: string, paneId: string) => void;
}

// Each pane memoizes its own callbacks, because TerminalView tears down and reconnects
// its shell whenever its handler props change identity.
const TerminalPane = React.memo(
  ({
    sessionId,
    pane,
    sessionActive,
    showChrome,
    canSplit,
    onState,
    onTitle,
    onShellLabel,
    onSplit,
    onRelaunch,
    onClosePane
  }: TerminalPaneProps) => {
    const { t } = useTranslation();
    const handleState = useCallback(
      (state: TerminalState) => onState(sessionId, pane.id, state),
      [onState, sessionId, pane.id]
    );
    const handleTitle = useCallback(
      (title: string) => onTitle(sessionId, title),
      [onTitle, sessionId]
    );
    const handleShell = useCallback(
      (label: string) => onShellLabel(sessionId, label),
      [onShellLabel, sessionId]
    );
    const closed = pane.state === 'closed';

    return (
      <div className="relative flex h-full min-w-0 flex-1 flex-col">
        {showChrome && (
          <div className="flex shrink-0 items-center justify-end gap-0.5 bg-[#1B1B1B] px-1 py-0.5">
            <button
              onClick={() => onSplit(sessionId)}
              disabled={!canSplit}
              className="rounded p-0.5 text-[#ADADAD] hover:bg-[#2D2D2D] hover:text-white disabled:opacity-30"
              title={t('terminal.splitPane')}
              aria-label={t('terminal.splitPane')}
            >
              <SplitSquareHorizontal size={11} aria-hidden="true" />
            </button>
            <button
              onClick={() => onClosePane(sessionId, pane.id)}
              className="rounded p-0.5 text-[#ADADAD] hover:bg-[#2D2D2D] hover:text-[#E74856]"
              title={t('terminal.killPane')}
              aria-label={t('terminal.killPane')}
            >
              <X size={11} aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1" key={`${pane.id}:${pane.generation}`}>
          <TerminalView
            active={sessionActive && !closed}
            shellId={pane.shellId}
            onStateChange={handleState}
            onTitleChange={handleTitle}
            onShellLabel={handleShell}
          />
        </div>
        {closed && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#0C0C0C]/85">
            <span className="text-[11px] text-[#ADADAD]">{t('terminal.processExited')}</span>
            <button
              onClick={() => onRelaunch(sessionId, pane.id)}
              className="flex items-center gap-1.5 rounded border border-[#454545] bg-[#2D2D2D] px-3 py-1 text-[11px] text-[#F2F2F2] hover:bg-[#3E3E3E]"
            >
              <RotateCw size={11} aria-hidden="true" />
              {t('terminal.relaunch')}
            </button>
          </div>
        )}
      </div>
    );
  }
);
TerminalPane.displayName = 'TerminalPane';

export const TerminalPanel = () => {
  const { t } = useTranslation();
  // Lazy initializers avoid reading refs during render.
  const [sessions, setSessions] = useState<Session[]>(() => [createSession()]);
  const [activeId, setActiveId] = useState<string>(() => sessions[0].id);
  const [shells, setShells] = useState<ShellOption[]>([]);
  const [selectedShellId, setSelectedShellId] = useState<string>('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Clicking outside the profile dropdown dismisses it.
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [profileMenuOpen]);

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

  const handleState = useCallback((sessionId: string, paneId: string, state: TerminalState) => {
    setSessions(previous =>
      previous.map(session =>
        session.id === sessionId
          ? {
              ...session,
              panes: session.panes.map(pane => (pane.id === paneId ? { ...pane, state } : pane))
            }
          : session
      )
    );
  }, []);

  const handleTitle = useCallback((sessionId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSessions(previous =>
      previous.map(session => (session.id === sessionId ? { ...session, title: trimmed } : session))
    );
  }, []);

  // The server reports the shell it actually started, which may differ from the request.
  const handleShellLabel = useCallback((sessionId: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setSessions(previous =>
      previous.map(session =>
        session.id === sessionId && session.title.startsWith('terminal')
          ? { ...session, title: trimmed }
          : session
      )
    );
  }, []);

  const addSession = useCallback(
    (shellIdOverride?: string) => {
      const shellId = (shellIdOverride ?? selectedShellId) || undefined;
      const label = shells.find(shell => shell.id === shellId)?.label;
      const session = createSession(shellId, label);
      setSessions(previous => [...previous, session]);
      setActiveId(session.id);
    },
    [selectedShellId, shells]
  );

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

  const splitSession = useCallback(
    (id: string) => {
      const shellId = selectedShellId || undefined;
      setSessions(previous =>
        previous.map(session =>
          session.id === id && session.panes.length < MAX_PANES_PER_SESSION
            ? { ...session, panes: [...session.panes, createPane(shellId)] }
            : session
        )
      );
    },
    [selectedShellId]
  );

  const closePane = useCallback((sessionId: string, paneId: string) => {
    setSessions(previous => {
      const session = previous.find(s => s.id === sessionId);
      // The last pane of a tab cannot be killed from pane chrome; the tab's close
      // button removes the terminal entirely.
      if (!session || session.panes.length <= 1) return previous;
      return previous.map(s =>
        s.id === sessionId ? { ...s, panes: s.panes.filter(pane => pane.id !== paneId) } : s
      );
    });
  }, []);

  const relaunchPane = useCallback((sessionId: string, paneId: string) => {
    setSessions(previous =>
      previous.map(session =>
        session.id === sessionId
          ? {
              ...session,
              panes: session.panes.map(pane =>
                pane.id === paneId
                  ? {
                      ...pane,
                      state: 'connecting' as TerminalState,
                      generation: pane.generation + 1
                    }
                  : pane
              )
            }
          : session
      )
    );
  }, []);

  // VS Code conventions: Ctrl+Shift+` opens a new terminal, Ctrl+Shift+5 splits the
  // active one. xterm lets unhandled keys bubble up to these listeners.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.shiftKey) return;
      if (event.code === 'Backquote') {
        event.preventDefault();
        addSession();
      } else if (event.code === 'Digit5') {
        event.preventDefault();
        splitSession(activeId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addSession, splitSession, activeId]);

  // WAI-ARIA tablist behaviour for the terminal tabs (Ctrl+` etc. handled elsewhere).
  const handleTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % sessions.length
        : (index - 1 + sessions.length) % sessions.length;
    setActiveId(sessions[next].id);
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Tab strip styled after Windows Terminal: dark #1B1B1B row, rounded-top tabs,
          and the active tab blends into the #0C0C0C terminal surface below. */}
      <div className="flex shrink-0 items-end gap-0 bg-[#1B1B1B] pl-1 pr-1 pt-1">
        <div
          className="flex min-w-0 flex-1 items-end gap-px overflow-x-auto"
          role="tablist"
          aria-label={t('panel.terminal')}
        >
          {sessions.map((session, index) => {
            const isActive = session.id === activeId;
            const state = sessionState(session);
            return (
              <div
                key={session.id}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveId(session.id)}
                onKeyDown={event => handleTabKeyDown(event, index)}
                onAuxClick={event => {
                  // Windows Terminal convention: middle-click closes the tab.
                  if (event.button === 1) {
                    event.preventDefault();
                    closeSession(session.id);
                  }
                }}
                title={session.title}
                className={`group flex h-8 min-w-[110px] max-w-[220px] flex-1 cursor-pointer items-center gap-2 rounded-t-md px-2.5 text-[12px] transition-colors ${
                  isActive
                    ? 'bg-[#0C0C0C] text-[#F2F2F2]'
                    : 'text-[#ADADAD] hover:bg-[#2D2D2D] hover:text-[#F2F2F2]'
                }`}
              >
                <SquareTerminal size={12} className="shrink-0 opacity-70" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{session.title}</span>
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    state === 'connected'
                      ? 'bg-[#16C60C]'
                      : state === 'connecting'
                        ? 'bg-[#F9F1A5]'
                        : 'bg-[#E74856]'
                  }`}
                />
                {sessions.length > 1 && (
                  <button
                    onClick={event => {
                      event.stopPropagation();
                      closeSession(session.id);
                    }}
                    className={`rounded p-0.5 text-[#ADADAD] transition-opacity hover:bg-[#454545] hover:text-white ${
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title={t('terminal.closeTab')}
                    aria-label={t('terminal.closeTab')}
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={() => addSession()}
            className="mb-0.5 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#CCCCCC] hover:bg-[#2D2D2D]"
            title={t('terminal.newTab') + ' (Ctrl+Shift+`)'}
          >
            <Plus size={14} aria-hidden="true" />
          </button>
          <button
            onClick={() => splitSession(activeId)}
            className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#CCCCCC] hover:bg-[#2D2D2D]"
            title={t('terminal.splitPane') + ' (Ctrl+Shift+5)'}
            aria-label={t('terminal.splitPane')}
          >
            <SplitSquareHorizontal size={13} aria-hidden="true" />
          </button>

          {/* Windows Terminal's ˅ profile menu: picking a profile opens a new tab with
              that shell immediately. */}
          {shells.length > 0 && (
            <div ref={profileMenuRef} className="relative shrink-0">
              <button
                onClick={() => setProfileMenuOpen(open => !open)}
                className={`mb-0.5 flex h-7 w-7 items-center justify-center rounded text-[#CCCCCC] hover:bg-[#2D2D2D] ${profileMenuOpen ? 'bg-[#2D2D2D]' : ''}`}
                title={t('terminal.shellProfiles')}
                aria-label={t('terminal.shellProfiles')}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
              >
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              {profileMenuOpen && (
                <div
                  className="absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-md border border-[#454545] bg-[#2D2D2D] py-1 shadow-xl"
                  role="menu"
                >
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#ADADAD]">
                    {t('terminal.profiles')}
                  </div>
                  {shells.map(shell => (
                    <button
                      key={shell.id}
                      onClick={() => {
                        setSelectedShellId(shell.id);
                        addSession(shell.id);
                        setProfileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-[#F2F2F2] hover:bg-[#3E3E3E]"
                      role="menuitem"
                    >
                      <SquareTerminal
                        size={12}
                        className="shrink-0 opacity-70"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">{shell.label}</span>
                      {shell.id === selectedShellId && (
                        <span className="text-[10px] text-[#ADADAD]">
                          {t('terminal.defaultProfile')}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {sessions.map(session => {
          const isActive = session.id === activeId;
          return (
            <div
              key={session.id}
              className={`flex h-full w-full divide-x divide-[#2D2D2D] ${isActive ? '' : 'invisible absolute inset-0 -z-10'}`}
            >
              {session.panes.map(pane => (
                <TerminalPane
                  key={pane.id}
                  sessionId={session.id}
                  pane={pane}
                  sessionActive={isActive}
                  showChrome={session.panes.length > 1}
                  canSplit={session.panes.length < MAX_PANES_PER_SESSION}
                  onState={handleState}
                  onTitle={handleTitle}
                  onShellLabel={handleShellLabel}
                  onSplit={splitSession}
                  onRelaunch={relaunchPane}
                  onClosePane={closePane}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

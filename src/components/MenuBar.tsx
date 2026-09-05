import React, { useState, useEffect, useRef } from 'react';
import { useIDE } from '../context/IDEContext';
import {
  FileText,
  Plus,
  Save,
  X,
  Trash2,
  Settings,
  BrainCircuit,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  ClipboardPaste,
  Search,
  Replace,
  Code,
  LayoutDashboard,
  Wand2,
  FolderGit2,
  Bug,
  Blocks,
  Sparkles,
  Terminal,
  Play,
  HelpCircle,
  Keyboard,
  Info,
  Check,
  PanelLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { ActivityTab, ActiveView, PanelTab } from '../types';

export type MenuCategory = 'File' | 'Edit' | 'Selection' | 'View' | 'Go' | 'Run' | 'Terminal' | 'Help';

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  shortcut?: string;
  divider?: boolean;
  checked?: boolean;
  disabled?: boolean;
  action?: () => void;
}

export const MenuBar = () => {
  const {
    activeView,
    setActiveView,
    activeActivity,
    setActiveActivity,
    toggleSidebar,
    togglePanel,
    setActivePanel,
    setIsPanelOpen,
    createNewFile,
    closeFile,
    closeAllFiles,
    activeFileId,
    openFiles,
    selectedModel,
    setIsModelSelectorOpen,
  } = useIDE();

  const [openMenu, setOpenMenu] = useState<MenuCategory | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [saveFlash, setSaveFlash] = useState(false);

  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showShortcutsModal || showAboutModal) {
          setShowShortcutsModal(false);
          setShowAboutModal(false);
        } else {
          setOpenMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showShortcutsModal, showAboutModal]);

  const handleMenuClick = (menu: MenuCategory) => {
    if (openMenu === menu) {
      setOpenMenu(null);
    } else {
      setOpenMenu(menu);
    }
  };

  const handleMenuHover = (menu: MenuCategory) => {
    if (openMenu !== null && openMenu !== menu) {
      setOpenMenu(menu);
    }
  };

  const executeItem = (itemAction?: () => void) => {
    if (itemAction) {
      itemAction();
    }
    setOpenMenu(null);
  };

  const handleSave = () => {
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  const selectActivityAndEditor = (activity: ActivityTab) => {
    setActiveActivity(activity);
    if (activeView !== 'editor') {
      setActiveView('editor');
    }
  };

  const menuDefinitions: Record<MenuCategory, MenuItem[]> = {
    File: [
      {
        id: 'new-file',
        label: 'New File',
        icon: Plus,
        shortcut: 'Ctrl+N',
        action: () => createNewFile(),
      },
      {
        id: 'open-file',
        label: 'Quick Open File...',
        icon: FileText,
        shortcut: 'Ctrl+P',
        action: () => selectActivityAndEditor('explorer'),
      },
      {
        id: 'save-file',
        label: 'Save',
        icon: Save,
        shortcut: 'Ctrl+S',
        action: handleSave,
      },
      {
        id: 'save-all',
        label: 'Save All',
        shortcut: 'Ctrl+Shift+S',
        action: handleSave,
      },
      {
        id: 'auto-save',
        label: 'Auto Save',
        checked: autoSave,
        action: () => setAutoSave(!autoSave),
      },
      { id: 'div-1', label: '', divider: true },
      {
        id: 'close-editor',
        label: 'Close Tab',
        icon: X,
        shortcut: 'Ctrl+W',
        disabled: !activeFileId,
        action: () => {
          if (activeFileId) closeFile(activeFileId);
        },
      },
      {
        id: 'close-all-editors',
        label: 'Close All Tabs',
        icon: Trash2,
        shortcut: 'Ctrl+K Ctrl+W',
        disabled: openFiles.length === 0,
        action: () => closeAllFiles(),
      },
      { id: 'div-2', label: '', divider: true },
      {
        id: 'preferences-settings',
        label: 'Settings & API Keys',
        icon: Settings,
        shortcut: 'Ctrl+,',
        action: () => setActiveActivity('settings'),
      },
      {
        id: 'train-skills',
        label: 'Train Agent & Claude Skills',
        icon: BrainCircuit,
        shortcut: 'Ctrl+4',
        action: () => setActiveView('skills'),
      },
    ],
    Edit: [
      {
        id: 'undo',
        label: 'Undo',
        icon: Undo2,
        shortcut: 'Ctrl+Z',
        action: () => {},
      },
      {
        id: 'redo',
        label: 'Redo',
        icon: Redo2,
        shortcut: 'Ctrl+Y',
        action: () => {},
      },
      { id: 'div-e1', label: '', divider: true },
      {
        id: 'cut',
        label: 'Cut',
        icon: Scissors,
        shortcut: 'Ctrl+X',
        action: () => {},
      },
      {
        id: 'copy',
        label: 'Copy',
        icon: Copy,
        shortcut: 'Ctrl+C',
        action: () => {},
      },
      {
        id: 'paste',
        label: 'Paste',
        icon: ClipboardPaste,
        shortcut: 'Ctrl+V',
        action: () => {},
      },
      { id: 'div-e2', label: '', divider: true },
      {
        id: 'find-project',
        label: 'Find in Project Files',
        icon: Search,
        shortcut: 'Ctrl+Shift+F',
        action: () => selectActivityAndEditor('search'),
      },
      {
        id: 'replace-project',
        label: 'Replace in Project Files',
        icon: Replace,
        shortcut: 'Ctrl+Shift+H',
        action: () => selectActivityAndEditor('search'),
      },
    ],
    Selection: [
      {
        id: 'select-all',
        label: 'Select All',
        shortcut: 'Ctrl+A',
        action: () => {},
      },
      {
        id: 'expand-selection',
        label: 'Expand Selection',
        shortcut: 'Shift+Alt+Right',
        action: () => {},
      },
      {
        id: 'shrink-selection',
        label: 'Shrink Selection',
        shortcut: 'Shift+Alt+Left',
        action: () => {},
      },
      { id: 'div-s1', label: '', divider: true },
      {
        id: 'copy-line-up',
        label: 'Copy Line Up',
        shortcut: 'Shift+Alt+Up',
        action: () => {},
      },
      {
        id: 'copy-line-down',
        label: 'Copy Line Down',
        shortcut: 'Shift+Alt+Down',
        action: () => {},
      },
    ],
    View: [
      {
        id: 'view-editor',
        label: 'Code Editor',
        icon: Code,
        shortcut: 'Ctrl+1',
        checked: activeView === 'editor',
        action: () => setActiveView('editor'),
      },
      {
        id: 'view-dashboard',
        label: 'Project Dashboard',
        icon: LayoutDashboard,
        shortcut: 'Ctrl+2',
        checked: activeView === 'dashboard',
        action: () => setActiveView('dashboard'),
      },
      {
        id: 'view-studio',
        label: 'Multimodal Task Studio',
        icon: Wand2,
        shortcut: 'Ctrl+3',
        checked: activeView === 'studio',
        action: () => setActiveView('studio'),
      },
      {
        id: 'view-skills',
        label: 'Train Agent & Skills Studio',
        icon: BrainCircuit,
        shortcut: 'Ctrl+4',
        checked: activeView === 'skills',
        action: () => setActiveView('skills'),
      },
      { id: 'div-v1', label: '', divider: true },
      {
        id: 'toggle-sidebar',
        label: 'Toggle Primary Sidebar',
        icon: PanelLeft,
        shortcut: 'Ctrl+B',
        action: () => toggleSidebar(),
      },
      {
        id: 'side-explorer',
        label: 'Explorer Panel',
        shortcut: 'Ctrl+Shift+E',
        action: () => selectActivityAndEditor('explorer'),
      },
      {
        id: 'side-search',
        label: 'Search Panel',
        shortcut: 'Ctrl+Shift+F',
        action: () => selectActivityAndEditor('search'),
      },
      {
        id: 'side-git',
        label: 'Source Control Panel',
        shortcut: 'Ctrl+Shift+G',
        action: () => selectActivityAndEditor('git'),
      },
      {
        id: 'side-debug',
        label: 'Run and Debug Panel',
        shortcut: 'Ctrl+Shift+D',
        action: () => selectActivityAndEditor('debug'),
      },
      {
        id: 'side-extensions',
        label: 'Extensions Panel',
        shortcut: 'Ctrl+Shift+X',
        action: () => selectActivityAndEditor('extensions'),
      },
      {
        id: 'side-ai',
        label: 'Copilot Assistant Panel',
        icon: Sparkles,
        shortcut: 'Ctrl+Shift+A',
        action: () => selectActivityAndEditor('ai'),
      },
      {
        id: 'side-skills',
        label: 'Agent Skills Panel',
        icon: BrainCircuit,
        action: () => setActiveActivity('skills'),
      },
      { id: 'div-v2', label: '', divider: true },
      {
        id: 'toggle-terminal',
        label: 'Toggle Bottom Terminal Panel',
        icon: Terminal,
        shortcut: 'Ctrl+`',
        action: () => togglePanel('terminal'),
      },
      {
        id: 'switch-model',
        label: 'Switch AI Model...',
        icon: Sparkles,
        action: () => setIsModelSelectorOpen(true),
      },
    ],
    Go: [
      {
        id: 'go-file',
        label: 'Go to File...',
        shortcut: 'Ctrl+P',
        action: () => selectActivityAndEditor('explorer'),
      },
      {
        id: 'go-line',
        label: 'Go to Line / Column...',
        shortcut: 'Ctrl+G',
        action: () => {},
      },
      {
        id: 'go-symbol',
        label: 'Go to Symbol...',
        shortcut: 'Ctrl+T',
        action: () => {},
      },
      { id: 'div-g1', label: '', divider: true },
      {
        id: 'next-problem',
        label: 'Next Problem',
        shortcut: 'F8',
        action: () => {
          setActivePanel('problems');
          setIsPanelOpen(true);
        },
      },
      {
        id: 'prev-problem',
        label: 'Previous Problem',
        shortcut: 'Shift+F8',
        action: () => {
          setActivePanel('problems');
          setIsPanelOpen(true);
        },
      },
    ],
    Run: [
      {
        id: 'start-debug',
        label: 'Start Debugging',
        icon: Play,
        shortcut: 'F5',
        action: () => {
          selectActivityAndEditor('debug');
          setActivePanel('terminal');
          setIsPanelOpen(true);
        },
      },
      {
        id: 'run-without-debug',
        label: 'Run Without Debugging',
        shortcut: 'Ctrl+F5',
        action: () => {
          setActivePanel('terminal');
          setIsPanelOpen(true);
        },
      },
      {
        id: 'stop-debug',
        label: 'Stop Debugging',
        shortcut: 'Shift+F5',
        action: () => {},
      },
      { id: 'div-r1', label: '', divider: true },
      {
        id: 'open-debug-panel',
        label: 'Open Debug Configurations',
        icon: Bug,
        action: () => selectActivityAndEditor('debug'),
      },
    ],
    Terminal: [
      {
        id: 'new-term',
        label: 'New Terminal',
        icon: Terminal,
        shortcut: 'Ctrl+Shift+`',
        action: () => {
          setActivePanel('terminal');
          setIsPanelOpen(true);
        },
      },
      {
        id: 'toggle-term',
        label: 'Toggle Terminal Panel',
        shortcut: 'Ctrl+`',
        action: () => togglePanel('terminal'),
      },
      { id: 'div-t1', label: '', divider: true },
      {
        id: 'term-problems',
        label: 'Problems & Diagnostics',
        action: () => {
          setActivePanel('problems');
          setIsPanelOpen(true);
        },
      },
      {
        id: 'term-output',
        label: 'Output Console',
        action: () => {
          setActivePanel('output');
          setIsPanelOpen(true);
        },
      },
    ],
    Help: [
      {
        id: 'doc-shortcuts',
        label: 'Keyboard Shortcuts Reference',
        icon: Keyboard,
        shortcut: 'Ctrl+K Ctrl+S',
        action: () => setShowShortcutsModal(true),
      },
      {
        id: 'help-copilot',
        label: 'Multi-Model Copilot Guide',
        icon: Sparkles,
        action: () => setIsModelSelectorOpen(true),
      },
      {
        id: 'help-skills',
        label: 'Train Agent & Skills Manual',
        icon: BrainCircuit,
        action: () => setActiveView('skills'),
      },
      { id: 'div-h1', label: '', divider: true },
      {
        id: 'about-devpilot',
        label: 'About DevPilotX IDE',
        icon: Info,
        action: () => setShowAboutModal(true),
      },
    ],
  };

  const menuKeys: MenuCategory[] = ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'];

  return (
    <div ref={menuBarRef} className="flex items-center text-xs relative select-none">
      {/* Menu Header Buttons */}
      <div className="flex items-center gap-0.5">
        {menuKeys.map((menuKey) => {
          const isOpen = openMenu === menuKey;
          return (
            <div key={menuKey} className="relative">
              <button
                onClick={() => handleMenuClick(menuKey)}
                onMouseEnter={() => handleMenuHover(menuKey)}
                className={`px-2 py-1 rounded transition-colors ${
                  isOpen
                    ? 'bg-[#21262D] text-white font-medium'
                    : 'text-[#8B949E] hover:text-white hover:bg-[#21262D]'
                }`}
              >
                {menuKey}
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div 
                  className="absolute top-full left-0 mt-1 z-50 min-w-[240px] bg-[#161B22] border border-[#30363D] rounded-lg shadow-2xl py-1 text-[#C9D1D9] text-xs backdrop-blur-md animate-in fade-in zoom-in-95 duration-75 divide-y divide-[#21262D]"
                >
                  <div className="py-0.5">
                    {menuDefinitions[menuKey].map((item, idx) => {
                      if (item.divider) {
                        return <div key={`div-${idx}`} className="my-1 border-t border-[#30363D]" />;
                      }

                      return (
                        <button
                          key={item.id}
                          disabled={item.disabled}
                          onClick={() => executeItem(item.action)}
                          className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors disabled:opacity-40 disabled:hover:bg-transparent group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            {item.checked !== undefined ? (
                              item.checked ? (
                                <Check size={13} className="text-[#58A6FF] shrink-0" />
                              ) : (
                                <div className="w-[13px] shrink-0" />
                              )
                            ) : item.icon ? (
                              <item.icon size={13} className="text-[#8B949E] group-hover:text-white shrink-0" />
                            ) : (
                              <div className="w-[13px] shrink-0" />
                            )}
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.shortcut && (
                            <span className="text-[10px] text-[#8B949E] font-mono shrink-0 pl-3">
                              {item.shortcut}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {saveFlash && (
        <span className="ml-3 text-[11px] text-[#3FB950] font-medium animate-pulse">
          Saved!
        </span>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#30363D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard size={18} className="text-[#58A6FF]" />
                <h3 className="font-semibold text-white text-sm">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 text-[#8B949E] hover:text-white rounded hover:bg-[#21262D]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto space-y-2 text-xs">
              {[
                { key: 'Ctrl + N', desc: 'Create New File' },
                { key: 'Ctrl + S', desc: 'Save Active File' },
                { key: 'Ctrl + W', desc: 'Close Active Editor Tab' },
                { key: 'Ctrl + B', desc: 'Toggle Primary Sidebar' },
                { key: 'Ctrl + `', desc: 'Toggle Bottom Terminal Panel' },
                { key: 'Ctrl + Shift + F', desc: 'Search & Replace in Project' },
                { key: 'Ctrl + Shift + A', desc: 'Open Copilot AI Assistant' },
                { key: 'Ctrl + Shift + G', desc: 'Open Source Control (Git)' },
                { key: 'Ctrl + Shift + D', desc: 'Open Run and Debug' },
                { key: 'Ctrl + Shift + X', desc: 'Open Extensions Marketplace' },
                { key: 'Ctrl + 1 / 2 / 3 / 4', desc: 'Switch Editor / Dashboard / Tasks / Skills' },
                { key: 'F5', desc: 'Start Debugging' },
                { key: 'F8', desc: 'Next Diagnostics Problem' },
              ].map((s, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-[#21262D] last:border-0">
                  <span className="text-[#C9D1D9]">{s.desc}</span>
                  <span className="font-mono bg-[#0D1117] border border-[#30363D] px-2 py-0.5 rounded text-[11px] text-[#58A6FF]">
                    {s.key}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-[#0D1117] border-t border-[#30363D] flex justify-end">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-3 py-1 bg-[#21262D] hover:bg-[#30363D] text-white rounded text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#30363D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-[#A371F7]" />
                <h3 className="font-semibold text-white text-sm">About DevPilotX IDE</h3>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="p-1 text-[#8B949E] hover:text-white rounded hover:bg-[#21262D]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 text-xs text-[#8B949E] space-y-3 leading-relaxed">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1F6FEB] flex items-center justify-center text-white font-bold text-base">
                  DP
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">DevPilotX IDE</h4>
                  <p className="text-[11px] text-[#8B949E]">v2.5.0 • Enterprise Edition</p>
                </div>
              </div>
              <p>
                Next-generation cloud IDE featuring Multi-Model LLMs (Gemini 3.7, Claude 3.7, GPT-4o, DeepSeek R1),
                Anthropic Claude-style Agent Skills & Training Studio, and high-performance Monaco code editor.
              </p>
              <div className="p-2.5 bg-[#0D1117] border border-[#30363D] rounded-lg font-mono text-[11px] text-[#C9D1D9] space-y-1">
                <div>Active Model: <span className="text-[#58A6FF]">{selectedModel.name}</span></div>
                <div>Active View: <span className="text-[#3FB950]">{activeView}</span></div>
                <div>Active Side Panel: <span className="text-[#E3B341]">{activeActivity || 'Collapsed'}</span></div>
              </div>
            </div>
            <div className="p-3 bg-[#0D1117] border-t border-[#30363D] flex justify-end">
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-3 py-1 bg-[#1F6FEB] hover:bg-[#388BFD] text-white rounded text-xs font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

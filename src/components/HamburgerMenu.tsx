import React, { useState, useEffect, useRef } from 'react';
import { useIDE } from '../context/IDEContext';
import {
  FileCode,
  Folder,
  Save,
  X,
  Search,
  Check,
  ChevronRight,
  Sparkles,
  Sliders,
  Terminal,
  Play,
  HelpCircle,
  Keyboard,
  Info,
  Code,
  LayoutDashboard,
  Layers,
  Cpu,
  Trash2,
  ExternalLink,
  Plus,
  Wand2,
  BrainCircuit,
  ImageIcon
} from 'lucide-react';
import { ModelIcon } from './ModelIcon';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type MenuCategory = 'file' | 'edit' | 'selection' | 'view' | 'ai' | 'run' | 'terminal' | 'help' | null;

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isOpen, onClose }) => {
  const {
    activeView,
    setActiveView,
    activeActivity,
    setActiveActivity,
    toggleSidebar,
    togglePanel,
    isPanelOpen,
    createNewFile,
    closeFile,
    closeAllFiles,
    activeFileId,
    openFiles,
    selectedModel,
    setIsModelSelectorOpen,
    clearChatHistory,
    clearTaskChatHistory,
  } = useIDE();

  const [activeSubmenu, setActiveSubmenu] = useState<MenuCategory>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showShortcutsModal || showAboutModal) {
          setShowShortcutsModal(false);
          setShowAboutModal(false);
        } else {
          onClose();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, showShortcutsModal, showAboutModal]);

  if (!isOpen) return null;

  const handleAction = (callback: () => void) => {
    callback();
    onClose();
  };

  return (
    <>
      {/* Dropdown Container */}
      <div
        ref={menuRef}
        id="devpilot-hamburger-dropdown"
        className="absolute top-10 left-2 z-50 w-72 bg-[#161B22] border border-[#30363D] rounded-lg shadow-2xl text-[#C9D1D9] text-xs py-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 divide-y divide-[#21262D]"
      >
        {/* Header Profile / Quick App status */}
        <div className="px-3 py-2 flex items-center justify-between bg-[#0D1117]/60">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#1F6FEB] flex items-center justify-center text-white font-bold text-[10px]">
              DP
            </div>
            <div>
              <div className="font-semibold text-white text-xs leading-none">DevPilotX IDE</div>
              <div className="text-[10px] text-[#8B949E] mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950] animate-pulse"></span>
                Ready • {selectedModel.name}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleAction(() => setIsModelSelectorOpen(true))}
            className="p-1 hover:bg-[#21262D] rounded text-[#8B949E] hover:text-white"
            title="Switch Model"
          >
            <ModelIcon type={selectedModel.iconType} size={14} />
          </button>
        </div>

        {/* Primary Sections */}
        <div className="py-1">
          {/* File Operations */}
          <div className="relative group">
            <button
              onMouseEnter={() => setActiveSubmenu('file')}
              onClick={() => handleAction(() => createNewFile())}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Plus size={14} className="text-[#58A6FF]" />
                New File
              </span>
              <span className="text-[10px] text-[#8B949E]">Ctrl+N</span>
            </button>
          </div>

          <button
            onClick={() => handleAction(() => {
              if (activeFileId) closeFile(activeFileId);
            })}
            disabled={!activeFileId}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <span className="flex items-center gap-2.5">
              <X size={14} className="text-[#F85149]" />
              Close Active Tab
            </span>
            <span className="text-[10px] text-[#8B949E]">Ctrl+W</span>
          </button>

          {openFiles.length > 1 && (
            <button
              onClick={() => handleAction(() => closeAllFiles())}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors text-[#8B949E]"
            >
              <span className="flex items-center gap-2.5">
                <Trash2 size={14} />
                Close All Tabs ({openFiles.length})
              </span>
            </button>
          )}
        </div>

        {/* Views & Workspaces */}
        <div className="py-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">
            View & Navigation
          </div>

          <button
            onClick={() => handleAction(() => setActiveView('editor'))}
            className={`w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] text-left transition-colors ${
              activeView === 'editor' ? 'text-white bg-[#21262D]/60' : 'hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Code size={14} className="text-[#58A6FF]" />
              Code Editor View
            </span>
            {activeView === 'editor' && <Check size={12} className="text-[#58A6FF]" />}
          </button>

          <button
            onClick={() => handleAction(() => setActiveView('dashboard'))}
            className={`w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] text-left transition-colors ${
              activeView === 'dashboard' ? 'text-white bg-[#21262D]/60' : 'hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <LayoutDashboard size={14} className="text-[#D29922]" />
              Project Dashboard
            </span>
            {activeView === 'dashboard' && <Check size={12} className="text-[#58A6FF]" />}
          </button>

          <button
            onClick={() => handleAction(() => setActiveView('studio'))}
            className={`w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] text-left transition-colors ${
              activeView === 'studio' ? 'text-white bg-[#21262D]/60' : 'hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Wand2 size={14} className="text-[#A371F7]" />
              Multimodal Task Studio (Images & Research)
            </span>
            {activeView === 'studio' && <Check size={12} className="text-[#58A6FF]" />}
          </button>

          <button
            onClick={() => handleAction(() => setActiveView('skills'))}
            className={`w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] text-left transition-colors ${
              activeView === 'skills' ? 'text-white bg-[#21262D]/60' : 'hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <BrainCircuit size={14} className="text-[#A371F7]" />
              Train Agent & Claude Skills Studio
            </span>
            {activeView === 'skills' && <Check size={12} className="text-[#58A6FF]" />}
          </button>

          <button
            onClick={() => handleAction(() => {
              toggleSidebar('explorer');
              if (activeView !== 'editor') setActiveView('editor');
            })}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Folder size={14} className="text-[#E3B341]" />
              Toggle File Explorer
            </span>
            <span className="text-[10px] text-[#8B949E]">Ctrl+Shift+E</span>
          </button>

          <button
            onClick={() => handleAction(() => {
              toggleSidebar('search');
              if (activeView !== 'editor') setActiveView('editor');
            })}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Search size={14} className="text-[#58A6FF]" />
              Search & Replace
            </span>
            <span className="text-[10px] text-[#8B949E]">Ctrl+Shift+F</span>
          </button>

          <button
            onClick={() => handleAction(() => togglePanel('terminal'))}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Terminal size={14} className="text-[#3FB950]" />
              Toggle Terminal Panel
            </span>
            <span className="text-[10px] text-[#8B949E]">Ctrl+`</span>
          </button>
        </div>

        {/* AI & DevPilotX Suite */}
        <div className="py-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8B949E] flex items-center justify-between">
            <span>DevPilotX AI & Models</span>
            <span className="text-[9px] bg-[#1F6FEB]/20 text-[#58A6FF] px-1.5 py-0.2 rounded border border-[#388BFD]/30 font-medium">
              Multi-LLM
            </span>
          </div>

          <button
            onClick={() => handleAction(() => setIsModelSelectorOpen(true))}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <ModelIcon type={selectedModel.iconType} size={14} />
              Switch Model ({selectedModel.name})
            </span>
            <ChevronRight size={12} className="text-[#8B949E]" />
          </button>

          <button
            onClick={() => handleAction(() => {
              setActiveActivity('ai');
              if (activeView !== 'editor') setActiveView('editor');
            })}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Sparkles size={14} className="text-[#58A6FF]" />
              Open DevPilotX Code Assistant
            </span>
            <span className="text-[10px] text-[#8B949E]">Ctrl+Shift+A</span>
          </button>

          <button
            onClick={() => handleAction(() => setActiveActivity('skills'))}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <BrainCircuit size={14} className="text-[#A371F7]" />
              Agent Skills Panel
            </span>
          </button>

          <button
            onClick={() => handleAction(() => setActiveActivity('tasks'))}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Wand2 size={14} className="text-[#A371F7]" />
              Open Multimodal Task Studio
            </span>
          </button>

          <button
            onClick={() => handleAction(() => setActiveActivity('settings'))}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Sliders size={14} className="text-[#A371F7]" />
              Settings & API Credentials
            </span>
            <span className="text-[10px] text-[#8B949E]">Ctrl+,</span>
          </button>

          <button
            onClick={() => handleAction(() => clearChatHistory())}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors text-[#8B949E]"
          >
            <span className="flex items-center gap-2.5">
              <Trash2 size={14} />
              Clear Code Chat History
            </span>
          </button>

          <button
            onClick={() => handleAction(() => clearTaskChatHistory())}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors text-[#8B949E]"
          >
            <span className="flex items-center gap-2.5">
              <Trash2 size={14} />
              Clear Task Studio History
            </span>
          </button>
        </div>

        {/* Footer / Help */}
        <div className="py-1">
          <button
            onClick={() => {
              setShowShortcutsModal(true);
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Keyboard size={14} className="text-[#8B949E]" />
              Keyboard Shortcuts
            </span>
          </button>

          <button
            onClick={() => {
              setShowAboutModal(true);
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] hover:text-white text-left transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Info size={14} className="text-[#8B949E]" />
              About DevPilotX IDE
            </span>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Keyboard size={16} className="text-[#58A6FF]" />
                Keyboard Shortcuts
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-[#8B949E] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#21262D]">
                <span className="text-[#C9D1D9]">New File</span>
                <kbd className="px-2 py-0.5 bg-[#21262D] border border-[#30363D] rounded text-[#8B949E] font-mono">Ctrl + N</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262D]">
                <span className="text-[#C9D1D9]">Toggle Explorer</span>
                <kbd className="px-2 py-0.5 bg-[#21262D] border border-[#30363D] rounded text-[#8B949E] font-mono">Ctrl + Shift + E</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262D]">
                <span className="text-[#C9D1D9]">Toggle Search</span>
                <kbd className="px-2 py-0.5 bg-[#21262D] border border-[#30363D] rounded text-[#8B949E] font-mono">Ctrl + Shift + F</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262D]">
                <span className="text-[#C9D1D9]">Toggle DevPilotX AI</span>
                <kbd className="px-2 py-0.5 bg-[#21262D] border border-[#30363D] rounded text-[#8B949E] font-mono">Ctrl + Shift + A</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262D]">
                <span className="text-[#C9D1D9]">Toggle Terminal Panel</span>
                <kbd className="px-2 py-0.5 bg-[#21262D] border border-[#30363D] rounded text-[#8B949E] font-mono">Ctrl + `</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262D]">
                <span className="text-[#C9D1D9]">Settings & API Keys</span>
                <kbd className="px-2 py-0.5 bg-[#21262D] border border-[#30363D] rounded text-[#8B949E] font-mono">Ctrl + ,</kbd>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#C9D1D9]">Close Active Tab</span>
                <kbd className="px-2 py-0.5 bg-[#21262D] border border-[#30363D] rounded text-[#8B949E] font-mono">Ctrl + W</kbd>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 rounded bg-[#21262D] hover:bg-[#30363D] text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About DevPilotX Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Info size={16} className="text-[#58A6FF]" />
                About DevPilotX IDE
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="text-[#8B949E] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#C9D1D9]">
              <div className="p-3 bg-[#0D1117] rounded-lg border border-[#30363D] space-y-1.5">
                <div className="font-bold text-white text-sm flex items-center gap-1.5">
                  DevPilotX Studio <span className="text-[10px] bg-[#1F6FEB]/30 text-[#58A6FF] px-1.5 py-0.5 rounded font-normal">v2.5.0</span>
                </div>
                <p className="text-[#8B949E] text-[11px]">
                  Next-generation cloud browser IDE powered by the DevPilotX multi-model engine, Monaco code editor, real terminal, and project dashboard.
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-white">Supported AI Ecosystem:</div>
                <ul className="list-disc list-inside text-[11px] text-[#8B949E] space-y-0.5">
                  <li>Google Gemini 3.7 Flash & 2.5 Pro</li>
                  <li>Anthropic Claude 3.7 Sonnet & 3.5 Haiku</li>
                  <li>OpenAI GPT-4o & o3-mini</li>
                  <li>DeepSeek R1 Reasoning (Free & Full)</li>
                  <li>Meta Llama 3.3 70B & Qwen 2.5 Coder 32B</li>
                  <li>Ollama Cloud & Custom Endpoints</li>
                  <li>Groq Fast LPU Inference</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-4 py-1.5 rounded bg-[#1F6FEB] hover:bg-[#388BFD] text-white text-xs font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { Menu, Play, Settings, CloudLightning, LayoutDashboard, Code, Sparkles, X, Wand2, BrainCircuit } from 'lucide-react';
import { useIDE } from '../context/IDEContext';
import { HamburgerMenu } from './HamburgerMenu';
import { MenuBar } from './MenuBar';
import { ModelIcon } from './ModelIcon';

export const TopBar = () => {
  const {
    activeView,
    setActiveView,
    toggleSidebar,
    togglePanel,
    createNewFile,
    selectedModel,
    setIsModelSelectorOpen,
    setActiveActivity,
    activeActivity,
  } = useIDE();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Optional Ctrl+M shortcut for the Mega Menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setIsMenuOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-10 border-b border-[#30363D] bg-[#161B22] flex items-center justify-between px-3 shrink-0 relative select-none">
      {/* Left Menu & Branding */}
      <div className="flex items-center gap-3">
        {/* Left Hamburger Toggle Button */}
        <button
          id="left-hamburger-button"
          onClick={() => toggleSidebar()}
          title={activeActivity ? "Hide Left Panel (Ctrl+B)" : "Expand Left Panel (Ctrl+B)"}
          aria-label={activeActivity ? "Hide Left Panel" : "Expand Left Panel"}
          aria-expanded={!!activeActivity}
          className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
            activeActivity
              ? 'text-[#58A6FF] bg-[#21262D] hover:bg-[#30363D]'
              : 'text-[#8B949E] hover:text-white hover:bg-[#21262D]'
          }`}
        >
          <Menu size={16} />
        </button>

        {/* Hamburger Dropdown Menu */}
        <HamburgerMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />

        <div className="flex items-center gap-1.5 font-semibold text-sm text-[#8B949E]">
          <CloudLightning size={16} className="text-[#58A6FF]" />
          <span className="text-white tracking-tight">DevPilotX</span>
        </div>

        {/* Interactive Desktop IDE Menu Bar */}
        <div className="hidden md:flex items-center ml-1">
          <MenuBar />
        </div>
      </div>

      {/* Right Controls: AI Quick Switch, View Switcher & Run */}
      <div className="flex items-center gap-2.5">
        {/* Model Quick Switcher Chip */}
        <button
          onClick={() => setIsModelSelectorOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0D1117] hover:bg-[#21262D] border border-[#30363D] text-[11px] text-[#C9D1D9] transition-all hover:border-[#58A6FF]/40"
          title={`Active AI: ${selectedModel.name} (${selectedModel.providerLabel})`}
        >
          <ModelIcon type={selectedModel.iconType} size={13} />
          <span className="font-medium max-w-[120px] truncate">{selectedModel.name}</span>
          <span className="text-[9px] text-[#58A6FF] font-semibold bg-[#1F6FEB]/15 px-1 py-0.2 rounded border border-[#388BFD]/30">
            DevPilotX
          </span>
        </button>

        {/* View Toggle */}
        <div className="flex bg-[#0D1117] border border-[#30363D] rounded overflow-hidden">
          <button 
            onClick={() => setActiveView('editor')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors ${
              activeView === 'editor' ? 'bg-[#21262D] text-white font-medium' : 'text-[#8B949E] hover:text-white hover:bg-[#161B22]'
            }`}
          >
            <Code size={12} />
            <span className="hidden sm:inline">Editor</span>
          </button>
          <button 
            onClick={() => setActiveView('studio')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors ${
              activeView === 'studio' ? 'bg-[#21262D] text-[#A371F7] font-medium' : 'text-[#8B949E] hover:text-white hover:bg-[#161B22]'
            }`}
          >
            <Wand2 size={12} className={activeView === 'studio' ? 'text-[#A371F7]' : ''} />
            <span className="hidden sm:inline">Task Studio</span>
          </button>
          <button 
            onClick={() => setActiveView('skills')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors ${
              activeView === 'skills' ? 'bg-[#21262D] text-[#A371F7] font-medium' : 'text-[#8B949E] hover:text-white hover:bg-[#161B22]'
            }`}
          >
            <BrainCircuit size={12} className={activeView === 'skills' ? 'text-[#A371F7]' : ''} />
            <span className="hidden sm:inline">Train & Skills</span>
          </button>
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors ${
              activeView === 'dashboard' ? 'bg-[#21262D] text-white font-medium' : 'text-[#8B949E] hover:text-white hover:bg-[#161B22]'
            }`}
          >
            <LayoutDashboard size={12} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        </div>

        {/* Run Project Button */}
        <button
          onClick={() => togglePanel('terminal')}
          className="flex items-center gap-1.5 bg-[#238636] hover:bg-[#2EA043] text-white text-xs px-2.5 py-1 rounded transition-colors font-medium shadow-sm"
        >
          <Play size={12} fill="currentColor" />
          <span className="hidden sm:inline">Run Project</span>
        </button>
      </div>
    </div>
  );
};

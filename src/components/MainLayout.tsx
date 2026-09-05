import React, { useEffect } from 'react';
import { TopBar } from './TopBar';
import { ActivityBar } from './ActivityBar';
import { Sidebar } from './Sidebar';
import { EditorArea } from './EditorArea';
import { Dashboard } from './Dashboard';
import { TaskStudio } from './TaskStudio';
import { AgentTrainingStudio } from './AgentTrainingStudio';
import { PanelArea } from './PanelArea';
import { StatusBar } from './StatusBar';
import { ModelSelectorModal } from './ModelSelectorModal';
import { useIDE } from '../context/IDEContext';

export const MainLayout = () => {
  const {
    activeActivity,
    lastActiveActivity,
    toggleSidebar,
    isPanelOpen,
    activeView,
    isModelSelectorOpen,
    setIsModelSelectorOpen,
  } = useIDE();

  // Global Ctrl+B shortcut to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const currentTab = activeActivity || lastActiveActivity || 'explorer';
  const isWideTab =
    currentTab === 'tasks' ||
    currentTab === 'ai' ||
    currentTab === 'skills' ||
    currentTab === 'extensions';
  const targetWidthClass = isWideTab ? 'w-80' : 'w-72';

  return (
    <div className="flex flex-col h-screen w-full bg-[#0D1117] text-[#C9D1D9] font-sans overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />
        {/* Left Panel Container with smooth animated hiding and expanding */}
        <div
          id="left-panel-container"
          aria-hidden={!activeActivity}
          className={`shrink-0 overflow-hidden flex flex-col h-full transition-all duration-200 ease-in-out ${
            activeActivity
              ? `${targetWidthClass} opacity-100 border-r border-[#30363D]`
              : 'w-0 opacity-0 pointer-events-none border-none'
          }`}
        >
          <div className={`${targetWidthClass} flex flex-col h-full shrink-0`}>
            <Sidebar />
          </div>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          {activeView === 'dashboard' ? (
            <Dashboard />
          ) : activeView === 'studio' ? (
            <TaskStudio mode="fullscreen" />
          ) : activeView === 'skills' ? (
            <AgentTrainingStudio />
          ) : (
            <EditorArea />
          )}
          {isPanelOpen && activeView === 'editor' && <PanelArea />}
        </div>
      </div>
      <StatusBar />
      <ModelSelectorModal
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
      />
    </div>
  );
};


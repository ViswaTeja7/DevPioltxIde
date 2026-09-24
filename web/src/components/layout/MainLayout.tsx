import React, { useEffect } from 'react';
import { TopBar } from './TopBar';
import { ActivityBar } from './ActivityBar';
import { Sidebar } from './Sidebar';
import { EditorArea } from '../editor/EditorArea';
import { Dashboard } from '../panels/Dashboard';
import { TaskStudio } from '../ai/TaskStudio';
import { AgentTrainingStudio } from '../ai/AgentTrainingStudio';
import { PanelArea } from './PanelArea';
import { StatusBar } from './StatusBar';
import { ErrorToast } from '../common/ErrorToast';
import { ModelSelectorModal } from '../ai/ModelSelectorModal';
import { useIDE } from '../../context/IDEContext';

export const MainLayout = () => {
  const {
    activeActivity,
    lastActiveActivity,
    toggleSidebar,
    togglePanel,
    isPanelOpen,
    activeView,
    isModelSelectorOpen,
    setIsModelSelectorOpen,
  } = useIDE();

  // Global shortcuts: Ctrl+B toggles the sidebar, Ctrl+` toggles the bottom panel
  // (VS Code convention).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleSidebar();
      } else if (e.code === 'Backquote' && !e.shiftKey) {
        e.preventDefault();
        togglePanel('terminal');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, togglePanel]);

  const currentTab = activeActivity || lastActiveActivity || 'explorer';
  const isWideTab =
    currentTab === 'tasks' ||
    currentTab === 'ai' ||
    currentTab === 'skills' ||
    currentTab === 'extensions';
  const targetWidthClass = isWideTab ? 'w-[389px]' : 'w-[325px]';

  return (
    <div className="flex flex-col h-screen w-full bg-[#0D1117] text-[#C9D1D9] font-sans overflow-hidden">
      <a href="#ide-main-content" className="skip-link">
        Skip to editor
      </a>
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
        <div className="flex flex-col flex-1 min-w-0" id="ide-main-content" tabIndex={-1}>
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
      <ErrorToast />
    </div>
  );
};

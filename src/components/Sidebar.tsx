import React from 'react';
import { useIDE } from '../context/IDEContext';
import { RepoTree } from './RepoTree';
import { SearchPanel } from './SearchPanel';
import { SourceControlPanel } from './SourceControlPanel';
import { DebugPanel } from './DebugPanel';
import { ExtensionsPanel } from './ExtensionsPanel';
import { AIAssistant } from './AIAssistant';
import { SettingsPanel } from './SettingsPanel';
import { TaskStudio } from './TaskStudio';
import { SkillsSidebarPanel } from './SkillsSidebarPanel';

export const Sidebar = () => {
  const { activeActivity, lastActiveActivity } = useIDE();
  const currentTab = activeActivity || lastActiveActivity || 'explorer';

  return (
    <div className="w-full h-full bg-[#161B22] flex flex-col shrink-0 overflow-hidden">
      {currentTab === 'explorer' && <RepoTree />}
      {currentTab === 'search' && <SearchPanel />}
      {currentTab === 'git' && <SourceControlPanel />}
      {currentTab === 'debug' && <DebugPanel />}
      {currentTab === 'extensions' && <ExtensionsPanel />}
      {currentTab === 'ai' && <AIAssistant />}
      {currentTab === 'skills' && <SkillsSidebarPanel />}
      {currentTab === 'tasks' && <TaskStudio mode="sidebar" />}
      {currentTab === 'settings' && <SettingsPanel />}
    </div>
  );
};

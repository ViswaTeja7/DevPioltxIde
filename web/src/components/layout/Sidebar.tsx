import React from 'react';
import { useIDE } from '../../context/IDEContext';
import { RepoTree } from '../panels/RepoTree';
import { SearchPanel } from '../panels/SearchPanel';
import { SourceControlPanel } from '../panels/SourceControlPanel';
import { DebugPanel } from '../panels/DebugPanel';
import { ExtensionsPanel } from '../panels/ExtensionsPanel';
import { AIAssistant } from '../ai/AIAssistant';
import { SettingsPanel } from '../panels/SettingsPanel';
import { TaskStudio } from '../ai/TaskStudio';
import { SkillsSidebarPanel } from '../panels/SkillsSidebarPanel';

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

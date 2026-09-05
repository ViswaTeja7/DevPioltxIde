import React from 'react';
import { Files, Search, GitBranch, Bug, Blocks, Sparkles, Settings, User, Wand2, BrainCircuit } from 'lucide-react';
import { useIDE } from '../context/IDEContext';
import { ActivityTab } from '../types';

export const ActivityBar = () => {
  const { activeActivity, setActiveActivity, activeView, setActiveView } = useIDE();

  const activities = [
    { id: 'explorer', icon: Files, title: 'Explorer (Ctrl+Shift+E)' },
    { id: 'search', icon: Search, title: 'Search & Replace (Ctrl+Shift+F)' },
    { id: 'git', icon: GitBranch, title: 'Source Control (Ctrl+Shift+G)' },
    { id: 'debug', icon: Bug, title: 'Run and Debug (Ctrl+Shift+D)' },
    { id: 'extensions', icon: Blocks, title: 'Extensions (Ctrl+Shift+X)' },
    { id: 'ai', icon: Sparkles, title: 'Copilot Code Assistant (Ctrl+Shift+A)' },
    { id: 'skills', icon: BrainCircuit, title: 'Train Agent & Claude Skills' },
    { id: 'tasks', icon: Wand2, title: 'Multimodal Task Studio (Images, Research, Docs)' },
  ] as const;

  const handleActivitySelect = (id: ActivityTab) => {
    if (activeActivity === id) {
      // Toggle sidebar off if clicking the already open tab
      setActiveActivity(null);
    } else {
      setActiveActivity(id);
      // If currently on dashboard, switch to editor so user sees files/assistant with code
      if (activeView === 'dashboard') {
        setActiveView('editor');
      }
    }
  };

  return (
    <div className="w-12 bg-[#0D1117] border-r border-[#30363D] flex flex-col items-center justify-between py-2 shrink-0 select-none">
      <div className="flex flex-col gap-3 w-full">
        {activities.map((act) => {
          const isActive = activeActivity === act.id;
          return (
            <button
              key={act.id}
              onClick={() => handleActivitySelect(act.id as ActivityTab)}
              title={act.title}
              className={`w-full flex justify-center py-2 relative transition-colors ${
                isActive ? 'text-white' : 'text-[#8B949E] hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#F78166]" />
              )}
              <act.icon
                size={22}
                strokeWidth={1.75}
                className={
                  act.id === 'ai' && isActive
                    ? 'text-[#58A6FF]'
                    : act.id === 'skills' && isActive
                    ? 'text-[#A371F7]'
                    : act.id === 'tasks' && isActive
                    ? 'text-[#A371F7]'
                    : ''
                }
              />
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-3 w-full">
        <button 
          onClick={() => handleActivitySelect('settings')}
          title="Account Profile" 
          className="w-full flex justify-center py-2 text-[#8B949E] hover:text-white transition-colors"
        >
          <User size={22} strokeWidth={1.75} />
        </button>
        <button 
          onClick={() => handleActivitySelect('settings')}
          title="Settings (Ctrl+,)"
          className={`w-full flex justify-center py-2 relative transition-colors ${activeActivity === 'settings' ? 'text-white' : 'text-[#8B949E] hover:text-white'}`}
        >
          {activeActivity === 'settings' && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#F78166]" />
          )}
          <Settings size={22} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
};

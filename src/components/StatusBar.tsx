import React from 'react';
import { GitBranch, XCircle, AlertTriangle, RadioTower, Bell, Sparkles } from 'lucide-react';
import { useIDE } from '../context/IDEContext';
import { ModelIcon } from './ModelIcon';

export const StatusBar = () => {
  const { activeFileId, openFiles, selectedModel, setIsModelSelectorOpen } = useIDE();
  const activeFile = openFiles.find(f => f.id === activeFileId);

  return (
    <div className="h-6 bg-[#21262D] border-t border-[#30363D] text-[#8B949E] flex items-center justify-between px-3 text-[10px] shrink-0 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors text-[#58A6FF]">
          <GitBranch size={12} />
          <span>feature/copilot-models</span>
        </div>
        <div className="flex items-center gap-2 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <div className="flex items-center gap-1"><XCircle size={12} /> 0</div>
          <div className="flex items-center gap-1"><AlertTriangle size={12} /> 0</div>
        </div>
        <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <RadioTower size={12} />
          <span>Port: 3000</span>
        </div>

        {/* Copilot Active Model status bar button */}
        <button
          onClick={() => setIsModelSelectorOpen(true)}
          className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-colors text-[#C9D1D9] hover:text-white"
          title="Click to switch Copilot AI model"
        >
          <ModelIcon type={selectedModel.iconType} size={11} className="p-0.5" />
          <span className="font-semibold text-[#58A6FF]">Copilot:</span>
          <span>{selectedModel.name}</span>
        </button>
      </div>

      <div className="flex items-center gap-3 uppercase font-bold tracking-tighter">
        {activeFile && (
          <>
            <div className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
              Ln 1, Col 1
            </div>
            <div className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
              UTF-8
            </div>
            <div className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
              {activeFile.language === 'typescript' ? 'TypeScript React' : activeFile.language || 'Plain Text'}
            </div>
          </>
        )}
        <div className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 text-[#2EA043]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2EA043]"></span>
          Ready
        </div>
        <div className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <Bell size={12} />
        </div>
      </div>
    </div>
  );
};


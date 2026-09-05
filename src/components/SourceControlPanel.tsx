import React, { useState } from 'react';
import { useIDE } from '../context/IDEContext';
import { 
  GitBranch, 
  GitCommit, 
  Check, 
  RefreshCw, 
  Plus, 
  Minus, 
  FileCode, 
  FileText, 
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface ChangedFile {
  id: string;
  name: string;
  path: string;
  status: 'M' | 'A' | 'D';
  staged: boolean;
}

export const SourceControlPanel = () => {
  const { openFiles, openFile, addChatMessage, selectedModel } = useIDE();
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [committedNotice, setCommittedNotice] = useState<string | null>(null);
  
  // Track mock changes
  const [changedFiles, setChangedFiles] = useState<ChangedFile[]>([
    { id: 'change-1', name: 'App.tsx', path: '/src/App.tsx', status: 'M', staged: true },
    { id: 'change-2', name: 'types.ts', path: '/src/types.ts', status: 'M', staged: false },
    { id: 'change-3', name: 'SkillsSidebarPanel.tsx', path: '/src/components/SkillsSidebarPanel.tsx', status: 'A', staged: false }
  ]);

  const stagedFiles = changedFiles.filter(f => f.staged);
  const unstagedFiles = changedFiles.filter(f => !f.staged);

  const toggleStageFile = (fileId: string) => {
    setChangedFiles(prev => prev.map(f => f.id === fileId ? { ...f, staged: !f.staged } : f));
  };

  const stageAll = () => {
    setChangedFiles(prev => prev.map(f => ({ ...f, staged: true })));
  };

  const unstageAll = () => {
    setChangedFiles(prev => prev.map(f => ({ ...f, staged: false })));
  };

  const handleCommit = () => {
    if (!commitMessage.trim() || stagedFiles.length === 0) return;
    setIsCommitting(true);
    setTimeout(() => {
      setIsCommitting(false);
      setCommittedNotice(`Committed ${stagedFiles.length} file(s) to main: "${commitMessage}"`);
      setChangedFiles(prev => prev.filter(f => !f.staged));
      setCommitMessage('');
      setTimeout(() => setCommittedNotice(null), 4000);
    }, 600);
  };

  const generateCommitMessageWithAI = () => {
    const changesSummary = stagedFiles.length > 0 ? stagedFiles.map(f => f.name).join(', ') : 'all recent changes';
    setCommitMessage(`feat: update architecture and add Claude skills support in ${changesSummary}`);
  };

  return (
    <div className="flex flex-col h-full bg-[#161B22] text-[#C9D1D9] text-xs select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#30363D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-[#58A6FF]" />
          <span className="font-semibold text-white">Source Control</span>
          <span className="text-[10px] bg-[#21262D] text-[#8B949E] px-1.5 py-0.2 rounded border border-[#30363D]">
            main
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {}}
            className="p-1 rounded text-[#8B949E] hover:text-white hover:bg-[#21262D]"
            title="Refresh"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Commit Input Area */}
      <div className="p-3 border-b border-[#30363D] space-y-2">
        <div className="relative">
          <textarea
            placeholder="Message (Ctrl+Enter to commit)"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            rows={2}
            className="w-full bg-[#0D1117] text-xs text-white p-2 border border-[#30363D] focus:border-[#58A6FF] rounded outline-none resize-none placeholder-[#8B949E]"
          />
          <button
            onClick={generateCommitMessageWithAI}
            className="absolute bottom-2 right-2 text-[10px] text-[#A371F7] hover:text-white flex items-center gap-1 bg-[#21262D]/90 px-1.5 py-0.5 rounded border border-[#A371F7]/30 hover:bg-[#A371F7]/20"
            title="Generate AI Commit Message"
          >
            <Sparkles size={11} />
            <span>AI Gen</span>
          </button>
        </div>

        <button
          onClick={handleCommit}
          disabled={!commitMessage.trim() || stagedFiles.length === 0 || isCommitting}
          className="w-full py-1.5 px-3 bg-[#238636] hover:bg-[#2EA043] disabled:opacity-40 disabled:hover:bg-[#238636] text-white font-semibold rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <GitCommit size={14} />
          <span>{isCommitting ? 'Committing...' : `Commit to main (${stagedFiles.length})`}</span>
        </button>

        {committedNotice && (
          <div className="text-[11px] text-[#3FB950] flex items-center gap-1">
            <CheckCircle2 size={13} />
            <span>{committedNotice}</span>
          </div>
        )}
      </div>

      {/* Changes List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#21262D]">
        {/* Staged Changes */}
        <div className="py-2">
          <div className="px-3 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">
            <span>Staged Changes ({stagedFiles.length})</span>
            {stagedFiles.length > 0 && (
              <button 
                onClick={unstageAll}
                className="hover:text-white flex items-center gap-0.5 lowercase font-normal text-[10px]"
              >
                <Minus size={11} /> unstage all
              </button>
            )}
          </div>
          {stagedFiles.length === 0 ? (
            <div className="px-3 py-1.5 text-[11px] text-[#8B949E] italic">No staged changes</div>
          ) : (
            stagedFiles.map((file) => (
              <div
                key={file.id}
                className="px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileCode size={13} className="text-[#41b883] shrink-0" />
                  <span className="text-white text-xs truncate">{file.name}</span>
                  <span className="text-[10px] text-[#8B949E] truncate">{file.path}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] font-bold px-1 rounded ${file.status === 'A' ? 'text-[#3FB950] bg-[#238636]/20' : 'text-[#D29922] bg-[#D29922]/20'}`}>
                    {file.status}
                  </span>
                  <button
                    onClick={() => toggleStageFile(file.id)}
                    className="p-1 rounded text-[#8B949E] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Unstage file"
                  >
                    <Minus size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Unstaged Changes */}
        <div className="py-2">
          <div className="px-3 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">
            <span>Changes ({unstagedFiles.length})</span>
            {unstagedFiles.length > 0 && (
              <button 
                onClick={stageAll}
                className="hover:text-white flex items-center gap-0.5 lowercase font-normal text-[10px]"
              >
                <Plus size={11} /> stage all
              </button>
            )}
          </div>
          {unstagedFiles.length === 0 ? (
            <div className="px-3 py-1.5 text-[11px] text-[#8B949E] italic">Working tree clean</div>
          ) : (
            unstagedFiles.map((file) => (
              <div
                key={file.id}
                className="px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileCode size={13} className="text-[#58A6FF] shrink-0" />
                  <span className="text-white text-xs truncate">{file.name}</span>
                  <span className="text-[10px] text-[#8B949E] truncate">{file.path}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] font-bold px-1 rounded ${file.status === 'A' ? 'text-[#3FB950] bg-[#238636]/20' : 'text-[#D29922] bg-[#D29922]/20'}`}>
                    {file.status}
                  </span>
                  <button
                    onClick={() => toggleStageFile(file.id)}
                    className="p-1 rounded text-[#8B949E] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Stage file"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

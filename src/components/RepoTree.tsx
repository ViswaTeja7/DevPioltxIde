import React, { useState } from 'react';
import { useIDE } from '../context/IDEContext';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FileJson, 
  FileCode, 
  FileText, 
  FilePlus, 
  FolderPlus, 
  RefreshCw, 
  FolderGit2,
  Minimize2,
  Check
} from 'lucide-react';
import { FileNode } from '../types';

export const RepoTree = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const { fileTree, createNewFile, setActiveView } = useIDE();
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleCreateNewFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    createNewFile(newFileName.trim());
    setNewFileName('');
    setIsCreatingFile(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#161B22] text-[#C9D1D9]">
      {!hideHeader && (
        <div className="p-3 border-b border-[#30363D] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FolderGit2 size={14} className="text-[#58A6FF]" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-white">
              Explorer
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCreatingFile(true)}
              className="p-1 rounded text-[#8B949E] hover:text-white hover:bg-[#21262D]"
              title="New File (Ctrl+N)"
            >
              <FilePlus size={13} />
            </button>
            <button
              onClick={() => setActiveView('editor')}
              className="p-1 rounded text-[#8B949E] hover:text-white hover:bg-[#21262D]"
              title="Refresh Explorer"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Inline New File Form */}
      {isCreatingFile && (
        <form onSubmit={handleCreateNewFile} className="p-2 border-b border-[#30363D] bg-[#0D1117]">
          <div className="flex items-center gap-1">
            <input
              type="text"
              autoFocus
              placeholder="filename.tsx"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="flex-1 bg-[#161B22] text-xs p-1 border border-[#58A6FF] rounded outline-none text-white font-mono"
            />
            <button
              type="submit"
              className="p-1 bg-[#1F6FEB] text-white rounded hover:bg-[#388BFD]"
              title="Create"
            >
              <Check size={12} />
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFile(false)}
              className="p-1 text-[#8B949E] hover:text-white"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        </form>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto py-1 text-xs select-none">
        {fileTree.map((node) => (
          <FileTreeNode key={node.id} node={node} level={0} />
        ))}
      </div>
    </div>
  );
};

const FileTreeNode: React.FC<{ node: FileNode; level: number }> = ({ node, level }) => {
  const { openFile, activeFileId } = useIDE();
  const [isOpen, setIsOpen] = useState(true);

  const isFolder = node.type === 'folder';
  const isActive = activeFileId === node.id;

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      openFile(node);
    }
  };

  const getFileIcon = () => {
    if (isFolder) {
      return isOpen ? <ChevronDown size={14} className="mr-1 opacity-80" /> : <ChevronRight size={14} className="mr-1 opacity-80" />;
    }
    
    if (node.name.endsWith('.ts') || node.name.endsWith('.tsx')) {
      return <FileCode size={14} className="mr-2 text-[#41b883]" />;
    }
    if (node.name.endsWith('.json')) {
      return <FileJson size={14} className="mr-2 text-[#f1e05a]" />;
    }
    if (node.name.endsWith('Dockerfile')) {
      return <File size={14} className="mr-2 text-[#58A6FF]" />;
    }
    return <FileText size={14} className="mr-2 text-[#8B949E]" />;
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 cursor-pointer hover:bg-[#21262D] select-none ${isActive ? 'bg-[#21262D] border-l-2 border-[#58A6FF] text-[#58A6FF]' : 'text-[#8B949E] border-l-2 border-transparent'}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {getFileIcon()}
        {isFolder && !isOpen && <Folder size={14} className="mr-2 text-[#8B949E]" />}
        {isFolder && isOpen && <Folder size={14} className="mr-2 text-[#8B949E]" />}
        <span className="truncate">{node.name}</span>
      </div>
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

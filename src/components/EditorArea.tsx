import React from 'react';
import { useIDE } from '../context/IDEContext';
import { X, FileCode, FileJson, File, FileText } from 'lucide-react';
import Editor, { useMonaco } from '@monaco-editor/react';

export const EditorArea = () => {
  const { openFiles, activeFileId, setActiveFileId, closeFile, updateFileContent } = useIDE();

  const activeFile = openFiles.find(f => f.id === activeFileId);

  const getFileIcon = (name: string) => {
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return <FileCode size={14} className="text-[#58A6FF]" />;
    if (name.endsWith('.json')) return <FileJson size={14} className="text-[#D2A8FF]" />;
    if (name.endsWith('Dockerfile')) return <File size={14} className="text-[#58A6FF]" />;
    return <FileText size={14} className="text-[#8B949E]" />;
  };

  const getLanguage = (name: string) => {
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'typescript';
    if (name.endsWith('.js') || name.endsWith('.jsx')) return 'javascript';
    if (name.endsWith('.json')) return 'json';
    if (name.endsWith('.css')) return 'css';
    if (name.endsWith('.html')) return 'html';
    if (name.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme('devpilot-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0D1117',
        'editor.lineHighlightBackground': '#161B22',
        'editorLineNumber.foreground': '#484F58',
        'editorIndentGuide.background': '#30363D',
        'editorSuggestWidget.background': '#161B22',
        'editorSuggestWidget.border': '#30363D',
        'editorWidget.background': '#161B22',
        'editorWidget.border': '#30363D',
      }
    });
  };

  return (
    <div className="flex flex-col flex-1 bg-[#0D1117] min-h-0 min-w-0">
      {openFiles.length > 0 ? (
        <>
          <div className="flex bg-[#161B22] border-b border-[#30363D] h-9 overflow-x-auto shrink-0 scrollbar-hide">
            {openFiles.map(file => {
              const isActive = file.id === activeFileId;
              return (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`flex items-center gap-2 px-4 cursor-pointer group min-w-[120px] max-w-[200px] select-none border-r border-[#30363D] ${isActive ? 'bg-[#0D1117] border-t-2 border-t-[#F78166] text-[#C9D1D9]' : 'bg-[#161B22] border-t-2 border-t-transparent text-[#8B949E]'}`}
                >
                  {getFileIcon(file.name)}
                  <span className="text-sm truncate flex-1">{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeFile(file.id);
                    }}
                    className={`p-0.5 rounded hover:text-white ${isActive ? 'opacity-100 text-[#8B949E]' : 'opacity-0 group-hover:opacity-100 text-[#8B949E]'}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex-1 overflow-hidden flex relative relative border-t border-[#0D1117]">
            {activeFile && (
              <Editor
                height="100%"
                width="100%"
                language={getLanguage(activeFile.name)}
                value={activeFile.content || ''}
                theme="devpilot-dark"
                beforeMount={handleEditorWillMount}
                onChange={(value) => {
                  if (activeFile && value !== undefined) {
                    updateFileContent(activeFile.id, value);
                  }
                }}
                options={{
                  minimap: { enabled: true },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace",
                  wordWrap: 'on',
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  renderLineHighlight: 'all',
                }}
              />
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-[#8B949E]">
          <div className="text-6xl mb-6 font-bold tracking-widest text-[#161B22]">DevPilotX</div>
          <div className="flex gap-8 text-sm">
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-[#C9D1D9]">Start</span>
              <span className="hover:text-[#58A6FF] cursor-pointer">New File</span>
              <span className="hover:text-[#58A6FF] cursor-pointer">Open Folder</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-[#C9D1D9]">Recent</span>
              <span className="hover:text-[#58A6FF] cursor-pointer">devpilot-x</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

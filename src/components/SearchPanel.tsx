import React, { useState, useMemo } from 'react';
import { useIDE } from '../context/IDEContext';
import { 
  Search, 
  Replace, 
  ChevronRight, 
  ChevronDown, 
  CaseSensitive, 
  WholeWord, 
  Regex, 
  FileCode, 
  FileText, 
  Check, 
  RefreshCw,
  X
} from 'lucide-react';
import { FileNode } from '../types';

export const SearchPanel = () => {
  const { fileTree, openFile, updateFileContent } = useIDE();
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [replacedNotice, setReplacedNotice] = useState<string | null>(null);

  // Flatten all files from fileTree
  const allFiles = useMemo(() => {
    const list: FileNode[] = [];
    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file') {
          list.push(node);
        } else if (node.children) {
          traverse(node.children);
        }
      }
    };
    traverse(fileTree);
    return list;
  }, [fileTree]);

  // Perform search across all file contents and names
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    interface MatchLine {
      lineNumber: number;
      lineContent: string;
      startIndex: number;
    }

    interface FileSearchResult {
      file: FileNode;
      matches: MatchLine[];
    }

    const results: FileSearchResult[] = [];

    allFiles.forEach((file) => {
      const content = file.content || '';
      const lines = content.split('\n');
      const fileMatches: MatchLine[] = [];

      lines.forEach((line, lineIdx) => {
        let matched = false;
        let startIndex = -1;

        if (useRegex) {
          try {
            const regex = new RegExp(searchQuery, matchCase ? 'g' : 'gi');
            const match = regex.exec(line);
            if (match) {
              matched = true;
              startIndex = match.index;
            }
          } catch (e) {
            // Invalid regex, ignore
          }
        } else if (matchWholeWord) {
          const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escaped}\\b`, matchCase ? '' : 'i');
          const match = regex.exec(line);
          if (match) {
            matched = true;
            startIndex = match.index;
          }
        } else {
          const searchIn = matchCase ? line : line.toLowerCase();
          const target = matchCase ? searchQuery : searchQuery.toLowerCase();
          startIndex = searchIn.indexOf(target);
          if (startIndex !== -1) {
            matched = true;
          }
        }

        if (matched) {
          fileMatches.push({
            lineNumber: lineIdx + 1,
            lineContent: line.trim(),
            startIndex
          });
        }
      });

      if (fileMatches.length > 0) {
        results.push({
          file,
          matches: fileMatches
        });
      }
    });

    return results;
  }, [allFiles, searchQuery, matchCase, matchWholeWord, useRegex]);

  const totalMatches = searchResults.reduce((sum, res) => sum + res.matches.length, 0);

  const toggleFileExpanded = (fileId: string) => {
    setExpandedFiles(prev => ({
      ...prev,
      [fileId]: prev[fileId] === undefined ? false : !prev[fileId]
    }));
  };

  const handleOpenFileAtLine = (file: FileNode) => {
    openFile(file);
  };

  const handleReplaceAll = () => {
    if (!searchQuery.trim() || searchResults.length === 0) return;

    let count = 0;
    searchResults.forEach(({ file }) => {
      const content = file.content || '';
      let newContent = content;

      if (useRegex) {
        try {
          const regex = new RegExp(searchQuery, matchCase ? 'g' : 'gi');
          newContent = content.replace(regex, replaceQuery);
        } catch (e) {
          return;
        }
      } else {
        const flags = matchCase ? 'g' : 'gi';
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(matchWholeWord ? `\\b${escaped}\\b` : escaped, flags);
        newContent = content.replace(regex, replaceQuery);
      }

      if (newContent !== content) {
        updateFileContent(file.id, newContent);
        count++;
      }
    });

    setReplacedNotice(`Replaced in ${count} file${count === 1 ? '' : 's'}`);
    setTimeout(() => setReplacedNotice(null), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-[#161B22] text-[#C9D1D9] text-xs select-none">
      {/* Search Header */}
      <div className="p-3 border-b border-[#30363D]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">
            Search & Replace
          </span>
          <button
            onClick={() => setShowReplace(!showReplace)}
            className={`p-1 rounded text-xs flex items-center gap-1 transition-colors ${
              showReplace ? 'text-[#58A6FF] bg-[#1F6FEB]/15' : 'text-[#8B949E] hover:text-white'
            }`}
            title="Toggle Replace"
          >
            <Replace size={13} />
            <span className="text-[10px]">Replace</span>
          </button>
        </div>

        {/* Search Input Box */}
        <div className="space-y-1.5">
          <div className="relative flex items-center bg-[#0D1117] border border-[#30363D] focus-within:border-[#58A6FF] rounded px-2 py-1">
            <Search size={13} className="text-[#8B949E] mr-1.5 shrink-0" />
            <input
              type="text"
              placeholder="Search in project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-[#8B949E] outline-none w-full"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[#8B949E] hover:text-white p-0.5"
              >
                <X size={12} />
              </button>
            )}
            {/* Filter buttons */}
            <div className="flex items-center gap-0.5 ml-1 border-l border-[#30363D] pl-1 shrink-0">
              <button
                onClick={() => setMatchCase(!matchCase)}
                className={`p-0.5 rounded text-[10px] ${matchCase ? 'bg-[#1F6FEB] text-white' : 'text-[#8B949E] hover:text-white'}`}
                title="Match Case"
              >
                <CaseSensitive size={12} />
              </button>
              <button
                onClick={() => setMatchWholeWord(!matchWholeWord)}
                className={`p-0.5 rounded text-[10px] ${matchWholeWord ? 'bg-[#1F6FEB] text-white' : 'text-[#8B949E] hover:text-white'}`}
                title="Match Whole Word"
              >
                <WholeWord size={12} />
              </button>
              <button
                onClick={() => setUseRegex(!useRegex)}
                className={`p-0.5 rounded text-[10px] ${useRegex ? 'bg-[#1F6FEB] text-white' : 'text-[#8B949E] hover:text-white'}`}
                title="Use Regular Expression"
              >
                <Regex size={12} />
              </button>
            </div>
          </div>

          {/* Replace Input Box (if active) */}
          {showReplace && (
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1 flex items-center bg-[#0D1117] border border-[#30363D] focus-within:border-[#58A6FF] rounded px-2 py-1">
                <Replace size={13} className="text-[#8B949E] mr-1.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder-[#8B949E] outline-none w-full"
                />
              </div>
              <button
                onClick={handleReplaceAll}
                disabled={!searchQuery.trim() || searchResults.length === 0}
                className="px-2 py-1 bg-[#21262D] hover:bg-[#30363D] disabled:opacity-40 text-[#C9D1D9] hover:text-white rounded text-[11px] font-medium transition-colors shrink-0"
                title="Replace all occurrences"
              >
                All
              </button>
            </div>
          )}

          {replacedNotice && (
            <div className="text-[11px] text-[#3FB950] flex items-center gap-1 pt-0.5">
              <Check size={12} />
              <span>{replacedNotice}</span>
            </div>
          )}
        </div>

        {/* Results summary */}
        {searchQuery.trim() && (
          <div className="mt-2 text-[11px] text-[#8B949E] flex items-center justify-between">
            <span>
              {totalMatches} result{totalMatches === 1 ? '' : 's'} in {searchResults.length} file{searchResults.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      {/* Results Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {!searchQuery.trim() ? (
          <div className="p-4 text-center text-[#8B949E]">
            <Search size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">Type a query to search across all project files.</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-4 text-center text-[#8B949E]">
            <p className="text-xs">No matching results found for "{searchQuery}".</p>
          </div>
        ) : (
          searchResults.map(({ file, matches }) => {
            const isExpanded = expandedFiles[file.id] !== false; // expanded by default
            return (
              <div key={file.id} className="border-b border-[#21262D]/60 last:border-0">
                {/* File Header Row */}
                <div
                  onClick={() => toggleFileExpanded(file.id)}
                  className="px-3 py-1.5 flex items-center justify-between hover:bg-[#21262D] cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isExpanded ? (
                      <ChevronDown size={13} className="text-[#8B949E] shrink-0" />
                    ) : (
                      <ChevronRight size={13} className="text-[#8B949E] shrink-0" />
                    )}
                    {file.name.endsWith('.tsx') || file.name.endsWith('.ts') ? (
                      <FileCode size={13} className="text-[#41b883] shrink-0" />
                    ) : (
                      <FileText size={13} className="text-[#8B949E] shrink-0" />
                    )}
                    <span className="font-semibold text-white truncate text-xs">{file.name}</span>
                    <span className="text-[10px] text-[#8B949E] truncate hidden group-hover:inline">
                      {file.path}
                    </span>
                  </div>
                  <span className="text-[10px] bg-[#21262D] text-[#8B949E] px-1.5 py-0.2 rounded-full shrink-0">
                    {matches.length}
                  </span>
                </div>

                {/* Match Lines */}
                {isExpanded && (
                  <div className="bg-[#0D1117]/50 divide-y divide-[#21262D]/40">
                    {matches.map((m, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleOpenFileAtLine(file)}
                        className="pl-7 pr-3 py-1 hover:bg-[#21262D] cursor-pointer flex items-center justify-between font-mono text-[11px] text-[#C9D1D9] group transition-colors"
                        title={`Line ${m.lineNumber}: ${m.lineContent}`}
                      >
                        <span className="truncate pr-2">
                          <span className="text-[#58A6FF] mr-2">:{m.lineNumber}</span>
                          <span className="text-[#8B949E] group-hover:text-white">
                            {m.lineContent}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

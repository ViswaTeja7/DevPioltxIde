import React, { useState, useRef, useEffect } from 'react';
import { useIDE } from '../context/IDEContext';
import { Send, Settings, Copy, Check, BrainCircuit, GraduationCap } from 'lucide-react';
import { ModelSelectorDropdown } from './ModelSelectorDropdown';
import { ModelIcon } from './ModelIcon';
import { getModelById, DEFAULT_MODEL_ID } from '../constants/models';
import { AgentModeSelector } from './AgentModeSelector';

// Self-learning used to require a human clicking "save to training", so almost nothing was
// ever learned. These patterns spot the moments worth remembering on their own: the user
// pushing back on an answer, and actions the agent attempted that failed.
const CORRECTION_PATTERNS: RegExp[] = [
  /\bno,?\s+(that|it|this|thats)\b/i,
  /\bthat'?s?\s+(not|wrong|incorrect|broke)\b/i,
  /\bwrong\b/i,
  /\bincorrect\b/i,
  /\bactually\b/i,
  /\binstead\b/i,
  /\bdon'?t\s+(do|use|that)\b/i,
  /\brevert\b/i,
  /\bundo\b/i,
  /\bnot what i\b/i,
  /\bstill\s+(broken|failing|not)\b/i,
  /\bthat (failed|didn'?t work|did not work)\b/i,
  /\btry again\b/i
];

function looksLikeCorrection(text: string): boolean {
  const trimmed = text.trim();
  // Long messages are new requests rather than pushback on the last answer.
  if (trimmed.length > 400) return false;
  return CORRECTION_PATTERNS.some(pattern => pattern.test(trimmed));
}

export const AIAssistant = () => {
  const { 
    chatHistory, 
    addChatMessage, 
    llmConfig, 
    selectedModel, 
    selectModel, 
    setActiveActivity, 
    setIsModelSelectorOpen,
    skills,
    trainingProfile,
    trainingExamples,
    knowledgeDocs,
    addTrainingExample,
    setActiveView,
    agentMode,
    fileTree,
    updateFileContent,
    createNewFile,
    deleteFile
  } = useIDE();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedTrainingId, setSavedTrainingId] = useState<string | null>(null);
  // Commands the agent proposed but the server refused to run without a human saying yes.
  const [approvals, setApprovals] = useState<Array<{ command: string; output?: string; running?: boolean }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const runApproved = async (index: number) => {
    const entry = approvals[index];
    if (!entry || entry.running) return;
    setApprovals(prev => prev.map((a, i) => (i === index ? { ...a, running: true } : a)));
    try {
      const response = await fetch('/api/agent/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: entry.command })
      });
      const data = await response.json();
      const output = data?.ok ? (data.output || '(no output)') : (data?.error || data?.output || 'Command failed.');
      setApprovals(prev => prev.map((a, i) => (i === index ? { ...a, output, running: false } : a)));
    } catch (error: any) {
      setApprovals(prev =>
        prev.map((a, i) => (i === index ? { ...a, output: error?.message || 'Failed to run.', running: false } : a))
      );
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  // Auto-capture moments worth remembering without a human clicking "save to training":
  // (1) the user pushing back on an answer, (2) an action the agent attempted that failed.
  const captureSelfLearning = (entry: {
    kind: 'correction' | 'failed-action';
    userPrompt: string;
    idealResponse: string;
  }) => {
    // Skip if we already learned this exact prompt, so the training set stays clean.
    const duplicate = trainingExamples.some(
      e => Array.isArray(e.tags) && e.tags.includes('auto-learned') && e.userPrompt === entry.userPrompt
    );
    if (duplicate) return;
    addTrainingExample({
      title: (entry.kind === 'correction' ? 'Correction: ' : 'Failed action: ') + entry.userPrompt.slice(0, 28),
      category: 'Self-Learned',
      userPrompt: entry.userPrompt,
      idealResponse: entry.idealResponse,
      tags: ['auto-learned', entry.kind],
      enabled: true
    });
  };

  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || isLoading) return;
    
    const userMessage = promptToSend;
    addChatMessage({
      role: 'user',
      content: userMessage,
    });
    setInput('');
    setIsLoading(true);

    // If this message reads as pushback on the previous answer, quietly learn from it.
    if (looksLikeCorrection(userMessage)) {
      const preceding = [...chatHistory].reverse();
      const lastAgent = preceding.find(
        m => m.role === 'agent' && !m.content.startsWith('[Error]:') && !m.content.startsWith('⚠️')
      );
      const lastUser = preceding.find(m => m.role === 'user');
      if (lastUser) {
        const rejected = lastAgent ? `\n\n[Rejected prior answer]\n${lastAgent.content}` : '';
        captureSelfLearning({
          kind: 'correction',
          userPrompt: lastUser.content,
          idealResponse: `[User feedback] ${userMessage}${rejected}`
        });
      }
    }

    try {
      const flattenFiles = (nodes: typeof fileTree): { path: string; content: string; language?: string }[] =>
        nodes.flatMap(node => node.type === 'folder'
          ? flattenFiles(node.children || [])
          : [{ path: node.path, content: node.content || '', language: node.language }]);
      const workspace = flattenFiles(fileTree);
      // In agent and autonomous modes the server runs a real loop, executing each action
      // and feeding results back. Elsewhere a single turn is all that is wanted.
      const useAgentLoop = agentMode === 'agent' || agentMode === 'autonomous';
      const response = await fetch(useAgentLoop ? '/api/agent' : '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatHistory, { role: 'user', content: userMessage }],
          provider: llmConfig.provider,
          modelId: llmConfig.selectedModelId,
          keys: llmConfig.keys,
          agentMode,
          skills: skills.filter(s => s.enabled),
          trainingProfile,
          trainingExamples: trainingExamples.filter(e => e.enabled),
          knowledgeDocs: knowledgeDocs.filter(d => d.enabled),
          workspace
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }

      const appliedActions: string[] = [];
      const pendingCommands: string[] = [];
      const normalizePath = (path: string) => path.replace(/^\.?[\\/]+/, '/').replace(/\\/g, '/');
      const findFile = (path: string): { id: string; path: string } | undefined => {
        const normalized = normalizePath(path);
        const search = (nodes: typeof fileTree): { id: string; path: string } | undefined => {
          for (const node of nodes) {
            if (node.type === 'file' && normalizePath(node.path) === normalized) {
              return { id: node.id, path: node.path };
            }
            const nested = node.children ? search(node.children) : undefined;
            if (nested) return nested;
          }
          return undefined;
        };
        return search(fileTree);
      };

      for (const action of Array.isArray(data.actions) ? data.actions : []) {
        const file = action.path ? findFile(action.path) : undefined;
        if (action.type === 'edit_file' && file?.id) {
          updateFileContent(file.id, String(action.content || ''));
          appliedActions.push(`Updated ${file.path}`);
        } else if (action.type === 'create_file' && action.path) {
          const path = normalizePath(action.path);
          const name = path.split('/').pop() || 'untitled.txt';
          createNewFile(name, String(action.content || ''));
          appliedActions.push(`Created ${path}`);
        } else if (action.type === 'delete_file' && file?.id) {
          // The loop already deleted it on disk, so only mirror the change locally.
          deleteFile(file.id, !useAgentLoop);
          appliedActions.push(`Deleted ${file.path}`);
        } else if (action.type === 'run_command' && action.command) {
          if (action.requiresApproval) {
            setApprovals(prev =>
              prev.some(a => a.command === action.command)
                ? prev
                : [...prev, { command: String(action.command) }]
            );
          } else if (useAgentLoop) {
            // The loop executes commands itself and reports the outcome in `action.detail`.
            appliedActions.push(`Ran \`${action.command}\`${action.ok ? '' : ' (failed)'}`);
            if (action.ok === false) {
              // A command the agent tried that failed is worth remembering.
              captureSelfLearning({
                kind: 'failed-action',
                userPrompt: `Command failed: ${action.command}`,
                idealResponse: `Command \`${action.command}\` failed.${action.detail ? `\n${action.detail}` : ''}`
              });
            }
          } else {
            pendingCommands.push(String(action.command));
          }
        }
      }

      const actionSummary = appliedActions.length || pendingCommands.length
        ? `\n\n**Agent actions**\n${appliedActions.map(action => `- ${action}`).join('\n')}${pendingCommands.length ? `\n${pendingCommands.map(command => `- \`${command}\` (command execution requires confirmation in the terminal)`).join('\n')}` : ''}`
        : '';

      addChatMessage({
        role: 'agent',
        content: `${data.text || 'Agent completed the request.'}${actionSummary}`,
        modelId: llmConfig.selectedModelId,
        modelName: selectedModel.name,
        provider: selectedModel.providerLabel
      });
    } catch (error: any) {
      addChatMessage({
        role: 'agent',
        content: `[Error]: ${error.message}`,
        modelId: llmConfig.selectedModelId,
        modelName: selectedModel.name,
        provider: selectedModel.providerLabel
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToTraining = (msgIndex: number, assistantMsg: any) => {
    let precedingUserPrompt = "Code task";
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (chatHistory[i].role === 'user') {
        precedingUserPrompt = chatHistory[i].content;
        break;
      }
    }

    addTrainingExample({
      title: precedingUserPrompt.slice(0, 32) + '...',
      category: 'Chat Trained',
      userPrompt: precedingUserPrompt,
      idealResponse: assistantMsg.content,
      tags: ['chat-trained'],
      enabled: true
    });

    setSavedTrainingId(assistantMsg.id);
    setTimeout(() => setSavedTrainingId(null), 2500);
  };

  const activeSkillsCount = skills.filter(s => s.enabled).length;

  return (
    <div className="flex flex-col h-full bg-[#161B22] border-l border-[#30363D]">
      {/* Top Header with DevPilotX Model Selector */}
      <div className="p-3 border-b border-[#30363D] flex items-center justify-between gap-2 bg-[#161B22] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#2EA043] shrink-0 animate-pulse"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-white truncate">
            DevPilotX Chat
          </span>
          <button
            onClick={() => setActiveView('skills')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#A371F7]/15 text-[#A371F7] border border-[#A371F7]/30 text-[10px] font-medium hover:bg-[#A371F7]/25 transition-colors shrink-0"
            title="Configure trainable agent skills, persona, and knowledge base"
          >
            <BrainCircuit size={10} />
            <span>{activeSkillsCount} Skills</span>
          </button>
        </div>
        
        {/* Model Selector Dropdown Pill */}
        <ModelSelectorDropdown variant="pill" />
        <AgentModeSelector />
      </div>
      
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {chatHistory.map((msg, index) => {
          const msgModel = msg.modelId ? getModelById(msg.modelId) : selectedModel;
          const isUser = msg.role === 'user';
          const isError = msg.content.startsWith('[Error]:');
          const isWarning = msg.content.startsWith('⚠️');

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 max-w-[95%] ${
                isUser ? 'self-end items-end' : 'self-start items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-[#8B949E] px-1">
                {isUser ? (
                  <span className="font-semibold uppercase tracking-wider text-[#8B949E]">You</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <ModelIcon type={msgModel.iconType} size={11} className="p-0.5" />
                    <span className="font-semibold text-[#C9D1D9]">DevPilotX</span>
                    <span className="text-[#8B949E]">•</span>
                    <span className="text-[#58A6FF] font-medium">{msg.modelName || msgModel.name}</span>
                  </div>
                )}
              </div>

              <div
                className={`p-3 rounded-lg text-xs leading-relaxed max-w-full break-words relative group ${
                  isUser
                    ? 'bg-[#1F6FEB] text-white shadow-md rounded-br-none'
                    : isError
                    ? 'bg-[#F85149]/10 text-[#FF7B72] border border-[#F85149]/30 rounded-bl-none'
                    : isWarning
                    ? 'bg-[#E3B341]/10 text-[#F0E6D2] border border-[#E3B341]/30 rounded-bl-none'
                    : 'bg-[#0D1117] text-[#C9D1D9] border border-[#30363D] shadow-sm rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {!isUser && !isError && !isWarning && (
                  <div className="mt-2 pt-2 border-t border-[#30363D]/60 flex items-center justify-between text-[10px] text-[#8B949E]">
                    <span className="text-[9px] text-[#8B949E]">
                      {msg.provider || msgModel.providerLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveToTraining(index, msg)}
                        className="hover:text-[#A371F7] flex items-center gap-1 opacity-70 hover:opacity-100 transition-all text-[10px]"
                        title="Save this exchange into Agent Training Demonstrations"
                      >
                        {savedTrainingId === msg.id ? (
                          <>
                            <Check size={11} className="text-[#3FB950]" />
                            <span className="text-[#3FB950]">Trained!</span>
                          </>
                        ) : (
                          <>
                            <GraduationCap size={11} />
                            <span>Train Agent</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="hover:text-white flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check size={11} className="text-[#3FB950]" />
                            <span className="text-[#3FB950]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {(isError || isWarning) && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#8B949E]">Quick Action:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => selectModel(DEFAULT_MODEL_ID)}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#1F6FEB] text-white hover:bg-[#388BFD] font-medium transition-colors"
                      >
                        ⚡ Switch to Gemini (Built-in)
                      </button>
                      <button
                        onClick={() => setActiveActivity('settings')}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#21262D] text-[#58A6FF] hover:bg-[#30363D] border border-[#30363D] transition-colors"
                      >
                        Settings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="self-start flex flex-col gap-1 max-w-[90%]">
            <div className="flex items-center gap-1.5 text-[10px] text-[#8B949E] px-1">
              <ModelIcon type={selectedModel.iconType} size={11} className="p-0.5" />
              <span className="font-semibold text-[#C9D1D9]">DevPilotX</span>
              <span className="text-[#8B949E]">•</span>
              <span className="text-[#58A6FF]">{selectedModel.name} thinking...</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D] text-[#8B949E] text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#58A6FF] animate-ping"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#58A6FF] animate-pulse"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#58A6FF] animate-pulse"></span>
              <span className="text-[11px] text-[#8B949E] ml-1">Generating intelligent code response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {approvals.length > 0 && (
        <div className="px-3 pt-2 pb-1 bg-[#0D1117] border-t border-[#30363D] shrink-0">
          <p className="text-[11px] uppercase tracking-wide text-[#8B949E] mb-2">
            Needs your approval
          </p>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {approvals.map((entry, index) => (
              <div
                key={`${entry.command}-${index}`}
                className="rounded-md border border-[#30363D] bg-[#161B22] p-2"
              >
                <code className="block text-[12px] text-[#E6EDF3] break-all font-mono">
                  {entry.command}
                </code>
                {entry.output === undefined ? (
                  <button
                    type="button"
                    onClick={() => runApproved(index)}
                    disabled={entry.running}
                    className="mt-2 text-[12px] px-2.5 py-1 rounded border border-[#30363D] text-[#E6EDF3] hover:border-[#58A6FF] disabled:opacity-60"
                  >
                    {entry.running ? 'Running...' : 'Run command'}
                  </button>
                ) : (
                  <pre className="mt-2 text-[11px] text-[#8B949E] whitespace-pre-wrap break-all font-mono max-h-32 overflow-y-auto">
                    {entry.output}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Composer Area */}
      <div className="p-3 bg-[#0D1117] border-t border-[#30363D] shrink-0">
        {/* Input Form with Model Indicator */}
        <form onSubmit={(e) => handleSend(e)} className="relative flex flex-col bg-[#21262D] border border-[#30363D] focus-within:border-[#58A6FF] rounded-lg transition-colors p-1.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Ask ${selectedModel.name} anything (Enter to send, Shift+Enter for newline)...`}
            rows={2}
            className="w-full bg-transparent text-xs text-white placeholder:text-[#484F58] resize-none focus:outline-none px-1.5 py-1"
          />

          <div className="flex items-center justify-between pt-1 border-t border-[#30363D]/60 mt-1">
            <div className="flex items-center gap-1.5">
              <ModelSelectorDropdown variant="compact" />
              <span className="text-[10px] text-[#8B949E] hidden sm:inline-block">
                {selectedModel.speed}
              </span>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex items-center gap-1 px-3 py-1 bg-[#238636] hover:bg-[#2EA043] disabled:opacity-40 disabled:hover:bg-[#238636] text-white rounded text-xs font-medium transition-colors"
            >
              <span>Send</span>
              <Send size={12} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

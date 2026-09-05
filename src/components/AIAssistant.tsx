import React, { useState, useRef, useEffect } from 'react';
import { useIDE } from '../context/IDEContext';
import { Send, Settings, Copy, Check, BrainCircuit, GraduationCap } from 'lucide-react';
import { ModelSelectorDropdown } from './ModelSelectorDropdown';
import { ModelIcon } from './ModelIcon';
import { getModelById, DEFAULT_MODEL_ID } from '../constants/models';
import { AgentModeSelector } from './AgentModeSelector';

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
    agentMode
  } = useIDE();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedTrainingId, setSavedTrainingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

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

    try {
      const response = await fetch('/api/chat', {
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
          knowledgeDocs: knowledgeDocs.filter(d => d.enabled)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }

      addChatMessage({
        role: 'agent',
        content: data.text,
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
      {/* Top Header with Copilot Model Selector */}
      <div className="p-3 border-b border-[#30363D] flex items-center justify-between gap-2 bg-[#161B22] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#2EA043] shrink-0 animate-pulse"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-white truncate">
            Copilot Chat
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

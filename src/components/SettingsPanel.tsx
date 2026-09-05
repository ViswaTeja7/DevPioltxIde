import React, { useState } from 'react';
import { useIDE } from '../context/IDEContext';
import { Key, Server, Sparkles, Check, ChevronRight, ShieldCheck, Zap, Brain, Sliders, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { AI_MODELS, getModelById } from '../constants/models';
import { ModelIcon } from './ModelIcon';

export const SettingsPanel = () => {
  const { llmConfig, updateLLMConfig, selectedModel, selectModel, setIsModelSelectorOpen, refreshProviderModels } = useIDE();
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [providerStatuses, setProviderStatuses] = useState<Record<string, { success: boolean; message: string }>>({});
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSaveKeys = () => {
    updateLLMConfig(prev => ({ ...prev }));
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleTestProvider = async (provider: 'gemini' | 'openrouter' | 'ollama' | 'groq') => {
    setTestingProvider(provider);
    setProviderStatuses(prev => ({ ...prev, [provider]: { success: false, message: 'Testing connection...' } }));
    
    try {
      const response = await fetch('/api/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          keys: llmConfig.keys,
          modelId: llmConfig.selectedModelId
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Connection test failed');
      }
      setProviderStatuses(prev => ({
        ...prev,
        [provider]: { success: true, message: data.message || 'Connected successfully!' }
      }));
      await refreshProviderModels();
    } catch (err: any) {
      setProviderStatuses(prev => ({
        ...prev,
        [provider]: { success: false, message: err.message || 'Connection failed' }
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#161B22] overflow-y-auto">
      <div className="p-3 border-b border-[#30363D] shrink-0 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Sliders size={14} className="text-[#58A6FF]" />
          Settings & AI Models
        </span>
        <button
          onClick={handleSaveKeys}
          className="text-[11px] px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2EA043] text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm"
        >
          {savedFeedback ? <Check size={12} className="text-white" /> : null}
          {savedFeedback ? 'Saved & Applied!' : 'Save Credentials'}
        </button>
      </div>
      
      <div className="p-4 flex-1 space-y-6">
        {/* Active Copilot Model Card */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] uppercase font-bold tracking-wider text-[#8B949E]">
              Current Copilot Model
            </h3>
            <button
              onClick={() => setIsModelSelectorOpen(true)}
              className="text-xs text-[#58A6FF] hover:underline font-medium flex items-center gap-1"
            >
              Browse All Models <ChevronRight size={12} />
            </button>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0D1117] border border-[#30363D] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ModelIcon type={selectedModel.iconType} size={18} className="p-1" />
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {selectedModel.name}
                    {selectedModel.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#58A6FF]/10 text-[#58A6FF] border border-[#58A6FF]/20">
                        {selectedModel.badge}
                      </span>
                    )}
                  </h4>
                  <span className="text-[10px] text-[#8B949E]">{selectedModel.providerLabel}</span>
                </div>
              </div>

              <button
                onClick={() => setIsModelSelectorOpen(true)}
                className="text-[11px] px-2.5 py-1 rounded bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-white font-medium transition-colors"
              >
                Change Model
              </button>
            </div>

            <p className="text-[11px] text-[#8B949E] leading-relaxed">
              {selectedModel.description}
            </p>

            <div className="flex items-center gap-3 pt-2 border-t border-[#30363D]/60 text-[10px] text-[#8B949E]">
              <span className="flex items-center gap-1">
                {selectedModel.speed === 'Deep Reasoning' ? (
                  <Brain size={11} className="text-[#E3B341]" />
                ) : (
                  <Zap size={11} className="text-[#3FB950]" />
                )}
                {selectedModel.speed}
              </span>
              <span>•</span>
              <span>Context: {selectedModel.contextWindow}</span>
              <span>•</span>
              <span className="text-[#3FB950]">Active</span>
            </div>
          </div>
        </div>

        {/* API Credentials & Endpoints */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] uppercase font-bold tracking-wider text-[#8B949E]">
              Provider Credentials & Keys
            </h3>
            <span className="text-[9px] text-[#3FB950] lowercase font-normal flex items-center gap-1">
              <ShieldCheck size={11} /> Saved to Local Storage
            </span>
          </div>
          
          <div className="flex flex-col gap-4 bg-[#0D1117] p-3.5 rounded-lg border border-[#30363D]">
            {/* 1. Google Gemini */}
            <div className="p-3 rounded-lg bg-[#161B22] border border-[#30363D]/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#C9D1D9] flex items-center gap-1.5 font-bold">
                  <Key size={12} className="text-[#58A6FF]" /> Google Gemini (Built-in)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-[#3FB950] bg-[#238636]/20 px-1.5 py-0.2 rounded border border-[#2EA043]/30">
                    Ready
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestProvider('gemini')}
                    disabled={testingProvider === 'gemini'}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] border border-[#30363D]"
                  >
                    {testingProvider === 'gemini' ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>
              <input 
                type="password" 
                value={llmConfig.keys.gemini}
                onChange={(e) => updateLLMConfig(prev => ({ ...prev, keys: { ...prev.keys, gemini: e.target.value } }))}
                placeholder="Optional custom key (uses server GEMINI_API_KEY by default)"
                className="w-full bg-[#0D1117] text-xs p-2 border border-[#30363D] focus:border-[#58A6FF] text-[#C9D1D9] outline-none rounded placeholder:text-[#484F58]" 
              />
              {providerStatuses.gemini && (
                <div className={`p-1.5 rounded text-[11px] flex items-center gap-1.5 ${providerStatuses.gemini.success ? 'bg-[#238636]/15 text-[#3FB950] border border-[#2EA043]/30' : 'bg-[#F85149]/15 text-[#FF7B72] border border-[#F85149]/30'}`}>
                  {providerStatuses.gemini.success ? <Check size={12} /> : <AlertCircle size={12} />}
                  <span className="truncate">{providerStatuses.gemini.message}</span>
                </div>
              )}
            </div>

            {/* 2. OpenRouter */}
            <div className="p-3 rounded-lg bg-[#161B22] border border-[#30363D]/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#C9D1D9] flex items-center gap-1.5 font-bold">
                  <Key size={12} className="text-[#E3B341]" /> OpenRouter API Key
                </label>
                <div className="flex items-center gap-2">
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[9px] text-[#58A6FF] hover:underline flex items-center gap-0.5"
                  >
                    Get Key <ExternalLink size={9} />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleTestProvider('openrouter')}
                    disabled={testingProvider === 'openrouter'}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] border border-[#30363D]"
                  >
                    {testingProvider === 'openrouter' ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>
              <input 
                type="password" 
                value={llmConfig.keys.openrouter}
                onChange={(e) => updateLLMConfig(prev => ({ ...prev, keys: { ...prev.keys, openrouter: e.target.value } }))}
                placeholder="sk-or-v1-... (enables NVIDIA Nemotron, MiniMax, Claude, DeepSeek & Free-tier)"
                className="w-full bg-[#0D1117] text-xs p-2 border border-[#30363D] focus:border-[#58A6FF] text-[#C9D1D9] outline-none rounded placeholder:text-[#484F58]" 
              />
              <p className="text-[10px] text-[#8B949E]">
                Supports <strong>NVIDIA Nemotron 70B</strong>, <strong>MiniMax-01</strong>, <strong>Claude 3.7</strong>, <strong>DeepSeek R1 Free</strong>, and <strong>Llama 3.3 Free</strong>.
              </p>
              {providerStatuses.openrouter && (
                <div className={`p-1.5 rounded text-[11px] flex items-center gap-1.5 ${providerStatuses.openrouter.success ? 'bg-[#238636]/15 text-[#3FB950] border border-[#2EA043]/30' : 'bg-[#F85149]/15 text-[#FF7B72] border border-[#F85149]/30'}`}>
                  {providerStatuses.openrouter.success ? <Check size={12} /> : <AlertCircle size={12} />}
                  <span className="truncate">{providerStatuses.openrouter.message}</span>
                </div>
              )}
            </div>

            {/* 3. Ollama Cloud & Local Settings */}
            <div className="p-3 rounded-lg bg-[#161B22] border border-[#30363D]/80 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#C9D1D9] flex items-center gap-1.5 font-bold">
                  <Server size={13} className="text-[#58A6FF]" /> Ollama Cloud & Private Endpoint
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateLLMConfig(prev => ({ 
                      ...prev, 
                      keys: { 
                        ...prev.keys, 
                        ollamaUrl: 'https://api.ollama.ai/v1' 
                      } 
                    }))}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] border border-[#30363D]"
                  >
                    Ollama Cloud
                  </button>
                  <button
                    type="button"
                    onClick={() => updateLLMConfig(prev => ({ 
                      ...prev, 
                      keys: { 
                        ...prev.keys, 
                        ollamaUrl: 'http://localhost:11434/v1' 
                      } 
                    }))}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-[#21262D] hover:bg-[#30363D] text-[#8B949E] border border-[#30363D]"
                  >
                    Local
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestProvider('ollama')}
                    disabled={testingProvider === 'ollama'}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] border border-[#30363D]"
                  >
                    {testingProvider === 'ollama' ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>

              {/* Ollama Base URL */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#8B949E]">Endpoint URL</span>
                <input 
                  type="text" 
                  value={llmConfig.keys.ollamaUrl}
                  onChange={(e) => updateLLMConfig(prev => ({ ...prev, keys: { ...prev.keys, ollamaUrl: e.target.value } }))}
                  placeholder="https://api.ollama.ai/v1 or https://xxxx.ngrok-free.app/v1"
                  className="w-full bg-[#0D1117] text-xs p-2 border border-[#30363D] focus:border-[#58A6FF] text-[#C9D1D9] outline-none rounded placeholder:text-[#484F58]" 
                />
              </div>

              {/* Ollama Cloud API Key */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#8B949E] flex items-center gap-1">
                    <Key size={11} className="text-[#3FB950]" /> Ollama Cloud API Key / Bearer Token
                  </span>
                </div>
                <input 
                  type="password" 
                  value={llmConfig.keys.ollamaApiKey || ''}
                  onChange={(e) => updateLLMConfig(prev => ({ ...prev, keys: { ...prev.keys, ollamaApiKey: e.target.value } }))}
                  placeholder="ollama_... or Bearer token (for hosted/cloud instances)"
                  className="w-full bg-[#0D1117] text-xs p-2 border border-[#30363D] focus:border-[#58A6FF] text-[#C9D1D9] outline-none rounded placeholder:text-[#484F58]" 
                />
              </div>

              {/* Ollama Model Name */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#8B949E]">Target Ollama Model</span>
                <input 
                  type="text" 
                  value={llmConfig.keys.ollamaModel || 'llama3.3'}
                  onChange={(e) => updateLLMConfig(prev => ({ ...prev, keys: { ...prev.keys, ollamaModel: e.target.value } }))}
                  placeholder="e.g. llama3.3, deepseek-r1:70b, qwen2.5-coder:32b"
                  className="w-full bg-[#0D1117] text-xs p-2 border border-[#30363D] focus:border-[#58A6FF] text-[#C9D1D9] outline-none rounded placeholder:text-[#484F58]" 
                />
              </div>

              {providerStatuses.ollama && (
                <div className={`p-1.5 rounded text-[11px] flex items-center gap-1.5 ${providerStatuses.ollama.success ? 'bg-[#238636]/15 text-[#3FB950] border border-[#2EA043]/30' : 'bg-[#F85149]/15 text-[#FF7B72] border border-[#F85149]/30'}`}>
                  {providerStatuses.ollama.success ? <Check size={12} /> : <AlertCircle size={12} />}
                  <span className="text-[11px] break-words">{providerStatuses.ollama.message}</span>
                </div>
              )}
            </div>

            {/* 4. Groq */}
            <div className="p-3 rounded-lg bg-[#161B22] border border-[#30363D]/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#C9D1D9] flex items-center gap-1.5 font-bold">
                  <Key size={12} className="text-[#FF7B72]" /> Groq API Key (LPU Fast Inference)
                </label>
                <div className="flex items-center gap-2">
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[9px] text-[#58A6FF] hover:underline flex items-center gap-0.5"
                  >
                    Get Key <ExternalLink size={9} />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleTestProvider('groq')}
                    disabled={testingProvider === 'groq'}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] border border-[#30363D]"
                  >
                    {testingProvider === 'groq' ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>
              <input 
                type="password" 
                value={llmConfig.keys.groq}
                onChange={(e) => updateLLMConfig(prev => ({ ...prev, keys: { ...prev.keys, groq: e.target.value } }))}
                placeholder="gsk_... (enables 500+ tok/sec Groq inference)"
                className="w-full bg-[#0D1117] text-xs p-2 border border-[#30363D] focus:border-[#58A6FF] text-[#C9D1D9] outline-none rounded placeholder:text-[#484F58]" 
              />
              {providerStatuses.groq && (
                <div className={`p-1.5 rounded text-[11px] flex items-center gap-1.5 ${providerStatuses.groq.success ? 'bg-[#238636]/15 text-[#3FB950] border border-[#2EA043]/30' : 'bg-[#F85149]/15 text-[#FF7B72] border border-[#F85149]/30'}`}>
                  {providerStatuses.groq.success ? <Check size={12} /> : <AlertCircle size={12} />}
                  <span className="truncate">{providerStatuses.groq.message}</span>
                </div>
              )}
            </div>

            {/* Save Button at Bottom */}
            <button
              type="button"
              onClick={handleSaveKeys}
              className="w-full py-2 px-3 rounded bg-[#1F6FEB] hover:bg-[#388BFD] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow"
            >
              {savedFeedback ? <Check size={14} /> : <Sparkles size={14} />}
              {savedFeedback ? 'Credentials Saved & Synced!' : 'Save & Sync API Credentials'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

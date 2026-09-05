import React, { useState } from 'react';
import { useIDE } from '../context/IDEContext';
import { AI_MODELS, getModelById, DEFAULT_MODEL_ID } from '../constants/models';
import { ModelIcon } from './ModelIcon';
import { AIModel } from '../types';
import { Search, Check, Sparkles, X, Brain, Zap, Key, ShieldCheck, Cpu, Terminal, ArrowRight, ExternalLink, Gift, Layers } from 'lucide-react';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({ isOpen, onClose }) => {
  const { llmConfig, updateLLMConfig, setActiveActivity } = useIDE();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const currentModel = getModelById(llmConfig.selectedModelId || DEFAULT_MODEL_ID);

  const filteredModels = AI_MODELS.filter((model) => {
    const matchesQuery =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.providerLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'image') return model.isImageModel || model.category === 'image';
    if (selectedCategory === 'free') return model.isFree;
    if (selectedCategory === 'nvidia') return model.iconType === 'nvidia' || model.name.toLowerCase().includes('nvidia');
    if (selectedCategory === 'minimax') return model.iconType === 'minimax' || model.name.toLowerCase().includes('minimax');
    if (selectedCategory === 'gemini') return model.provider === 'gemini';
    if (selectedCategory === 'anthropic') return model.iconType === 'claude';
    if (selectedCategory === 'openai') return model.iconType === 'openai';
    if (selectedCategory === 'deepseek') return model.iconType === 'deepseek';
    if (selectedCategory === 'mistral') return model.iconType === 'mistral';
    if (selectedCategory === 'groq') return model.provider === 'groq';
    if (selectedCategory === 'ollama') return model.provider === 'ollama';

    return true;
  });

  const handleSelect = (model: AIModel) => {
    updateLLMConfig({
      selectedModelId: model.id,
      provider: model.provider,
    });
    onClose();
  };

  const categories = [
    { id: 'all', label: 'All Models' },
    { id: 'image', label: '🎨 Image Models' },
    { id: 'free', label: '🎁 Free Models' },
    { id: 'nvidia', label: 'NVIDIA Nemotron' },
    { id: 'minimax', label: 'MiniMax' },
    { id: 'gemini', label: 'Google Gemini' },
    { id: 'anthropic', label: 'Anthropic Claude' },
    { id: 'openai', label: 'OpenAI' },
    { id: 'deepseek', label: 'DeepSeek' },
    { id: 'mistral', label: 'Mistral' },
    { id: 'groq', label: 'Groq LPU' },
    { id: 'ollama', label: 'Local Ollama' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#30363D] flex items-center justify-between bg-[#0D1117]/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1F6FEB]/15 text-[#58A6FF] border border-[#388BFD]/30">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                GitHub Copilot AI Model Selector
              </h2>
              <p className="text-xs text-[#8B949E]">
                Select between Google Gemini, NVIDIA Nemotron, MiniMax, Claude, DeepSeek, OpenAI, Mistral & Free-tier models.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8B949E] hover:text-white hover:bg-[#21262D] rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Selection Banner */}
        <div className="px-5 py-2.5 bg-[#0D1117] border-b border-[#30363D] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#8B949E]">Active Model:</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#21262D] border border-[#30363D]">
              <ModelIcon type={currentModel.iconType} size={14} />
              <span className="text-xs font-semibold text-white">{currentModel.name}</span>
              <span className="text-[10px] text-[#58A6FF] ml-1">({currentModel.providerLabel})</span>
            </div>
            {currentModel.isFree && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3FB950] border border-[#2EA043]/30 font-medium">
                Zero Cost / Free
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#3FB950]">
            <ShieldCheck size={14} />
            <span>Ready for Code Generation</span>
          </div>
        </div>

        {/* Search and Category Filters */}
        <div className="p-4 border-b border-[#30363D] flex flex-col gap-3 bg-[#161B22]">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by model name (e.g. Nemotron, MiniMax, Claude, DeepSeek, Free)..."
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-[#484F58] outline-none focus:border-[#58A6FF] transition-colors"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === tab.id
                    ? 'bg-[#1F6FEB] text-white font-medium shadow-sm'
                    : 'bg-[#21262D] text-[#8B949E] hover:text-white hover:bg-[#30363D]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Model Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-[#0D1117]/40">
          {filteredModels.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-[#8B949E]">
              <Layers size={32} className="mx-auto mb-2 opacity-40 text-[#58A6FF]" />
              <p className="text-sm font-semibold text-white">No models matching "{searchQuery}"</p>
              <p className="text-xs text-[#8B949E] mt-1">Try searching for "NVIDIA", "MiniMax", "Free", or "Flash"</p>
            </div>
          ) : (
            filteredModels.map((model) => {
              const isSelected = model.id === currentModel.id;
              return (
                <div
                  key={model.id}
                  onClick={() => handleSelect(model)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-[#1F6FEB]/15 border-[#388BFD] shadow-md ring-1 ring-[#388BFD]/30'
                      : 'bg-[#161B22] hover:bg-[#21262D] border-[#30363D] hover:border-[#58A6FF]/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ModelIcon type={model.iconType} size={18} className="p-1.5 shrink-0" />
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white group-hover:text-[#58A6FF] transition-colors flex items-center gap-1.5 truncate">
                            {model.name}
                          </h3>
                          <span className="text-[11px] text-[#8B949E] truncate block">{model.providerLabel}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {model.isFree && (
                          <span className="px-1.5 py-0.5 rounded bg-[#238636]/20 border border-[#2EA043]/30 text-[#3FB950] text-[9px] font-semibold flex items-center gap-0.5">
                            <Gift size={9} /> Free
                          </span>
                        )}
                        {isSelected ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1F6FEB] text-white text-[10px] font-semibold">
                            <Check size={11} /> Active
                          </span>
                        ) : (
                          model.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-[#21262D] border border-[#30363D] text-[#C9D1D9] text-[10px]">
                              {model.badge}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#8B949E] leading-relaxed mb-3 line-clamp-2">
                      {model.description}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-[#30363D]/60 flex items-center justify-between text-[11px] text-[#8B949E]">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        {model.speed === 'Deep Reasoning' ? (
                          <Brain size={12} className="text-[#E3B341]" />
                        ) : (
                          <Zap size={12} className="text-[#3FB950]" />
                        )}
                        <span className="text-[#C9D1D9]">{model.speed}</span>
                      </span>
                      <span>•</span>
                      <span className="text-[#8B949E]">{model.contextWindow}</span>
                    </div>

                    <span className="text-[#58A6FF] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-medium text-xs">
                      Select <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#30363D] bg-[#0D1117] flex items-center justify-between text-xs text-[#8B949E] flex-wrap gap-2">
          <span>
            Free models with the <strong className="text-[#3FB950]">Free</strong> badge can be used without consuming paid API credits.
          </span>
          <button
            onClick={() => {
              onClose();
              setActiveActivity('settings');
            }}
            className="text-[#58A6FF] hover:underline font-medium flex items-center gap-1"
          >
            Configure API Keys & Endpoints <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

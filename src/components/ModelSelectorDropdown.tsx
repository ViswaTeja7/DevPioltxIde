import React, { useState, useRef, useEffect } from 'react';
import { useIDE } from '../context/IDEContext';
import { AI_MODELS, getModelById, DEFAULT_MODEL_ID } from '../constants/models';
import { ModelIcon } from './ModelIcon';
import { AIModel } from '../types';
import { Search, Check, ChevronDown, Sparkles, Key, ExternalLink, Zap, Brain, SlidersHorizontal, Info, Gift } from 'lucide-react';

interface ModelSelectorDropdownProps {
  variant?: 'pill' | 'compact' | 'full';
  className?: string;
  onOpenSettings?: () => void;
}

export const ModelSelectorDropdown: React.FC<ModelSelectorDropdownProps> = ({
  variant = 'pill',
  className = '',
  onOpenSettings,
}) => {
  const { llmConfig, updateLLMConfig, setActiveActivity } = useIDE();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedModel = getModelById(llmConfig.selectedModelId || DEFAULT_MODEL_ID);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectModel = (model: AIModel) => {
    updateLLMConfig({
      selectedModelId: model.id,
      provider: model.provider,
    });
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleGoToSettings = () => {
    setIsOpen(false);
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      setActiveActivity('settings');
    }
  };

  // Filter models
  const filteredModels = AI_MODELS.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.providerLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeCategory === 'all') return true;
    if (activeCategory === 'image') return model.isImageModel || model.category === 'image';
    if (activeCategory === 'free') return model.isFree;
    if (activeCategory === 'nvidia') return model.iconType === 'nvidia' || model.name.toLowerCase().includes('nvidia');
    if (activeCategory === 'minimax') return model.iconType === 'minimax' || model.name.toLowerCase().includes('minimax');
    if (activeCategory === 'gemini') return model.provider === 'gemini';
    if (activeCategory === 'anthropic') return model.iconType === 'claude';
    if (activeCategory === 'openai') return model.iconType === 'openai';
    if (activeCategory === 'deepseek') return model.iconType === 'deepseek';
    if (activeCategory === 'mistral') return model.iconType === 'mistral';
    if (activeCategory === 'groq') return model.provider === 'groq';
    if (activeCategory === 'ollama') return model.provider === 'ollama';

    return true;
  });

  const recommendedModels = filteredModels.filter((m) => m.isCopilotRecommended);
  const otherModels = filteredModels.filter((m) => !m.isCopilotRecommended);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      {variant === 'pill' && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] hover:border-[#58A6FF]/50 text-xs text-[#C9D1D9] transition-all group select-none shadow-sm"
          title="Switch Copilot AI Model"
        >
          <ModelIcon type={selectedModel.iconType} size={13} className="p-0.5" />
          <span className="font-medium text-white group-hover:text-[#58A6FF] transition-colors max-w-[140px] truncate">
            {selectedModel.name}
          </span>
          {selectedModel.isFree ? (
            <span className="text-[9px] px-1 py-0.2 rounded bg-[#238636]/20 text-[#3FB950] border border-[#2EA043]/30 hidden sm:inline-block font-semibold">
              Free
            </span>
          ) : selectedModel.badge ? (
            <span className="text-[9px] px-1 py-0.2 rounded bg-[#58A6FF]/10 text-[#58A6FF] border border-[#58A6FF]/20 hidden sm:inline-block">
              {selectedModel.badge}
            </span>
          ) : null}
          <ChevronDown
            size={12}
            className={`text-[#8B949E] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#58A6FF]' : ''}`}
          />
        </button>
      )}

      {variant === 'compact' && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-[11px] text-[#C9D1D9] transition-colors"
        >
          <ModelIcon type={selectedModel.iconType} size={11} className="p-0.5" />
          <span className="truncate max-w-[100px] text-white">{selectedModel.name}</span>
          <ChevronDown size={11} className="text-[#8B949E]" />
        </button>
      )}

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-1.5 sm:bottom-auto sm:top-full sm:mt-1.5 w-[340px] sm:w-[400px] bg-[#161B22] border border-[#30363D] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[490px] animate-in fade-in zoom-in-95 duration-150">
          {/* Header & Search */}
          <div className="p-2.5 border-b border-[#30363D] bg-[#0D1117]/80 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#58A6FF]" />
                Select Copilot AI Model
              </span>
              <span className="text-[10px] text-[#8B949E]">
                {filteredModels.length} models
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models (e.g. Flux, Imagen, Nemotron, Free)..."
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-8 py-1.5 text-xs text-white placeholder:text-[#484F58] outline-none focus:border-[#58A6FF] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8B949E] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Provider Filter Tabs */}
            <div className="flex gap-1 mt-2 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'image', label: '🎨 Image' },
                { id: 'free', label: '🎁 Free' },
                { id: 'nvidia', label: 'NVIDIA' },
                { id: 'minimax', label: 'MiniMax' },
                { id: 'gemini', label: 'Gemini' },
                { id: 'anthropic', label: 'Claude' },
                { id: 'openai', label: 'OpenAI' },
                { id: 'deepseek', label: 'DeepSeek' },
                { id: 'mistral', label: 'Mistral' },
                { id: 'groq', label: 'Groq' },
                { id: 'ollama', label: 'Local' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                    activeCategory === tab.id
                      ? 'bg-[#58A6FF]/20 text-[#58A6FF] font-semibold border border-[#58A6FF]/40'
                      : 'text-[#8B949E] hover:text-[#C9D1D9] bg-[#21262D]/60 hover:bg-[#21262D]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {filteredModels.length === 0 ? (
              <div className="p-6 text-center text-[#8B949E] text-xs">
                No matching models found for "{searchQuery}".
              </div>
            ) : (
              <>
                {/* Copilot Recommended Section */}
                {recommendedModels.length > 0 && activeCategory === 'all' && !searchQuery && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#58A6FF] px-2 mb-1.5 flex items-center gap-1">
                      <Sparkles size={11} /> Recommended for Coding & Architecture
                    </div>
                    <div className="space-y-1">
                      {recommendedModels.map((model) => (
                        <ModelListItem
                          key={model.id}
                          model={model}
                          isSelected={model.id === selectedModel.id}
                          onSelect={() => handleSelectModel(model)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Models Section */}
                <div>
                  {recommendedModels.length > 0 && activeCategory === 'all' && !searchQuery && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B949E] px-2 mb-1.5 mt-3">
                      All Available Models
                    </div>
                  )}
                  <div className="space-y-1">
                    {(activeCategory !== 'all' || searchQuery ? filteredModels : otherModels).map((model) => (
                      <ModelListItem
                        key={model.id}
                        model={model}
                        isSelected={model.id === selectedModel.id}
                        onSelect={() => handleSelectModel(model)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer with Settings link */}
          <div className="p-2.5 border-t border-[#30363D] bg-[#0D1117] flex items-center justify-between text-[11px] text-[#8B949E]">
            <div className="flex items-center gap-1.5 text-[#8B949E]">
              <Info size={12} className="text-[#3FB950]" />
              <span>Built-in & Free-tier models ready</span>
            </div>
            <button
              type="button"
              onClick={handleGoToSettings}
              className="flex items-center gap-1 text-[#58A6FF] hover:underline font-medium"
            >
              <SlidersHorizontal size={11} />
              <span>API Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface ModelListItemProps {
  model: AIModel;
  isSelected: boolean;
  onSelect: () => void;
}

const ModelListItem: React.FC<ModelListItemProps> = ({ model, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-2 rounded-lg border transition-all flex items-start gap-2.5 group ${
        isSelected
          ? 'bg-[#1F6FEB]/15 border-[#388BFD]/50 text-white shadow-sm'
          : 'bg-[#161B22] hover:bg-[#21262D] border-transparent hover:border-[#30363D] text-[#C9D1D9]'
      }`}
    >
      <ModelIcon type={model.iconType} size={15} className="mt-0.5 p-1 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs font-semibold ${isSelected ? 'text-[#58A6FF]' : 'text-white group-hover:text-[#58A6FF]'}`}>
            {model.name}
          </span>
          <span className="text-[10px] text-[#8B949E]">({model.providerLabel})</span>
          {model.isFree && (
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#238636]/20 text-[#3FB950] font-semibold border border-[#2EA043]/30 flex items-center gap-0.5">
              <Gift size={8} /> Free
            </span>
          )}
          {model.badge && !model.isFree && (
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#30363D] text-[#C9D1D9] font-normal border border-[#484F58]">
              {model.badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#8B949E] line-clamp-1 mt-0.5">
          {model.description}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-[9px] text-[#8B949E]">
          <span className="flex items-center gap-0.5 bg-[#0D1117] px-1.5 py-0.5 rounded border border-[#30363D]">
            {model.speed === 'Deep Reasoning' ? <Brain size={10} className="text-[#E3B341]" /> : <Zap size={10} className="text-[#3FB950]" />}
            {model.speed}
          </span>
          <span className="bg-[#0D1117] px-1.5 py-0.5 rounded border border-[#30363D]">
            {model.contextWindow}
          </span>
          {model.isFree ? (
            <span className="text-[#3FB950] font-medium">Zero Credits</span>
          ) : !model.requiresCustomKey ? (
            <span className="text-[#3FB950] font-medium">Ready</span>
          ) : (
            <span className="text-[#8B949E]">Key in Settings</span>
          )}
        </div>
      </div>
      {isSelected && (
        <div className="shrink-0 text-[#58A6FF] p-1">
          <Check size={14} />
        </div>
      )}
    </button>
  );
};

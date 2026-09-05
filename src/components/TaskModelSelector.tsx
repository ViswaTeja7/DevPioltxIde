import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Sparkles, Check, Image as ImageIcon, Zap, Filter } from 'lucide-react';
import { AI_MODELS, getModelById, getImageModels, getTextModels } from '../constants/models';
import { AIModel, TaskType } from '../types';
import { ModelIcon } from './ModelIcon';

interface TaskModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (model: AIModel) => void;
  taskType: TaskType;
  className?: string;
}

export const TaskModelSelector: React.FC<TaskModelSelectorProps> = ({
  selectedModelId,
  onSelectModel,
  taskType,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(taskType === 'image' ? 'image' : 'all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync category when task type changes
  useEffect(() => {
    if (taskType === 'image') {
      setActiveCategory('image');
    } else if (activeCategory === 'image') {
      setActiveCategory('all');
    }
  }, [taskType]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentModel = getModelById(selectedModelId) || (taskType === 'image' ? getImageModels()[0] : AI_MODELS[0]);

  // Filter models
  const filteredModels = AI_MODELS.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.providerLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeCategory === 'image') return model.isImageModel || model.category === 'image';
    if (activeCategory === 'free') return model.isFree;
    if (activeCategory === 'gemini') return model.provider === 'gemini';
    if (activeCategory === 'anthropic') return model.iconType === 'claude';
    if (activeCategory === 'openai') return model.iconType === 'openai';
    if (activeCategory === 'deepseek') return model.iconType === 'deepseek';
    if (activeCategory === 'nvidia') return model.iconType === 'nvidia';
    if (activeCategory === 'all') return true;

    return true;
  });

  const categories = [
    { id: 'image', label: '🎨 Image Gen' },
    { id: 'all', label: 'All Models' },
    { id: 'free', label: '🎁 Free Tier' },
    { id: 'gemini', label: 'Gemini' },
    { id: 'anthropic', label: 'Claude' },
    { id: 'openai', label: 'OpenAI' },
    { id: 'deepseek', label: 'DeepSeek' },
    { id: 'nvidia', label: 'NVIDIA' },
  ];

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] hover:border-[#58A6FF]/50 text-xs text-[#C9D1D9] transition-all group select-none shadow-sm"
        title="Select AI Model for this Studio Task"
      >
        <ModelIcon type={currentModel.iconType} size={13} className="p-0.5" />
        <span className="font-semibold text-white group-hover:text-[#58A6FF] transition-colors max-w-[150px] truncate">
          {currentModel.name}
        </span>
        {currentModel.isImageModel && (
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#8A2BE2]/20 text-[#D2A8FF] border border-[#8A2BE2]/30 font-medium">
            Image
          </span>
        )}
        {currentModel.isFree && !currentModel.isImageModel && (
          <span className="text-[9px] px-1 py-0.2 rounded bg-[#238636]/20 text-[#3FB950] border border-[#2EA043]/30 font-medium">
            Free
          </span>
        )}
        <ChevronDown
          size={12}
          className={`text-[#8B949E] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#58A6FF]' : ''}`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-[330px] sm:w-[380px] bg-[#161B22] border border-[#30363D] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[460px] animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-2.5 border-b border-[#30363D] bg-[#0D1117]/90 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#58A6FF]" />
                Select Task AI Model
              </span>
              <span className="text-[10px] text-[#8B949E] font-medium">
                {filteredModels.length} models available
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models (e.g. Flux, Imagen, Claude, DeepSeek)..."
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

            {/* Category Filter Tabs */}
            <div className="flex gap-1 mt-2 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
              {categories.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-2 py-0.5 rounded whitespace-nowrap font-medium transition-colors ${
                    activeCategory === tab.id
                      ? 'bg-[#1F6FEB] text-white'
                      : 'bg-[#21262D] text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#30363D]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model List */}
          <div className="overflow-y-auto flex-1 p-1.5 divide-y divide-[#21262D]/50 scrollbar-thin">
            {filteredModels.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8B949E]">
                No matching models found. Try clearing your search.
              </div>
            ) : (
              filteredModels.map((model) => {
                const isSelected = model.id === currentModel.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-all group ${
                      isSelected
                        ? 'bg-[#1F6FEB]/15 border border-[#388BFD]/40'
                        : 'hover:bg-[#21262D] border border-transparent'
                    }`}
                  >
                    <ModelIcon type={model.iconType} size={15} className="mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-[#58A6FF]' : 'text-white group-hover:text-[#58A6FF]'}`}>
                          {model.name}
                        </span>
                        {model.isImageModel && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#8A2BE2]/20 text-[#D2A8FF] border border-[#8A2BE2]/30 font-medium">
                            Image Gen
                          </span>
                        )}
                        {model.isFree && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#238636]/20 text-[#3FB950] border border-[#2EA043]/30 font-medium">
                            Free
                          </span>
                        )}
                        {model.badge && !model.isImageModel && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#58A6FF]/10 text-[#58A6FF] border border-[#58A6FF]/20">
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#8B949E] line-clamp-1 mt-0.5">
                        {model.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-[#6E7681]">
                        <span>{model.providerLabel}</span>
                        <span>•</span>
                        <span>{model.speed}</span>
                        <span>•</span>
                        <span>{model.contextWindow}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-[#58A6FF] shrink-0 mt-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-[#30363D] bg-[#0D1117] flex items-center justify-between text-[10px] text-[#8B949E]">
            <span>Active Model: <strong className="text-white">{currentModel.name}</strong></span>
            {currentModel.isImageModel ? (
              <span className="text-[#D2A8FF]">Visual Synthesis Ready</span>
            ) : (
              <span className="text-[#3FB950]">Grounded & Reasoning</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

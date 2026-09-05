import React from 'react';
import { Sparkles, Brain, Bot, Zap, Terminal, Code2, Flame, Cpu, Eye, Shield, Activity, Image as ImageIcon, Palette, Wand2 } from 'lucide-react';
import { AIModel } from '../types';

interface ModelIconProps {
  type: AIModel['iconType'] | string;
  size?: number;
  className?: string;
}

export const ModelIcon: React.FC<ModelIconProps> = ({ type, size = 14, className = '' }) => {
  switch (type) {
    case 'image':
      return (
        <div className={`flex items-center justify-center rounded bg-[#8A2BE2]/15 text-[#D2A8FF] border border-[#8A2BE2]/30 ${className}`}>
          <ImageIcon size={size} />
        </div>
      );
    case 'flux':
      return (
        <div className={`flex items-center justify-center rounded bg-[#FF7B72]/15 text-[#FF7B72] border border-[#F78166]/30 ${className}`}>
          <Wand2 size={size} />
        </div>
      );
    case 'stability':
      return (
        <div className={`flex items-center justify-center rounded bg-[#E3B341]/15 text-[#F0883E] border border-[#D29922]/30 ${className}`}>
          <Palette size={size} />
        </div>
      );
    case 'gemini':
      return (
        <div className={`flex items-center justify-center rounded bg-gradient-to-br from-[#1F6FEB]/20 to-[#A371F7]/20 text-[#58A6FF] border border-[#388BFD]/30 ${className}`}>
          <Sparkles size={size} />
        </div>
      );
    case 'nvidia':
      return (
        <div className={`flex items-center justify-center rounded bg-[#76B900]/15 text-[#76B900] border border-[#76B900]/30 ${className}`}>
          <Eye size={size} />
        </div>
      );
    case 'minimax':
      return (
        <div className={`flex items-center justify-center rounded bg-[#D2A8FF]/15 text-[#D2A8FF] border border-[#A371F7]/30 ${className}`}>
          <Activity size={size} />
        </div>
      );
    case 'mistral':
      return (
        <div className={`flex items-center justify-center rounded bg-[#FF7000]/15 text-[#FF9E40] border border-[#FF7000]/30 ${className}`}>
          <Flame size={size} />
        </div>
      );
    case 'claude':
      return (
        <div className={`flex items-center justify-center rounded bg-[#D29922]/15 text-[#E3B341] border border-[#D29922]/30 ${className}`}>
          <Brain size={size} />
        </div>
      );
    case 'openai':
      return (
        <div className={`flex items-center justify-center rounded bg-[#238636]/15 text-[#3FB950] border border-[#2EA043]/30 ${className}`}>
          <Bot size={size} />
        </div>
      );
    case 'deepseek':
      return (
        <div className={`flex items-center justify-center rounded bg-[#1F6FEB]/15 text-[#79C0FF] border border-[#1F6FEB]/30 ${className}`}>
          <Code2 size={size} />
        </div>
      );
    case 'meta':
    case 'groq':
      return (
        <div className={`flex items-center justify-center rounded bg-[#F78166]/15 text-[#FF7B72] border border-[#F78166]/30 ${className}`}>
          <Zap size={size} />
        </div>
      );
    case 'qwen':
      return (
        <div className={`flex items-center justify-center rounded bg-[#A371F7]/15 text-[#D2A8FF] border border-[#A371F7]/30 ${className}`}>
          <Cpu size={size} />
        </div>
      );
    case 'ollama':
    default:
      return (
        <div className={`flex items-center justify-center rounded bg-[#8B949E]/15 text-[#C9D1D9] border border-[#30363D] ${className}`}>
          <Terminal size={size} />
        </div>
      );
  }
};


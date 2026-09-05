import React from 'react';
import { ClipboardList, MessageCircle, Bot, Rocket } from 'lucide-react';
import { AgentMode } from '../types';
import { useIDE } from '../context/IDEContext';

const modes: { id: AgentMode; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'plan', label: 'Plan', description: 'Analyze and propose steps before doing work', icon: ClipboardList },
  { id: 'ask', label: 'Ask', description: 'Answer questions without taking action', icon: MessageCircle },
  { id: 'agent', label: 'Agent', description: 'Produce concrete implementation-ready work', icon: Bot },
  { id: 'autonomous', label: 'Autonomous', description: 'Carry the task through with minimal guidance', icon: Rocket },
];

export const AgentModeSelector: React.FC = () => {
  const { agentMode, setAgentMode } = useIDE();
  const selected = modes.find(mode => mode.id === agentMode) || modes[2];
  const Icon = selected.icon;

  return (
    <label className="flex items-center gap-1.5 text-[10px] text-[#8B949E]">
      <span className="hidden sm:inline">Mode</span>
      <Icon size={12} className="text-[#A371F7]" />
      <select
        value={agentMode}
        onChange={event => setAgentMode(event.target.value as AgentMode)}
        title={selected.description}
        className="bg-[#21262D] border border-[#30363D] rounded px-1.5 py-1 text-[10px] text-white outline-none focus:border-[#A371F7]"
      >
        {modes.map(mode => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
      </select>
    </label>
  );
};

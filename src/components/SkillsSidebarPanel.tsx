import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Plus, 
  Search, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  BookOpen, 
  Sliders, 
  ShieldAlert, 
  Cpu, 
  Code2, 
  Layers, 
  RotateCcw,
  GraduationCap
} from 'lucide-react';
import { useIDE } from '../context/IDEContext';
import { SkillCategory, AgentSkill } from '../types';

export const SkillsSidebarPanel = () => {
  const { 
    skills, 
    toggleSkill, 
    resetSkills,
    trainingProfile, 
    updateTrainingProfile,
    trainingExamples,
    setActiveView 
  } = useIDE();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const enabledCount = skills.filter((s) => s.enabled).length;
  const trainedExCount = trainingExamples.filter((e) => e.enabled).length;

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'architecture', label: 'Arch' },
    { id: 'testing', label: 'Test' },
    { id: 'security', label: 'Sec' },
    { id: 'frontend', label: 'UI' },
    { id: 'backend', label: 'API' },
    { id: 'custom', label: 'Custom' }
  ];

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch = 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.triggers.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: SkillCategory) => {
    switch (category) {
      case 'security':
        return <ShieldAlert size={12} className="text-[#F85149]" />;
      case 'testing':
        return <CheckCircle2 size={12} className="text-[#3FB950]" />;
      case 'architecture':
        return <Layers size={12} className="text-[#58A6FF]" />;
      case 'frontend':
        return <Code2 size={12} className="text-[#DB61A2]" />;
      case 'backend':
        return <Cpu size={12} className="text-[#D29922]" />;
      default:
        return <Sparkles size={12} className="text-[#A371F7]" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#161B22] text-[#C9D1D9] select-none text-xs">
      {/* Top Header */}
      <div className="p-3 border-b border-[#30363D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[#A371F7]/15 text-[#A371F7] border border-[#A371F7]/30">
            <BrainCircuit size={14} />
          </div>
          <div>
            <h2 className="font-semibold text-white tracking-wide flex items-center gap-1.5">
              Agent Skills
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-full bg-[#1F6FEB]/20 text-[#58A6FF] border border-[#388BFD]/30">
                Claude-style
              </span>
            </h2>
            <p className="text-[10px] text-[#8B949E]">Train & customize behavior</p>
          </div>
        </div>

        <button
          onClick={() => setActiveView('skills')}
          title="Open Full Training Studio"
          className="p-1.5 rounded hover:bg-[#21262D] text-[#8B949E] hover:text-white transition-colors"
        >
          <ExternalLink size={14} />
        </button>
      </div>

      {/* Persona Quick Switcher */}
      <div className="p-2.5 bg-[#0D1117] border-b border-[#30363D]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8B949E] flex items-center gap-1">
            <Sliders size={11} className="text-[#58A6FF]" />
            Agent Persona
          </span>
          <span className="text-[10px] text-[#58A6FF] font-medium">
            {trainingProfile.persona.replace('-', ' ')}
          </span>
        </div>
        <select
          value={trainingProfile.persona}
          onChange={(e) => updateTrainingProfile({ persona: e.target.value as any })}
          className="w-full bg-[#161B22] border border-[#30363D] rounded px-2 py-1 text-xs text-white outline-none focus:border-[#58A6FF]"
        >
          <option value="senior-architect">Senior Systems Architect</option>
          <option value="concise-engineer">Concise Principal Engineer</option>
          <option value="strict-auditor">Strict Security Auditor</option>
          <option value="mentor">Staff Engineering Mentor</option>
          <option value="custom">Custom Persona</option>
        </select>
      </div>

      {/* Search & Category Filter */}
      <div className="p-2.5 space-y-2 border-b border-[#30363D]">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2 text-[#8B949E]" />
          <input
            type="text"
            placeholder="Search skills or triggers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D1117] text-xs pl-7 pr-2 py-1.5 rounded border border-[#30363D] focus:border-[#58A6FF] text-[#C9D1D9] outline-none placeholder-[#484F58]"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#1F6FEB] text-white'
                  : 'bg-[#21262D] text-[#8B949E] hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skills List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        <div className="flex items-center justify-between px-1 text-[10px] text-[#8B949E] uppercase font-semibold">
          <span>Available Skills ({filteredSkills.length})</span>
          <span>{enabledCount} Active</span>
        </div>

        {filteredSkills.map((skill) => (
          <div
            key={skill.id}
            className={`p-2 rounded border transition-all ${
              skill.enabled 
                ? 'bg-[#0D1117] border-[#30363D] hover:border-[#58A6FF]/50' 
                : 'bg-[#161B22] border-[#21262D] opacity-60 hover:opacity-90'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="shrink-0">{getCategoryIcon(skill.category)}</span>
                <span className="font-medium text-white truncate text-xs">
                  {skill.name}
                </span>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => toggleSkill(skill.id)}
                title={skill.enabled ? 'Click to disable' : 'Click to enable'}
                className={`w-7 h-4 rounded-full transition-colors relative shrink-0 ${
                  skill.enabled ? 'bg-[#238636]' : 'bg-[#30363D]'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform absolute top-0.5 ${
                    skill.enabled ? 'left-3.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <p className="text-[11px] text-[#8B949E] mt-1 line-clamp-2 leading-relaxed">
              {skill.description}
            </p>

            <div className="mt-2 flex items-center justify-between gap-1 text-[10px] text-[#8B949E]">
              <div className="flex items-center gap-1 flex-wrap">
                {skill.triggers.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="px-1 py-0.2 rounded bg-[#21262D] text-[#8B949E] font-mono text-[9px]"
                  >
                    #{t}
                  </span>
                ))}
                {skill.triggers.length > 3 && (
                  <span className="text-[9px] text-[#8B949E]">
                    +{skill.triggers.length - 3}
                  </span>
                )}
              </div>

              {skill.fewShotExamples?.length > 0 && (
                <span className="text-[9px] text-[#A371F7] font-medium bg-[#A371F7]/10 px-1 rounded">
                  {skill.fewShotExamples.length} ex
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredSkills.length === 0 && (
          <div className="text-center py-6 text-[#8B949E] text-xs">
            No skills match your search.
          </div>
        )}
      </div>

      {/* Bottom Actions & Stats */}
      <div className="p-3 border-t border-[#30363D] bg-[#0D1117] space-y-2">
        <div className="flex items-center justify-between text-[11px] text-[#8B949E]">
          <div className="flex items-center gap-1">
            <GraduationCap size={13} className="text-[#A371F7]" />
            <span>Trained Demonstrations</span>
          </div>
          <span className="font-semibold text-white">{trainedExCount} active</span>
        </div>

        <button
          onClick={() => setActiveView('skills')}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-[#21262D] hover:bg-[#30363D] text-white text-xs font-medium transition-colors border border-[#30363D]"
        >
          <BrainCircuit size={13} className="text-[#A371F7]" />
          Open Full Training Studio
        </button>

        <div className="flex items-center justify-between pt-1 text-[10px] text-[#8B949E]">
          <button 
            onClick={resetSkills}
            className="hover:text-white flex items-center gap-1 transition-colors"
            title="Reset to default built-in skills"
          >
            <RotateCcw size={10} /> Reset presets
          </button>
          <span className="text-[#3FB950] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950] inline-block"></span>
            Ready to train
          </span>
        </div>
      </div>
    </div>
  );
};

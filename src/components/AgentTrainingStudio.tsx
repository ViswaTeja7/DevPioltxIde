import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  Search, 
  Sliders, 
  Layers, 
  ShieldAlert, 
  Cpu, 
  Code2, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Download, 
  Upload, 
  ChevronDown, 
  ChevronRight, 
  Send, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Check, 
  Copy, 
  Terminal, 
  ExternalLink,
  Info,
  X,
  Play
} from 'lucide-react';
import { useIDE } from '../context/IDEContext';
import { AgentSkill, SkillCategory, TrainingExample, KnowledgeDoc } from '../types';

type StudioTab = 'skills' | 'training' | 'knowledge' | 'sandbox';

export const AgentTrainingStudio = () => {
  const { 
    skills, 
    addSkill, 
    updateSkill, 
    toggleSkill, 
    deleteSkill, 
    resetSkills,
    trainingProfile, 
    updateTrainingProfile,
    trainingExamples,
    addTrainingExample,
    updateTrainingExample,
    deleteTrainingExample,
    knowledgeDocs,
    addKnowledgeDoc,
    updateKnowledgeDoc,
    deleteKnowledgeDoc,
    selectedModel,
    llmConfig,
    setActiveView
  } = useIDE();

  const [activeTab, setActiveTab] = useState<StudioTab>('skills');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal States
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<AgentSkill | null>(null);

  const [isExampleModalOpen, setIsExampleModalOpen] = useState(false);
  const [editingExample, setEditingExample] = useState<TrainingExample | null>(null);

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDoc | null>(null);

  // Sandbox State
  const [sandboxPrompt, setSandboxPrompt] = useState('');
  const [sandboxOutput, setSandboxOutput] = useState('');
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxMetadata, setSandboxMetadata] = useState<any>(null);

  // Strict Rule input state
  const [newRuleInput, setNewRuleInput] = useState('');

  const enabledSkillsCount = skills.filter((s) => s.enabled).length;
  const enabledExamplesCount = trainingExamples.filter((e) => e.enabled).length;
  const enabledDocsCount = knowledgeDocs.filter((d) => d.enabled).length;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportSkillsJSON = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      trainingProfile,
      skills,
      trainingExamples,
      knowledgeDocs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devpilotx-agent-skills-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSkillsJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.skills)) {
          parsed.skills.forEach((s: AgentSkill) => {
            if (!skills.some(existing => existing.id === s.id)) {
              addSkill(s);
            }
          });
        }
        if (Array.isArray(parsed.trainingExamples)) {
          parsed.trainingExamples.forEach((ex: TrainingExample) => {
            if (!trainingExamples.some(existing => existing.id === ex.id)) {
              addTrainingExample(ex);
            }
          });
        }
        alert('Skills and training data imported successfully!');
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Run Sandbox Evaluation
  const handleRunSandbox = async () => {
    if (!sandboxPrompt.trim() || sandboxLoading) return;
    setSandboxLoading(true);
    setSandboxOutput('');
    setSandboxMetadata(null);

    const startTime = Date.now();
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: sandboxPrompt }],
          provider: llmConfig.provider,
          modelId: llmConfig.selectedModelId,
          keys: llmConfig.keys,
          skills: skills.filter(s => s.enabled),
          trainingProfile,
          trainingExamples: trainingExamples.filter(e => e.enabled),
          knowledgeDocs: knowledgeDocs.filter(d => d.enabled)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Evaluation failed');

      setSandboxOutput(data.text || '');
      setSandboxMetadata({
        timeMs: Date.now() - startTime,
        model: selectedModel.name,
        activeSkills: skills.filter(s => s.enabled).map(s => s.name)
      });
    } catch (err: any) {
      setSandboxOutput(`[Sandbox Error]: ${err.message}`);
    } finally {
      setSandboxLoading(false);
    }
  };

  const handleSaveSandboxAsTrainingExample = () => {
    setEditingExample({
      id: '',
      title: sandboxPrompt.slice(0, 40) + '...',
      category: 'General',
      userPrompt: sandboxPrompt,
      idealResponse: sandboxOutput,
      tags: ['sandbox-verified'],
      enabled: true,
      createdAt: new Date().toISOString()
    });
    setIsExampleModalOpen(true);
  };

  const getCategoryIcon = (category: SkillCategory) => {
    switch (category) {
      case 'security':
        return <ShieldAlert size={14} className="text-[#F85149]" />;
      case 'testing':
        return <CheckCircle2 size={14} className="text-[#3FB950]" />;
      case 'architecture':
        return <Layers size={14} className="text-[#58A6FF]" />;
      case 'frontend':
        return <Code2 size={14} className="text-[#DB61A2]" />;
      case 'backend':
        return <Cpu size={14} className="text-[#D29922]" />;
      default:
        return <Sparkles size={14} className="text-[#A371F7]" />;
    }
  };

  const filteredSkills = skills.filter((s) => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.triggers.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0D1117] text-[#C9D1D9] overflow-hidden">
      {/* Top Banner Header */}
      <div className="border-b border-[#30363D] bg-[#161B22]/90 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#A371F7]/25 to-[#1F6FEB]/25 border border-[#A371F7]/40 text-[#A371F7]">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Agent Skills & Training Studio
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#A371F7]/15 text-[#A371F7] border border-[#A371F7]/30">
                  Claude-Style Extensible Brain
                </span>
              </h1>
              <p className="text-xs text-[#8B949E] mt-0.5">
                Equip your coding agent with specialized skills, teach patterns through few-shot exemplars, and tune behavior.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === 'sandbox'
                ? 'bg-[#A371F7] text-white shadow-sm'
                : 'bg-[#21262D] text-[#C9D1D9] hover:bg-[#30363D] hover:text-white border border-[#30363D]'
            }`}
          >
            <Play size={13} fill={activeTab === 'sandbox' ? 'currentColor' : 'none'} />
            Evaluate in Sandbox
          </button>

          <button
            onClick={exportSkillsJSON}
            title="Export skills and training datasets as JSON"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] hover:text-white border border-[#30363D] text-xs font-medium transition-colors"
          >
            <Download size={13} />
            Export JSON
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] hover:text-white border border-[#30363D] text-xs font-medium cursor-pointer transition-colors">
            <Upload size={13} />
            Import
            <input type="file" accept=".json" onChange={importSkillsJSON} className="hidden" />
          </label>

          <button
            onClick={() => setActiveView('editor')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-medium transition-colors"
          >
            Return to Editor
          </button>
        </div>
      </div>

      {/* Metric Cards Quick Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 border-b border-[#30363D] bg-[#0D1117] text-xs">
        <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#30363D] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider">Active Skills</div>
            <div className="text-base font-bold text-white mt-0.5">
              {enabledSkillsCount} <span className="text-xs text-[#8B949E] font-normal">/ {skills.length}</span>
            </div>
          </div>
          <div className="p-2 rounded bg-[#58A6FF]/10 text-[#58A6FF]">
            <BrainCircuit size={16} />
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#30363D] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider">Training Exemplars</div>
            <div className="text-base font-bold text-[#A371F7] mt-0.5">
              {enabledExamplesCount} <span className="text-xs text-[#8B949E] font-normal">active pairs</span>
            </div>
          </div>
          <div className="p-2 rounded bg-[#A371F7]/10 text-[#A371F7]">
            <GraduationCap size={16} />
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#30363D] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider">Project Docs</div>
            <div className="text-base font-bold text-[#3FB950] mt-0.5">
              {enabledDocsCount} <span className="text-xs text-[#8B949E] font-normal">in context</span>
            </div>
          </div>
          <div className="p-2 rounded bg-[#3FB950]/10 text-[#3FB950]">
            <BookOpen size={16} />
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#30363D] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider">Agent Persona</div>
            <div className="text-xs font-semibold text-white mt-0.5 truncate max-w-[140px]">
              {trainingProfile.persona.replace('-', ' ')}
            </div>
          </div>
          <div className="p-2 rounded bg-[#D29922]/10 text-[#D29922]">
            <Sliders size={16} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#30363D] px-6 bg-[#161B22] gap-2">
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'skills'
              ? 'border-[#A371F7] text-white'
              : 'border-transparent text-[#8B949E] hover:text-white'
          }`}
        >
          <Sparkles size={14} className={activeTab === 'skills' ? 'text-[#A371F7]' : ''} />
          Skills Library ({skills.length})
        </button>

        <button
          onClick={() => setActiveTab('training')}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'training'
              ? 'border-[#A371F7] text-white'
              : 'border-transparent text-[#8B949E] hover:text-white'
          }`}
        >
          <GraduationCap size={14} className={activeTab === 'training' ? 'text-[#A371F7]' : ''} />
          Train Agent & Persona ({trainingExamples.length})
        </button>

        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'knowledge'
              ? 'border-[#A371F7] text-white'
              : 'border-transparent text-[#8B949E] hover:text-white'
          }`}
        >
          <BookOpen size={14} className={activeTab === 'knowledge' ? 'text-[#A371F7]' : ''} />
          Project Knowledge Base ({knowledgeDocs.length})
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'sandbox'
              ? 'border-[#A371F7] text-white'
              : 'border-transparent text-[#8B949E] hover:text-white'
          }`}
        >
          <Terminal size={14} className={activeTab === 'sandbox' ? 'text-[#A371F7]' : ''} />
          Evaluation Sandbox
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: SKILLS LIBRARY */}
        {activeTab === 'skills' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#161B22] p-3 rounded-lg border border-[#30363D]">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search size={14} className="absolute left-3 top-2.5 text-[#8B949E]" />
                  <input
                    type="text"
                    placeholder="Search skills by name, keywords, or triggers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0D1117] text-xs pl-9 pr-3 py-2 rounded-md border border-[#30363D] focus:border-[#58A6FF] text-[#C9D1D9] outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto">
                  {['all', 'architecture', 'testing', 'security', 'frontend', 'backend', 'custom'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded text-xs font-medium capitalize shrink-0 transition-colors ${
                        selectedCategory === cat
                          ? 'bg-[#1F6FEB] text-white'
                          : 'bg-[#21262D] text-[#8B949E] hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetSkills}
                  title="Reset to default built-in skills"
                  className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#21262D] hover:bg-[#30363D] text-[#8B949E] hover:text-white text-xs transition-colors border border-[#30363D]"
                >
                  <RotateCcw size={12} />
                  Reset Defaults
                </button>

                <button
                  onClick={() => {
                    setEditingSkill(null);
                    setIsSkillModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-medium transition-colors shadow-sm"
                >
                  <Plus size={14} />
                  Add Custom Skill
                </button>
              </div>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSkills.map((skill) => {
                const isExpanded = expandedSkillId === skill.id;

                return (
                  <div
                    key={skill.id}
                    className={`rounded-xl border transition-all flex flex-col ${
                      skill.enabled 
                        ? 'bg-[#161B22] border-[#30363D] shadow-sm hover:border-[#58A6FF]/40' 
                        : 'bg-[#161B22]/50 border-[#21262D] opacity-75 hover:opacity-90'
                    }`}
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-[#30363D]/60 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-[#0D1117] border border-[#30363D] shrink-0 mt-0.5">
                          {getCategoryIcon(skill.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white text-sm">
                              {skill.name}
                            </h3>
                            {skill.isBuiltin ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#30363D] text-[#8B949E]">
                                Built-in
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#A371F7]/20 text-[#A371F7] border border-[#A371F7]/30">
                                Custom
                              </span>
                            )}
                            <span className="text-[10px] uppercase font-bold text-[#8B949E] bg-[#0D1117] px-1.5 py-0.2 rounded border border-[#30363D]">
                              {skill.category}
                            </span>
                          </div>
                          <p className="text-xs text-[#8B949E] mt-1 leading-relaxed">
                            {skill.description}
                          </p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleSkill(skill.id)}
                        className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                          skill.enabled ? 'bg-[#238636]' : 'bg-[#30363D]'
                        }`}
                        title={skill.enabled ? 'Enabled (click to disable)' : 'Disabled (click to enable)'}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                            skill.enabled ? 'left-4.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Trigger Keywords */}
                    <div className="px-4 py-2.5 bg-[#0D1117]/60 flex items-center justify-between gap-2 text-xs border-b border-[#30363D]/40">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-[#8B949E] font-medium uppercase tracking-wider">Triggers:</span>
                        {skill.triggers.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded bg-[#21262D] text-[#58A6FF] font-mono text-[10px]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      <span className="text-[11px] text-[#A371F7] font-medium">
                        {skill.fewShotExamples?.length || 0} exemplars
                      </span>
                    </div>

                    {/* Expandable Instructions Preview */}
                    {isExpanded && (
                      <div className="p-4 bg-[#0D1117] text-xs space-y-3 border-b border-[#30363D]">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              <Code2 size={13} className="text-[#58A6FF]" />
                              System Instructions / Guidelines
                            </span>
                            <button
                              onClick={() => handleCopy(skill.systemPrompt, `prompt-${skill.id}`)}
                              className="text-[#8B949E] hover:text-white flex items-center gap-1 text-[11px]"
                            >
                              {copiedId === `prompt-${skill.id}` ? <Check size={12} className="text-[#3FB950]" /> : <Copy size={12} />}
                              Copy
                            </button>
                          </div>
                          <pre className="p-2.5 rounded bg-[#161B22] border border-[#30363D] font-mono text-[11px] text-[#C9D1D9] whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {skill.systemPrompt}
                          </pre>
                        </div>

                        {skill.fewShotExamples && skill.fewShotExamples.length > 0 && (
                          <div>
                            <div className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
                              <GraduationCap size={13} className="text-[#A371F7]" />
                              Few-Shot Demonstrations ({skill.fewShotExamples.length})
                            </div>
                            <div className="space-y-2">
                              {skill.fewShotExamples.map((ex, idx) => (
                                <div key={idx} className="p-2 rounded bg-[#161B22] border border-[#30363D] space-y-1">
                                  <div className="text-[11px] font-medium text-[#58A6FF]">
                                    Query: {ex.userQuery}
                                  </div>
                                  <div className="text-[10px] text-[#8B949E] font-mono whitespace-pre-wrap line-clamp-3">
                                    {ex.assistantResponse}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className="px-4 py-2.5 flex items-center justify-between text-xs mt-auto">
                      <button
                        onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}
                        className="flex items-center gap-1 text-[#8B949E] hover:text-white transition-colors"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {isExpanded ? 'Hide Details' : 'View Guidelines & Examples'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingSkill(skill);
                            setIsSkillModalOpen(true);
                          }}
                          className="p-1 rounded hover:bg-[#21262D] text-[#8B949E] hover:text-white transition-colors"
                          title="Edit Skill"
                        >
                          <Edit3 size={13} />
                        </button>
                        {!skill.isBuiltin && (
                          <button
                            onClick={() => deleteSkill(skill.id)}
                            className="p-1 rounded hover:bg-[#21262D] text-[#F85149] hover:text-red-400 transition-colors"
                            title="Delete Skill"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: TRAIN AGENT & PERSONA */}
        {activeTab === 'training' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Persona & Behavioral Profile Section */}
            <div className="p-5 rounded-xl bg-[#161B22] border border-[#30363D] space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders size={16} className="text-[#58A6FF]" />
                    Agent Persona & Custom Directives
                  </h2>
                  <p className="text-xs text-[#8B949E] mt-0.5">
                    Define the core mindset, guardrails, and tone the agent must embody across all chats and tasks.
                  </p>
                </div>

                <select
                  value={trainingProfile.persona}
                  onChange={(e) => updateTrainingProfile({ persona: e.target.value as any })}
                  className="bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#58A6FF]"
                >
                  <option value="senior-architect">Senior Systems Architect</option>
                  <option value="concise-engineer">Concise Principal Engineer</option>
                  <option value="strict-auditor">Strict Security Auditor</option>
                  <option value="mentor">Staff Engineering Mentor</option>
                  <option value="custom">Custom Persona</option>
                </select>
              </div>

              {/* Custom Directives Textarea */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Custom System Directives
                </label>
                <textarea
                  rows={3}
                  value={trainingProfile.customSystemInstructions}
                  onChange={(e) => updateTrainingProfile({ customSystemInstructions: e.target.value })}
                  placeholder="e.g. Always write full code solutions without omitting lines. Never introduce unnecessary third party libraries. Prefer functional programming patterns."
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-xs text-[#C9D1D9] outline-none focus:border-[#58A6FF] font-sans leading-relaxed"
                />
              </div>

              {/* Strict Rules / Guardrails */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Strict Guardrails & Negative Constraints
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add strict rule (e.g., 'Never use any in TypeScript', 'Always write tests using Vitest')"
                      value={newRuleInput}
                      onChange={(e) => setNewRuleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newRuleInput.trim()) {
                          updateTrainingProfile({ strictRules: [...trainingProfile.strictRules, newRuleInput.trim()] });
                          setNewRuleInput('');
                        }
                      }}
                      className="flex-1 bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#58A6FF]"
                    />
                    <button
                      onClick={() => {
                        if (newRuleInput.trim()) {
                          updateTrainingProfile({ strictRules: [...trainingProfile.strictRules, newRuleInput.trim()] });
                          setNewRuleInput('');
                        }
                      }}
                      className="px-3 py-2 bg-[#21262D] hover:bg-[#30363D] text-white rounded-lg text-xs font-medium border border-[#30363D]"
                    >
                      Add Rule
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {trainingProfile.strictRules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0D1117] border border-[#30363D] text-xs text-[#C9D1D9]"
                      >
                        <ShieldAlert size={12} className="text-[#F85149]" />
                        <span>{rule}</span>
                        <button
                          onClick={() => {
                            const updated = trainingProfile.strictRules.filter((_, i) => i !== idx);
                            updateTrainingProfile({ strictRules: updated });
                          }}
                          className="hover:text-white text-[#8B949E]"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Team Conventions */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Team Coding Conventions
                </label>
                <textarea
                  rows={2}
                  value={trainingProfile.teamConventions}
                  onChange={(e) => updateTrainingProfile({ teamConventions: e.target.value })}
                  placeholder="e.g. Tailwind CSS for styles, Lucide for icons, PascalCase for component files, named exports."
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-xs text-[#C9D1D9] outline-none focus:border-[#58A6FF]"
                />
              </div>
            </div>

            {/* Few-Shot Demonstrations Section */}
            <div className="p-5 rounded-xl bg-[#161B22] border border-[#30363D] space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <GraduationCap size={16} className="text-[#A371F7]" />
                    Few-Shot Demonstrations (User-Trained Patterns)
                  </h2>
                  <p className="text-xs text-[#8B949E] mt-0.5">
                    Teach the agent your exact preferred code style by showing input/output exemplar pairs.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingExample(null);
                    setIsExampleModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-medium transition-colors"
                >
                  <Plus size={14} />
                  Add Demonstration
                </button>
              </div>

              {/* Demonstrations List */}
              <div className="space-y-3">
                {trainingExamples.map((ex) => (
                  <div
                    key={ex.id}
                    className={`p-4 rounded-xl border transition-all ${
                      ex.enabled 
                        ? 'bg-[#0D1117] border-[#30363D]' 
                        : 'bg-[#0D1117]/50 border-[#21262D] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{ex.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#21262D] text-[#58A6FF] font-medium">
                          {ex.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateTrainingExample(ex.id, { enabled: !ex.enabled })}
                          className={`w-7 h-4 rounded-full transition-colors relative ${
                            ex.enabled ? 'bg-[#238636]' : 'bg-[#30363D]'
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full bg-white transition-transform absolute top-0.5 ${
                              ex.enabled ? 'left-3.5' : 'left-0.5'
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => {
                            setEditingExample(ex);
                            setIsExampleModalOpen(true);
                          }}
                          className="p-1 rounded hover:bg-[#21262D] text-[#8B949E] hover:text-white"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => deleteTrainingExample(ex.id)}
                          className="p-1 rounded hover:bg-[#21262D] text-[#F85149]"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                      <div className="p-3 rounded-lg bg-[#161B22] border border-[#30363D]">
                        <div className="text-[10px] uppercase font-bold text-[#8B949E] mb-1">
                          User Prompt
                        </div>
                        <div className="text-white text-xs line-clamp-3">
                          {ex.userPrompt}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#161B22] border border-[#30363D]">
                        <div className="text-[10px] uppercase font-bold text-[#A371F7] mb-1">
                          Target Assistant Output
                        </div>
                        <pre className="text-xs font-mono text-[#C9D1D9] line-clamp-3 whitespace-pre-wrap">
                          {ex.idealResponse}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROJECT KNOWLEDGE BASE */}
        {activeTab === 'knowledge' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#161B22] border border-[#30363D]">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen size={16} className="text-[#3FB950]" />
                  Project Context & Knowledge Base
                </h2>
                <p className="text-xs text-[#8B949E] mt-0.5">
                  Inject custom architecture documents, schema definitions, and internal API specs into the agent's memory.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingDoc(null);
                  setIsDocModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-medium transition-colors"
              >
                <Plus size={14} />
                Add Document
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {knowledgeDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    doc.enabled ? 'bg-[#161B22] border-[#30363D]' : 'bg-[#161B22]/50 border-[#21262D] opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-semibold text-white text-sm">{doc.title}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#0D1117] text-[#58A6FF] border border-[#30363D] mt-1 inline-block">
                          {doc.category}
                        </span>
                      </div>

                      <button
                        onClick={() => updateKnowledgeDoc(doc.id, { enabled: !doc.enabled })}
                        className={`w-8 h-4.5 rounded-full transition-colors relative shrink-0 ${
                          doc.enabled ? 'bg-[#238636]' : 'bg-[#30363D]'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                            doc.enabled ? 'left-4' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <pre className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D] text-[11px] font-mono text-[#8B949E] line-clamp-6 whitespace-pre-wrap mt-3">
                      {doc.content}
                    </pre>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-[#30363D]/60">
                    <span className="text-[10px] text-[#8B949E]">
                      Updated {new Date(doc.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingDoc(doc);
                          setIsDocModalOpen(true);
                        }}
                        className="p-1 rounded hover:bg-[#21262D] text-[#8B949E] hover:text-white"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => deleteKnowledgeDoc(doc.id)}
                        className="p-1 rounded hover:bg-[#21262D] text-[#F85149]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EVALUATION SANDBOX */}
        {activeTab === 'sandbox' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D]">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal size={16} className="text-[#A371F7]" />
                    Live Agent Training Sandbox
                  </h2>
                  <p className="text-xs text-[#8B949E] mt-0.5">
                    Test your agent in real-time with the currently active skills, persona instructions, and few-shot exemplars.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#8B949E]">Testing with:</span>
                  <span className="px-2.5 py-1 rounded bg-[#0D1117] border border-[#30363D] text-white font-medium">
                    {selectedModel.name}
                  </span>
                </div>
              </div>

              {/* Active Skill Pills */}
              <div className="flex items-center gap-1.5 flex-wrap p-2.5 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs">
                <span className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mr-1">
                  Active Skills in Context:
                </span>
                {skills.filter(s => s.enabled).map(s => (
                  <span key={s.id} className="px-2 py-0.5 rounded-full bg-[#1F6FEB]/15 text-[#58A6FF] border border-[#388BFD]/30 text-[10px]">
                    ⚡ {s.name}
                  </span>
                ))}
                {skills.filter(s => s.enabled).length === 0 && (
                  <span className="text-xs text-[#8B949E] italic">No skills currently enabled</span>
                )}
              </div>

              {/* Prompt Input */}
              <div className="mt-3 space-y-2">
                <textarea
                  rows={3}
                  value={sandboxPrompt}
                  onChange={(e) => setSandboxPrompt(e.target.value)}
                  placeholder="Enter a prompt or code task to test the trained agent's behavior (e.g. 'Refactor this API handler to include robust input validation and logging')..."
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-xs text-white outline-none focus:border-[#58A6FF] leading-relaxed"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-[#8B949E]">
                    <span>Sample tests:</span>
                    <button
                      onClick={() => setSandboxPrompt("Write a TypeScript service for user authentication with password hashing and JWT token issuance.")}
                      className="text-[#58A6FF] hover:underline"
                    >
                      Auth Service
                    </button>
                    •
                    <button
                      onClick={() => setSandboxPrompt("Refactor a React component with state props to strictly adhere to Clean Architecture principles.")}
                      className="text-[#58A6FF] hover:underline"
                    >
                      Clean Code
                    </button>
                    •
                    <button
                      onClick={() => setSandboxPrompt("Write Vitest unit tests for a shopping cart calculation module.")}
                      className="text-[#58A6FF] hover:underline"
                    >
                      Vitest TDD
                    </button>
                  </div>

                  <button
                    onClick={handleRunSandbox}
                    disabled={sandboxLoading || !sandboxPrompt.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#238636] hover:bg-[#2EA043] disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    {sandboxLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        Run Test
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Response Area */}
            {sandboxOutput && (
              <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D] space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#30363D]/60 pb-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-white">Agent Output</span>
                    {sandboxMetadata && (
                      <span className="text-[#8B949E] text-[11px]">
                        ({sandboxMetadata.timeMs}ms using {sandboxMetadata.model})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(sandboxOutput, 'sandbox-out')}
                      className="flex items-center gap-1 text-xs text-[#8B949E] hover:text-white px-2 py-1 rounded bg-[#0D1117] border border-[#30363D]"
                    >
                      {copiedId === 'sandbox-out' ? <Check size={12} className="text-[#3FB950]" /> : <Copy size={12} />}
                      Copy Output
                    </button>

                    <button
                      onClick={handleSaveSandboxAsTrainingExample}
                      className="flex items-center gap-1.5 text-xs text-white px-2.5 py-1 rounded bg-[#A371F7] hover:bg-[#8957e5] font-medium transition-colors"
                      title="Add this prompt and response pair to your trained demonstrations"
                    >
                      <GraduationCap size={13} />
                      Save as Training Exemplar
                    </button>
                  </div>
                </div>

                <pre className="p-4 rounded-lg bg-[#0D1117] border border-[#30363D] font-mono text-xs text-[#C9D1D9] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {sandboxOutput}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE / EDIT SKILL MODAL */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
            <div className="p-4 border-b border-[#30363D] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <BrainCircuit size={16} className="text-[#A371F7]" />
                {editingSkill ? 'Edit Skill' : 'Create Custom Claude Skill'}
              </h3>
              <button onClick={() => setIsSkillModalOpen(false)} className="text-[#8B949E] hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                const category = (form.elements.namedItem('category') as HTMLSelectElement).value as SkillCategory;
                const description = (form.elements.namedItem('description') as HTMLInputElement).value;
                const triggers = (form.elements.namedItem('triggers') as HTMLInputElement).value
                  .split(',')
                  .map(t => t.trim().toLowerCase().replace(/^#/, ''))
                  .filter(Boolean);
                const systemPrompt = (form.elements.namedItem('systemPrompt') as HTMLTextAreaElement).value;

                if (editingSkill) {
                  updateSkill(editingSkill.id, { name, category, description, triggers, systemPrompt });
                } else {
                  addSkill({
                    name,
                    category,
                    description,
                    enabled: true,
                    triggers,
                    systemPrompt,
                    fewShotExamples: []
                  });
                }
                setIsSkillModalOpen(false);
              }}
              className="p-5 overflow-y-auto space-y-4 flex-1"
            >
              <div>
                <label className="block text-white font-semibold mb-1">Skill Name</label>
                <input
                  name="name"
                  defaultValue={editingSkill?.name || ''}
                  required
                  placeholder="e.g. GraphQL Apollo Architect"
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-white outline-none focus:border-[#58A6FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-semibold mb-1">Category</label>
                  <select
                    name="category"
                    defaultValue={editingSkill?.category || 'custom'}
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-white outline-none focus:border-[#58A6FF]"
                  >
                    <option value="custom">Custom</option>
                    <option value="architecture">Architecture</option>
                    <option value="testing">Testing</option>
                    <option value="security">Security</option>
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="devops">DevOps</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-1">Triggers (comma separated)</label>
                  <input
                    name="triggers"
                    defaultValue={editingSkill?.triggers.join(', ') || ''}
                    placeholder="e.g. graphql, apollo, schema"
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-white outline-none focus:border-[#58A6FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-1">Description</label>
                <input
                  name="description"
                  defaultValue={editingSkill?.description || ''}
                  required
                  placeholder="Summary of when and how the agent applies this skill"
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-white outline-none focus:border-[#58A6FF]"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-1">
                  System Instructions / Behavioral Guidelines (Markdown supported)
                </label>
                <textarea
                  name="systemPrompt"
                  rows={8}
                  defaultValue={editingSkill?.systemPrompt || ''}
                  required
                  placeholder="Enter the detailed behavioral instructions the agent will follow when this skill is active..."
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded p-3 text-white font-mono text-xs outline-none focus:border-[#58A6FF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#30363D]">
                <button
                  type="button"
                  onClick={() => setIsSkillModalOpen(false)}
                  className="px-4 py-2 rounded bg-[#21262D] hover:bg-[#30363D] text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#238636] hover:bg-[#2EA043] text-white font-medium"
                >
                  {editingSkill ? 'Save Changes' : 'Create Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TRAINING EXAMPLE MODAL */}
      {isExampleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
            <div className="p-4 border-b border-[#30363D] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <GraduationCap size={16} className="text-[#A371F7]" />
                {editingExample?.id ? 'Edit Training Demonstration' : 'Add Training Demonstration'}
              </h3>
              <button onClick={() => setIsExampleModalOpen(false)} className="text-[#8B949E] hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                const category = (form.elements.namedItem('category') as HTMLInputElement).value;
                const userPrompt = (form.elements.namedItem('userPrompt') as HTMLTextAreaElement).value;
                const idealResponse = (form.elements.namedItem('idealResponse') as HTMLTextAreaElement).value;

                if (editingExample?.id) {
                  updateTrainingExample(editingExample.id, { title, category, userPrompt, idealResponse });
                } else {
                  addTrainingExample({
                    title,
                    category,
                    userPrompt,
                    idealResponse,
                    tags: ['custom'],
                    enabled: true
                  });
                }
                setIsExampleModalOpen(false);
              }}
              className="p-5 overflow-y-auto space-y-4 flex-1"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-semibold mb-1">Title</label>
                  <input
                    name="title"
                    defaultValue={editingExample?.title || ''}
                    required
                    placeholder="e.g. Linear Guard Clauses"
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-white outline-none focus:border-[#58A6FF]"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-1">Category</label>
                  <input
                    name="category"
                    defaultValue={editingExample?.category || 'General'}
                    placeholder="e.g. Refactoring, Architecture"
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-white outline-none focus:border-[#58A6FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-1">User Query / Prompt</label>
                <textarea
                  name="userPrompt"
                  rows={3}
                  defaultValue={editingExample?.userPrompt || ''}
                  required
                  placeholder="The user prompt that triggers this response pattern..."
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded p-3 text-white outline-none focus:border-[#58A6FF]"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-1">Ideal Assistant Response (Exemplar)</label>
                <textarea
                  name="idealResponse"
                  rows={8}
                  defaultValue={editingExample?.idealResponse || ''}
                  required
                  placeholder="The exact code formatting, tone, and response structure the agent should learn..."
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded p-3 text-white font-mono text-xs outline-none focus:border-[#58A6FF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#30363D]">
                <button
                  type="button"
                  onClick={() => setIsExampleModalOpen(false)}
                  className="px-4 py-2 rounded bg-[#21262D] hover:bg-[#30363D] text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#238636] hover:bg-[#2EA043] text-white font-medium"
                >
                  Save Demonstration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT KNOWLEDGE DOC MODAL */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
            <div className="p-4 border-b border-[#30363D] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <BookOpen size={16} className="text-[#3FB950]" />
                {editingDoc ? 'Edit Knowledge Document' : 'Add Knowledge Document'}
              </h3>
              <button onClick={() => setIsDocModalOpen(false)} className="text-[#8B949E] hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                const category = (form.elements.namedItem('category') as HTMLInputElement).value;
                const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;

                if (editingDoc) {
                  updateKnowledgeDoc(editingDoc.id, { title, category, content });
                } else {
                  addKnowledgeDoc({
                    title,
                    category,
                    content,
                    enabled: true
                  });
                }
                setIsDocModalOpen(false);
              }}
              className="p-5 overflow-y-auto space-y-4 flex-1"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-semibold mb-1">Title</label>
                  <input
                    name="title"
                    defaultValue={editingDoc?.title || ''}
                    required
                    placeholder="e.g. Internal Auth Architecture"
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-white outline-none focus:border-[#58A6FF]"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-1">Category</label>
                  <input
                    name="category"
                    defaultValue={editingDoc?.category || 'Architecture'}
                    placeholder="e.g. Database, API, Security"
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-white outline-none focus:border-[#58A6FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-1">Document Content</label>
                <textarea
                  name="content"
                  rows={10}
                  defaultValue={editingDoc?.content || ''}
                  required
                  placeholder="Markdown or text content describing schemas, architectural constraints, or workflows..."
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded p-3 text-white font-mono text-xs outline-none focus:border-[#58A6FF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#30363D]">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 rounded bg-[#21262D] hover:bg-[#30363D] text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#238636] hover:bg-[#2EA043] text-white font-medium"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

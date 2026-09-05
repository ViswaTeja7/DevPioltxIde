import React, { useState, useRef, useEffect } from 'react';
import { useIDE } from '../context/IDEContext';
import { TaskType, TaskChatMessage } from '../types';
import { TaskModelSelector } from './TaskModelSelector';
import { ModelIcon } from './ModelIcon';
import { DEFAULT_MODEL_ID, DEFAULT_IMAGE_MODEL_ID, getModelById } from '../constants/models';
import {
  Image as ImageIcon,
  Search,
  FileText,
  Lightbulb,
  MessageSquare,
  Send,
  Download,
  FolderPlus,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Trash2,
  Sparkles,
  ExternalLink,
  ZoomIn,
  X,
  Compass,
  Layers,
  Wand2,
  Globe,
  BookOpen,
  ArrowUpRight,
  RefreshCw,
  Eye,
  Bot
} from 'lucide-react';
import { AgentModeSelector } from './AgentModeSelector';

interface TaskStudioProps {
  mode?: 'sidebar' | 'fullscreen';
}

export const TaskStudio: React.FC<TaskStudioProps> = ({ mode = 'sidebar' }) => {
  const {
    taskChatHistory,
    addTaskChatMessage,
    clearTaskChatHistory,
    activeTaskType,
    setActiveTaskType,
    saveAssetToProject,
    activeView,
    setActiveView,
    setActiveActivity,
    llmConfig,
    agentMode
  } = useIDE();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; prompt: string } | null>(null);

  // Model selection state for Task Studio
  const [selectedTaskModelId, setSelectedTaskModelId] = useState<string>(
    activeTaskType === 'image' ? DEFAULT_IMAGE_MODEL_ID : (llmConfig?.selectedModelId || DEFAULT_MODEL_ID)
  );

  // Automatically adjust model selection when switching between image and non-image tasks
  useEffect(() => {
    const currentModel = getModelById(selectedTaskModelId);
    if (activeTaskType === 'image') {
      if (!currentModel?.isImageModel) {
        setSelectedTaskModelId(DEFAULT_IMAGE_MODEL_ID);
      }
    } else {
      if (currentModel?.isImageModel) {
        setSelectedTaskModelId(llmConfig?.selectedModelId || DEFAULT_MODEL_ID);
      }
    }
  }, [activeTaskType]);

  // Task-specific options
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [imageStyle, setImageStyle] = useState<string>('modern');
  const [imageEngine, setImageEngine] = useState<'auto' | 'neural' | 'gemini'>('auto');
  const [researchDepth, setResearchDepth] = useState<'detailed' | 'brief' | 'comprehensive'>('detailed');
  const [docFormat, setDocFormat] = useState<'prd' | 'adr' | 'api' | 'readme'>('prd');
  const [filterTaskType, setFilterTaskType] = useState<TaskType | 'all'>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [taskChatHistory, isLoading]);

  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || isLoading) return;

    const userText = promptToSend.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    addTaskChatMessage({
      role: 'user',
      taskType: activeTaskType,
      content: userText,
      metadata: {
        query: userText,
        depth: researchDepth,
        docType: docFormat
      }
    });

    try {
      const activeModel = getModelById(selectedTaskModelId);

      if (activeTaskType === 'image') {
        setLoadingPhase(`Synthesizing visual assets with ${activeModel.name}...`);
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userText,
            aspectRatio,
            style: imageStyle,
            engine: imageEngine,
            modelId: selectedTaskModelId,
            keys: llmConfig?.keys,
            agentMode
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to generate image');

        addTaskChatMessage({
          role: 'assistant',
          taskType: 'image',
          content: data.textFeedback || `Generated graphic asset for: "${userText}"`,
          images: [
            {
              url: data.imageUrl,
              prompt: userText,
              aspectRatio: data.aspectRatio,
              style: data.style
            }
          ],
          metadata: {
            modelUsed: data.modelUsed || activeModel.name
          }
        });
      } else if (activeTaskType === 'research') {
        setLoadingPhase(`Gathering live web data and structuring research briefing with ${activeModel.name}...`);
        const res = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userText,
            depth: researchDepth,
            focusArea: 'technical',
            modelId: selectedTaskModelId,
            keys: llmConfig?.keys,
            agentMode
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Research failed');

        addTaskChatMessage({
          role: 'assistant',
          taskType: 'research',
          content: data.report || 'Research findings compiled.',
          sources: data.sources || [],
          metadata: {
            query: userText,
            depth: researchDepth,
            modelUsed: data.modelUsed || activeModel.name
          }
        });
      } else {
        // Docs, Brainstorming, or General
        setLoadingPhase(
          activeTaskType === 'docs'
            ? `Authoring technical specification with ${activeModel.name}...`
            : activeTaskType === 'brainstorm'
            ? `Synthesizing product ideas and strategy with ${activeModel.name}...`
            : `Processing task response with ${activeModel.name}...`
        );

        const res = await fetch('/api/task-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...taskChatHistory.slice(-6).map((m) => ({
                role: m.role,
                content: m.content
              })),
              { role: 'user', content: userText }
            ],
            taskType: activeTaskType,
            modelId: selectedTaskModelId,
            provider: activeModel?.provider,
            keys: llmConfig?.keys,
            agentMode
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Task processing failed');

        addTaskChatMessage({
          role: 'assistant',
          taskType: activeTaskType,
          content: data.text,
          metadata: {
            docType: docFormat,
            modelUsed: data.modelUsed || activeModel.name
          }
        });
      }
    } catch (err: any) {
      addTaskChatMessage({
        role: 'assistant',
        taskType: activeTaskType,
        content: `⚠️ **Task Error**: ${err.message || 'An unexpected error occurred while executing this task.'}`
      });
    } finally {
      setIsLoading(false);
      setLoadingPhase('');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadImage = (url: string, prompt: string) => {
    const a = document.createElement('a');
    a.href = url;
    const cleanName = prompt.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30) || 'asset';
    const isSvg = url.startsWith('data:image/svg');
    a.download = `${cleanName}.${isSvg ? 'svg' : 'png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveImageToProject = (url: string, prompt: string, msgId: string) => {
    const cleanName = prompt.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24) || 'asset';
    const isSvg = url.startsWith('data:image/svg');
    const isHttp = url.startsWith('http');
    const fileName = isSvg ? `src/assets/${cleanName}.svg` : isHttp ? `src/assets/${cleanName}.ts` : `src/assets/${cleanName}.png`;
    
    // For SVG data URLs, extract decode; for HTTP URLs, export as TypeScript asset module
    let fileContent = url;
    if (isSvg && url.includes(',')) {
      try {
        fileContent = decodeURIComponent(url.split(',')[1]);
      } catch (e) {
        fileContent = url;
      }
    } else if (isHttp) {
      fileContent = `// AI Generated Asset for: "${prompt}"\nexport const assetUrl = "${url}";\nexport default assetUrl;\n`;
    }

    saveAssetToProject(fileName, fileContent, isSvg ? 'html' : isHttp ? 'typescript' : 'plaintext');
    setSavedId(msgId);
    setTimeout(() => setSavedId(null), 2500);
  };

  const handleSaveDocToProject = (title: string, markdownContent: string, msgId: string) => {
    const cleanName = title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30) || 'research-report';
    const fileName = `docs/${cleanName}.md`;
    saveAssetToProject(fileName, markdownContent, 'markdown');
    setSavedId(msgId);
    setTimeout(() => setSavedId(null), 2500);
  };

  const taskTabs = [
    { id: 'image', label: 'Images & Assets', icon: ImageIcon, desc: 'Generate icons, UI illustrations & logos' },
    { id: 'research', label: 'Deep Research', icon: Search, desc: 'Web-grounded technical research & comparisons' },
    { id: 'docs', label: 'Docs & Specs', icon: FileText, desc: 'PRDs, ADRs, OpenAPI specs & READMEs' },
    { id: 'brainstorm', label: 'Brainstorm', icon: Lightbulb, desc: 'Product roadmaps & UX feature ideation' },
    { id: 'general', label: 'General Task', icon: MessageSquare, desc: 'Multi-turn non-coding reasoning' },
  ] as const;

  const quickPrompts: Record<TaskType, { label: string; prompt: string }[]> = {
    image: [
      { label: '🎨 Modern App Logo', prompt: 'Minimalist tech logo for an AI developer platform with glowing geometric lines' },
      { label: '📊 Dashboard Illustration', prompt: 'High-tech analytics dashboard banner with futuristic network nodes' },
      { label: '🤖 Cyberpunk Avatar', prompt: 'Cyberpunk programmer avatar wearing glowing visor in dark mode studio' },
      { label: '☁️ Cloud Architecture', prompt: 'Clean schematic graphic of multi-region cloud microservices' },
    ],
    research: [
      { label: '⚡ Zustand vs Redux', prompt: 'Comprehensive benchmark and architecture comparison: Zustand vs Redux Toolkit vs TanStack Store in 2026' },
      { label: '🛡️ OAuth2 PKCE Flow', prompt: 'Security analysis, implementation trade-offs and RFC specifications for OAuth 2.0 PKCE in single page apps' },
      { label: '🗄️ Postgres vs Cloud SQL', prompt: 'Architectural comparison of self-hosted PostgreSQL vs managed Google Cloud SQL: pricing, scalability, and connection pooling' },
      { label: '🚀 WebAssembly in 2026', prompt: 'Current state of WebAssembly (Wasm) and WASI for browser-based intensive computations' },
    ],
    docs: [
      { label: '📄 PRD: Auth & RBAC', prompt: 'Generate a comprehensive Product Requirements Document (PRD) for Role-Based Access Control in a SaaS app' },
      { label: '📐 ADR: State Manager', prompt: 'Write an Architecture Decision Record (ADR) detailing the decision to adopt Zustand over Context API' },
      { label: '📖 Project README', prompt: 'Write a professional, GitHub-ready README.md for DevPilotX IDE featuring installation, features, and config' },
    ],
    brainstorm: [
      { label: '💡 AI Code Assist Features', prompt: 'Brainstorm 5 innovative, non-intrusive AI developer features that developers will love' },
      { label: '📈 Developer Growth Loops', prompt: 'Suggest viral product growth loops and open-source incentives for an IDE tool' },
      { label: '🗺️ 6-Month Roadmap', prompt: 'Outline a realistic 6-month product roadmap for scaling a developer tools startup' },
    ],
    general: [
      { label: '✍️ Release Notes', prompt: 'Draft celebratory, high-energy release notes for v2.0 of our developer platform' },
      { label: '🔍 Explain Architecture', prompt: 'Explain the difference between event-driven architecture and request-response architecture' },
    ],
  };

  const filteredHistory = taskChatHistory.filter((msg) => {
    if (filterTaskType === 'all') return true;
    return msg.taskType === filterTaskType;
  });

  const isFullscreen = mode === 'fullscreen' || activeView === 'studio';

  return (
    <div className={`flex flex-col h-full bg-[#161B22] text-[#C9D1D9] select-none ${isFullscreen ? 'w-full' : 'w-full border-r border-[#30363D]'}`}>
      {/* Top Header */}
      <div className="p-3 bg-[#0D1117] border-b border-[#30363D] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#8A2BE2] to-[#58A6FF] flex items-center justify-center text-white shadow-sm shrink-0">
            <Wand2 size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white truncate">
                Multimodal Task Studio
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#238636]/20 text-[#3FB950] border border-[#238636]/30 font-medium">
                Non-Coding
              </span>
            </div>
            <p className="text-[10px] text-[#8B949E] truncate hidden sm:block">
              Dedicated chat for images, deep research & specs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Model Selector in Header */}
          <TaskModelSelector
            selectedModelId={selectedTaskModelId}
            onSelectModel={(m) => setSelectedTaskModelId(m.id)}
            taskType={activeTaskType}
          />
          <AgentModeSelector />

          {/* Toggle Fullscreen / Dock */}
          {isFullscreen ? (
            <button
              onClick={() => {
                setActiveView('editor');
                setActiveActivity('tasks');
              }}
              title="Dock in Sidebar"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-xs text-[#C9D1D9] hover:text-white transition-colors"
            >
              <Minimize2 size={12} />
              <span className="hidden sm:inline text-[11px]">Dock in Sidebar</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveView('studio');
                setActiveActivity(null);
              }}
              title="Expand to Full Window"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1F6FEB]/20 hover:bg-[#1F6FEB]/30 border border-[#1F6FEB]/40 text-xs text-[#58A6FF] hover:text-white transition-colors"
            >
              <Maximize2 size={12} />
              <span className="hidden sm:inline text-[11px]">Full Window</span>
            </button>
          )}

          {/* Clear history */}
          <button
            onClick={() => clearTaskChatHistory()}
            title="Clear Chat History"
            className="p-1.5 rounded hover:bg-[#21262D] text-[#8B949E] hover:text-[#FF7B72] transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Task Type Switcher Bar */}
      <div className="bg-[#161B22] border-b border-[#30363D] px-2 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
        {taskTabs.map((tab) => {
          const isActive = activeTaskType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTaskType(tab.id as TaskType)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#1F6FEB] text-white shadow-sm'
                  : 'text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#21262D]'
              }`}
            >
              <tab.icon size={13} className={isActive ? 'text-white' : 'text-[#8B949E]'} />
              <span>{tab.label}</span>
            </button>
          );
        })}

        <div className="ml-auto hidden md:flex items-center gap-1 text-[10px] text-[#8B949E] pl-2 border-l border-[#30363D]">
          <span>Filter:</span>
          <button
            onClick={() => setFilterTaskType('all')}
            className={`px-1.5 py-0.5 rounded ${filterTaskType === 'all' ? 'bg-[#30363D] text-white' : 'hover:text-white'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterTaskType(activeTaskType)}
            className={`px-1.5 py-0.5 rounded ${filterTaskType === activeTaskType ? 'bg-[#30363D] text-white' : 'hover:text-white'}`}
          >
            Active Only
          </button>
        </div>
      </div>

      {/* Mode Specific Controls & Parameters Strip */}
      <div className="bg-[#0D1117]/80 px-3 py-1.5 border-b border-[#30363D] flex flex-wrap items-center gap-2 text-xs shrink-0">
        {activeTaskType === 'image' && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#8B949E]">Aspect Ratio:</span>
              {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                    aspectRatio === ratio
                      ? 'bg-[#238636] text-white border-[#238636]'
                      : 'bg-[#21262D] text-[#8B949E] border-[#30363D] hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#8B949E]">Model:</span>
                <TaskModelSelector
                  selectedModelId={selectedTaskModelId}
                  onSelectModel={(m) => setSelectedTaskModelId(m.id)}
                  taskType="image"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#8B949E]">Style:</span>
                <select
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value)}
                  className="bg-[#21262D] border border-[#30363D] text-[#C9D1D9] text-[11px] rounded px-2 py-0.5 focus:outline-none focus:border-[#58A6FF]"
                >
                  <option value="modern">Modern Flat / UI</option>
                  <option value="cyberpunk">Cyberpunk / Neon</option>
                  <option value="3d-clay">3D Claymorphic</option>
                  <option value="pixel-art">16-Bit Pixel Art</option>
                  <option value="minimal-tech">Minimalist Blueprint</option>
                  <option value="realistic">Photorealistic</option>
                </select>
              </div>
            </div>
          </>
        )}

        {activeTaskType === 'research' && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#8B949E]">Depth:</span>
              {(['detailed', 'brief', 'comprehensive'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setResearchDepth(d)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize border transition-colors ${
                    researchDepth === d
                      ? 'bg-[#1F6FEB] text-white border-[#1F6FEB]'
                      : 'bg-[#21262D] text-[#8B949E] border-[#30363D] hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#8B949E]">Model:</span>
                <TaskModelSelector
                  selectedModelId={selectedTaskModelId}
                  onSelectModel={(m) => setSelectedTaskModelId(m.id)}
                  taskType="research"
                />
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#3FB950] font-medium">
                <Globe size={11} className="animate-pulse" />
                <span className="hidden sm:inline">Google Search Grounded</span>
              </div>
            </div>
          </>
        )}

        {activeTaskType === 'docs' && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#8B949E]">Spec Template:</span>
              {[
                { id: 'prd', label: 'PRD' },
                { id: 'adr', label: 'Architecture Decision' },
                { id: 'api', label: 'API Spec' },
                { id: 'readme', label: 'README.md' }
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDocFormat(d.id as any)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                    docFormat === d.id
                      ? 'bg-[#8A2BE2] text-white border-[#8A2BE2]'
                      : 'bg-[#21262D] text-[#8B949E] border-[#30363D] hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-[#8B949E]">Model:</span>
              <TaskModelSelector
                selectedModelId={selectedTaskModelId}
                onSelectModel={(m) => setSelectedTaskModelId(m.id)}
                taskType="docs"
              />
            </div>
          </>
        )}

        {activeTaskType === 'brainstorm' && (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[#8B949E]">
              <Lightbulb size={12} className="text-[#E3B341]" />
              <span>Structured product ideation, user journey mapping & feature scoring</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto shrink-0">
              <span className="text-[11px] text-[#8B949E]">Model:</span>
              <TaskModelSelector
                selectedModelId={selectedTaskModelId}
                onSelectModel={(m) => setSelectedTaskModelId(m.id)}
                taskType="brainstorm"
              />
            </div>
          </div>
        )}

        {activeTaskType === 'general' && (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[#8B949E]">
              <Sparkles size={12} className="text-[#58A6FF]" />
              <span>Dedicated multi-turn assistant for writing, reasoning, and communications</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto shrink-0">
              <span className="text-[11px] text-[#8B949E]">Model:</span>
              <TaskModelSelector
                selectedModelId={selectedTaskModelId}
                onSelectModel={(m) => setSelectedTaskModelId(m.id)}
                taskType="general"
              />
            </div>
          </div>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 select-text">
        {filteredHistory.map((msg) => {
          const isUser = msg.role === 'user';
          const hasImages = msg.images && msg.images.length > 0;
          const hasSources = msg.sources && msg.sources.length > 0;

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 max-w-[96%] ${
                isUser ? 'self-end items-end' : 'self-start items-start w-full'
              }`}
            >
              {/* Header Badge */}
              <div className="flex items-center gap-1.5 text-[10px] text-[#8B949E] px-1">
                {isUser ? (
                  <span className="font-semibold uppercase tracking-wider text-[#8B949E]">You</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#58A6FF]"></span>
                    <span className="font-semibold text-[#C9D1D9]">Studio Agent</span>
                    <span className="text-[#8B949E]">•</span>
                    <span className="text-[#58A6FF] capitalize">{msg.taskType}</span>
                    {msg.metadata?.modelUsed && (
                      <>
                        <span className="text-[#8B949E]">•</span>
                        <span className="text-[#8B949E] text-[9px]">{msg.metadata.modelUsed}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Message Bubble Card */}
              <div
                className={`p-3.5 rounded-lg text-xs leading-relaxed max-w-full break-words relative shadow-sm ${
                  isUser
                    ? 'bg-[#1F6FEB] text-white rounded-br-none max-w-[85%]'
                    : 'bg-[#0D1117] text-[#C9D1D9] border border-[#30363D] rounded-bl-none w-full'
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed">
                  {msg.content}
                </div>

                {/* Render Generated Images Card if present */}
                {hasImages && (
                  <div className="mt-3 flex flex-col gap-3">
                    {msg.images!.map((img, imgIdx) => (
                      <div
                        key={imgIdx}
                        className="rounded-lg overflow-hidden border border-[#30363D] bg-[#161B22] p-2 flex flex-col gap-2"
                      >
                        <div className="relative group flex items-center justify-center bg-[#0D1117] rounded-md overflow-hidden min-h-[200px] max-h-[460px]">
                          <img
                            src={img.url}
                            alt={img.prompt}
                            className="max-h-[440px] w-auto object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
                          />
                          {/* Hover Actions Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => setZoomImage({ url: img.url, prompt: img.prompt })}
                              className="p-2 rounded-full bg-[#161B22]/90 hover:bg-[#1F6FEB] text-white shadow-lg transition-colors"
                              title="Zoom in"
                            >
                              <ZoomIn size={16} />
                            </button>
                            <button
                              onClick={() => handleDownloadImage(img.url, img.prompt)}
                              className="p-2 rounded-full bg-[#161B22]/90 hover:bg-[#238636] text-white shadow-lg transition-colors"
                              title="Download Asset"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => handleSaveImageToProject(img.url, img.prompt, msg.id)}
                              className="p-2 rounded-full bg-[#161B22]/90 hover:bg-[#8A2BE2] text-white shadow-lg transition-colors"
                              title="Save to Project Files"
                            >
                              <FolderPlus size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Image Footer Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 px-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262D] text-[#58A6FF] border border-[#30363D] font-mono">
                              {img.aspectRatio || '1:1'}
                            </span>
                            {img.style && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262D] text-[#C9D1D9] border border-[#30363D] capitalize">
                                {img.style}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownloadImage(img.url, img.prompt)}
                              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] hover:text-white transition-colors"
                            >
                              <Download size={12} />
                              <span>Download</span>
                            </button>
                            <button
                              onClick={() => handleSaveImageToProject(img.url, img.prompt, msg.id)}
                              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2EA043] text-white font-medium transition-colors"
                            >
                              {savedId === msg.id ? (
                                <>
                                  <Check size={12} />
                                  <span>Saved in /src/assets!</span>
                                </>
                              ) : (
                                <>
                                  <FolderPlus size={12} />
                                  <span>Add to Project</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Render Research Sources if present */}
                {hasSources && (
                  <div className="mt-3 pt-2.5 border-t border-[#30363D]/80">
                    <div className="text-[11px] font-semibold text-[#8B949E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Globe size={12} className="text-[#58A6FF]" />
                      <span>Verified Sources & Citations ({msg.sources!.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources!.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-[11px] text-[#58A6FF] hover:text-[#79C0FF] transition-colors"
                          title={s.snippet || s.url}
                        >
                          <span className="truncate max-w-[180px]">{s.title}</span>
                          <ArrowUpRight size={10} className="shrink-0 opacity-70" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Action Strip for Assistant Messages */}
                {!isUser && (
                  <div className="mt-3 pt-2 border-t border-[#30363D]/60 flex items-center justify-between text-[11px] text-[#8B949E]">
                    <div className="flex items-center gap-2">
                      {/* If text contains markdown report or spec, allow 1-click save to project docs */}
                      {msg.taskType !== 'image' && (
                        <button
                          onClick={() =>
                            handleSaveDocToProject(
                              msg.metadata?.query || msg.metadata?.docType || 'studio-report',
                              msg.content,
                              msg.id
                            )
                          }
                          className="flex items-center gap-1 hover:text-white px-2 py-0.5 rounded bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-[10px] text-[#58A6FF] transition-colors"
                        >
                          {savedId === msg.id ? (
                            <>
                              <Check size={11} className="text-[#3FB950]" />
                              <span className="text-[#3FB950]">Saved to /docs</span>
                            </>
                          ) : (
                            <>
                              <BookOpen size={11} />
                              <span>Save as Markdown Doc</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="hover:text-white flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={12} className="text-[#3FB950]" />
                          <span className="text-[#3FB950]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading State */}
        {isLoading && (
          <div className="self-start flex flex-col gap-1 max-w-[90%] w-full">
            <div className="flex items-center gap-1.5 text-[10px] text-[#8B949E] px-1">
              <span className="w-2 h-2 rounded-full bg-[#58A6FF] animate-ping"></span>
              <span className="font-semibold text-[#C9D1D9]">Studio Agent</span>
              <span className="text-[#8B949E]">•</span>
              <span className="text-[#58A6FF] capitalize">{activeTaskType}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#58A6FF]">
                <RefreshCw size={14} className="animate-spin" />
                <span className="font-medium text-[12px]">{loadingPhase || 'Processing multimodal task...'}</span>
              </div>
              <div className="h-1.5 w-full bg-[#21262D] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#1F6FEB] via-[#8A2BE2] to-[#58A6FF] rounded-full animate-pulse w-3/4"></div>
              </div>
              <span className="text-[10px] text-[#8B949E]">
                {activeTaskType === 'image'
                  ? 'Rendering generative asset with Gemini Image Engine...'
                  : activeTaskType === 'research'
                  ? 'Scanning web indices, analyzing comparisons & synthesizing citations...'
                  : 'Synthesizing structured Markdown document...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="px-3 pt-2 bg-[#0D1117] border-t border-[#30363D] shrink-0">
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] text-[#8B949E] font-medium shrink-0">Suggestions:</span>
          {quickPrompts[activeTaskType]?.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(undefined, qp.prompt)}
              disabled={isLoading}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-[10px] text-[#C9D1D9] hover:text-white whitespace-nowrap transition-colors disabled:opacity-40"
            >
              <span>{qp.label}</span>
            </button>
          ))}
        </div>

        {/* Input Composer */}
        <form
          onSubmit={(e) => handleSend(e)}
          className="relative flex flex-col bg-[#21262D] border border-[#30363D] focus-within:border-[#58A6FF] rounded-lg transition-colors p-1.5 mb-2.5"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              activeTaskType === 'image'
                ? 'Describe the image, icon, logo, or UI asset to generate...'
                : activeTaskType === 'research'
                ? 'Enter your deep technical research query (e.g., Zustand vs Redux, OAuth2 PKCE)...'
                : activeTaskType === 'docs'
                ? 'Describe the PRD, architecture specification, or README to write...'
                : activeTaskType === 'brainstorm'
                ? 'Describe what you want to brainstorm (features, UX flows, sprint plans)...'
                : 'Ask anything for non-coding tasks (Enter to send, Shift+Enter for newline)...'
            }
            rows={isFullscreen ? 3 : 2}
            className="w-full bg-transparent text-xs sm:text-[13px] text-white placeholder:text-[#484F58] resize-none focus:outline-none px-1.5 py-1"
          />

          <div className="flex items-center justify-between pt-1 border-t border-[#30363D]/60 mt-1">
            <div className="flex items-center gap-1.5 text-[10px] text-[#8B949E] flex-wrap">
              <span className="capitalize font-medium text-[#58A6FF]">{activeTaskType} Mode</span>
              <span className="text-[#30363D]">•</span>
              <div className="flex items-center gap-1 text-white bg-[#0D1117] border border-[#30363D] px-2 py-0.5 rounded">
                <ModelIcon type={getModelById(selectedTaskModelId).iconType} size={11} className="p-0.5" />
                <span className="font-medium text-[10px] truncate max-w-[130px]">{getModelById(selectedTaskModelId).name}</span>
              </div>
              {activeTaskType === 'image' && (
                <span className="text-[#8B949E]">• {aspectRatio} • {imageStyle}</span>
              )}
              {activeTaskType === 'research' && (
                <span className="text-[#8B949E]">• {researchDepth} search</span>
              )}
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#1F6FEB] hover:bg-[#388BFD] disabled:opacity-40 disabled:hover:bg-[#1F6FEB] text-white rounded text-xs font-medium transition-colors"
            >
              <span>Generate</span>
              <Send size={12} />
            </button>
          </div>
        </form>
      </div>

      {/* Image Zoom Lightbox Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-[#0D1117] border-b border-[#30363D] flex items-center justify-between">
              <span className="text-xs font-medium text-[#C9D1D9] truncate max-w-lg">
                {zoomImage.prompt}
              </span>
              <button
                onClick={() => setZoomImage(null)}
                className="p-1 rounded hover:bg-[#21262D] text-[#8B949E] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 bg-[#0D1117] flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={zoomImage.url}
                alt={zoomImage.prompt}
                className="max-h-[70vh] w-auto object-contain rounded-md"
              />
            </div>
            <div className="p-3 bg-[#161B22] border-t border-[#30363D] flex items-center justify-end gap-2">
              <button
                onClick={() => handleDownloadImage(zoomImage.url, zoomImage.prompt)}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#21262D] hover:bg-[#30363D] text-xs text-white"
              >
                <Download size={13} />
                <span>Download Asset</span>
              </button>
              <button
                onClick={() => {
                  handleSaveImageToProject(zoomImage.url, zoomImage.prompt, 'zoom');
                  setZoomImage(null);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2EA043] text-xs text-white font-medium"
              >
                <FolderPlus size={13} />
                <span>Save to /src/assets</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

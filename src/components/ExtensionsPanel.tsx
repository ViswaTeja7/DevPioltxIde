import React, { useState } from 'react';
import { 
  Blocks, 
  Search, 
  Check, 
  Download, 
  Settings, 
  Sparkles, 
  Star, 
  ShieldCheck, 
  Layers, 
  Code2, 
  Cpu, 
  BrainCircuit,
  X
} from 'lucide-react';
import { useIDE } from '../context/IDEContext';

interface ExtensionItem {
  id: string;
  name: string;
  publisher: string;
  version: string;
  description: string;
  installed: boolean;
  enabled: boolean;
  downloads: string;
  rating: string;
  iconColor: string;
}

export const ExtensionsPanel = () => {
  const { setActiveView } = useIDE();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'installed' | 'recommended'>('all');

  const [extensions, setExtensions] = useState<ExtensionItem[]>([
    {
      id: 'ext-copilot',
      name: 'DevPilotX Multi-Model Agent',
      publisher: 'DevPilotX',
      version: 'v1.14.0',
      description: 'AI pair programmer with Gemini 3.7, Claude 3.7, GPT-4o, and DeepSeek R1 reasoning.',
      installed: true,
      enabled: true,
      downloads: '14.2M',
      rating: '4.8',
      iconColor: '#58A6FF'
    },
    {
      id: 'ext-claude-skills',
      name: 'Claude Agent Skills & Training',
      publisher: 'Anthropic & DevPilotX',
      version: 'v2.1.0',
      description: 'Train custom personas, few-shot coding examples, and reusable agent skills in-editor.',
      installed: true,
      enabled: true,
      downloads: '3.1M',
      rating: '4.9',
      iconColor: '#A371F7'
    },
    {
      id: 'ext-tailwind',
      name: 'Tailwind CSS IntelliSense',
      publisher: 'Tailwind Labs',
      version: 'v0.9.11',
      description: 'Intelligent Tailwind CSS tooling for VS Code and Monaco editor.',
      installed: true,
      enabled: true,
      downloads: '9.8M',
      rating: '4.7',
      iconColor: '#38BDF8'
    },
    {
      id: 'ext-eslint',
      name: 'ESLint & TypeScript Analyzer',
      publisher: 'Microsoft',
      version: 'v2.4.2',
      description: 'Integrates ESLint and modern TypeScript diagnostics into Monaco editor.',
      installed: true,
      enabled: true,
      downloads: '28.4M',
      rating: '4.6',
      iconColor: '#4B32C3'
    },
    {
      id: 'ext-python',
      name: 'Python Language Server',
      publisher: 'Microsoft',
      version: 'v2024.2.0',
      description: 'Python IntelliSense, linting, code navigation, and unit test runner.',
      installed: false,
      enabled: false,
      downloads: '112M',
      rating: '4.5',
      iconColor: '#F7C948'
    },
    {
      id: 'ext-docker',
      name: 'Docker & Cloud Run Containers',
      publisher: 'Microsoft',
      version: 'v1.28.0',
      description: 'Makes it easy to create, manage, and debug containerized applications.',
      installed: false,
      enabled: false,
      downloads: '32.1M',
      rating: '4.7',
      iconColor: '#2496ED'
    }
  ]);

  const toggleInstall = (id: string) => {
    setExtensions(prev => prev.map(ext => {
      if (ext.id === id) {
        const nextInstalled = !ext.installed;
        return {
          ...ext,
          installed: nextInstalled,
          enabled: nextInstalled ? true : false
        };
      }
      return ext;
    }));
  };

  const toggleEnable = (id: string) => {
    setExtensions(prev => prev.map(ext => {
      if (ext.id === id) {
        return { ...ext, enabled: !ext.enabled };
      }
      return ext;
    }));
  };

  const filteredExtensions = extensions.filter(ext => {
    const matchesSearch = 
      ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.publisher.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'installed') {
      return matchesSearch && ext.installed;
    }
    if (activeFilter === 'recommended') {
      return matchesSearch && !ext.installed;
    }
    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#161B22] text-[#C9D1D9] text-xs select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#30363D]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Blocks size={14} className="text-[#A371F7]" />
            <span className="font-semibold text-white">Extensions</span>
          </div>
          <span className="text-[10px] text-[#8B949E]">Marketplace</span>
        </div>

        {/* Search */}
        <div className="relative flex items-center bg-[#0D1117] border border-[#30363D] focus-within:border-[#58A6FF] rounded px-2 py-1 mb-2">
          <Search size={13} className="text-[#8B949E] mr-1.5 shrink-0" />
          <input
            type="text"
            placeholder="Search extensions in marketplace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-[#8B949E] outline-none w-full"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#8B949E] hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeFilter === 'all' ? 'bg-[#21262D] text-white' : 'text-[#8B949E] hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('installed')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeFilter === 'installed' ? 'bg-[#21262D] text-white' : 'text-[#8B949E] hover:text-white'
            }`}
          >
            Installed ({extensions.filter(e => e.installed).length})
          </button>
          <button
            onClick={() => setActiveFilter('recommended')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeFilter === 'recommended' ? 'bg-[#21262D] text-white' : 'text-[#8B949E] hover:text-white'
            }`}
          >
            Recommended
          </button>
        </div>
      </div>

      {/* Extensions List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#21262D]">
        {filteredExtensions.map((ext) => (
          <div key={ext.id} className="p-3 hover:bg-[#21262D]/60 transition-colors">
            <div className="flex items-start gap-2.5">
              <div 
                className="w-8 h-8 rounded bg-[#0D1117] border border-[#30363D] flex items-center justify-center shrink-0"
                style={{ color: ext.iconColor }}
              >
                {ext.id === 'ext-claude-skills' ? (
                  <BrainCircuit size={16} />
                ) : ext.id === 'ext-copilot' ? (
                  <Sparkles size={16} />
                ) : (
                  <Blocks size={16} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-xs truncate">{ext.name}</h3>
                  <span className="text-[10px] text-[#8B949E]">{ext.version}</span>
                </div>
                <div className="text-[11px] text-[#8B949E] mb-1">{ext.publisher}</div>
                <p className="text-[11px] text-[#8B949E] line-clamp-2 mb-2">
                  {ext.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-[#8B949E]">
                    <span className="flex items-center gap-0.5">
                      <Star size={10} className="text-[#E3B341] fill-[#E3B341]" />
                      {ext.rating}
                    </span>
                    <span>{ext.downloads}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {ext.installed ? (
                      <>
                        <button
                          onClick={() => toggleEnable(ext.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                            ext.enabled
                              ? 'bg-[#238636]/20 text-[#3FB950] border border-[#238636]/40 hover:bg-[#238636]/30'
                              : 'bg-[#21262D] text-[#8B949E] border border-[#30363D]'
                          }`}
                        >
                          {ext.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <button
                          onClick={() => toggleInstall(ext.id)}
                          className="px-2 py-0.5 rounded text-[10px] text-[#8B949E] hover:text-[#F85149] hover:bg-[#21262D] transition-colors"
                        >
                          Uninstall
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => toggleInstall(ext.id)}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#1F6FEB] hover:bg-[#388BFD] text-white text-[10px] font-semibold transition-colors"
                      >
                        <Download size={10} />
                        Install
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

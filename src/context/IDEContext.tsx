import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  ActivityTab, 
  PanelTab, 
  FileNode, 
  ChatMessage, 
  LLMConfig, 
  ActiveView, 
  AIModel, 
  TaskType, 
  TaskChatMessage,
  AgentSkill,
  TrainingExample,
  KnowledgeDoc,
  AgentTrainingProfile
} from '../types';
import { initialFileTree } from '../data';
import { AI_MODELS, getModelById, DEFAULT_MODEL_ID } from '../constants/models';
import { 
  DEFAULT_BUILTIN_SKILLS, 
  DEFAULT_TRAINING_EXAMPLES, 
  DEFAULT_TRAINING_PROFILE, 
  DEFAULT_KNOWLEDGE_DOCS 
} from '../constants/skills';

interface IDEState {
  activeView: ActiveView;
  activeActivity: ActivityTab | null;
  lastActiveActivity: ActivityTab;
  activePanel: PanelTab;
  isPanelOpen: boolean;
  fileTree: FileNode[];
  openFiles: FileNode[];
  activeFileId: string | null;
  chatHistory: ChatMessage[];
  taskChatHistory: TaskChatMessage[];
  activeTaskType: TaskType;
  setActiveTaskType: (type: TaskType) => void;
  setActiveActivity: (tab: ActivityTab | null) => void;
  setActivePanel: (tab: PanelTab) => void;
  setIsPanelOpen: (isOpen: boolean) => void;
  openFile: (file: FileNode) => void;
  closeFile: (fileId: string) => void;
  closeAllFiles: () => void;
  createNewFile: (name?: string, content?: string) => void;
  deleteFile: (fileId: string) => void;
  saveAssetToProject: (fileName: string, content: string, language?: string) => void;
  setActiveFileId: (id: string | null) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatHistory: () => void;
  addTaskChatMessage: (msg: Omit<TaskChatMessage, 'id' | 'timestamp'>) => void;
  clearTaskChatHistory: (taskType?: TaskType) => void;
  updateFileContent: (fileId: string, content: string) => void;
  llmConfig: LLMConfig;
  updateLLMConfig: (config: Partial<LLMConfig> | ((prev: LLMConfig) => LLMConfig)) => void;
  selectedModel: AIModel;
  availableModels: AIModel[];
  refreshProviderModels: () => Promise<void>;
  selectModel: (modelId: string) => void;
  isModelSelectorOpen: boolean;
  setIsModelSelectorOpen: (open: boolean) => void;
  setActiveView: (view: ActiveView) => void;
  toggleSidebar: (tab?: ActivityTab) => void;
  togglePanel: (tab?: PanelTab) => void;
  // Trainable Agent & Claude-style Skills System
  skills: AgentSkill[];
  addSkill: (skill: Omit<AgentSkill, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSkill: (id: string, updates: Partial<AgentSkill>) => void;
  toggleSkill: (id: string) => void;
  deleteSkill: (id: string) => void;
  resetSkills: () => void;
  trainingExamples: TrainingExample[];
  addTrainingExample: (ex: Omit<TrainingExample, 'id' | 'createdAt'>) => void;
  updateTrainingExample: (id: string, updates: Partial<TrainingExample>) => void;
  deleteTrainingExample: (id: string) => void;
  trainingProfile: AgentTrainingProfile;
  updateTrainingProfile: (updates: Partial<AgentTrainingProfile>) => void;
  knowledgeDocs: KnowledgeDoc[];
  addKnowledgeDoc: (doc: Omit<KnowledgeDoc, 'id' | 'updatedAt'>) => void;
  updateKnowledgeDoc: (id: string, updates: Partial<KnowledgeDoc>) => void;
  deleteKnowledgeDoc: (id: string) => void;
}

const IDEContext = createContext<IDEState | undefined>(undefined);

const STORAGE_KEY = 'devpilotx_llm_config_v2';
const SKILLS_STORAGE_KEY = 'devpilotx_skills_v1';
const TRAINING_EXAMPLES_STORAGE_KEY = 'devpilotx_training_examples_v1';
const TRAINING_PROFILE_STORAGE_KEY = 'devpilotx_training_profile_v1';
const KNOWLEDGE_DOCS_STORAGE_KEY = 'devpilotx_knowledge_docs_v1';

const getInitialSkills = (): AgentSkill[] => {
  try {
    const saved = localStorage.getItem(SKILLS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Failed to load saved skills', e);
  }
  return DEFAULT_BUILTIN_SKILLS;
};

const getInitialTrainingExamples = (): TrainingExample[] => {
  try {
    const saved = localStorage.getItem(TRAINING_EXAMPLES_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Failed to load saved training examples', e);
  }
  return DEFAULT_TRAINING_EXAMPLES;
};

const getInitialTrainingProfile = (): AgentTrainingProfile => {
  try {
    const saved = localStorage.getItem(TRAINING_PROFILE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Failed to load saved training profile', e);
  }
  return DEFAULT_TRAINING_PROFILE;
};

const getInitialKnowledgeDocs = (): KnowledgeDoc[] => {
  try {
    const saved = localStorage.getItem(KNOWLEDGE_DOCS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Failed to load saved knowledge docs', e);
  }
  return DEFAULT_KNOWLEDGE_DOCS;
};

const getInitialLLMConfig = (): LLMConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        provider: parsed.provider || 'gemini',
        selectedModelId: parsed.selectedModelId || DEFAULT_MODEL_ID,
        keys: {
          gemini: parsed.keys?.gemini || '',
          openrouter: parsed.keys?.openrouter || '',
          ollamaUrl: parsed.keys?.ollamaUrl || 'http://localhost:11434/v1',
          ollamaApiKey: parsed.keys?.ollamaApiKey || '',
          ollamaModel: parsed.keys?.ollamaModel || 'llama3.3',
          groq: parsed.keys?.groq || ''
        }
      };
    }
  } catch (e) {
    console.warn('Failed to parse saved LLM config', e);
  }
  return {
    provider: 'gemini',
    selectedModelId: DEFAULT_MODEL_ID,
    keys: {
      gemini: '',
      openrouter: '',
      ollamaUrl: 'http://localhost:11434/v1',
      ollamaApiKey: '',
      ollamaModel: 'llama3.3',
      groq: ''
    }
  };
};

export const IDEProvider = ({ children }: { children: ReactNode }) => {
  const [activeView, setActiveView] = useState<ActiveView>('editor');
  const [activeActivity, setActiveActivityState] = useState<ActivityTab | null>('explorer');
  const [lastActiveActivity, setLastActiveActivity] = useState<ActivityTab>('explorer');

  const setActiveActivity = (tab: ActivityTab | null) => {
    if (tab !== null) {
      setLastActiveActivity(tab);
    }
    setActiveActivityState(tab);
  };
  const [activePanel, setActivePanel] = useState<PanelTab>('terminal');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [fileTree, setFileTree] = useState<FileNode[]>(initialFileTree);
  const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      role: 'agent',
      content: 'Hello! I am DevPilotX with GitHub Copilot AI model integration. You can switch between Gemini 3.7 Flash, Claude 3.7 Sonnet, GPT-4o, DeepSeek R1, Llama 3.3, and local/cloud Ollama. How can I help you build today?',
      timestamp: new Date(),
      modelId: DEFAULT_MODEL_ID,
      modelName: 'Gemini 3.7 Flash',
    }
  ]);
  const [activeTaskType, setActiveTaskType] = useState<TaskType>('image');
  const [taskChatHistory, setTaskChatHistory] = useState<TaskChatMessage[]>([
    {
      id: 'task-msg-welcome',
      role: 'assistant',
      taskType: 'general',
      content: "👋 **Welcome to the Multimodal Task & Research Studio!**\n\nThis dedicated chat window is separate from coding tasks. You can use it to:\n\n* 🎨 **Generate Visual Assets & Images**: UI mockups, app logos, icons, vector illustrations, cyberpunk textures\n* 🔍 **Deep Web & Technical Research**: Benchmark comparisons, architecture trade-offs, live sources\n* 📄 **Technical Specs & PRDs**: Architecture Decision Records, user guides, OpenAPI specs\n* 💡 **Brainstorming & Planning**: Product roadmaps, system architectures, UX journeys\n\nSelect a task mode above or type your request below to get started!",
      timestamp: new Date(),
    }
  ]);
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(getInitialLLMConfig);
  const [discoveredModels, setDiscoveredModels] = useState<AIModel[]>([]);

  // Trainable Agent & Claude-style Skills System State
  const [skills, setSkills] = useState<AgentSkill[]>(getInitialSkills);
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>(getInitialTrainingExamples);
  const [trainingProfile, setTrainingProfile] = useState<AgentTrainingProfile>(getInitialTrainingProfile);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>(getInitialKnowledgeDocs);

  const persistSkills = (newSkills: AgentSkill[]) => {
    setSkills(newSkills);
    try {
      localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(newSkills));
    } catch (e) {
      console.warn('Failed to save skills to localStorage', e);
    }
  };

  const addSkill = (skillData: Omit<AgentSkill, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSkill: AgentSkill = {
      ...skillData,
      id: `skill-custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    persistSkills([newSkill, ...skills]);
  };

  const updateSkill = (id: string, updates: Partial<AgentSkill>) => {
    const updated = skills.map((s) => 
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );
    persistSkills(updated);
  };

  const toggleSkill = (id: string) => {
    const updated = skills.map((s) => 
      s.id === id ? { ...s, enabled: !s.enabled, updatedAt: new Date().toISOString() } : s
    );
    persistSkills(updated);
  };

  const deleteSkill = (id: string) => {
    const updated = skills.filter((s) => s.id !== id);
    persistSkills(updated);
  };

  const resetSkills = () => {
    persistSkills(DEFAULT_BUILTIN_SKILLS);
  };

  const persistTrainingExamples = (newExamples: TrainingExample[]) => {
    setTrainingExamples(newExamples);
    try {
      localStorage.setItem(TRAINING_EXAMPLES_STORAGE_KEY, JSON.stringify(newExamples));
    } catch (e) {
      console.warn('Failed to save training examples', e);
    }
  };

  const addTrainingExample = (ex: Omit<TrainingExample, 'id' | 'createdAt'>) => {
    const newEx: TrainingExample = {
      ...ex,
      id: `train-ex-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    persistTrainingExamples([newEx, ...trainingExamples]);
  };

  const updateTrainingExample = (id: string, updates: Partial<TrainingExample>) => {
    const updated = trainingExamples.map((ex) => ex.id === id ? { ...ex, ...updates } : ex);
    persistTrainingExamples(updated);
  };

  const deleteTrainingExample = (id: string) => {
    const updated = trainingExamples.filter((ex) => ex.id !== id);
    persistTrainingExamples(updated);
  };

  const updateTrainingProfile = (updates: Partial<AgentTrainingProfile>) => {
    setTrainingProfile((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(TRAINING_PROFILE_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save training profile', e);
      }
      return updated;
    });
  };

  const persistKnowledgeDocs = (newDocs: KnowledgeDoc[]) => {
    setKnowledgeDocs(newDocs);
    try {
      localStorage.setItem(KNOWLEDGE_DOCS_STORAGE_KEY, JSON.stringify(newDocs));
    } catch (e) {
      console.warn('Failed to save knowledge docs', e);
    }
  };

  const addKnowledgeDoc = (doc: Omit<KnowledgeDoc, 'id' | 'updatedAt'>) => {
    const newDoc: KnowledgeDoc = {
      ...doc,
      id: `doc-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    persistKnowledgeDocs([newDoc, ...knowledgeDocs]);
  };

  const updateKnowledgeDoc = (id: string, updates: Partial<KnowledgeDoc>) => {
    const updated = knowledgeDocs.map((d) => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d);
    persistKnowledgeDocs(updated);
  };

  const deleteKnowledgeDoc = (id: string) => {
    const updated = knowledgeDocs.filter((d) => d.id !== id);
    persistKnowledgeDocs(updated);
  };

  const availableModels = [...discoveredModels, ...AI_MODELS.filter(model =>
    !discoveredModels.some(discovered => discovered.id === model.id)
  )];
  const selectedModel = availableModels.find(model => model.id === llmConfig.selectedModelId) || getModelById(DEFAULT_MODEL_ID);

  const refreshProviderModels = async () => {
    const response = await fetch('/api/provider-models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: llmConfig.keys })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Unable to load provider models');
    }
    setDiscoveredModels(data.models || []);
  };

  useEffect(() => {
    const hasCredentials = Boolean(
      llmConfig.keys.gemini.trim() ||
      llmConfig.keys.openrouter.trim() ||
      llmConfig.keys.groq.trim()
    );
    if (!hasCredentials) {
      setDiscoveredModels([]);
      return;
    }

    const timer = window.setTimeout(() => {
      refreshProviderModels().catch(error => {
        console.warn('Failed to refresh provider models', error);
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [llmConfig.keys.gemini, llmConfig.keys.openrouter, llmConfig.keys.groq]);

  const selectModel = (modelId: string) => {
    const targetModel = getModelById(modelId);
    setLLMConfig((prev) => {
      const updated = {
        ...prev,
        selectedModelId: targetModel.id,
        provider: targetModel.provider,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  const updateLLMConfig = (config: Partial<LLMConfig> | ((prev: LLMConfig) => LLMConfig)) => {
    setLLMConfig((prev) => {
      const updated = typeof config === 'function' ? config(prev) : { ...prev, ...config };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  const openFile = (file: FileNode) => {
    if (file.type === 'folder') return;
    if (!openFiles.find((f) => f.id === file.id)) {
      setOpenFiles([...openFiles, file]);
    }
    setActiveFileId(file.id);
    setActiveView('editor');
  };

  const closeFile = (fileId: string) => {
    const newFiles = openFiles.filter((f) => f.id !== fileId);
    setOpenFiles(newFiles);
    if (activeFileId === fileId) {
      setActiveFileId(newFiles.length > 0 ? newFiles[newFiles.length - 1].id : null);
    }
  };

  const closeAllFiles = () => {
    setOpenFiles([]);
    setActiveFileId(null);
  };

  const createNewFile = (fileName?: string, content?: string) => {
    const defaultName = fileName || `untitled-${openFiles.length + 1}.tsx`;
    const defaultContent = content !== undefined 
      ? content 
      : `// ${defaultName}\nimport React from 'react';\n\nexport default function CustomComponent() {\n  return (\n    <div>\n      <h1>New File</h1>\n    </div>\n  );\n}\n`;

    const getLanguageFromName = (name: string) => {
      if (name.endsWith('.tsx') || name.endsWith('.ts')) return 'typescript';
      if (name.endsWith('.json')) return 'json';
      if (name.endsWith('.md')) return 'markdown';
      if (name.endsWith('.html') || name.endsWith('.svg')) return 'html';
      if (name.endsWith('.css')) return 'css';
      return 'javascript';
    };

    const newFile: FileNode = {
      id: `file-custom-${Date.now()}`,
      name: defaultName,
      type: 'file',
      path: `/${defaultName}`,
      language: getLanguageFromName(defaultName),
      content: defaultContent
    };
    setFileTree((prev) => [...prev, newFile]);
    setOpenFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setActiveView('editor');
    setActiveActivity('explorer');
  };

  const deleteFile = (fileId: string) => {
    const deletedIds: string[] = [];
    const collectIds = (node: FileNode) => {
      deletedIds.push(node.id);
      if (node.children) {
        node.children.forEach(collectIds);
      }
    };

    const filterTree = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter((node) => {
          if (node.id === fileId) {
            collectIds(node);
            return false;
          }
          return true;
        })
        .map((node) => {
          if (node.children && node.children.length > 0) {
            return {
              ...node,
              children: filterTree(node.children),
            };
          }
          return node;
        });
    };

    setFileTree((prev) => filterTree(prev));

    setOpenFiles((prevOpen) => {
      const remaining = prevOpen.filter((f) => !deletedIds.includes(f.id));
      setActiveFileId((currentActive) => {
        if (currentActive && deletedIds.includes(currentActive)) {
          return remaining.length > 0 ? remaining[remaining.length - 1].id : null;
        }
        return currentActive;
      });
      return remaining;
    });
  };

  const saveAssetToProject = (fileName: string, content: string, language?: string) => {
    // Check if file already exists in open files or fileTree
    const existingIndex = fileTree.findIndex((f) => f.name === fileName || f.path === `/${fileName}`);
    if (existingIndex >= 0) {
      const existingId = fileTree[existingIndex].id;
      setFileTree((prev) => prev.map((f) => f.id === existingId ? { ...f, content } : f));
      setOpenFiles((prev) => prev.map((f) => f.id === existingId ? { ...f, content } : f));
      setActiveFileId(existingId);
      setActiveView('editor');
      return;
    }

    const newFile: FileNode = {
      id: `file-asset-${Date.now()}`,
      name: fileName,
      type: 'file',
      path: `/${fileName}`,
      language: language || (fileName.endsWith('.md') ? 'markdown' : fileName.endsWith('.svg') ? 'html' : 'plaintext'),
      content
    };
    setFileTree((prev) => [...prev, newFile]);
    setOpenFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setActiveView('editor');
  };

  const clearChatHistory = () => {
    setChatHistory([
      {
        id: `msg-${Date.now()}`,
        role: 'agent',
        content: `Chat cleared. Ready for your prompt with ${selectedModel.name}.`,
        timestamp: new Date(),
        modelId: selectedModel.id,
        modelName: selectedModel.name,
      }
    ]);
  };

  const addTaskChatMessage = (msg: Omit<TaskChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: TaskChatMessage = {
      ...msg,
      id: `task-msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(),
    };
    setTaskChatHistory((prev) => [...prev, newMsg]);
  };

  const clearTaskChatHistory = (taskType?: TaskType) => {
    if (taskType) {
      setTaskChatHistory((prev) => prev.filter((m) => m.taskType !== taskType));
    } else {
      setTaskChatHistory([
        {
          id: `task-msg-${Date.now()}`,
          role: 'assistant',
          taskType: activeTaskType,
          content: `Task chat cleared. Ready for new ${activeTaskType} generation or research!`,
          timestamp: new Date(),
        }
      ]);
    }
  };

  const toggleSidebar = (tab?: ActivityTab) => {
    if (tab) {
      if (activeActivity === tab) {
        setActiveActivity(null);
      } else {
        setActiveActivity(tab);
      }
    } else {
      if (activeActivity !== null) {
        setActiveActivity(null);
      } else {
        setActiveActivity(lastActiveActivity || 'explorer');
      }
    }
  };

  const togglePanel = (tab?: PanelTab) => {
    if (tab) {
      if (isPanelOpen && activePanel === tab) {
        setIsPanelOpen(false);
      } else {
        setActivePanel(tab);
        setIsPanelOpen(true);
      }
    } else {
      setIsPanelOpen(!isPanelOpen);
    }
  };

  const addChatMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      timestamp: new Date(),
      modelId: msg.modelId || llmConfig.selectedModelId,
      modelName: msg.modelName || selectedModel.name,
      provider: msg.provider || selectedModel.providerLabel,
    };
    setChatHistory((prev) => [...prev, newMsg]);
  };

  const updateFileContent = (fileId: string, content: string) => {
    setOpenFiles(openFiles.map(f => f.id === fileId ? { ...f, content } : f));
  };

  return (
    <IDEContext.Provider
      value={{
        activeView,
        activeActivity,
        lastActiveActivity,
        activePanel,
        isPanelOpen,
        fileTree,
        openFiles,
        activeFileId,
        chatHistory,
        taskChatHistory,
        activeTaskType,
        setActiveTaskType,
        setActiveActivity,
        setActivePanel,
        setIsPanelOpen,
        openFile,
        closeFile,
        closeAllFiles,
        createNewFile,
        saveAssetToProject,
        setActiveFileId,
        addChatMessage,
        clearChatHistory,
        addTaskChatMessage,
        clearTaskChatHistory,
        updateFileContent,
        llmConfig,
        updateLLMConfig,
        selectedModel,
        availableModels,
        refreshProviderModels,
        selectModel,
        isModelSelectorOpen,
        setIsModelSelectorOpen,
        setActiveView,
        toggleSidebar,
        togglePanel,
        // Skills and Trainable Agent
        skills,
        addSkill,
        updateSkill,
        toggleSkill,
        deleteSkill,
        resetSkills,
        trainingExamples,
        addTrainingExample,
        updateTrainingExample,
        deleteTrainingExample,
        trainingProfile,
        updateTrainingProfile,
        knowledgeDocs,
        addKnowledgeDoc,
        updateKnowledgeDoc,
        deleteKnowledgeDoc,
      }}
    >
      {children}
    </IDEContext.Provider>
  );
};


export const useIDE = () => {
  const context = useContext(IDEContext);
  if (context === undefined) {
    throw new Error('useIDE must be used within an IDEProvider');
  }
  return context;
};

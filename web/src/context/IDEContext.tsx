import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode
} from 'react';
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
  AgentTrainingProfile,
  AgentMode
} from '../types';
import { initialFileTree } from '../data';
import { AI_MODELS, getModelById, DEFAULT_MODEL_ID } from '../constants/models';
import {
  DEFAULT_BUILTIN_SKILLS,
  DEFAULT_TRAINING_EXAMPLES,
  DEFAULT_TRAINING_PROFILE,
  DEFAULT_KNOWLEDGE_DOCS
} from '../constants/skills';
import {
  writeWorkspaceFile,
  deleteWorkspaceFile,
  readWorkspaceFile,
  listWorkspaceTree,
  createWorkspaceDir,
  renameWorkspacePath,
  reportFsError
} from '../lib/workspaceFs';
import { entriesToTree, repathSubtree } from '../lib/fsTree';
import { getLanguageFromName } from '../lib/language';
import {
  clearSecrets,
  describeSecretStorage,
  hasAnySecret,
  loadSecrets,
  pickSecrets,
  saveSecrets,
  stripSecrets,
  type SecretStorageKind
} from '../lib/secrets';
import {
  DEFAULT_OLLAMA_URL,
  computeLinkedProviders,
  filterAvailableModels,
  type LinkedProviders,
  type ServerProviderStatus
} from '../lib/modelAvailability';

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
  createFolder: (name?: string) => void;
  renamePath: (fileId: string, newName: string) => void;
  refreshFileTree: () => Promise<void>;
  workspaceTruncated: boolean;
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
  /** Where API keys are stored: OS keychain, session-only, or nowhere. */
  secretStorage: SecretStorageKind;
  /** Writes the current API keys to the secure store immediately. */
  persistApiKeys: () => Promise<void>;
  /** Removes all stored API keys from memory and the secure store. */
  clearApiKeys: () => Promise<void>;
  selectedModel: AIModel;
  availableModels: AIModel[];
  /** Providers with a usable API behind them (user key or server credential). */
  linkedProviders: LinkedProviders;
  refreshProviderModels: () => Promise<void>;
  selectModel: (modelId: string) => void;
  isModelSelectorOpen: boolean;
  setIsModelSelectorOpen: (open: boolean) => void;
  setActiveView: (view: ActiveView) => void;
  toggleSidebar: (tab?: ActivityTab) => void;
  togglePanel: (tab?: PanelTab) => void;
  agentMode: AgentMode;
  setAgentMode: (mode: AgentMode) => void;
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
  addFolderToTree: (folder: FileNode) => void;
}

const IDEContext = createContext<IDEState | undefined>(undefined);

const STORAGE_KEY = 'devpilotx_llm_config_v2';
const SKILLS_STORAGE_KEY = 'devpilotx_skills_v1';
const TRAINING_EXAMPLES_STORAGE_KEY = 'devpilotx_training_examples_v1';
const TRAINING_PROFILE_STORAGE_KEY = 'devpilotx_training_profile_v1';
const KNOWLEDGE_DOCS_STORAGE_KEY = 'devpilotx_knowledge_docs_v1';
const FILE_TREE_STORAGE_KEY = 'devpilotx_file_tree_v1';

const getInitialSkills = (): AgentSkill[] => {
  let saved: AgentSkill[] | null = null;
  try {
    const raw = localStorage.getItem(SKILLS_STORAGE_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load saved skills', e);
  }
  if (!saved || !Array.isArray(saved)) return DEFAULT_BUILTIN_SKILLS;

  // Merge by id rather than letting saved state win outright. Saved state carries the user's
  // edits and custom skills, but built-ins added in a later version still have to appear for
  // anyone who already has skills stored -- otherwise shipping new built-ins does nothing.
  const byId = new Map<string, AgentSkill>();
  for (const skill of DEFAULT_BUILTIN_SKILLS) byId.set(skill.id, skill);
  for (const skill of saved) {
    if (skill && typeof skill.id === 'string') byId.set(skill.id, skill);
  }
  return [...byId.values()];
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

const isFileNode = (value: unknown): value is FileNode => {
  if (!value || typeof value !== 'object') return false;
  const node = value as FileNode;
  return (
    typeof node.id === 'string' &&
    typeof node.name === 'string' &&
    (node.type === 'file' || node.type === 'folder') &&
    typeof node.path === 'string'
  );
};

const sanitizeFileTree = (nodes: unknown): FileNode[] | null => {
  if (!Array.isArray(nodes)) return null;
  const result: FileNode[] = [];
  for (const raw of nodes) {
    if (!isFileNode(raw)) return null;
    const sanitized: FileNode = { ...raw };
    if (raw.type === 'folder' && Array.isArray((raw as FileNode).children)) {
      const sanitizedChildren = sanitizeFileTree((raw as FileNode).children);
      if (!sanitizedChildren) return null;
      sanitized.children = sanitizedChildren;
    }
    result.push(sanitized);
  }
  return result;
};

const getInitialFileTree = (): FileNode[] => {
  try {
    const saved = localStorage.getItem(FILE_TREE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const sanitized = sanitizeFileTree(parsed);
      if (sanitized) return sanitized;
      console.warn('Discarded malformed saved file tree');
    }
  } catch (e) {
    console.warn('Failed to load saved file tree', e);
  }
  return initialFileTree;
};

// Credentials are intentionally NOT read from localStorage: only the non-secret parts of
// the configuration live there. Keys come from the OS keychain (see lib/secrets.ts) and
// are merged in after mount. Legacy plaintext keys written by earlier versions are
// stripped here so upgrading removes them from disk.
const getInitialLLMConfig = (): LLMConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const cleanKeys = stripSecrets(parsed?.keys || {});
      if (parsed?.keys && hasAnySecret(parsed.keys)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, keys: cleanKeys }));
        console.warn('[secrets] removed plaintext API keys from localStorage');
      }
      return {
        provider: parsed.provider || 'gemini',
        selectedModelId: parsed.selectedModelId || DEFAULT_MODEL_ID,
        keys: {
          gemini: '',
          openrouter: '',
          ollamaUrl: cleanKeys.ollamaUrl || DEFAULT_OLLAMA_URL,
          ollamaApiKey: '',
          ollamaModel: cleanKeys.ollamaModel || 'llama3.3',
          groq: ''
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
      ollamaUrl: DEFAULT_OLLAMA_URL,
      ollamaApiKey: '',
      ollamaModel: 'llama3.3',
      groq: ''
    }
  };
};

// Only the non-secret half of the configuration belongs in localStorage.
const persistLLMConfig = (config: LLMConfig): void => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...config, keys: stripSecrets(config.keys) })
    );
  } catch (e) {
    // Non-fatal: preferences simply will not persist.
  }
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
  const [workspaceTruncated, setWorkspaceTruncated] = useState(false);
  // Monaco calls the content setter on every keystroke, so disk writes are debounced
  // per path rather than issued per character.
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activeTaskType, setActiveTaskType] = useState<TaskType>('image');
  const [taskChatHistory, setTaskChatHistory] = useState<TaskChatMessage[]>([]);
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(getInitialLLMConfig);
  // Where API keys live: the OS keychain in the desktop app, session-only in a browser.
  const [secretStorage, setSecretStorage] = useState<SecretStorageKind>('none');
  const secretsLoaded = useRef(false);
  const secretSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [agentMode, setAgentModeState] = useState<AgentMode>(() => {
    const saved = localStorage.getItem('devpilotx_agent_mode');
    return saved === 'plan' || saved === 'ask' || saved === 'agent' || saved === 'autonomous'
      ? saved
      : 'agent';
  });
  const [discoveredModels, setDiscoveredModels] = useState<AIModel[]>([]);
  // Providers the backend itself can serve (from its environment). Null until probed.
  const [serverProviderStatus, setServerProviderStatus] = useState<ServerProviderStatus | null>(
    null
  );

  // Trainable Agent & Claude-style Skills System State
  const [skills, setSkills] = useState<AgentSkill[]>(getInitialSkills);
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>(
    getInitialTrainingExamples
  );
  const [trainingProfile, setTrainingProfile] =
    useState<AgentTrainingProfile>(getInitialTrainingProfile);
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
    const updated = skills.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );
    persistSkills(updated);
  };

  const toggleSkill = (id: string) => {
    const updated = skills.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled, updatedAt: new Date().toISOString() } : s
    );
    persistSkills(updated);
  };

  const deleteSkill = (id: string) => {
    const updated = skills.filter(s => s.id !== id);
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
    const updated = trainingExamples.map(ex => (ex.id === id ? { ...ex, ...updates } : ex));
    persistTrainingExamples(updated);
  };

  const deleteTrainingExample = (id: string) => {
    const updated = trainingExamples.filter(ex => ex.id !== id);
    persistTrainingExamples(updated);
  };

  const updateTrainingProfile = (updates: Partial<AgentTrainingProfile>) => {
    setTrainingProfile(prev => {
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
    const updated = knowledgeDocs.map(d =>
      d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
    );
    persistKnowledgeDocs(updated);
  };

  const deleteKnowledgeDoc = (id: string) => {
    const updated = knowledgeDocs.filter(d => d.id !== id);
    persistKnowledgeDocs(updated);
  };

  // Which providers have a usable API behind them: user keys OR server env credentials.
  const linkedProviders = computeLinkedProviders(llmConfig.keys, serverProviderStatus);

  const availableModels: AIModel[] = (() => {
    // Discovered catalogs (from /api/provider-models) first, then the static catalogue
    // minus duplicates — then keep only providers that are actually linked to an API,
    // either by a user key or by server-side credentials.
    const all = [
      ...discoveredModels,
      ...AI_MODELS.filter(model => !discoveredModels.some(discovered => discovered.id === model.id))
    ];
    return filterAvailableModels(all, linkedProviders);
  })();
  // If the saved selection is for a provider that is no longer linked, fall back to the
  // first model that is — the user must never be left on an unusable model.
  const selectedModel =
    availableModels.find(model => model.id === llmConfig.selectedModelId) ||
    availableModels[0] ||
    getModelById(DEFAULT_MODEL_ID);

  // Fetch provider catalogs for whichever providers have usable credentials (user keys
  // travel in the body; the server adds its own env-based credentials server-side).
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
    // Always probe on mount: the server may serve providers from its own environment
    // even when the user has not entered any key yet.
    const timer = window.setTimeout(() => {
      refreshProviderModels().catch(error => {
        console.warn('Failed to refresh provider models', error);
      });
    }, 500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llmConfig.keys.gemini, llmConfig.keys.openrouter, llmConfig.keys.groq]);

  // One-time probe of the backend's own provider credentials (booleans only).
  useEffect(() => {
    fetch('/api/provider-status')
      .then(response => (response.ok ? response.json() : {}))
      .then((status: ServerProviderStatus) => setServerProviderStatus(status || {}))
      .catch(() => setServerProviderStatus({}));
  }, []);

  // Persist file tree (create / delete / edit) so changes survive a page reload.
  useEffect(() => {
    try {
      localStorage.setItem(FILE_TREE_STORAGE_KEY, JSON.stringify(fileTree));
    } catch (e) {
      console.warn('Failed to save file tree to localStorage', e);
    }
  }, [fileTree]);

  // The explorer reflects the real workspace on disk. The localStorage-backed virtual
  // tree is kept only as a fallback for environments where the backend reports an
  // empty or unreachable workspace (e.g. a fresh empty folder).
  const workspaceLoadStarted = useRef(false);
  const refreshFileTree = useCallback(async () => {
    try {
      const { entries, truncated } = await listWorkspaceTree();
      if (entries.length === 0 && !truncated) return; // empty workspace: keep current tree
      setFileTree(entriesToTree(entries));
      setWorkspaceTruncated(truncated);
    } catch (error) {
      console.warn('Failed to load workspace tree from disk', error);
    }
  }, []);

  useEffect(() => {
    if (workspaceLoadStarted.current) return;
    workspaceLoadStarted.current = true;
    void refreshFileTree();
  }, [refreshFileTree]);

  const selectModel = (modelId: string) => {
    const targetModel = getModelById(modelId);
    setLLMConfig(prev => {
      const updated = {
        ...prev,
        selectedModelId: targetModel.id,
        provider: targetModel.provider
      };
      persistLLMConfig(updated);
      return updated;
    });
  };

  // Load credentials from the OS keychain once, then write any change back. Keys live
  // only in this in-memory config and in the encrypted vault — never in localStorage.
  useEffect(() => {
    let cancelled = false;
    setSecretStorage(describeSecretStorage());
    void loadSecrets().then(secrets => {
      if (cancelled) return;
      secretsLoaded.current = true;
      if (Object.keys(secrets).length > 0) {
        setLLMConfig(prev => ({ ...prev, keys: { ...prev.keys, ...secrets } }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Skip the first render: the vault has not been read yet and writing now would
    // clobber stored keys with the empty initial state.
    if (!secretsLoaded.current) return;
    if (secretSaveTimer.current) clearTimeout(secretSaveTimer.current);
    secretSaveTimer.current = setTimeout(() => {
      secretSaveTimer.current = null;
      saveSecrets(pickSecrets(llmConfig.keys)).catch(error =>
        console.warn('[secrets] failed to store API keys', error)
      );
    }, 500);
    return () => {
      if (secretSaveTimer.current) clearTimeout(secretSaveTimer.current);
    };
  }, [llmConfig.keys]);

  // Explicit write, used by the Settings "Save" button so the user gets immediate
  // confirmation rather than waiting on the debounce.
  const persistApiKeys = useCallback(async () => {
    await saveSecrets(pickSecrets(llmConfig.keys));
    secretsLoaded.current = true;
  }, [llmConfig.keys]);

  const clearApiKeys = useCallback(async () => {
    secretsLoaded.current = true;
    setLLMConfig(prev => ({
      ...prev,
      keys: { ...prev.keys, gemini: '', openrouter: '', groq: '', ollamaApiKey: '' }
    }));
    await clearSecrets();
  }, []);

  const updateLLMConfig = (config: Partial<LLMConfig> | ((prev: LLMConfig) => LLMConfig)) => {
    setLLMConfig(prev => {
      const updated = typeof config === 'function' ? config(prev) : { ...prev, ...config };
      persistLLMConfig(updated);
      return updated;
    });
  };

  const setAgentMode = (mode: AgentMode) => {
    setAgentModeState(mode);
    localStorage.setItem('devpilotx_agent_mode', mode);
  };

  const openFile = (file: FileNode) => {
    if (file.type === 'folder') return;
    if (!openFiles.find(f => f.id === file.id)) {
      setOpenFiles([...openFiles, file]);
    }
    setActiveFileId(file.id);
    setActiveView('editor');
    // Real-workspace nodes carry no content; pull it from disk the first time they open.
    if (file.content === undefined) {
      readWorkspaceFile(file.path)
        .then(content => updateFileContent(file.id, content))
        .catch(error => reportFsError('read', file.path, error));
    }
  };

  const closeFile = (fileId: string) => {
    const newFiles = openFiles.filter(f => f.id !== fileId);
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
    const defaultContent = content !== undefined ? content : '';

    const newFile: FileNode = {
      id: `file-custom-${Date.now()}`,
      name: defaultName,
      type: 'file',
      path: `/${defaultName}`,
      language: getLanguageFromName(defaultName),
      content: defaultContent
    };
    setFileTree(prev => [...prev, newFile]);
    setOpenFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setActiveView('editor');
    setActiveActivity('explorer');

    // Write through to the real filesystem. Without this the file existed only in
    // browser state and vanished from disk's point of view entirely.
    writeWorkspaceFile(newFile.path, newFile.content ?? '').catch(error =>
      reportFsError('create', newFile.path, error)
    );
  };

  const addFolderToTree = (folder: FileNode) => {
    setFileTree(prev => [...prev, folder]);
    setActiveView('editor');
    setActiveActivity('explorer');
  };

  const createFolder = (folderName?: string) => {
    const name = (folderName || 'new-folder').trim();
    if (!name) return;
    const path = `/${name}`;
    if (fileTree.some(node => node.type === 'folder' && node.path === path)) return;
    const newFolder: FileNode = { id: `fs-${path}`, name, type: 'folder', path, children: [] };
    setFileTree(prev => [...prev, newFolder]);
    setActiveView('editor');
    setActiveActivity('explorer');
    createWorkspaceDir(path).catch(error => reportFsError('mkdir', path, error));
  };

  // Renames on disk first, then re-paths the in-memory subtree (ids derive from paths).
  const renamePath = (fileId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const findNode = (nodes: FileNode[]): FileNode | undefined => {
      for (const node of nodes) {
        if (node.id === fileId) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    const target = findNode(fileTree);
    if (!target) return;

    const parentDir = target.path.split('/').slice(0, -1).join('/');
    const to = `${parentDir}/${trimmed}`;
    if (to === target.path) return;

    const renamed = repathSubtree(target, target.path, to);
    const replaceNode = (nodes: FileNode[]): FileNode[] =>
      nodes.map(node =>
        node.id === fileId
          ? renamed
          : node.children
            ? { ...node, children: replaceNode(node.children) }
            : node
      );
    setFileTree(prev => replaceNode(prev));

    // Keep open tabs and the active tab pointing at the renamed paths.
    setOpenFiles(prevOpen =>
      prevOpen.map(open => {
        if (open.id === fileId) return renamed;
        if (open.path.startsWith(`${target.path}/`)) {
          const subPath = `${to}/${open.path.slice(target.path.length + 1)}`;
          return repathSubtree(open, open.path, subPath);
        }
        return open;
      })
    );
    if (activeFileId === target.id) {
      setActiveFileId(renamed.id);
    } else if (activeFileId) {
      const active = openFiles.find(f => f.id === activeFileId);
      if (active && active.path.startsWith(`${target.path}/`)) {
        setActiveFileId(`fs-${to}/${active.path.slice(target.path.length + 1)}`);
      }
    }

    renameWorkspacePath(target.path, to).catch(error =>
      reportFsError('rename', target.path, error)
    );
  };

  // `persist` is false when the caller is only mirroring a change the server already made
  // (the agent loop executes actions itself), so a second delete would 404.
  const deleteFile = (fileId: string, persist = true) => {
    // Resolve the path before the tree is filtered, so the file can be removed from disk too.
    const findNode = (nodes: FileNode[]): FileNode | undefined => {
      for (const node of nodes) {
        if (node.id === fileId) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    const target = findNode(fileTree);

    const deletedIds: string[] = [];
    const collectIds = (node: FileNode) => {
      deletedIds.push(node.id);
      if (node.children) {
        node.children.forEach(collectIds);
      }
    };

    const filterTree = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter(node => {
          if (node.id === fileId) {
            collectIds(node);
            return false;
          }
          return true;
        })
        .map(node => {
          if (node.children && node.children.length > 0) {
            return {
              ...node,
              children: filterTree(node.children)
            };
          }
          return node;
        });
    };

    setFileTree(prev => filterTree(prev));

    setOpenFiles(prevOpen => {
      const remaining = prevOpen.filter(f => !deletedIds.includes(f.id));
      setActiveFileId(currentActive => {
        if (currentActive && deletedIds.includes(currentActive)) {
          return remaining.length > 0 ? remaining[remaining.length - 1].id : null;
        }
        return currentActive;
      });
      return remaining;
    });

    if (persist && target?.path && target.type !== 'folder') {
      clearTimeout(saveTimers.current[target.path]);
      delete saveTimers.current[target.path];
      deleteWorkspaceFile(target.path).catch(error => reportFsError('delete', target.path, error));
    }
  };

  const saveAssetToProject = (fileName: string, content: string, language?: string) => {
    // Check if file already exists in open files or fileTree
    const existingIndex = fileTree.findIndex(f => f.name === fileName || f.path === `/${fileName}`);
    if (existingIndex >= 0) {
      const existingId = fileTree[existingIndex].id;
      setFileTree(prev => prev.map(f => (f.id === existingId ? { ...f, content } : f)));
      setOpenFiles(prev => prev.map(f => (f.id === existingId ? { ...f, content } : f)));
      setActiveFileId(existingId);
      setActiveView('editor');
      return;
    }

    const newFile: FileNode = {
      id: `file-asset-${Date.now()}`,
      name: fileName,
      type: 'file',
      path: `/${fileName}`,
      language:
        language ||
        (fileName.endsWith('.md') ? 'markdown' : fileName.endsWith('.svg') ? 'html' : 'plaintext'),
      content
    };
    setFileTree(prev => [...prev, newFile]);
    setOpenFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setActiveView('editor');
  };

  const clearChatHistory = () => {
    setChatHistory([]);
  };

  const addTaskChatMessage = (msg: Omit<TaskChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: TaskChatMessage = {
      ...msg,
      id: `task-msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date()
    };
    setTaskChatHistory(prev => [...prev, newMsg]);
  };

  const clearTaskChatHistory = (taskType?: TaskType) => {
    if (taskType) {
      setTaskChatHistory(prev => prev.filter(m => m.taskType !== taskType));
    } else {
      setTaskChatHistory([]);
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
      provider: msg.provider || selectedModel.providerLabel
    };
    setChatHistory(prev => [...prev, newMsg]);
  };

  const updateFileContent = (fileId: string, content: string) => {
    setOpenFiles(prev => prev.map(f => (f.id === fileId ? { ...f, content } : f)));
    const updateTree = (nodes: FileNode[]): FileNode[] =>
      nodes.map(node => {
        if (node.id === fileId) return { ...node, content };
        return node.children ? { ...node, children: updateTree(node.children) } : node;
      });

    setFileTree(prev => updateTree(prev));

    const locate = (nodes: FileNode[]): FileNode | undefined => {
      for (const node of nodes) {
        if (node.id === fileId) return node;
        if (node.children) {
          const found = locate(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    const path = locate(fileTree)?.path;
    if (!path) return;
    clearTimeout(saveTimers.current[path]);
    saveTimers.current[path] = setTimeout(() => {
      delete saveTimers.current[path];
      writeWorkspaceFile(path, content).catch(error => reportFsError('write', path, error));
    }, 800);
  };

  const toggleSidebar = (tab?: ActivityTab) => {
    if (tab) {
      setActiveActivity(activeActivity === tab ? null : tab);
    } else {
      setActiveActivity(activeActivity === null ? 'explorer' : null);
    }
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
        createFolder,
        renamePath,
        refreshFileTree,
        workspaceTruncated,
        deleteFile,
        addFolderToTree,
        saveAssetToProject,
        setActiveFileId,
        addChatMessage,
        clearChatHistory,
        addTaskChatMessage,
        clearTaskChatHistory,
        updateFileContent,
        llmConfig,
        updateLLMConfig,
        secretStorage,
        persistApiKeys,
        clearApiKeys,
        selectedModel,
        availableModels,
        linkedProviders,
        refreshProviderModels,
        selectModel,
        isModelSelectorOpen,
        setIsModelSelectorOpen,
        setActiveView,
        toggleSidebar,
        togglePanel,
        agentMode,
        setAgentMode,
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
        deleteKnowledgeDoc
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

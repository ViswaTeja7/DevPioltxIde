export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  language?: string;
  content?: string;
  children?: FileNode[];
  path: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  modelId?: string;
  modelName?: string;
  provider?: string;
}

export type ActivityTab = 'explorer' | 'search' | 'git' | 'debug' | 'extensions' | 'ai' | 'tasks' | 'skills' | 'settings';
export type PanelTab = 'terminal' | 'output' | 'debug' | 'problems';
export type ActiveView = 'editor' | 'dashboard' | 'studio' | 'skills';

export type TaskType = 'image' | 'research' | 'docs' | 'brainstorm' | 'general';
export type AgentMode = 'plan' | 'ask' | 'agent' | 'autonomous';

export type SkillCategory = 'frontend' | 'backend' | 'testing' | 'security' | 'architecture' | 'devops' | 'documentation' | 'custom';

export interface SkillFewShotExample {
  id: string;
  userQuery: string;
  assistantResponse: string;
  explanation?: string;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  enabled: boolean;
  triggers: string[]; // keywords e.g. ['test', 'vitest'] or ['*'] for all
  systemPrompt: string; // The core behavioral guidelines / skill instructions
  fewShotExamples: SkillFewShotExample[];
  isBuiltin?: boolean;
  createdAt: string;
  updatedAt: string;
  author?: string;
  icon?: string;
}

export interface TrainingExample {
  id: string;
  title: string;
  category: string;
  userPrompt: string;
  idealResponse: string;
  tags: string[];
  enabled: boolean;
  createdAt: string;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  enabled: boolean;
  updatedAt: string;
}

export interface AgentTrainingProfile {
  persona: 'senior-architect' | 'concise-engineer' | 'strict-auditor' | 'mentor' | 'custom';
  customPersonaTitle?: string;
  customSystemInstructions: string;
  strictRules: string[];
  teamConventions: string;
  enableFewShotLearning: boolean;
  enableProjectKnowledge: boolean;
  temperature?: number;
}

export interface TaskChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  taskType: TaskType;
  content: string;
  timestamp: Date;
  images?: {
    url: string;
    prompt: string;
    aspectRatio?: string;
    style?: string;
  }[];
  sources?: {
    title: string;
    url: string;
    snippet?: string;
  }[];
  metadata?: {
    query?: string;
    depth?: string;
    docType?: string;
    executionTimeMs?: number;
    modelUsed?: string;
  };
}

export type AIProvider = 'gemini' | 'openrouter' | 'ollama' | 'groq';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  providerLabel: string;
  description: string;
  tags: string[];
  badge?: string;
  contextWindow: string;
  speed: 'Ultra Fast' | 'Fast' | 'Deep Reasoning';
  iconType: 'gemini' | 'claude' | 'openai' | 'deepseek' | 'meta' | 'ollama' | 'qwen' | 'nvidia' | 'minimax' | 'mistral' | 'groq' | 'image' | 'flux' | 'stability';
  isDefault?: boolean;
  isCopilotRecommended?: boolean;
  requiresCustomKey?: boolean;
  isFree?: boolean;
  isImageModel?: boolean;
  category?: 'coding' | 'general' | 'image' | 'reasoning';
}


export interface LLMConfig {
  provider: AIProvider;
  selectedModelId: string;
  keys: {
    gemini: string;
    openrouter: string;
    ollamaUrl: string;
    ollamaApiKey: string;
    ollamaModel: string;
    groq: string;
  };
}

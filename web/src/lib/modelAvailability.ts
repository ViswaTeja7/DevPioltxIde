// Model availability rules.
//
// The assistant must only offer models whose backing API is actually linked. A provider
// is linked when either side has a usable credential:
//   - the user entered an API key in Settings (stored in the OS keychain), or
//   - the backend has the key in its environment (server-side built-in credentials).
// The server never reveals the keys themselves — only booleans via /api/provider-status.
import { AIProvider } from '../types';

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434/v1';

export interface ServerProviderStatus {
  gemini?: boolean;
  openrouter?: boolean;
  groq?: boolean;
  ollama?: boolean;
}

export interface LinkedProviders {
  gemini: boolean;
  openrouter: boolean;
  groq: boolean;
  ollama: boolean;
}

export interface ProviderKeyBag {
  gemini?: string;
  openrouter?: string;
  groq?: string;
  ollamaApiKey?: string;
  ollamaUrl?: string;
}

// Ollama is "linked" when the user explicitly configured it (API key, or a base URL
// other than the untouched default). A default localhost URL alone proves nothing —
// the daemon may not even be running.
export const computeLinkedProviders = (
  keys: ProviderKeyBag,
  serverStatus?: ServerProviderStatus | null
): LinkedProviders => {
  const ollamaUrl = (keys.ollamaUrl || '').trim();
  return {
    gemini: Boolean(keys.gemini?.trim()) || Boolean(serverStatus?.gemini),
    openrouter: Boolean(keys.openrouter?.trim()) || Boolean(serverStatus?.openrouter),
    groq: Boolean(keys.groq?.trim()) || Boolean(serverStatus?.groq),
    ollama:
      Boolean(keys.ollamaApiKey?.trim()) ||
      Boolean(serverStatus?.ollama) ||
      (ollamaUrl.length > 0 && ollamaUrl !== DEFAULT_OLLAMA_URL)
  };
};

export const isProviderLinked = (
  provider: AIProvider,
  linked: LinkedProviders
): boolean => {
  switch (provider) {
    case 'gemini':
      return linked.gemini;
    case 'openrouter':
      return linked.openrouter;
    case 'groq':
      return linked.groq;
    case 'ollama':
      return linked.ollama;
    default:
      return false;
  }
};

/** Keeps only models whose provider is linked to a usable API. */
export const filterAvailableModels = <T extends { provider: AIProvider }>(
  models: T[],
  linked: LinkedProviders
): T[] => models.filter(model => isProviderLinked(model.provider, linked));

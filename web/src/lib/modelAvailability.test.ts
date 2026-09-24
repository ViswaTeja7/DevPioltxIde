import { describe, it, expect } from 'vitest';
import {
  computeLinkedProviders,
  filterAvailableModels,
  isProviderLinked,
  type LinkedProviders
} from './modelAvailability';
import { AIModel } from '../types';

const model = (id: string, provider: AIModel['provider']): AIModel => ({
  id,
  name: id,
  provider,
  providerLabel: provider,
  description: '',
  tags: [],
  contextWindow: '128k',
  speed: 'Fast',
  iconType: 'gemini'
});

describe('computeLinkedProviders', () => {
  it('links a provider when the user supplied a key', () => {
    const linked = computeLinkedProviders({ gemini: 'AIza-1', groq: '  ' });
    expect(linked.gemini).toBe(true);
    expect(linked.groq).toBe(false);
    expect(linked.openrouter).toBe(false);
  });

  it('links a provider from server-side credentials', () => {
    const linked = computeLinkedProviders(
      {},
      { gemini: false, openrouter: true, groq: false, ollama: false }
    );
    expect(linked.gemini).toBe(false);
    expect(linked.openrouter).toBe(true);
  });

  it('treats an explicitly configured Ollama URL as linked', () => {
    const linked = computeLinkedProviders({ ollamaUrl: 'https://my-host.example/v1' });
    expect(linked.ollama).toBe(true);
  });

  it('does not treat the untouched default Ollama URL as linked', () => {
    const linked = computeLinkedProviders({ ollamaUrl: 'http://localhost:11434/v1' });
    expect(linked.ollama).toBe(false);
  });

  it('links Ollama with an API key or server-side URL', () => {
    expect(computeLinkedProviders({ ollamaApiKey: 'tok' }).ollama).toBe(true);
    expect(computeLinkedProviders({}, { ollama: true }).ollama).toBe(true);
  });
});

describe('filterAvailableModels', () => {
  const all: AIModel[] = [
    model('gemini-1', 'gemini'),
    model('or-1', 'openrouter'),
    model('or-2', 'openrouter'),
    model('groq-1', 'groq'),
    model('local-1', 'ollama')
  ];

  it('returns only models of linked providers', () => {
    const linked: LinkedProviders = { gemini: true, openrouter: false, groq: true, ollama: false };
    const result = filterAvailableModels(all, linked);
    expect(result.map(m => m.id)).toEqual(['gemini-1', 'groq-1']);
  });

  it('returns everything when all providers are linked', () => {
    const linked: LinkedProviders = { gemini: true, openrouter: true, groq: true, ollama: true };
    expect(filterAvailableModels(all, linked)).toHaveLength(all.length);
  });

  it('returns nothing when no provider is linked', () => {
    const linked: LinkedProviders = {
      gemini: false,
      openrouter: false,
      groq: false,
      ollama: false
    };
    expect(filterAvailableModels(all, linked)).toEqual([]);
  });

  it('isProviderLinked covers every provider', () => {
    const linked: LinkedProviders = { gemini: true, openrouter: false, groq: true, ollama: false };
    expect(isProviderLinked('gemini', linked)).toBe(true);
    expect(isProviderLinked('openrouter', linked)).toBe(false);
    expect(isProviderLinked('groq', linked)).toBe(true);
    expect(isProviderLinked('ollama', linked)).toBe(false);
  });
});

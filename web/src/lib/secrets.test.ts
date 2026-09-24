import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  SECRET_KEY_NAMES,
  describeSecretStorage,
  hasAnySecret,
  isSecretKey,
  loadSecrets,
  partitionKeys,
  pickSecrets,
  saveSecrets,
  stripSecrets
} from './secrets';

const fullKeys = {
  gemini: 'AIza-secret',
  openrouter: 'sk-or-secret',
  groq: 'gsk-secret',
  ollamaApiKey: 'ollama-secret',
  ollamaUrl: 'http://localhost:11434/v1',
  ollamaModel: 'llama3.3'
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('secret partitioning', () => {
  it('classifies every credential field as a secret', () => {
    expect([...SECRET_KEY_NAMES]).toEqual(['gemini', 'openrouter', 'groq', 'ollamaApiKey']);
    expect(isSecretKey('gemini')).toBe(true);
    expect(isSecretKey('ollamaUrl')).toBe(false);
  });

  it('separates secrets from persistable configuration', () => {
    const { secrets, config } = partitionKeys(fullKeys);
    expect(Object.keys(secrets).sort()).toEqual(['gemini', 'groq', 'ollamaApiKey', 'openrouter']);
    expect(config).toEqual({
      ollamaUrl: 'http://localhost:11434/v1',
      ollamaModel: 'llama3.3'
    });
  });

  it('stripSecrets never leaks a credential', () => {
    const persisted = JSON.stringify(stripSecrets(fullKeys));
    expect(persisted).not.toContain('secret');
    expect(persisted).not.toContain('gemini');
  });

  it('omits empty secrets so clearing a key removes it from the vault', () => {
    expect(pickSecrets({ ...fullKeys, groq: '' })).not.toHaveProperty('groq');
  });

  it('hasAnySecret reflects whether anything is stored', () => {
    expect(hasAnySecret(fullKeys)).toBe(true);
    expect(hasAnySecret({ ollamaUrl: 'http://localhost:11434/v1' })).toBe(false);
  });
});

describe('storage backends', () => {
  it('prefers the desktop keychain bridge', async () => {
    const setSecrets = vi.fn().mockResolvedValue(true);
    const getSecrets = vi.fn().mockResolvedValue({ gemini: 'from-keychain' });
    vi.stubGlobal('window', { devpilotx: { setSecrets, getSecrets } });

    expect(describeSecretStorage()).toBe('keychain');
    await expect(loadSecrets()).resolves.toEqual({ gemini: 'from-keychain' });
    await saveSecrets({ gemini: 'new' });
    expect(setSecrets).toHaveBeenCalledWith({ gemini: 'new' });
  });

  it('falls back to session-only storage without the bridge', async () => {
    const store = new Map<string, string>();
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
        removeItem: (key: string) => void store.delete(key)
      }
    });

    expect(describeSecretStorage()).toBe('session');
    await saveSecrets({ openrouter: 'sk-or-x' });
    await expect(loadSecrets()).resolves.toEqual({ openrouter: 'sk-or-x' });
  });

  it('reports no storage when neither backend is usable', () => {
    vi.stubGlobal('window', {
      // A hardened context where sessionStorage throws (Safari private mode, policy).
      get sessionStorage(): Storage {
        throw new Error('blocked');
      }
    });
    expect(describeSecretStorage()).toBe('none');
  });

  it('degrades to empty secrets when the keychain read fails', async () => {
    vi.stubGlobal('window', {
      devpilotx: {
        getSecrets: vi.fn().mockRejectedValue(new Error('keychain locked')),
        setSecrets: vi.fn()
      }
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(loadSecrets()).resolves.toEqual({});
    warn.mockRestore();
  });
});

// API-key storage.
//
// Keys must never be written to localStorage: that is plaintext on disk (Chromium's
// unencrypted leveldb under userData), so any process or backup that can read the
// profile can read the keys. In the desktop app keys go through the preload bridge into
// Electron's safeStorage, which encrypts them with the OS keychain (DPAPI on Windows,
// Keychain on macOS, libsecret on Linux) and stores only ciphertext in secrets.bin.
//
// If the bridge is unavailable (e.g. `npm run dev` in a plain browser) keys are kept in
// sessionStorage, which the browser clears when the window closes — so they are never
// persisted to disk, at the cost of having to re-enter them after a restart.

export const SECRET_KEY_NAMES = ['gemini', 'openrouter', 'groq', 'ollamaApiKey'] as const;
export type SecretKeyName = (typeof SECRET_KEY_NAMES)[number];

export type SecretStorageKind = 'keychain' | 'session' | 'none';

const SESSION_STORAGE_KEY = 'devpilotx_session_secrets';

export const isSecretKey = (name: string): name is SecretKeyName =>
  (SECRET_KEY_NAMES as readonly string[]).includes(name);

/** Splits a keys record into { secrets, config } — pure, unit-tested. */
export const partitionKeys = <T extends Record<string, string | undefined>>(
  keys: T
): { secrets: Record<string, string>; config: Record<string, string> } => {
  const secrets: Record<string, string> = {};
  const config: Record<string, string> = {};
  for (const [name, value] of Object.entries(keys)) {
    if (typeof value !== 'string') continue;
    if (isSecretKey(name)) {
      if (value) secrets[name] = value;
    } else {
      config[name] = value;
    }
  }
  return { secrets, config };
};

/** Non-secret subset, safe to persist in localStorage. */
export const stripSecrets = <T extends Record<string, string | undefined>>(
  keys: T
): Record<string, string> => partitionKeys(keys).config;

/** Secret subset destined for the OS keychain. */
export const pickSecrets = <T extends Record<string, string | undefined>>(
  keys: T
): Record<string, string> => partitionKeys(keys).secrets;

export const hasAnySecret = (keys: Record<string, string | undefined>): boolean =>
  Object.keys(pickSecrets(keys)).length > 0;

const desktopBridge = (): Window['devpilotx'] | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window.devpilotx;
};

const canUseSessionStorage = (): boolean => {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return false;
    window.sessionStorage.setItem('__devpilotx_probe', '1');
    window.sessionStorage.removeItem('__devpilotx_probe');
    return true;
  } catch {
    return false;
  }
};

export const describeSecretStorage = (): SecretStorageKind => {
  if (desktopBridge()?.setSecrets) return 'keychain';
  if (canUseSessionStorage()) return 'session';
  return 'none';
};

export const loadSecrets = async (): Promise<Record<string, string>> => {
  const bridge = desktopBridge();
  if (bridge?.getSecrets) {
    try {
      const stored = await bridge.getSecrets();
      return stored && typeof stored === 'object' ? stored : {};
    } catch (error) {
      console.warn('[secrets] keychain read failed', error);
      return {};
    }
  }
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const saveSecrets = async (secrets: Record<string, string>): Promise<void> => {
  const bridge = desktopBridge();
  if (bridge?.setSecrets) {
    // safeStorage serialises the whole vault, so replace it wholesale.
    await bridge.setSecrets(secrets);
    return;
  }
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(secrets));
  } catch (error) {
    console.warn('[secrets] session storage write failed', error);
  }
};

export const clearSecrets = async (): Promise<void> => {
  await saveSecrets({});
};

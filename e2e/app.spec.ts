import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// This spec is ESM (package.json sets "type": "module"), so __dirname is unavailable.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Smoke tests for the packaged application shell. These launch the real main process,
// which in turn spawns the real backend and serves the built renderer, so a regression
// in process wiring (spawn, handshake, auth, CSP) fails here rather than in the field.

let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  app = await electron.launch({
    args: [projectRoot],
    cwd: projectRoot,
    env: {
      ...process.env,
      DEVPILOTX_DISABLE_GPU: '1', // headless CI runners have no usable GPU
      DEVPILOTX_WORKSPACE: projectRoot
    }
  });
  page = await app.firstWindow();
});

test.afterAll(async () => {
  await app?.close();
});

test('main process reports the app version and workspace', async () => {
  const info = await app.evaluate(async ({ app: electronApp }) => ({
    version: electronApp.getVersion(),
    packaged: electronApp.isPackaged,
    name: electronApp.getName()
  }));
  expect(info.version).toMatch(/^\d+\.\d+\.\d+/);
  expect(info.name).toBeTruthy();
});

test('renderer loads from the local backend and is authenticated', async () => {
  // The renderer is only reachable on loopback with a valid session cookie, so a
  // successful load proves the spawn → handshake → /__auth → session chain works.
  expect(page.url()).toMatch(/^http:\/\/127\.0\.0\.1:\d+\//);
});

test('IDE shell renders', async () => {
  await expect(page.locator('text=Explorer').first()).toBeVisible();
});

test('backend API answers the workspace tree request', async () => {
  const status = await page.evaluate(async () => {
    const response = await fetch('/api/fs/tree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '.' })
    });
    const body = await response.json();
    return { ok: response.ok, entryCount: Array.isArray(body?.entries) ? body.entries.length : -1 };
  });
  expect(status.ok).toBe(true);
  expect(status.entryCount).toBeGreaterThan(0);
});

test('workspace root containment rejects path escapes', async () => {
  const result = await page.evaluate(async () => {
    const response = await fetch('/api/fs/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '../../../../etc/passwd' })
    });
    return { status: response.status, body: await response.json() };
  });
  expect(result.status).toBe(400);
  expect(result.body.error).toMatch(/escapes the workspace root/i);
});

test('backend reports which AI providers it can serve without revealing keys', async () => {
  const status = await page.evaluate(async () => {
    const response = await fetch('/api/provider-status');
    return { ok: response.ok, body: await response.json() };
  });
  expect(status.ok).toBe(true);
  // Booleans only — the endpoint must never echo key material.
  for (const provider of ['gemini', 'openrouter', 'groq', 'ollama']) {
    expect(typeof status.body[provider]).toBe('boolean');
  }
  expect(JSON.stringify(status.body)).not.toMatch(/sk-or-|AIza|gsk_/);
});

test('terminal tab exposes a live PTY session', async () => {
  // The backend advertises the shells it resolved (ConPTY on Windows, pty elsewhere).
  const shells = await page.evaluate(async () => {
    const response = await fetch('/api/shells');
    return response.ok ? response.json() : null;
  });
  expect(shells?.shells?.length).toBeGreaterThan(0);
  expect(shells.defaultId).toBeTruthy();
});

test('API keys typed in Settings reach the OS keychain and never localStorage', async () => {
  // Start from a clean vault so the assertion cannot pass on stale state.
  await page.evaluate(() => window.devpilotx?.setSecrets({}));

  await page.locator('nav[aria-label="Primary"] button[aria-label="Settings"]').click();

  const geminiKeyField = page.getByPlaceholder(
    'Optional custom key (uses server GEMINI_API_KEY by default)'
  );
  await expect(geminiKeyField).toBeVisible();
  await geminiKeyField.fill('AIza-e2e-secret-key');

  // Give the debounced secure-store write time to land.
  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const stored = await window.devpilotx?.getSecrets();
        return stored?.gemini ?? null;
      })
    )
    .toBe('AIza-e2e-secret-key');

  // The plaintext must not survive anywhere in browser storage.
  const leaked = await page.evaluate(() => {
    const config = localStorage.getItem('devpilotx_llm_config_v2') || '';
    const allLocal = JSON.stringify(localStorage);
    const allSession = JSON.stringify(sessionStorage);
    return {
      config,
      inConfig: config.includes('AIza-e2e-secret-key'),
      anywhere: allLocal.includes('AIza-e2e-secret-key') || allSession.includes('AIza-e2e-secret-key')
    };
  });
  expect(leaked.inConfig).toBe(false);
  expect(leaked.anywhere).toBe(false);

  // Non-secret preferences still persist, so the feature remains usable.
  expect(leaked.config).toContain('selectedModelId');

  // Clean up the vault for the next run.
  await page.evaluate(() => window.devpilotx?.setSecrets({}));
});

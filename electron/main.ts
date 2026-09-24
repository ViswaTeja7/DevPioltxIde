import {
  app,
  BrowserWindow,
  Menu,
  crashReporter,
  dialog,
  ipcMain,
  safeStorage,
  session,
  shell
} from 'electron';
import { spawn, type ChildProcess } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import log from 'electron-log/main';
import path from 'path';

const AUTH_TOKEN = crypto.randomBytes(32).toString('hex');
const isDev = !app.isPackaged;

// Structured logging to a rotating file in the OS log directory
// (%APPDATA%/devpilotx/logs/main.log on Windows). console.* is mirrored into it so
// everything the main process prints is captured for support diagnostics.
log.initialize();
log.transports.file.level = 'info';
log.transports.file.maxSize = 5 * 1024 * 1024;
Object.assign(console, log.functions);

// Collect crash dumps locally; they are never uploaded anywhere automatically.
// Dumps land in the crashpad directory under userData for support to review.
crashReporter.start({ productName: 'DevPilotX', uploadToServer: false });

process.on('uncaughtException', error => {
  log.error('[main] uncaught exception:', error);
});
process.on('unhandledRejection', reason => {
  log.error('[main] unhandled rejection:', reason);
});

// Compatibility escape hatches for constrained environments. Both default to OFF so that
// normal desktop installs keep Chromium's sandbox and GPU acceleration enabled.
// These must run before the app becomes ready.
//
// DEVPILOTX_DISABLE_GPU=1  — for VMs / remote desktop sessions with no usable GPU, where
//                            Chromium's GPU process dies and takes the app with it
//                            ("GPU process isn't usable. Goodbye."). Falls back to software GL.
// DEVPILOTX_NO_SANDBOX=1   — for nested-virtualisation or locked-down images where the
//                            Chromium sandbox cannot initialise. Weakens process isolation,
//                            so only set it when the sandbox genuinely cannot start.
const gpuDisabled =
  process.argv.includes('--disable-gpu') || process.env.DEVPILOTX_DISABLE_GPU === '1';
const sandboxUnavailable =
  process.argv.includes('--no-sandbox') || process.env.DEVPILOTX_NO_SANDBOX === '1';

if (gpuDisabled) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('use-gl', 'swiftshader');
  app.commandLine.appendSwitch('disable-software-rasterizer');
}
if (sandboxUnavailable) {
  app.commandLine.appendSwitch('no-sandbox');
}

let backend: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;
let backendOrigin = '';
// Distinguishes an intentional stop (workspace switch, app quit) from a crash, so only
// the latter triggers an automatic restart.
let backendStopIntentional = false;
let backendRestartAttempts = 0;
const MAX_BACKEND_RESTARTS = 5;

interface AppSettings {
  workspace: string;
}

function settingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

function secretsPath(): string {
  return path.join(app.getPath('userData'), 'secrets.bin');
}

function readSettings(): AppSettings {
  try {
    const parsed = JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));
    if (typeof parsed?.workspace === 'string' && parsed.workspace.trim()) {
      return { workspace: parsed.workspace.trim() };
    }
  } catch {
    /* first launch or unreadable file */
  }
  return { workspace: app.getPath('documents') };
}

function writeSettings(settings: AppSettings): void {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), 'utf8');
}

function secureStorageAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

function readSecrets(): Record<string, string> {
  if (!secureStorageAvailable()) return {};
  try {
    const parsed = JSON.parse(safeStorage.decryptString(fs.readFileSync(secretsPath())));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeSecrets(secrets: Record<string, string>): void {
  if (!secureStorageAvailable()) {
    throw new Error('OS keychain is unavailable on this system.');
  }
  fs.mkdirSync(path.dirname(secretsPath()), { recursive: true });
  fs.writeFileSync(secretsPath(), safeStorage.encryptString(JSON.stringify(secrets)));
}

function unpackedRoot(): string {
  return app.isPackaged ? path.join(process.resourcesPath, 'app.asar.unpacked') : app.getAppPath();
}

function serverEntry(): string {
  return path.join(unpackedRoot(), 'dist', 'server.bundle.cjs');
}

function rendererDist(): string {
  return path.join(unpackedRoot(), 'dist');
}

function stopBackend(): void {
  backendStopIntentional = true;
  if (backend && !backend.killed) {
    backend.removeAllListeners('exit');
    backend.kill();
  }
  backend = null;
  backendOrigin = '';
}

// A backend that dies mid-session takes the whole IDE down if nothing restarts it.
// Restart with exponential backoff and reload the window onto the new origin.
function scheduleBackendRestart(code: number | null, signal: NodeJS.Signals | null): void {
  if (!mainWindow) return; // the app is shutting down
  backendRestartAttempts += 1;
  if (backendRestartAttempts > MAX_BACKEND_RESTARTS) {
    log.error(`[backend] gave up after ${MAX_BACKEND_RESTARTS} restart attempts.`);
    dialog.showErrorBox(
      'DevPilotX backend stopped',
      'The local backend crashed repeatedly and could not be restarted. Check the logs (Help menu) and relaunch the app.'
    );
    return;
  }
  const delay = Math.min(1000 * 2 ** (backendRestartAttempts - 1), 15_000);
  log.warn(
    `[backend] exited unexpectedly (code=${code}, signal=${signal}); ` +
      `restart ${backendRestartAttempts}/${MAX_BACKEND_RESTARTS} in ${delay}ms`
  );
  setTimeout(() => {
    reloadWindowWithFreshBackend().catch(error => {
      log.error('[backend] restart failed:', error);
      scheduleBackendRestart(null, null);
    });
  }, delay);
}

function startBackend(): Promise<string> {
  return new Promise((resolve, reject) => {
    stopBackend();

    const settings = readSettings();
    const entry = serverEntry();

    if (!fs.existsSync(entry)) {
      reject(new Error(`Backend bundle missing at ${entry}. Run "npm run build" first.`));
      return;
    }

    const child = spawn(process.execPath, [entry], {
      cwd: settings.workspace,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        NODE_ENV: 'production',
        DEVPILOTX_EMBEDDED: '1',
        DEVPILOTX_HOST: '127.0.0.1',
        DEVPILOTX_PORT: '0',
        DEVPILOTX_AUTH_TOKEN: AUTH_TOKEN,
        DEVPILOTX_WORKSPACE: settings.workspace,
        DEVPILOTX_DIST_DIR: rendererDist()
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    backend = child;
    backendStopIntentional = false;

    let settled = false;
    let stdoutBuffer = '';

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      stopBackend();
      reject(new Error('Backend did not report readiness within 30 seconds.'));
    }, 30_000);

    child.stdout?.on('data', chunk => {
      stdoutBuffer += chunk.toString();
      const match = stdoutBuffer.match(/DEVPILOTX_READY (\{.*\})/);
      if (match && !settled) {
        settled = true;
        clearTimeout(timeout);
        try {
          const info = JSON.parse(match[1]);
          const origin = `http://127.0.0.1:${info.port}`;
          backendOrigin = origin;
          backendRestartAttempts = 0; // a healthy start clears the restart backoff
          log.info(`[backend] ready on ${origin}`);
          resolve(origin);
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Malformed backend handshake.'));
        }
      }
    });

    child.stderr?.on('data', chunk => {
      log.error('[backend]', chunk.toString().trim());
    });

    child.on('error', error => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });

    child.on('exit', (code, signal) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(new Error(`Backend exited early with code ${code}.`));
        return;
      }
      // The backend was healthy and died mid-session: supervise it back to life
      // instead of stranding the UI on a dead origin.
      if (backend === child) backend = null;
      if (backendStopIntentional) return;
      scheduleBackendRestart(code, signal);
    });
  });
}

function buildContentSecurityPolicy(): string {
  const directives = [
    "default-src 'self'",
    isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    // Task Studio renders generated images with <img src>, and the keyless image
    // backend returns absolute pollinations.ai URLs, so that origin must be allowed
    // for images. It is deliberately not allowed for scripts, styles or connections.
    "img-src 'self' data: blob: https://image.pollinations.ai",
    "font-src 'self' data:",
    "media-src 'self' data:",
    "connect-src 'self' ws://127.0.0.1:* ws://localhost:*",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'"
  ];
  return directives.join('; ');
}

function isAppUrl(target: string): boolean {
  if (!backendOrigin) return false;
  try {
    const candidate = new URL(target);
    const base = new URL(backendOrigin);
    return candidate.hostname === base.hostname && candidate.port === base.port;
  } catch {
    return false;
  }
}

function openExternalUrl(target: string): void {
  try {
    const parsed = new URL(target);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      void shell.openExternal(target);
    }
  } catch {
    /* ignore malformed URLs */
  }
}

function installSessionHardening(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [buildContentSecurityPolicy()],
        'X-Content-Type-Options': ['nosniff']
      }
    });
  });

  // Only clipboard access is granted; the terminal needs both directions for
  // Ctrl+Shift+C / Ctrl+Shift+V. Everything else is denied by default.
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => {
    callback(permission === 'clipboard-sanitized-write' || permission === 'clipboard-read');
  });
}

function hardenWebContents(contents: Electron.WebContents): void {
  contents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) {
      event.preventDefault();
      openExternalUrl(url);
    }
  });

  contents.setWindowOpenHandler(({ url }) => {
    openExternalUrl(url);
    return { action: 'deny' };
  });

  contents.on('will-attach-webview', event => {
    event.preventDefault();
  });

  if (!isDev) {
    contents.on('devtools-opened', () => contents.closeDevTools());
  }
}

function createWindow(origin: string): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 620,
    show: false,
    backgroundColor: '#0d1117',
    title: 'DevPilotX IDE',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      spellcheck: false,
      devTools: isDev
    }
  });

  hardenWebContents(mainWindow.webContents);

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  void mainWindow.loadURL(`${origin}/__auth?token=${encodeURIComponent(AUTH_TOKEN)}`);
}

async function reloadWindowWithFreshBackend(): Promise<void> {
  const origin = await startBackend();
  if (mainWindow) {
    await mainWindow.loadURL(`${origin}/__auth?token=${encodeURIComponent(AUTH_TOKEN)}`);
  }
}

// Auto-updates via electron-updater against the GitHub Releases feed configured under
// "publish" in package.json. Runs only in packaged builds; in dev it is a no-op.
let updaterConfigured = false;

async function checkForUpdates(manual = false): Promise<void> {
  if (!app.isPackaged) {
    if (manual) {
      void dialog.showMessageBox({
        type: 'info',
        message: 'Updates are only checked in packaged builds.'
      });
    }
    return;
  }

  const { autoUpdater } = await import('electron-updater');

  if (!updaterConfigured) {
    updaterConfigured = true;
    autoUpdater.logger = log;
    autoUpdater.autoDownload = true;
    autoUpdater.on('update-available', info => {
      log.info(`[updater] update available: ${info.version}; downloading…`);
    });
    autoUpdater.on('update-not-available', () => {
      log.info('[updater] already up to date');
      if (manual) {
        void dialog.showMessageBox({ type: 'info', message: 'DevPilotX is up to date.' });
      }
    });
    autoUpdater.on('error', error => {
      log.warn('[updater] error:', error?.message || error);
      if (manual) {
        void dialog.showMessageBox({
          type: 'error',
          message: 'Update check failed.',
          detail: String(error?.message || error)
        });
      }
    });
    autoUpdater.on('update-downloaded', info => {
      log.info(`[updater] ${info.version} downloaded; awaiting restart`);
      void dialog
        .showMessageBox({
          type: 'info',
          message: `DevPilotX ${info.version} is ready to install.`,
          detail: 'Restart the application to apply the update.',
          buttons: ['Restart now', 'Later'],
          defaultId: 0,
          cancelId: 1
        })
        .then(result => {
          if (result.response === 0) autoUpdater.quitAndInstall();
        });
    });
  }

  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    log.warn('[updater] check failed:', error);
  }
}

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Workspace Folder…',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const current = readSettings();
            const result = await dialog.showOpenDialog({
              title: 'Choose workspace folder',
              defaultPath: current.workspace,
              properties: ['openDirectory', 'createDirectory']
            });
            if (result.canceled || !result.filePaths[0]) return;
            writeSettings({ workspace: result.filePaths[0] });
            try {
              await reloadWindowWithFreshBackend();
            } catch (error) {
              dialog.showErrorBox(
                'Unable to switch workspace',
                error instanceof Error ? error.message : String(error)
              );
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates…',
          click: () => void checkForUpdates(true)
        },
        {
          label: 'Open Logs Folder',
          click: () => void shell.openPath(path.join(app.getPath('logs')))
        },
        { type: 'separator' },
        {
          label: 'DevPilotX on GitHub',
          click: () => openExternalUrl('https://github.com/ViswaTeja7/DevPioltxIde')
        }
      ]
    }
  ];

  if (isDev) {
    template.splice(2, 0, {
      label: 'Developer',
      submenu: [{ role: 'toggleDevTools' }]
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function registerIpc(): void {
  ipcMain.handle('app:get-info', () => ({
    platform: process.platform,
    version: app.getVersion(),
    packaged: app.isPackaged,
    secureStorageAvailable: secureStorageAvailable(),
    workspace: readSettings().workspace
  }));

  ipcMain.handle('settings:get-workspace', () => readSettings().workspace);

  ipcMain.handle('secrets:get', () => readSecrets());

  ipcMain.handle('secrets:set', (_event, payload: unknown) => {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid secrets payload.');
    }
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      if (typeof value === 'string') clean[key] = value;
    }
    writeSecrets(clean);
    return true;
  });

  ipcMain.handle('shell:open-external', (_event, target: unknown) => {
    if (typeof target !== 'string') return false;
    openExternalUrl(target);
    return true;
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('web-contents-created', (_event, contents) => hardenWebContents(contents));

  app.whenReady().then(async () => {
    installSessionHardening();
    registerIpc();
    buildMenu();

    try {
      const origin = await startBackend();
      createWindow(origin);
      void checkForUpdates(); // background check on launch; packaged builds only
    } catch (error) {
      dialog.showErrorBox(
        'DevPilotX failed to start',
        error instanceof Error ? error.message : String(error)
      );
      app.quit();
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0 && backendOrigin) {
        createWindow(backendOrigin);
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', stopBackend);
  app.on('will-quit', stopBackend);
}

import { app, BrowserWindow, Menu, dialog, ipcMain, safeStorage, session, shell } from "electron";
import { spawn, type ChildProcess } from "child_process";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const AUTH_TOKEN = crypto.randomBytes(32).toString("hex");
const isDev = !app.isPackaged;

let backend: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;
let backendOrigin = "";

interface AppSettings {
  workspace: string;
}

function settingsPath(): string {
  return path.join(app.getPath("userData"), "settings.json");
}

function secretsPath(): string {
  return path.join(app.getPath("userData"), "secrets.bin");
}

function readSettings(): AppSettings {
  try {
    const parsed = JSON.parse(fs.readFileSync(settingsPath(), "utf8"));
    if (typeof parsed?.workspace === "string" && parsed.workspace.trim()) {
      return { workspace: parsed.workspace.trim() };
    }
  } catch {
    /* first launch or unreadable file */
  }
  return { workspace: app.getPath("documents") };
}

function writeSettings(settings: AppSettings): void {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), "utf8");
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
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSecrets(secrets: Record<string, string>): void {
  if (!secureStorageAvailable()) {
    throw new Error("OS keychain is unavailable on this system.");
  }
  fs.mkdirSync(path.dirname(secretsPath()), { recursive: true });
  fs.writeFileSync(secretsPath(), safeStorage.encryptString(JSON.stringify(secrets)));
}

function unpackedRoot(): string {
  return app.isPackaged ? path.join(process.resourcesPath, "app.asar.unpacked") : app.getAppPath();
}

function serverEntry(): string {
  return path.join(unpackedRoot(), "dist", "server.bundle.cjs");
}

function rendererDist(): string {
  return path.join(unpackedRoot(), "dist");
}

function stopBackend(): void {
  if (backend && !backend.killed) {
    backend.removeAllListeners("exit");
    backend.kill();
  }
  backend = null;
  backendOrigin = "";
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
        ELECTRON_RUN_AS_NODE: "1",
        NODE_ENV: "production",
        DEVPILOTX_EMBEDDED: "1",
        DEVPILOTX_HOST: "127.0.0.1",
        DEVPILOTX_PORT: "0",
        DEVPILOTX_AUTH_TOKEN: AUTH_TOKEN,
        DEVPILOTX_WORKSPACE: settings.workspace,
        DEVPILOTX_DIST_DIR: rendererDist()
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });

    backend = child;

    let settled = false;
    let stdoutBuffer = "";

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      stopBackend();
      reject(new Error("Backend did not report readiness within 30 seconds."));
    }, 30_000);

    child.stdout?.on("data", chunk => {
      stdoutBuffer += chunk.toString();
      const match = stdoutBuffer.match(/DEVPILOTX_READY (\{.*\})/);
      if (match && !settled) {
        settled = true;
        clearTimeout(timeout);
        try {
          const info = JSON.parse(match[1]);
          const origin = `http://127.0.0.1:${info.port}`;
          backendOrigin = origin;
          resolve(origin);
        } catch (error) {
          reject(error instanceof Error ? error : new Error("Malformed backend handshake."));
        }
      }
    });

    child.stderr?.on("data", chunk => {
      console.error("[backend]", chunk.toString().trim());
    });

    child.on("error", error => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });

    child.on("exit", code => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error(`Backend exited early with code ${code}.`));
    });
  });
}

function buildContentSecurityPolicy(): string {
  const directives = [
    "default-src 'self'",
    isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "media-src 'self' data:",
    "connect-src 'self' ws://127.0.0.1:* ws://localhost:*",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'"
  ];
  return directives.join("; ");
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
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
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
        "Content-Security-Policy": [buildContentSecurityPolicy()],
        "X-Content-Type-Options": ["nosniff"]
      }
    });
  });

  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => {
    callback(permission === "clipboard-sanitized-write");
  });
}

function hardenWebContents(contents: Electron.WebContents): void {
  contents.on("will-navigate", (event, url) => {
    if (!isAppUrl(url)) {
      event.preventDefault();
      openExternalUrl(url);
    }
  });

  contents.setWindowOpenHandler(({ url }) => {
    openExternalUrl(url);
    return { action: "deny" };
  });

  contents.on("will-attach-webview", event => {
    event.preventDefault();
  });

  if (!isDev) {
    contents.on("devtools-opened", () => contents.closeDevTools());
  }
}

function createWindow(origin: string): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 620,
    show: false,
    backgroundColor: "#0d1117",
    title: "DevPilotX IDE",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
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

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => {
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

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        {
          label: "Open Workspace Folder…",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const current = readSettings();
            const result = await dialog.showOpenDialog({
              title: "Choose workspace folder",
              defaultPath: current.workspace,
              properties: ["openDirectory", "createDirectory"]
            });
            if (result.canceled || !result.filePaths[0]) return;
            writeSettings({ workspace: result.filePaths[0] });
            try {
              await reloadWindowWithFreshBackend();
            } catch (error) {
              dialog.showErrorBox(
                "Unable to switch workspace",
                error instanceof Error ? error.message : String(error)
              );
            }
          }
        },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }]
    },
    {
      label: "Help",
      submenu: [
        {
          label: "DevPilotX on GitHub",
          click: () => openExternalUrl("https://github.com/ViswaTeja7/DevPioltxIde")
        }
      ]
    }
  ];

  if (isDev) {
    template.splice(2, 0, {
      label: "Developer",
      submenu: [{ role: "toggleDevTools" }]
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function registerIpc(): void {
  ipcMain.handle("app:get-info", () => ({
    platform: process.platform,
    version: app.getVersion(),
    packaged: app.isPackaged,
    secureStorageAvailable: secureStorageAvailable(),
    workspace: readSettings().workspace
  }));

  ipcMain.handle("settings:get-workspace", () => readSettings().workspace);

  ipcMain.handle("secrets:get", () => readSecrets());

  ipcMain.handle("secrets:set", (_event, payload: unknown) => {
    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid secrets payload.");
    }
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      if (typeof value === "string") clean[key] = value;
    }
    writeSecrets(clean);
    return true;
  });

  ipcMain.handle("shell:open-external", (_event, target: unknown) => {
    if (typeof target !== "string") return false;
    openExternalUrl(target);
    return true;
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on("web-contents-created", (_event, contents) => hardenWebContents(contents));

  app.whenReady().then(async () => {
    installSessionHardening();
    registerIpc();
    buildMenu();

    try {
      const origin = await startBackend();
      createWindow(origin);
    } catch (error) {
      dialog.showErrorBox(
        "DevPilotX failed to start",
        error instanceof Error ? error.message : String(error)
      );
      app.quit();
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0 && backendOrigin) {
        createWindow(backendOrigin);
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", stopBackend);
  app.on("will-quit", stopBackend);
}

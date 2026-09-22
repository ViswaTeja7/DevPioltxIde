# DevPilotX

A modern, high-density, AI-assisted development environment running natively in the browser.

## Features

- **Project Dashboard**: A dedicated cockpit view featuring cyclomatic complexity heatmaps, automated test coverage trends, CI/CD integrations, and intelligent batch-fix previews.
- **DevPilotX Agent**: Built-in multi-model chat (supports Gemini, OpenRouter, Ollama, Groq) with IDE context awareness.
- **Monaco Editor**: Industry-standard code editor with syntax highlighting, auto-completion, and minimap.
- **Full-Stack Architecture**: React front-end powered by an Express backend for secure API management.

## Integrated terminal

The terminal panel is a real terminal, not a command box. It is built from
[node-pty](https://github.com/microsoft/node-pty) on the server and
[xterm.js](https://xtermjs.org/) in the renderer — the same pairing VS Code uses.

**Why a PTY matters.** The earlier implementation piped `stdio` to the shell, which runs `cmd.exe` in
non-interactive batch mode. That loses echo, prompts, tab completion, command history and colour. With
a pseudo-terminal (ConPTY on Windows, a pty elsewhere) the shell behaves exactly as it does in Windows
Terminal.

| Capability | Detail |
|---|---|
| Full ANSI/VT rendering | 256-colour, truecolor (`COLORTERM=truecolor`), cursor movement, clear-screen, window title |
| Inline typing | Type directly at the prompt; no separate input box |
| Tabs | Each tab is an independent shell process. The `+` button opens another. |
| Search | `Ctrl+Shift+F` over scrollback; `Enter` / `Shift+Enter` for next / previous |
| Copy and paste | `Ctrl+Shift+C` / `Ctrl+Shift+V`, plus normal right-click paste |
| Resize | The PTY is resized to match the panel, so full-screen programs lay out correctly |
| Scrollback | 5000 lines |

The shell defaults to `%ComSpec%` (`cmd.exe`) on Windows and `$SHELL` on Unix, and can be overridden
with `DEVPILOTX_SHELL`. The shell starts in the workspace folder.

### Native module note

`node-pty` is a **native module**, which has three consequences:

1. It is marked `--external` in the server bundle and shipped via `asarUnpack`, because a `.node`
   binary cannot be loaded from inside an asar archive.
2. `electron-builder` rebuilds it for Electron's ABI during packaging. It currently resolves from the
   shipped prebuild without a local toolchain.
3. Prebuilds are published for **win32 and darwin only**. On Linux, `npm install` falls back to
   `node-gyp rebuild`, so a C++ toolchain is required to install locally. CI avoids this by running
   `npm ci --ignore-scripts`, since it only lints and builds.

## Project Dashboard Capabilities

- Visualizes repository complexity and file language distributions
- Highlights specific "hotspots" in the codebase
- CI/CD integration with GitHub Actions (`.github/workflows/ci.yml`)
- Provides AI-driven code remediation and review metrics

## Desktop application (Electron)

DevPilotX runs as a hardened desktop app. This is the recommended way to use it: the backend can
then reach your real filesystem and shell, and a local Ollama instance at `localhost:11434` becomes
reachable.

### Architecture

```
App window (sandboxed renderer)
      |  http://127.0.0.1:<ephemeral port>  +  ws://.../ws/terminal
Local Node backend  (separate child process, spawned via ELECTRON_RUN_AS_NODE)
      |  child_process / fs
Your filesystem and shell
```

The backend runs as an **isolated child process** rather than inside the main process. It binds to
`127.0.0.1` on an OS-assigned ephemeral port and reports readiness on stdout, so no fixed port is
ever exposed and a crashed backend cannot take the window down with it.

### Security model

| Control | Detail |
|---|---|
| Session auth | The main process generates a 32-byte random token per launch. The window loads `/__auth?token=…`, which exchanges it for an `HttpOnly; SameSite=Strict` cookie. |
| Terminal protection | `/ws/terminal` requires the same valid session cookie and rejects cross-origin upgrades. This endpoint spawns a real shell, so it is treated as privileged. |
| Loopback binding | The backend binds `127.0.0.1` only. It is never reachable from the LAN. |
| DNS-rebinding defence | Requests with a non-loopback `Host` header are rejected with `403`. |
| Renderer isolation | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`. |
| Preload bridge | Exposes a fixed allowlist of methods via `contextBridge`; `ipcRenderer` itself is never exposed. |
| CSP | Applied to every response. `script-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`. |
| Navigation | Off-origin navigation is blocked; `window.open` and external links are handed to the system browser. |
| Webviews | `<webview>` attachment is refused. |
| Secret storage | API keys are encrypted with the OS keychain via Electron `safeStorage` (DPAPI on Windows, Keychain on macOS, libsecret on Linux) rather than stored in plaintext. |
| Supply chain | Monaco is bundled from `node_modules` instead of the jsDelivr CDN, so the editor works offline and no third-party script origin is trusted. |

## Commands

```bash
npm install            # install dependencies
npm run electron       # build and launch the desktop app
npm run test           # unit tests (Vitest)
npm run test:coverage  # unit tests + enforced coverage thresholds
npm run test:e2e       # Playwright smoke tests against the real app (build first)
npm run notices        # regenerate THIRD_PARTY_NOTICES.md
npm run sbom           # emit a CycloneDX SBOM
npm run package:win    # build a Windows installer (NSIS)
npm run package:win:msi # build a Windows MSI for Intune/SCCM (needs WiX v3)
npm run package:mac    # build a macOS disk image
npm run package:linux  # build a Linux AppImage
npm run package:publish # build and publish installers + update metadata
```

Build output: `dist/` (renderer + backend bundle), `dist-electron/` (main + preload), `release/`
(installers).

### Releases and auto-updates

Tagging a commit `v*` triggers [`.github/workflows/release.yml`](.github/workflows/release.yml),
which builds and signs the installers for all three platforms, publishes a GitHub Release,
and attaches the update metadata (`latest.yml`, blockmaps) that the in-app
`electron-updater` feed consumes. Existing installs update themselves from
**Help → Check for Updates…**.

### Accessibility and internationalisation

- Keyboard-navigable tablists, `aria-label`s on icon controls, a global `:focus-visible`
  outline, `prefers-reduced-motion` support and a skip link.
- Screen-reader announcements for filesystem failures via an `aria-live` region.
- UI strings resolve through `react-i18next` (`src/i18n/`); the OS locale is selected
  automatically with English as the fallback.


### Configuration

The backend reads these environment variables. The desktop app sets them automatically; they are
only needed if you run the server standalone.

| Variable | Default | Purpose |
|---|---|---|
| `DEVPILOTX_HOST` | `127.0.0.1` | Bind address. Keep on loopback. |
| `DEVPILOTX_PORT` | `3000` | Port; `0` picks a free ephemeral port. |
| `DEVPILOTX_AUTH_TOKEN` | *(none)* | When set, all routes and the terminal require a session. |
| `DEVPILOTX_WORKSPACE` | `process.cwd()` | Root folder exposed to the agent and terminal. |
| `DEVPILOTX_DIST_DIR` | `./dist` | Location of the built renderer. |

### Constrained environments

Both of these default to **off**, so normal desktop installs keep Chromium's sandbox and GPU
acceleration. Only set them when the platform genuinely cannot provide them.

| Variable | When to use it |
|---|---|
| `DEVPILOTX_DISABLE_GPU=1` | Virtual machines and remote desktop sessions with no usable GPU. Without it Chromium's GPU process dies and aborts the app with `GPU process isn't usable. Goodbye.` Falls back to software rendering (`use-gl=swiftshader`). |
| `DEVPILOTX_NO_SANDBOX=1` | Nested virtualisation or locked-down images where the Chromium sandbox cannot initialise. **This weakens process isolation** — only use it if the app refuses to start otherwise, and prefer fixing the platform. |

```bash
# Example: launch on a GPU-less VM
DEVPILOTX_DISABLE_GPU=1 npm run electron
```

### Code signing

Unsigned builds work locally but will show OS warnings to end users. For distribution, provide a
Windows code-signing certificate and an Apple Developer ID. macOS builds also need
`CSC_LINK` / `CSC_KEY_PASSWORD` (or an appropriate keychain identity) plus notarization credentials.
`build/entitlements.mac.plist` is already configured with the entitlements the app requires.

Full instructions — including Azure Trusted Signing for Windows and notarization for macOS —
are in [`build/SIGNING.md`](build/SIGNING.md).

### Diagnostics

- Rotating logs live in the OS log directory (`%APPDATA%\devpilotx\logs` on Windows),
  reachable from **Help → Open Logs Folder**.
- Crash dumps are collected locally and never uploaded automatically.
- The backend is supervised: if it crashes it restarts automatically with exponential
  backoff, and the window reconnects to the new port.


### Known limitations

- The workspace folder is chosen via **File → Open Workspace Folder…** and persisted between
  launches. Changing it restarts the backend.
- Monaco is bundled, which makes the renderer chunk large (about 4.9 MB minified). This is a
  deliberate trade for offline capability and a strict CSP.


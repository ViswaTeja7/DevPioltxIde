# Security Policy

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report them privately via GitHub's private vulnerability reporting on this repository
(**Security → Advisories → Report a vulnerability**), or by email to
**silverknight.viswateja@gmail.com**.

Please include:

- A description of the issue and its impact
- Steps to reproduce or a proof of concept
- Affected version(s)

We aim to acknowledge reports within **72 hours** and provide a remediation timeline
within **7 days**.

## Security architecture summary

DevPilotX is a local-first desktop application. Key protections:

| Layer                 | Protection                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend binding       | Loopback (`127.0.0.1`) only, ephemeral port                                                                                                                                                                                                 |
| DNS-rebinding defence | Non-loopback `Host` headers rejected with 403                                                                                                                                                                                               |
| Renderer              | `contextIsolation`, `sandbox`, no `nodeIntegration`, strict CSP                                                                                                                                                                             |
| IPC                   | Preload exposes an allowlisted bridge only                                                                                                                                                                                                  |
| Terminal              | Shell executable chosen from a server-side allowlist; clients send an id, never a path                                                                                                                                                      |
| Filesystem            | All `/api/fs/*` paths are resolved against the workspace root; escapes are refused                                                                                                                                                          |
| Secrets               | API keys encrypted with the OS keychain (DPAPI / Keychain / libsecret) via Electron `safeStorage`; never written to browser storage. Without the desktop keychain, keys are kept in `sessionStorage` only (cleared when the window closes). |
| Agent commands        | Destructive command patterns are denied; gated commands require explicit user approval                                                                                                                                                      |
| Updates               | Delivered over HTTPS from GitHub Releases; signed installers                                                                                                                                                                                |

## Scope notes

- **API key storage**: keys entered in Settings → Provider Credentials are stored only in
  the OS keychain (`safeStorage`-encrypted `secrets.bin` inside the app's userData
  folder). They are never placed in `localStorage`, which is plaintext on disk. In
  non-desktop environments (plain browser) they live in `sessionStorage` for the current
  session only. Settings shows a live indicator of which storage is active, and
  **Clear keys** wipes the vault.
- The AI agent can read and write files inside the configured workspace folder by design.
  Treat the workspace root as the security boundary and do not point it at directories
  containing credentials or system files.
- Prompt content and workspace snippets are sent to the AI provider you configure
  (Gemini, OpenRouter, Groq) — or stay local when using Ollama.

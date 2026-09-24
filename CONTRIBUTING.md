# Contributing to DevPilotX

## Prerequisites

- Node.js **22.x** (Electron 44 requires >= 22.12)
- npm 10+
- Windows: no extra toolchain needed (`node-pty` ships prebuilds). Linux: a C++
  toolchain is required because `node-pty` falls back to `node-gyp rebuild`.

## Setup

```bash
npm install
npm run electron   # build + launch the desktop app
```

For renderer-only iteration:

```bash
npm run dev        # tsx server/server.ts on http://127.0.0.1:3000
```

## Quality gates (must pass before merge)

| Command | What it checks |
|---|---|
| `npm run lint` | TypeScript typecheck (renderer + electron configs) |
| `npm run lint:eslint` | ESLint (style/rules; warnings are being ratcheted to errors) |
| `npm test` / `npm run test:coverage` | Vitest unit tests; coverage thresholds enforced on `web/src/lib` |
| `npm run test:e2e` | Playwright smoke tests that launch the real Electron app (requires `npm run build` first) |
| `npm run build` | Production build (renderer + server bundle + electron) |
| `npm run format:check` | Prettier formatting |
| `npm run notices` | Regenerates `THIRD_PARTY_NOTICES.md` from the lockfile |
| `npm run sbom` | Emits a CycloneDX SBOM for compliance tooling |

CI runs all of the above on Ubuntu, Windows and macOS, plus `npm audit --audit-level=high`
and the end-to-end suite on Windows and macOS.

## Conventions

- **TypeScript strict** everywhere; no new `any` without a comment explaining why.
- Pure logic belongs in `web/src/lib/` (unit-tested, no DOM/React dependencies).
- Renderer ↔ backend communication goes through the Express API (`/api/*`) or the
  terminal WebSocket; the renderer never touches Node APIs directly.
- Every new `/api/fs`-style route must resolve paths through `resolveWorkspacePath`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org)
  (`feat:`, `fix:`, `chore:`, …).

## User-facing strings and i18n

All new user-facing text goes through `react-i18next`:

```tsx
const { t } = useTranslation();
return <button title={t('terminal.newTab')}>…</button>;
```

Add keys to [`web/src/i18n/locales/en.ts`](web/src/i18n/locales/en.ts). To add a language, create
a sibling catalogue with the same key shape and register it in
[`web/src/i18n/index.ts`](web/src/i18n/index.ts) — the resolver picks the OS locale automatically
and falls back to English.

## Accessibility

- Icon-only controls need an `aria-label`; decorative icons get `aria-hidden="true"`.
- Interactive collections use the matching ARIA pattern (the panel and terminal tabs
  implement `tablist`/`tab` with arrow-key navigation).
- Announce asynchronous failures through an `aria-live` region — see
  [`ErrorToast.tsx`](web/src/components/common/ErrorToast.tsx).
- Never remove focus outlines; the global `:focus-visible` style in `web/src/index.css`
  covers keyboard users.

## Releasing

```bash
npm version patch          # bumps version, tags
git push --follow-tags
npm run package:win        # or package:mac / package:linux
```

Publishing a GitHub Release with the built installers makes the update available to
existing installs via the in-app updater.

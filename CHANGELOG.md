# Changelog

All notable changes to DevPilotX are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Windows Terminal–style integrated terminal: tab bar with profile dropdown, split
  panes, relaunch of exited shells, clickable links, Campbell palette, `Ctrl+` `` ` ``
  toggle, `Ctrl+Shift+5` split, middle-click tab close.
- Real workspace filesystem in the Explorer: tree loaded from disk, lazy file loading,
  create/rename/delete folders and files, refresh, large-workspace truncation notice.
- New backend routes: `/api/fs/tree`, `/api/fs/mkdir`, `/api/fs/rename` (all
  workspace-root contained).
- Vitest unit-test suite with enforced coverage thresholds on `src/lib`.
- ESLint 9 flat config + Prettier; `lint:eslint`, `format`, `format:check` scripts.
- Structured file logging (`electron-log`), local crash-dump collection, and
  uncaught-exception capture in the main process.
- Backend supervisor: unexpected backend crashes restart automatically with
  exponential backoff (up to 5 attempts) instead of killing the app.
- Auto-updates via `electron-updater` from GitHub Releases, with Help →
  "Check for Updates…" and Help → "Open Logs Folder" menu items.
- Dependabot configuration (npm + GitHub Actions).
- SECURITY.md, CONTRIBUTING.md, CHANGELOG.md, build/SIGNING.md, THIRD_PARTY_NOTICES.md.
- Playwright end-to-end smoke suite that launches the real Electron app and asserts the
  backend handshake, authentication, IDE shell, workspace API, path containment and PTY
  shell discovery.
- Accessibility: ARIA tablists with arrow-key navigation for panel and terminal tabs,
  labelled icon controls, skip link, global `:focus-visible` outline,
  `prefers-reduced-motion` support, and an `aria-live` toast for filesystem errors.
- Internationalisation scaffolding with `react-i18next` (`src/i18n/`), OS-locale
  detection and English catalogue; panel, terminal and explorer strings migrated.
- Release workflow that builds, signs and publishes installers for all platforms plus a
  CycloneDX SBOM artifact.
- `npm run notices` / `npm run sbom` compliance scripts; `package:win:msi` target for
  Intune/SCCM deployment.
- API keys are now stored as real secrets: Settings writes them through Electron
  `safeStorage` into the OS keychain (DPAPI / Keychain / libsecret) instead of plaintext
  `localStorage`; legacy plaintext keys are purged on upgrade; a storage indicator and a
  "Clear keys" control were added to Settings; session-only fallback for non-desktop
  environments. Covered by a new E2E test that types a key and proves it reaches the
  keychain while never touching browser storage.
- The Code Assistant now lists only models whose provider is actually linked to an API:
  a user key from the OS keychain or a server-side credential (new `/api/provider-status`
  endpoint returns booleans only). Model discovery runs for server-env providers too,
  the saved selection falls back to a linked model, and both the dropdown and the modal
  show a "No AI providers are linked yet → Open API Settings" empty state instead of an
  unreachable catalogue.

### Changed
- CI now runs typecheck, real unit tests with coverage, `npm audit --audit-level=high`,
  and the production build on Ubuntu, Windows and macOS. The previous placeholder
  "simulated coverage" steps were removed.
- Consolidated on npm as the single package manager (`bun.lock` removed).

### Fixed
- The bottom panel's TERMINAL tab rendered a legacy read-only text box instead of the
  real PTY terminal; it now mounts the actual terminal component.
- Duplicate `/api/provider-models` route registration removed.
- Monaco language detection unified into `src/lib/language.ts` (was duplicated in
  three places).
- React refs no longer read/written during render in the terminal components.

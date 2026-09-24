// English resource catalogue. Adding a locale means adding a sibling file with the same
// key shape and registering it in ../index.ts — no other component changes are needed.
export const en = {
  panel: {
    problems: 'Problems',
    output: 'Output',
    debugConsole: 'Debug Console',
    terminal: 'Terminal',
    closePanel: 'Close panel',
    resizeHint: 'Drag to resize, double-click to reset',
    noProblems: 'No problems have been detected in the workspace.',
    outputReady: 'Log output initialization complete.',
    debugReady: 'Debug console is ready.'
  },
  terminal: {
    newTab: 'New tab',
    splitPane: 'Split pane',
    profiles: 'Profiles',
    defaultProfile: 'default',
    closeTab: 'Close tab',
    killPane: 'Kill pane',
    relaunch: 'Relaunch terminal',
    processExited: 'The terminal process has exited.',
    shellProfiles: 'Shell profiles',
    findInTerminal: 'Find in terminal'
  },
  explorer: {
    title: 'Explorer',
    newFile: 'New File',
    newFolder: 'New Folder',
    refresh: 'Reload from disk',
    rename: 'Rename',
    delete: 'Delete',
    truncated: 'Workspace is large — showing a partial tree (depth/entry limits reached).'
  },
  common: {
    dismiss: 'Dismiss',
    filesystemError: 'Filesystem error'
  }
};

export type TranslationCatalogue = typeof en;

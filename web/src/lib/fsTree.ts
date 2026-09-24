// Converts the server's recursive /api/fs/tree payload into the FileNode tree the
// explorer renders. Pure and dependency-free so it is unit-testable without a DOM.
import { FileNode } from '../types';
import { getLanguageFromName } from './language';

export interface WorkspaceTreeEntry {
  name: string;
  type: 'file' | 'folder';
  children?: WorkspaceTreeEntry[];
}

const normalize = (value: string): string => value.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

const joinPath = (parent: string, name: string): string => {
  const base = normalize(parent);
  const clean = normalize(name);
  return `/${base ? `${base}/` : ''}${clean}`;
};

// Folders first, then files, each group sorted case-insensitively — the ordering users
// expect from VS Code / Windows Explorer. The sort is applied recursively.
export const sortTreeEntries = (entries: WorkspaceTreeEntry[]): WorkspaceTreeEntry[] =>
  [...entries]
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    })
    .map(entry =>
      entry.children ? { ...entry, children: sortTreeEntries(entry.children) } : entry
    );

export const entriesToTree = (
  entries: WorkspaceTreeEntry[],
  parentPath = ''
): FileNode[] =>
  sortTreeEntries(entries).map(entry => {
    const path = joinPath(parentPath, entry.name);
    if (entry.type === 'folder') {
      return {
        id: `fs-${path}`,
        name: entry.name,
        type: 'folder',
        path,
        children: entriesToTree(entry.children ?? [], path)
      };
    }
    return {
      id: `fs-${path}`,
      name: entry.name,
      type: 'file',
      path,
      language: getLanguageFromName(entry.name)
      // content is intentionally omitted: the editor loads it lazily from disk on open,
      // so starting the IDE does not read every file in the workspace into memory.
    };
  });

// Finds a node by path — used to reconcile the in-memory tree with disk after renames.
export const findNodeByPath = (nodes: FileNode[], targetPath: string): FileNode | undefined => {
  const normalized = joinPath('', targetPath);
  for (const node of nodes) {
    if (node.path === normalized) return node;
    if (node.children) {
      const found = findNodeByPath(node.children, targetPath);
      if (found) return found;
    }
  }
  return undefined;
};

// Re-paths a subtree after a rename/move so ids and paths stay consistent with disk.
export const repathSubtree = (node: FileNode, fromPath: string, toPath: string): FileNode => {
  const from = joinPath('', fromPath);
  const to = joinPath('', toPath);
  const rewrite = (current: FileNode): FileNode => {
    const newPath = current.path === from ? to : current.path.replace(`${from}/`, `${to}/`);
    return {
      ...current,
      id: `fs-${newPath}`,
      name: current.path === from ? newPath.split('/').pop() ?? current.name : current.name,
      path: newPath,
      language: current.type === 'file' ? getLanguageFromName(newPath) : current.language,
      children: current.children?.map(rewrite)
    };
  };
  return rewrite(node);
};

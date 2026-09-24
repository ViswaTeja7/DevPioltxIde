import { describe, it, expect } from 'vitest';
import { entriesToTree, findNodeByPath, repathSubtree, WorkspaceTreeEntry } from './fsTree';

const sample: WorkspaceTreeEntry[] = [
  { name: 'zeta.ts', type: 'file' },
  {
    name: 'src',
    type: 'folder',
    children: [
      { name: 'App.tsx', type: 'file' },
      { name: 'lib', type: 'folder', children: [{ name: 'util.ts', type: 'file' }] }
    ]
  },
  { name: 'alpha.md', type: 'file' }
];

describe('entriesToTree', () => {
  it('sorts folders before files, alphabetically within each group', () => {
    const tree = entriesToTree(sample);
    expect(tree.map(n => n.name)).toEqual(['src', 'alpha.md', 'zeta.ts']);
  });

  it('builds slash-rooted paths and deterministic ids', () => {
    const tree = entriesToTree(sample);
    const src = tree[0];
    expect(src.path).toBe('/src');
    expect(src.id).toBe('fs-/src');
    // Children are sorted folders-first, so 'lib' precedes 'App.tsx'.
    expect(src.children![1].path).toBe('/src/App.tsx');
    expect(src.children![0].children![0].path).toBe('/src/lib/util.ts');
  });

  it('assigns Monaco languages to files and leaves content lazy (undefined)', () => {
    const tree = entriesToTree(sample);
    expect(tree[1].language).toBe('markdown');
    expect(tree[1].content).toBeUndefined();
  });

  it('sorts recursively inside folders', () => {
    const tree = entriesToTree(sample);
    expect(tree[0].children!.map(n => n.name)).toEqual(['lib', 'App.tsx']);
  });
});

describe('findNodeByPath', () => {
  it('finds nested nodes by normalized path', () => {
    const tree = entriesToTree(sample);
    expect(findNodeByPath(tree, 'src/lib/util.ts')?.name).toBe('util.ts');
    expect(findNodeByPath(tree, '/src')?.type).toBe('folder');
  });

  it('returns undefined for missing paths', () => {
    expect(findNodeByPath(entriesToTree(sample), '/nope')).toBeUndefined();
  });
});

describe('repathSubtree', () => {
  it('rewrites ids, names and paths for the whole subtree', () => {
    const tree = entriesToTree(sample);
    const src = tree[0];
    const moved = repathSubtree(src, '/src', '/source');
    expect(moved.path).toBe('/source');
    expect(moved.name).toBe('source');
    expect(moved.id).toBe('fs-/source');
    expect(moved.children![0].children![0].path).toBe('/source/lib/util.ts');
    expect(moved.children![0].children![0].language).toBe('typescript');
  });
});

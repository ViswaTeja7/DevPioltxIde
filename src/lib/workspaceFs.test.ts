import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  readWorkspaceFile,
  writeWorkspaceFile,
  deleteWorkspaceFile,
  listWorkspaceDir,
  listWorkspaceTree,
  createWorkspaceDir,
  renameWorkspacePath,
  reportFsError
} from './workspaceFs';

const okResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('workspaceFs client', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('readWorkspaceFile returns file content', async () => {
    fetchMock.mockResolvedValue(okResponse({ path: 'src/a.ts', content: 'hello' }));
    await expect(readWorkspaceFile('/src/a.ts')).resolves.toBe('hello');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/fs/read',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ path: '/src/a.ts' }) })
    );
  });

  it('writeWorkspaceFile posts content and returns write stats', async () => {
    fetchMock.mockResolvedValue(okResponse({ ok: true, path: 'a.ts', created: true, bytes: 5 }));
    const result = await writeWorkspaceFile('/a.ts', 'hello');
    expect(result.ok).toBe(true);
    expect(result.created).toBe(true);
  });

  it('deleteWorkspaceFile posts the path', async () => {
    fetchMock.mockResolvedValue(okResponse({ ok: true }));
    await expect(deleteWorkspaceFile('/a.ts')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/fs/delete',
      expect.objectContaining({ body: JSON.stringify({ path: '/a.ts' }) })
    );
  });

  it('listWorkspaceDir returns entries array', async () => {
    fetchMock.mockResolvedValue(okResponse({ entries: [{ name: 'src', type: 'folder' }] }));
    await expect(listWorkspaceDir('.')).resolves.toEqual([{ name: 'src', type: 'folder' }]);
  });

  it('listWorkspaceDir tolerates a malformed payload', async () => {
    fetchMock.mockResolvedValue(okResponse({}));
    await expect(listWorkspaceDir('.')).resolves.toEqual([]);
  });

  it('listWorkspaceTree surfaces the truncated flag', async () => {
    fetchMock.mockResolvedValue(okResponse({ entries: [{ name: 'a.ts', type: 'file' }], truncated: true }));
    const result = await listWorkspaceTree();
    expect(result.truncated).toBe(true);
    expect(result.entries).toHaveLength(1);
  });

  it('createWorkspaceDir posts to mkdir', async () => {
    fetchMock.mockResolvedValue(okResponse({ ok: true }));
    await expect(createWorkspaceDir('/new-dir')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/fs/mkdir',
      expect.objectContaining({ body: JSON.stringify({ path: '/new-dir' }) })
    );
  });

  it('renameWorkspacePath posts from/to', async () => {
    fetchMock.mockResolvedValue(okResponse({ ok: true }));
    await expect(renameWorkspacePath('/old.ts', '/new.ts')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/fs/rename',
      expect.objectContaining({ body: JSON.stringify({ from: '/old.ts', to: '/new.ts' }) })
    );
  });

  it('throws the server error message on failure', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Path escapes the workspace root.' }), { status: 400 })
    );
    await expect(readWorkspaceFile('/../secret')).rejects.toThrow('Path escapes the workspace root.');
  });

  it('throws a generic message when the response has no JSON body', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));
    await expect(readWorkspaceFile('/a.ts')).rejects.toThrow('Filesystem read failed (500).');
  });
});

describe('reportFsError', () => {
  it('logs and dispatches a devpilotx:fs-error event', async () => {
    const events: CustomEvent[] = [];
    vi.stubGlobal('window', {
      dispatchEvent: (event: CustomEvent) => {
        events.push(event);
        return true;
      }
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    reportFsError('write', '/a.ts', new Error('disk full'));

    expect(errorSpy).toHaveBeenCalledOnce();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('devpilotx:fs-error');
    expect(events[0].detail).toEqual({ action: 'write', path: '/a.ts', message: 'disk full' });

    errorSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});

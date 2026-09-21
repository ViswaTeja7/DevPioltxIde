// Client for the server's /api/fs routes.
//
// Before this existed, edits made through the IDE (including every file the agent
// "changed") only mutated React state and were persisted to browser storage. The real
// filesystem was never touched, so nothing the user or the agent did ever reached disk.
// These calls make edits real. Paths are resolved against the workspace root server-side,
// so a path that escapes it is refused there rather than trusted here.

export interface WorkspaceWriteResult {
  ok: boolean;
  path: string;
  created?: boolean;
  bytes?: number;
  linesAdded?: number;
  linesRemoved?: number;
}

async function postFs(route: string, body: unknown): Promise<any> {
  const response = await fetch(`/api/fs/${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Filesystem ${route} failed (${response.status}).`);
  }
  return data;
}

export async function readWorkspaceFile(filePath: string): Promise<string> {
  const data = await postFs('read', { path: filePath });
  return String(data?.content ?? '');
}

export async function writeWorkspaceFile(
  filePath: string,
  content: string
): Promise<WorkspaceWriteResult> {
  return postFs('write', { path: filePath, content });
}

export async function deleteWorkspaceFile(filePath: string): Promise<{ ok: boolean }> {
  return postFs('delete', { path: filePath });
}

export async function listWorkspaceDir(
  filePath: string
): Promise<Array<{ name: string; type: 'file' | 'folder' }>> {
  const data = await postFs('list', { path: filePath });
  return Array.isArray(data?.entries) ? data.entries : [];
}

// Surfaces disk errors without taking down the editor. A failure to persist is important
// enough to tell the user about, but the in-memory file should stay usable.
export function reportFsError(action: string, filePath: string, error: unknown): void {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[workspaceFs] ${action} failed for ${filePath}: ${detail}`);
  window.dispatchEvent(
    new CustomEvent('devpilotx:fs-error', {
      detail: { action, path: filePath, message: detail }
    })
  );
}

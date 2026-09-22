import { contextBridge, ipcRenderer } from "electron";

const api = {
  isDesktop: true as const,
  getInfo: () => ipcRenderer.invoke("app:get-info"),
  getWorkspace: () => ipcRenderer.invoke("settings:get-workspace"),
  getSecrets: () => ipcRenderer.invoke("secrets:get"),
  setSecrets: (secrets: Record<string, string>) => ipcRenderer.invoke("secrets:set", secrets),
  openExternal: (url: string) => ipcRenderer.invoke("shell:open-external", url)
};

contextBridge.exposeInMainWorld("devpilotx", api);

export type DevPilotxDesktopApi = typeof api;

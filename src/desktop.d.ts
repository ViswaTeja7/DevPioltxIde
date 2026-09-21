/// <reference types="vite/client" />

export interface DevPilotxDesktopInfo {
  platform: string;
  version: string;
  packaged: boolean;
  secureStorageAvailable: boolean;
  workspace: string;
}

export interface DevPilotxDesktopApi {
  isDesktop: true;
  getInfo(): Promise<DevPilotxDesktopInfo>;
  getWorkspace(): Promise<string>;
  getSecrets(): Promise<Record<string, string>>;
  setSecrets(secrets: Record<string, string>): Promise<boolean>;
  openExternal(url: string): Promise<boolean>;
}

declare global {
  interface Window {
    devpilotx?: DevPilotxDesktopApi;
  }
}

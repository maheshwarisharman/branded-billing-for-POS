import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronBridge {
  getConfig: () => Promise<{
    watchFolder: string;
    backendUrl: string;
    merchantKey: string;
  }>;
  saveConfig: (config: {
    watchFolder: string;
    backendUrl: string;
    merchantKey: string;
  }) => Promise<void>;
  selectFolder: () => Promise<string | null>;
  testConnection: (url: string) => Promise<{ ok: boolean; error?: string }>;
  resetConfig: () => Promise<boolean>;
}

contextBridge.exposeInMainWorld('electron', {
  getConfig: (): Promise<unknown> =>
    ipcRenderer.invoke('config:get'),
  saveConfig: (config: unknown): Promise<unknown> =>
    ipcRenderer.invoke('config:save', config),
  selectFolder: (): Promise<unknown> =>
    ipcRenderer.invoke('dialog:selectFolder'),
  testConnection: (...args: unknown[]): Promise<unknown> =>
    ipcRenderer.invoke('connection:test', args[0]),
  resetConfig: (): Promise<unknown> =>
    ipcRenderer.invoke('config:reset'),
});


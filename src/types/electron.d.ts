export interface ElectronAPI {
  openFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) => Promise<{
    canceled: boolean;
    filePaths: string[];
  }>;
  saveFile: (options?: { filters?: Array<{ name: string; extensions: string[] }>; defaultPath?: string }) => Promise<{
    canceled: boolean;
    filePath?: string;
  }>;
  platform: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
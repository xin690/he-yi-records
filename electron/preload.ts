import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) => 
    ipcRenderer.invoke('dialog:openFile', options),
  saveFile: (options?: { filters?: Array<{ name: string; extensions: string[] }>; defaultPath?: string }) => 
    ipcRenderer.invoke('dialog:saveFile', options),
  platform: process.platform,
})
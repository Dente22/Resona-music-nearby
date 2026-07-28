import { contextBridge, ipcRenderer } from "electron"

export interface ImportedTrackMeta {
  filePath: string
  title: string
  artist: string
  album: string
  duration: number
  img: string
}

export interface AppSettings {
  hotkey: string
  panelEdge: "left" | "right"
  panelWidth: number
  volume: number
  startMinimized: boolean
}

const api = {
  loadLibrary: () => ipcRenderer.invoke("library:load") as Promise<{ tracks: unknown[] }>,
  saveLibrary: (data: unknown) => ipcRenderer.invoke("library:save", data),
  loadPlaylists: () => ipcRenderer.invoke("playlists:load") as Promise<{ playlists: unknown[] }>,
  savePlaylists: (data: unknown) => ipcRenderer.invoke("playlists:save", data),
  loadSettings: () => ipcRenderer.invoke("settings:load") as Promise<AppSettings>,
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke("settings:save", settings),
  pickTracks: () => ipcRenderer.invoke("tracks:pick") as Promise<ImportedTrackMeta[]>,
  deleteTrackFile: (filePath: string) => ipcRenderer.invoke("tracks:delete-file", filePath),
  hidePanel: () => ipcRenderer.invoke("panel:hide"),
  resolveAudioPath: (filePath: string) => ipcRenderer.invoke("audio:resolve-path", filePath) as Promise<string>,
  onPanelVisibility: (cb: (visible: boolean) => void) => {
    const handler = (_: unknown, visible: boolean) => cb(visible)
    ipcRenderer.on("panel:visibility", handler)
    return () => ipcRenderer.removeListener("panel:visibility", handler)
  },
}

contextBridge.exposeInMainWorld("musicPlayer", api)

export type MusicPlayerApi = typeof api

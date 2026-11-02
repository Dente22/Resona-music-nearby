const { contextBridge, ipcRenderer } = require("electron")

const api = {
  loadLibrary: () => ipcRenderer.invoke("library:load"),
  saveLibrary: (data) => ipcRenderer.invoke("library:save", data),
  loadPlaylists: () => ipcRenderer.invoke("playlists:load"),
  savePlaylists: (data) => ipcRenderer.invoke("playlists:save", data),
  loadSettings: () => ipcRenderer.invoke("settings:load"),
  saveSettings: (settings) => ipcRenderer.invoke("settings:save", settings),
  pickTracks: () => ipcRenderer.invoke("tracks:pick"),
  deleteTrackFile: (filePath) => ipcRenderer.invoke("tracks:delete-file", filePath),
  hidePanel: () => ipcRenderer.invoke("panel:hide"),
  togglePanel: () => ipcRenderer.invoke("panel:toggle"),
  scanMusicFolders: () => ipcRenderer.invoke("library:scan"),
  discoverTrack: (payload) => ipcRenderer.invoke("discovery:search", payload),
  downloadFreeTrack: (payload) => ipcRenderer.invoke("discovery:download", payload),
  resolvePlaylist: (url) => ipcRenderer.invoke("playlist:resolve", url),
  downloadPlaylist: (tracks) => ipcRenderer.invoke("playlist:download", tracks),
  resolveAudioPath: (filePath) => ipcRenderer.invoke("audio:resolve-path", filePath),
  getMusicLibraryDir: () => ipcRenderer.invoke("library:music-dir"),
  chooseMusicLibraryDir: () => ipcRenderer.invoke("library:choose-dir"),
  streamingEmbedStatus: () => ipcRenderer.invoke("streaming:embed-status"),
  streamingEmbedClear: (provider) => ipcRenderer.invoke("streaming:embed-clear", provider),
  loadStreamingLibrary: () => ipcRenderer.invoke("streaming:library:load"),
  saveStreamingLibrary: (data) => ipcRenderer.invoke("streaming:library:save", data),
  streamingImportUrl: (url) => ipcRenderer.invoke("streaming:import-url", url),
  streamingLikeTrack: (url) => ipcRenderer.invoke("streaming:like-track", url),
  streamingUnlikeTrack: (url) => ipcRenderer.invoke("streaming:unlike-track", url),
  refreshTrackCovers: (filePaths) => ipcRenderer.invoke("tracks:refresh-covers", filePaths),
  embedLayout: (request) => ipcRenderer.invoke("embed:layout", request),
  embedExecute: (provider, script) => ipcRenderer.invoke("embed:execute", provider, script),
  embedSetVolume: (percent) => ipcRenderer.invoke("embed:set-volume", percent),
  setSystemVolume: (percent) => ipcRenderer.invoke("volume:set-system", percent),
  systemVolumeSupported: () => ipcRenderer.invoke("volume:system-supported"),
  embedGetUrl: (provider) => ipcRenderer.invoke("embed:get-url", provider),
  embedReload: (provider) => ipcRenderer.invoke("embed:reload", provider),
  embedLoadUrl: (provider, url) => ipcRenderer.invoke("embed:load-url", provider, url),
  embedReset: (provider) => ipcRenderer.invoke("embed:reset", provider),
  onEmbedConsole: (cb) => {
    const handler = (_event, data) => cb(data)
    ipcRenderer.on("embed:console", handler)
    return () => ipcRenderer.removeListener("embed:console", handler)
  },
  loadEmbedPlayback: () => ipcRenderer.invoke("embed:playback:load"),
  saveEmbedPlayback: (info) => ipcRenderer.invoke("embed:playback:save", info),
  loadCatalogs: () => ipcRenderer.invoke("catalogs:load"),
  pushCatalogs: (payload) => ipcRenderer.invoke("catalogs:push", payload),
  onSyncStatus: (cb) => {
    const handler = (_event, status) => cb(status)
    ipcRenderer.on("sync:status", handler)
    return () => ipcRenderer.removeListener("sync:status", handler)
  },
  onPanelVisibility: (cb) => {
    const handler = (_event, visible) => cb(visible)
    ipcRenderer.on("panel:visibility", handler)
    return () => ipcRenderer.removeListener("panel:visibility", handler)
  },
}

contextBridge.exposeInMainWorld("musicPlayer", api)
contextBridge.exposeInMainWorld("__VIOLETWAVE_ELECTRON__", true)

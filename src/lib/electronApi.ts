import type { AppSettings, Playlist, Track } from "./types"
import { DEFAULT_SETTINGS } from "./types"
import { shouldInstallBrowserFallback } from "./isElectron"
import type { EmbedNowPlaying } from "./streaming/embedNowPlaying"
import { parseStoredEmbedPlayback, serializeEmbedPlayback } from "./streaming/embedPlaybackStore"

const STORAGE_KEYS = {
  library: "mp-library",
  playlists: "mp-playlists",
  settings: "mp-settings",
  embedPlayback: "mp-embed-playback",
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeLocal(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data))
}

const browserApi = {
  loadLibrary: async () => readLocal(STORAGE_KEYS.library, { tracks: [] as Track[] }),
  saveLibrary: async (data: { tracks: Track[] }) => {
    writeLocal(STORAGE_KEYS.library, data)
    return true
  },
  loadPlaylists: async () => readLocal(STORAGE_KEYS.playlists, { playlists: [] as Playlist[] }),
  savePlaylists: async (data: { playlists: Playlist[] }) => {
    writeLocal(STORAGE_KEYS.playlists, data)
    return true
  },
  loadSettings: async () => readLocal(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  saveSettings: async (settings: AppSettings) => {
    writeLocal(STORAGE_KEYS.settings, settings)
    return true
  },
  pickTracks: async () => {
    console.warn("[Resona] Запустите через npm run electron:dev для импорта файлов")
    return []
  },
  deleteTrackFile: async () => true,
  hidePanel: async () => {
    console.warn("[Resona] hidePanel недоступен в браузере — используйте npm run electron:dev")
    return false
  },
  togglePanel: async () => {
    console.warn("[Resona] togglePanel недоступен в браузере — используйте npm run electron:dev")
    return false
  },
  scanMusicFolders: async () => {
    console.warn("[Resona] scanMusicFolders недоступен в браузере")
    return []
  },
  discoverTrack: async () => {
    console.warn("[Resona] discoverTrack недоступен в браузере")
    return { identified: { title: "", artist: "" }, freeDownloads: [] }
  },
  downloadFreeTrack: async () => {
    console.warn("[Resona] downloadFreeTrack недоступен в браузере")
    throw new Error("Electron only")
  },
  resolvePlaylist: async () => {
    console.warn("[Resona] resolvePlaylist недоступен в браузере")
    return { parsed: { type: "unsupported", url: "" }, tracks: [] }
  },
  downloadPlaylist: async () => {
    console.warn("[Resona] downloadPlaylist недоступен в браузере")
    return []
  },
  resolveAudioPath: async (filePath: string) => filePath,
  getMusicLibraryDir: async () => "",
  chooseMusicLibraryDir: async () => null,
  streamingEmbedStatus: async () => ({
    spotify: { provider: "spotify" as const, loggedIn: false, url: "https://open.spotify.com", partition: "" },
    yandex: { provider: "yandex" as const, loggedIn: false, url: "https://music.yandex.ru", partition: "" },
  }),
  streamingEmbedClear: async () => true,
  loadStreamingLibrary: async () => ({ tracks: [] }),
  saveStreamingLibrary: async () => true,
  streamingImportUrl: async () => ({ ok: false, tracks: [], error: "electron_only" }),
  streamingLikeTrack: async () => ({ ok: false, error: "electron_only" }),
  streamingUnlikeTrack: async () => ({ ok: false, error: "electron_only" }),
  refreshTrackCovers: async () => [],
  loadEmbedPlayback: async () =>
    parseStoredEmbedPlayback(localStorage.getItem(STORAGE_KEYS.embedPlayback)),
  saveEmbedPlayback: async (info: EmbedNowPlaying | null) => {
    // Browser-only fallback (no Electron). Real app persists via IPC → userdata/.
    if (info?.title?.trim()) {
      localStorage.setItem(STORAGE_KEYS.embedPlayback, serializeEmbedPlayback(info))
    } else {
      localStorage.removeItem(STORAGE_KEYS.embedPlayback)
    }
    return true
  },
  onPanelVisibility: (_cb: (visible: boolean) => void) => () => {},
  loadCatalogs: async () => ({
    library: readLocal(STORAGE_KEYS.library, { tracks: [] as Track[] }),
    playlists: readLocal(STORAGE_KEYS.playlists, { playlists: [] as Playlist[] }),
    streaming: { tracks: [] as Track[] },
    sync: { state: "local" as const },
  }),
  pushCatalogs: async () => ({ ok: true, sync: { state: "local" as const } }),
  onSyncStatus: () => () => {},
  embedLayout: async () => true,
  embedExecute: async () => null,
  embedSetVolume: async () => false,
  setSystemVolume: async (percent: number) => ({
    ok: false,
    percent,
    supported: false,
  }),
  systemVolumeSupported: async () => ({ supported: false }),
  embedGetUrl: async () => "",
  embedReload: async () => true,
  embedLoadUrl: async () => false,
  embedReset: async () => true,
  onEmbedConsole: (_cb: (data: { provider: "spotify" | "yandex"; message: string }) => void) =>
    () => {},
}

export function getMusicPlayerApi() {
  return window.musicPlayer ?? browserApi
}

export function installBrowserApiFallback() {
  const hasBridge = typeof window !== "undefined" && Boolean(window.musicPlayer)
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : ""

  if (!shouldInstallBrowserFallback({ hasBridge, userAgent })) {
    return
  }

  window.musicPlayer = browserApi as typeof window.musicPlayer
}

declare global {
  interface Window {
    __VIOLETWAVE_ELECTRON__?: boolean
  }
}

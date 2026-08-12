import type { AppSettings } from "@/lib/types"
import type { TrackMood } from "@/lib/moodAnalyzer"

export interface ImportedTrackMeta {
  filePath: string
  title: string
  artist: string
  album: string
  duration: number
  img: string
  mood?: TrackMood
  originalPath?: string
}

export interface DiscoveryResult {
  identified: {
    title: string
    artist: string
    album?: string
    year?: string
    durationSec?: number
    source?: string
  }
  freeDownloads: Array<{
    id: string
    title: string
    artist: string
    album: string
    downloadUrl: string
    licenseUrl: string
    imageUrl: string
    durationSec: number
  }>
}

export interface PlaylistTrackItem {
  title: string
  artist: string
  album: string
  durationSec: number
  downloadUrl: string
  imageUrl: string
  licenseUrl: string
}

export interface ResolvedPlaylist {
  parsed: {
    type: string
    id?: string
    url: string
    reason?: string
  }
  tracks: PlaylistTrackItem[]
}

export interface MusicPlayerApi {
  loadLibrary: () => Promise<{ tracks: unknown[] }>
  saveLibrary: (data: unknown) => Promise<unknown>
  loadPlaylists: () => Promise<{ playlists: unknown[] }>
  savePlaylists: (data: unknown) => Promise<unknown>
  loadSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<unknown>
  pickTracks: () => Promise<ImportedTrackMeta[]>
  deleteTrackFile: (filePath: string) => Promise<boolean>
  hidePanel: () => Promise<boolean>
  togglePanel: () => Promise<boolean>
  scanMusicFolders: () => Promise<ImportedTrackMeta[]>
  discoverTrack: (payload: {
    filePath?: string | null
    artist?: string
    title?: string
  }) => Promise<DiscoveryResult>
  downloadFreeTrack: (payload: {
    downloadUrl: string
    title: string
    artist: string
  }) => Promise<ImportedTrackMeta>
  resolvePlaylist: (url: string) => Promise<ResolvedPlaylist>
  downloadPlaylist: (tracks: PlaylistTrackItem[]) => Promise<ImportedTrackMeta[]>
  resolveAudioPath: (filePath: string) => Promise<string>
  getMusicLibraryDir: () => Promise<string>
  chooseMusicLibraryDir: () => Promise<string | null>
  streamingEmbedStatus: () => Promise<{
    spotify: { provider: "spotify" | "yandex"; loggedIn: boolean; url: string; partition: string }
    yandex: { provider: "spotify" | "yandex"; loggedIn: boolean; url: string; partition: string }
  }>
  streamingEmbedClear: (provider: "spotify" | "yandex") => Promise<boolean>
  loadStreamingLibrary: () => Promise<{ tracks: unknown[] }>
  saveStreamingLibrary: (data: { tracks: unknown[] }) => Promise<unknown>
  streamingImportUrl: (url: string) => Promise<{
    ok: boolean
    tracks: Array<{
      source: "local" | "spotify" | "yandex"
      externalId: string
      title: string
      artist: string
      album: string
      duration: number
      img: string
      streamUrl?: string
      pageUrl?: string
    }>
    error?: string
  }>
  streamingLikeTrack: (url: string) => Promise<{ ok: boolean; error?: string }>
  streamingUnlikeTrack: (url: string) => Promise<{ ok: boolean; error?: string }>
  refreshTrackCovers: (filePaths: string[]) => Promise<Array<{ filePath: string; img: string }>>
  loadEmbedPlayback: () => Promise<import("./streaming/embedNowPlaying").EmbedNowPlaying | null>
  saveEmbedPlayback: (
    info: import("./streaming/embedNowPlaying").EmbedNowPlaying | null,
  ) => Promise<boolean>
  onPanelVisibility: (cb: (visible: boolean) => void) => () => void
  embedLayout: (request: {
    visible: boolean
    provider?: "spotify" | "yandex"
    bounds?: { x: number; y: number; width: number; height: number }
  }) => Promise<boolean>
  embedExecute: (provider: "spotify" | "yandex", script: string) => Promise<unknown>
  embedSetVolume: (percent: number) => Promise<boolean | { ok: boolean; muted: boolean; targets: number }>
  setSystemVolume: (percent: number) => Promise<{
    ok: boolean
    percent: number
    supported: boolean
    error?: string
  }>
  systemVolumeSupported: () => Promise<{ supported: boolean }>
  embedGetUrl: (provider: "spotify" | "yandex") => Promise<string>
  embedReload: (provider: "spotify" | "yandex") => Promise<boolean>
  embedLoadUrl: (provider: "spotify" | "yandex", url: string) => Promise<boolean>
  embedReset: (provider: "spotify" | "yandex") => Promise<boolean>
  onEmbedConsole: (
    cb: (data: { provider: "spotify" | "yandex"; message: string }) => void,
  ) => () => void
}

declare global {
  interface Window {
    musicPlayer: MusicPlayerApi
    __VIOLETWAVE_ELECTRON__?: boolean
  }
}

export {}

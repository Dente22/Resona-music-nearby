import { v4 as uuidv4 } from "uuid"
import type { TrackMood } from "./moodAnalyzer"
import type { AppLocale } from "./i18n"
import type { TrackSource } from "./streaming/types"
import type { AppTheme } from "./designTokens"

export type { AppTheme } from "./designTokens"

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  downloaded: boolean
  img: string
  filePath: string
  /** Original location before copy into Violetwave library */
  originalPath?: string
  addedAt: number
  mood?: TrackMood
  /** local = file on disk; spotify/yandex = stream over internet */
  source?: TrackSource
  streamUrl?: string
  /** Canonical track page on Spotify / Yandex */
  pageUrl?: string
  externalId?: string
}

export interface Playlist {
  id: string
  name: string
  trackIds: string[]
  img: string
  createdAt: number
  /** System playlist — e.g. mixed Likes library */
  kind?: "likes" | "user"
}

export interface AppSettings {
  hotkey: string
  panelEdge: "left" | "right"
  panelWidth: number
  volume: number
  startMinimized: boolean
  autoScanFolders: boolean
  language: AppLocale
  theme: AppTheme
  /** Empty string = default folder under AppData */
  musicLibraryPath: string
  /** Tailscale origin, e.g. https://server.tail.ts.net. Empty = catalogs stay on this PC. */
  hubUrl: string
  /** Needed only for a direct :8767 connection. Portal HTTPS injects the hub token. */
  hubToken: string
}

export interface LibraryState {
  tracks: Track[]
}

export interface PlaylistsState {
  playlists: Playlist[]
}

export type RepeatMode = "off" | "all" | "one"

export interface PlaybackState {
  currentTrackId: string | null
  isPlaying: boolean
  progress: number
  isShuffled: boolean
  repeatMode: RepeatMode
}

export interface PanelState {
  isVisible: boolean
  edge: "left" | "right"
  width: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  hotkey: "F9",
  panelEdge: "right",
  panelWidth: 390,
  volume: 72,
  startMinimized: false,
  autoScanFolders: true,
  language: "ru",
  theme: "light",
  musicLibraryPath: "",
  hubUrl: "",
  hubToken: "",
}

export function createTrackFromFile(
  filePath: string,
  meta: {
    title?: string
    artist?: string
    album?: string
    duration?: number
    img?: string
    mood?: TrackMood
    originalPath?: string
  },
  id?: string,
): Track {
  const fileName = filePath.split(/[/\\]/).pop() ?? "Unknown"
  const baseName = fileName.replace(/\.[^.]+$/, "")
  return {
    id: id ?? uuidv4(),
    title: meta.title ?? baseName,
    artist: meta.artist ?? "Unknown Artist",
    album: meta.album ?? "Unknown Album",
    duration: meta.duration ?? 0,
    downloaded: true,
    img: meta.img ?? "",
    filePath,
    originalPath: meta.originalPath,
    addedAt: Date.now(),
    mood: meta.mood,
    source: "local",
  }
}

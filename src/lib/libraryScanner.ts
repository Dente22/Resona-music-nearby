import { parseFilenameToTrackMeta } from "./filenameParser.js"

export type Platform = "win32" | "darwin" | "linux"

export const AUDIO_EXTENSIONS = new Set([
  "mp3", "wav", "ogg", "flac", "m4a", "aac", "opus", "wma", "aiff", "alac",
])

export interface ScannedTrackMeta {
  filePath: string
  title: string
  artist: string
  album: string
  duration: number
  img: string
}

export function isAudioFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
  return AUDIO_EXTENSIONS.has(ext)
}

export function getDefaultMusicPaths(platform: Platform, homeDir: string): string[] {
  const sep = platform === "win32" ? "\\" : "/"
  const join = (...parts: string[]) =>
    platform === "win32" ? parts.join("\\") : parts.join("/")

  const common = [
    join(homeDir, "Music"),
    join(homeDir, "Downloads"),
  ]

  if (platform === "win32") {
    return [
      ...common,
      join(homeDir, "Documents", "Music"),
      "D:\\Music",
    ]
  }

  if (platform === "darwin") {
    return [
      ...common,
      join(homeDir, "Library", "Music"),
      join(homeDir, "Library", "Mobile Documents", "com~apple~Music", "Music"),
    ]
  }

  return [
    ...common,
    join(homeDir, ".local", "share", "music"),
    "/mnt/c/Users/Public/Music",
  ]
}

export function filterNewTracks(files: string[], existingPaths: Set<string>): string[] {
  return files.filter(f => !existingPaths.has(f))
}

export function parseTrackMetaFromPath(filePath: string): ScannedTrackMeta {
  const parsed = parseFilenameToTrackMeta(filePath)

  return {
    filePath,
    title: parsed.title,
    artist: parsed.artist,
    album: "Unknown Album",
    duration: 0,
    img: "",
  }
}

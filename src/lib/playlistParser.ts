import { isAllowedDownloadUrl } from "./downloadSafety.js"

export type PlaylistSourceType =
  | "jamendo-album"
  | "jamendo-playlist"
  | "m3u-url"
  | "blocked"
  | "unsupported"

export interface ParsedPlaylistLink {
  type: PlaylistSourceType
  id?: string
  url: string
  reason?: string
}

const BLOCKED_HOST_PATTERNS = [
  "open.spotify.com",
  "spotify.com",
  "youtube.com",
  "youtu.be",
  "music.apple.com",
  "music.yandex.",
  "soundcloud.com",
  "deezer.com",
  "tidal.com",
]

export function isBlockedPlaylistUrl(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase()
    return BLOCKED_HOST_PATTERNS.some(
      blocked => host === blocked || host.endsWith(`.${blocked}`) || host.includes(blocked),
    )
  } catch {
    return false
  }
}

export function parsePlaylistUrl(input: string): ParsedPlaylistLink {
  const trimmed = input.trim()
  if (!trimmed) {
    return { type: "unsupported", url: trimmed, reason: "empty" }
  }

  if (isBlockedPlaylistUrl(trimmed)) {
    return {
      type: "blocked",
      url: trimmed,
      reason: "Spotify, YouTube и другие стриминги не поддерживаются — только Jamendo и M3U",
    }
  }

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.toLowerCase()

    if (host.includes("jamendo.com")) {
      const albumMatch = parsed.pathname.match(/\/album\/(\d+)/)
      if (albumMatch) {
        return { type: "jamendo-album", id: albumMatch[1], url: trimmed }
      }
      const playlistMatch = parsed.pathname.match(/\/playlist\/(\d+)/)
      if (playlistMatch) {
        return { type: "jamendo-playlist", id: playlistMatch[1], url: trimmed }
      }
    }

    if (/\.(m3u8?|pls)$/i.test(parsed.pathname)) {
      return { type: "m3u-url", url: trimmed }
    }
  } catch {
    // fall through
  }

  if (trimmed.includes("#EXTM3U") || trimmed.startsWith("http")) {
    const lines = trimmed.split(/\r?\n/)
    const hasExt = lines.some(l => l.startsWith("#EXT"))
    const hasUrl = lines.some(l => /^https?:\/\//.test(l.trim()))
    if (hasExt && hasUrl) {
      return { type: "m3u-url", url: trimmed }
    }
  }

  return { type: "unsupported", url: trimmed, reason: "unsupported format" }
}

export function parseM3uContent(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => /^https?:\/\//i.test(line))
}

export function filterAllowedPlaylistUrls(urls: string[]): string[] {
  return urls.filter(isAllowedDownloadUrl)
}

import type { StreamingProvider } from "./types.js"

export type StreamingResourceType = "track" | "album" | "playlist" | "unknown"

export interface ParsedStreamingUrl {
  provider: StreamingProvider | null
  type: StreamingResourceType
  id: string | null
  url: string
}

function normalizeStreamingUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""
  try {
    const parsed = new URL(trimmed)
    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return trimmed.split("?")[0].split("#")[0]
  }
}

function isYandexMusicHost(host: string): boolean {
  return /(?:^|\.)music\.yandex\./i.test(host)
}

export function buildYandexTrackPageUrl(trackId: string): string {
  return `https://music.yandex.ru/track/${trackId}`
}

export function parseStreamingUrl(raw: string): ParsedStreamingUrl {
  const url = normalizeStreamingUrl(raw)
  if (!url) {
    return { provider: null, type: "unknown", id: null, url: raw.trim() }
  }

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()

    if (host.includes("spotify.com")) {
      const albumTrack = parsed.pathname.match(/\/album\/[^/]+\/track\/([a-zA-Z0-9]+)/)
      if (albumTrack) {
        return { provider: "spotify", type: "track", id: albumTrack[1], url }
      }
      const track = parsed.pathname.match(/\/track\/([a-zA-Z0-9]+)/)
      if (track) {
        return { provider: "spotify", type: "track", id: track[1], url }
      }
      const playlist = parsed.pathname.match(/\/playlist\/([a-zA-Z0-9]+)/)
      if (playlist) {
        return { provider: "spotify", type: "playlist", id: playlist[1], url }
      }
      const album = parsed.pathname.match(/\/album\/([a-zA-Z0-9]+)/)
      if (album) {
        return { provider: "spotify", type: "album", id: album[1], url }
      }
      return { provider: "spotify", type: "unknown", id: null, url }
    }

    if (isYandexMusicHost(host)) {
      const albumTrack = parsed.pathname.match(/\/album\/\d+\/track\/(\d+)/)
      if (albumTrack) {
        return { provider: "yandex", type: "track", id: albumTrack[1], url }
      }
      const track = parsed.pathname.match(/\/track\/(\d+)/)
      if (track) {
        return { provider: "yandex", type: "track", id: track[1], url }
      }
      const playlist = parsed.pathname.match(/\/playlists\/(\d+)/)
      if (playlist) {
        return { provider: "yandex", type: "playlist", id: playlist[1], url }
      }
      const album = parsed.pathname.match(/\/album\/(\d+)/)
      if (album) {
        return { provider: "yandex", type: "album", id: album[1], url }
      }
      return { provider: "yandex", type: "unknown", id: null, url }
    }
  } catch {
    // invalid URL
  }

  return { provider: null, type: "unknown", id: null, url }
}

export function resolveYandexTrackUrlFromText(raw: string): string | null {
  const normalized = normalizeStreamingUrl(raw)
  const parsed = parseStreamingUrl(normalized)
  if (parsed.provider === "yandex" && parsed.type === "track" && parsed.id) {
    return parsed.url || buildYandexTrackPageUrl(parsed.id)
  }
  const idMatch = raw.match(/\/track\/(\d+)/)
  if (idMatch) return buildYandexTrackPageUrl(idMatch[1])
  return null
}

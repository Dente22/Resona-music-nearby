import { parseStreamingUrl } from "./urlParser.js"

/** Normalize a Spotify/Yandex track URL for import, likes, and playlist add. */
export function sanitizeStreamingTrackUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const parsed = parseStreamingUrl(trimmed)
  if (!parsed.provider || parsed.type !== "track" || !parsed.id) return null
  return parsed.url
}

export function acceptStreamingTrackUrl(raw: string): boolean {
  return sanitizeStreamingTrackUrl(raw) !== null
}

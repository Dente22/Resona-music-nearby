import { isAllowedDownloadUrl } from "./downloadSafety.js"
import { normalizeSearchText } from "./trackAnalyzer.js"

export interface FreeTrackResult {
  source: "jamendo"
  id: string
  title: string
  artist: string
  album: string
  durationSec: number
  downloadUrl: string
  imageUrl: string
  licenseUrl: string
}

export function buildJamendoSearchUrl(query: string, clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    format: "json",
    limit: "15",
    include: "musicinfo",
    search: query,
  })
  return `https://api.jamendo.com/v3.0/tracks/?${params.toString()}`
}

interface JamendoTrack {
  id?: string | number
  name?: string
  artist_name?: string
  album_name?: string
  duration?: number
  audio?: string
  image?: string
  license_ccurl?: string
}

export function parseJamendoSearchResponse(data: { results?: JamendoTrack[] }): FreeTrackResult[] {
  return (data.results ?? [])
    .filter(t => t.id != null && t.name && t.audio && isAllowedDownloadUrl(t.audio))
    .map(t => ({
      source: "jamendo" as const,
      id: String(t.id),
      title: t.name!,
      artist: t.artist_name ?? "Unknown Artist",
      album: t.album_name ?? "",
      durationSec: t.duration ?? 0,
      downloadUrl: t.audio!,
      imageUrl: t.image ?? "",
      licenseUrl: t.license_ccurl ?? "",
    }))
}

function scoreMatch(track: FreeTrackResult, artist: string, title: string): number {
  const ta = normalizeSearchText(track.artist)
  const tt = normalizeSearchText(track.title)
  const qa = normalizeSearchText(artist)
  const qt = normalizeSearchText(title)
  let score = 0
  if (ta && qa && (ta === qa || ta.includes(qa) || qa.includes(ta))) score += 2
  if (tt && qt && (tt === qt || tt.includes(qt) || qt.includes(tt))) score += 2
  return score
}

export function rankFreeTracks(
  tracks: FreeTrackResult[],
  artist: string,
  title: string,
): FreeTrackResult[] {
  return [...tracks].sort(
    (a, b) => scoreMatch(b, artist, title) - scoreMatch(a, artist, title),
  )
}

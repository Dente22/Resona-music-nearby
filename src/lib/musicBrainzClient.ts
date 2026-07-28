import { normalizeSearchText } from "./trackAnalyzer.js"

export interface RecordingMatch {
  id: string
  title: string
  artist: string
  album: string
  year: string
  durationSec: number
}

export function buildRecordingSearchUrl(artist: string, title: string): string {
  const parts: string[] = []
  if (title.trim()) parts.push(`recording:"${title.trim()}"`)
  if (artist.trim()) parts.push(`artist:"${artist.trim()}"`)
  const query = parts.join(" AND ") || title || artist
  const params = new URLSearchParams({ query, fmt: "json", limit: "5" })
  return `https://musicbrainz.org/ws/2/recording/?${params.toString()}`
}

interface MusicBrainzRecording {
  id?: string
  title?: string
  length?: number
  "artist-credit"?: Array<{ name?: string }>
  releases?: Array<{ title?: string; date?: string }>
}

export function parseRecordingSearchResponse(data: {
  recordings?: MusicBrainzRecording[]
}): RecordingMatch[] {
  return (data.recordings ?? [])
    .filter(r => r.id && r.title)
    .map(r => ({
      id: r.id!,
      title: r.title!,
      artist: r["artist-credit"]?.[0]?.name ?? "Unknown Artist",
      album: r.releases?.[0]?.title ?? "",
      year: r.releases?.[0]?.date?.slice(0, 4) ?? "",
      durationSec: r.length ? Math.round(r.length / 1000) : 0,
    }))
}

function similarity(a: string, b: string): number {
  const na = normalizeSearchText(a)
  const nb = normalizeSearchText(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.8
  return 0
}

export function pickBestRecordingMatch(
  candidates: RecordingMatch[],
  artist: string,
  title: string,
): RecordingMatch | null {
  if (!candidates.length) return null

  let best = candidates[0]
  let bestScore = -1

  for (const c of candidates) {
    const score = similarity(c.title, title) * 2 + similarity(c.artist, artist)
    if (score > bestScore) {
      bestScore = score
      best = c
    }
  }

  return bestScore > 0 ? best : candidates[0]
}

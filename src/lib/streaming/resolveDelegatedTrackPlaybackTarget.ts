import type { Track } from "../types.js"
import { resolveDelegatedTrackPageUrl } from "./resolveDelegatedTrackPageUrl.js"
import type { StreamingProvider } from "./types.js"

export type DelegatedPlaybackTarget =
  | { mode: "track"; url: string }
  | { mode: "search"; url: string; title: string; artist: string; provider: StreamingProvider }

export function buildYandexSearchUrl(title: string, artist: string): string {
  const query = [artist, title].map(part => part.trim()).filter(Boolean).join(" ")
  return `https://music.yandex.ru/search?text=${encodeURIComponent(query)}`
}

export function buildSpotifySearchUrl(title: string, artist: string): string {
  const query = [artist, title].map(part => part.trim()).filter(Boolean).join(" ")
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`
}

const GENERIC_TITLES = /^(yandex music|spotify)$/i

/** Direct track page URL, or a provider search URL for browsable library items. */
export function resolveDelegatedTrackPlaybackTarget(track: Track): DelegatedPlaybackTarget | null {
  const direct = resolveDelegatedTrackPageUrl(track)
  if (direct) return { mode: "track", url: direct }

  const title = track.title?.trim() ?? ""
  const artist = track.artist?.trim() ?? ""
  if (!title || GENERIC_TITLES.test(title)) return null

  if (track.source === "yandex") {
    return {
      mode: "search",
      provider: "yandex",
      url: buildYandexSearchUrl(title, artist),
      title,
      artist,
    }
  }

  if (track.source === "spotify") {
    return {
      mode: "search",
      provider: "spotify",
      url: buildSpotifySearchUrl(title, artist),
      title,
      artist,
    }
  }

  return null
}

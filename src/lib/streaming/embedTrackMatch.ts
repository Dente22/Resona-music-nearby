import type { Track } from "../types.js"
import type { EmbedNowPlaying } from "./embedNowPlaying.js"
import { isEmbedDelegatedTrack } from "./embedDelegatedTrack.js"
import { parseStreamingUrl } from "./urlParser.js"
import { sanitizeStreamingTrackUrl } from "./streamingTrackUrl.js"

export function streamingTrackIdsMatch(
  a: { provider: string | null; id: string | null },
  b: { provider: string | null; id: string | null },
): boolean {
  return Boolean(a.provider && a.id && a.provider === b.provider && a.id === b.id)
}

export function streamingUrlsSame(rawA: string, rawB: string): boolean {
  const a = sanitizeStreamingTrackUrl(rawA) ?? rawA.trim()
  const b = sanitizeStreamingTrackUrl(rawB) ?? rawB.trim()
  if (!a || !b) return false
  return streamingTrackIdsMatch(parseStreamingUrl(a), parseStreamingUrl(b))
}

export function embedMatchesLibraryTrack(
  track: Track,
  embed: Pick<EmbedNowPlaying, "provider" | "pageUrl" | "title">,
): boolean {
  if (track.source !== embed.provider) return false

  const libraryTitle = track.title?.trim()
  const embedTitle = embed.title?.trim()
  if (
    libraryTitle
    && embedTitle
    && libraryTitle !== "Yandex Music"
    && libraryTitle !== "Spotify"
    && libraryTitle.toLowerCase() !== embedTitle.toLowerCase()
  ) {
    return false
  }

  if (track.externalId && embed.pageUrl) {
    const parsed = parseStreamingUrl(embed.pageUrl)
    if (parsed.id && parsed.provider === track.source) {
      return parsed.id === track.externalId
    }
  }
  if (track.pageUrl && embed.pageUrl) {
    return streamingUrlsSame(track.pageUrl, embed.pageUrl)
  }
  return false
}

export function embedMatchesBrowsableTrack(
  track: Track,
  embed: Pick<EmbedNowPlaying, "provider" | "title" | "artist">,
): boolean {
  if (track.source !== embed.provider) return false
  const title = track.title.trim().toLowerCase()
  const embedTitle = embed.title.trim().toLowerCase()
  const artist = track.artist.trim().toLowerCase()
  const embedArtist = embed.artist.trim().toLowerCase()
  return Boolean(title && embedTitle && title === embedTitle && artist === embedArtist)
}

export function embedMatchesQueuedLibraryTrack(
  track: Track,
  embed: Pick<EmbedNowPlaying, "provider" | "pageUrl" | "title" | "artist">,
): boolean {
  if (embedMatchesLibraryTrack(track, embed)) return true
  // Title/artist still count after pageUrl is persisted — poll often omits a stable track URL
  // (landing/player bar), and suppressing those polls freezes the progress slider at 0.
  return embedMatchesBrowsableTrack(track, embed)
}

export interface EmbedPollFilterOptions {
  /** Follow live browser queue when it differs from the library selection (Internet tab / My Wave). */
  followBrowserOnMismatch?: boolean
}

/** Prevent embed poll from replacing a queued Yandex/Spotify track with the browser queue. */
export function filterEmbedPollForDelegatedTrack(
  incoming: EmbedNowPlaying | null,
  libraryTrack: Track | null,
  options: EmbedPollFilterOptions = {},
): EmbedNowPlaying | null {
  if (!incoming?.title?.trim()) return incoming
  if (!libraryTrack || !isEmbedDelegatedTrack(libraryTrack)) return incoming

  if (embedMatchesQueuedLibraryTrack(libraryTrack, incoming)) return incoming

  if (options.followBrowserOnMismatch !== false) return incoming

  return null
}

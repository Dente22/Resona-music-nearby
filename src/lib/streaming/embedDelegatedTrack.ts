import type { Track } from "../types.js"
import { getPlaybackUri, isStreamingTrack } from "./trackFactory.js"
import type { StreamingProvider } from "./types.js"

/** Streaming track that plays only through the Spotify/Yandex embed (no direct stream URL). */
export function isEmbedDelegatedTrack(track: Track | null | undefined): boolean {
  if (!track || !isStreamingTrack(track)) return false
  return !getPlaybackUri(track).trim()
}

export function getEmbedProviderForTrack(track: Track): StreamingProvider | null {
  if (track.source === "spotify" || track.source === "yandex") return track.source
  return null
}

export function mergeStreamingTrackWithEmbed(track: Track, embed: {
  title: string
  artist: string
  album: string
  img: string
  duration: number
}): Track {
  const placeholderTitle = track.title === "Yandex Music" || track.title === "Spotify"
  return {
    ...track,
    title: placeholderTitle && embed.title ? embed.title : track.title,
    artist: track.artist?.trim() ? track.artist : embed.artist,
    album: track.album?.trim() ? track.album : embed.album,
    img: track.img?.trim() ? track.img : embed.img,
    duration: track.duration > 0 ? track.duration : embed.duration,
  }
}

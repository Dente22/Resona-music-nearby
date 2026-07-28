import type { EmbedNowPlaying } from "./streaming/embedNowPlaying"
import type { PlaybackState, Track } from "./types"

export function shouldShowPlaybackBar(input: {
  screen: string
  displayTrack: Track
  playback: PlaybackState
  embedNowPlaying: EmbedNowPlaying | null
  emptyTitle: string
}): boolean {
  if (input.screen === "nowplaying") return false
  if (input.embedNowPlaying?.title?.trim()) return true
  if (input.playback.currentTrackId) return true
  return Boolean(input.displayTrack.id && input.displayTrack.title !== input.emptyTitle)
}

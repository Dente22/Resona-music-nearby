import type { Track } from "./types.js"
import { getPlaybackUri } from "./streaming/trackFactory.js"
import { isEmbedDelegatedTrack } from "./streaming/embedDelegatedTrack.js"

/** Only the HTML audio element should play for local files and direct stream URLs. */
export function shouldDriveLocalAudioPlayer(state: {
  displayIsEmbed: boolean
  currentTrack: Track | null
  /** @deprecated Ignored — displayIsEmbed is the source of truth (avoids poll killing library play). */
  embedBrowsingActive?: boolean
  embedIsPlaying?: boolean
}): boolean {
  if (state.displayIsEmbed) return false
  if (isEmbedDelegatedTrack(state.currentTrack)) return false
  const uri = state.currentTrack ? getPlaybackUri(state.currentTrack).trim() : ""
  return Boolean(uri)
}

/**
 * Clear local queue playing flag when the UI has switched to live browser playback.
 * Do NOT clear merely because embedBrowsingActive flipped — Yandex poll used to set that
 * and immediately kill library tracks right after the user pressed play.
 */
export function shouldClearLocalPlayingForEmbed(state: {
  localIsPlaying: boolean
  currentTrack: Track | null
  displayIsEmbed: boolean
  embedBrowsingActive: boolean
  embedIsPlaying: boolean
}): boolean {
  if (!state.localIsPlaying) return false
  if (isEmbedDelegatedTrack(state.currentTrack)) return false
  return state.displayIsEmbed
}

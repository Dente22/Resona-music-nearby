import type { Track } from "./types.js"
import { getPlaybackUri } from "./streaming/trackFactory.js"
import { isEmbedDelegatedTrack } from "./streaming/embedDelegatedTrack.js"

/** Only the HTML audio element should play for local files and direct stream URLs. */
export function shouldDriveLocalAudioPlayer(state: {
  displayIsEmbed: boolean
  currentTrack: Track | null
  embedBrowsingActive?: boolean
  embedIsPlaying?: boolean
}): boolean {
  if (state.displayIsEmbed) return false
  if (state.embedBrowsingActive) return false
  if (isEmbedDelegatedTrack(state.currentTrack)) return false
  const uri = state.currentTrack ? getPlaybackUri(state.currentTrack).trim() : ""
  return Boolean(uri)
}

/** Clear local queue playing flag when browser session owns audio. */
export function shouldClearLocalPlayingForEmbed(state: {
  localIsPlaying: boolean
  currentTrack: Track | null
  displayIsEmbed: boolean
  embedBrowsingActive: boolean
  embedIsPlaying: boolean
}): boolean {
  if (!state.localIsPlaying) return false
  if (isEmbedDelegatedTrack(state.currentTrack)) return false
  if (state.displayIsEmbed) return true
  if (state.embedBrowsingActive) return true
  return false
}

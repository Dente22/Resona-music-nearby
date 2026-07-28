import type { Track } from "../types.js"
import { isEmbedDelegatedTrack, getEmbedProviderForTrack } from "./embedDelegatedTrack.js"
import type { EmbedNowPlaying } from "./embedNowPlaying.js"
import { embedMatchesQueuedLibraryTrack } from "./embedTrackMatch.js"
import type { StreamingProvider } from "./types.js"

export function shouldOpenInternetForEmbedTrack(track: Track | null | undefined): boolean {
  return Boolean(track && isEmbedDelegatedTrack(track) && getEmbedProviderForTrack(track))
}

/** Saved delegated tracks should open Now Playing, not the Internet tab. */
export function shouldQueueNowPlayingForEmbedTrack(track: Track | null | undefined): boolean {
  return shouldOpenInternetForEmbedTrack(track)
}

export function isPinnedDelegatedLibraryPlayback(
  track: Track | null | undefined,
  playbackTrackId: string | null | undefined,
  driveTrackId: string | null | undefined,
): boolean {
  if (!track || !playbackTrackId || !driveTrackId) return false
  if (track.id !== playbackTrackId || track.id !== driveTrackId) return false
  return isEmbedDelegatedTrack(track)
}

export function shouldFollowBrowserEmbedPoll(
  embedBrowsingActive: boolean,
  pinnedLibraryPlayback: boolean,
): boolean {
  return embedBrowsingActive && !pinnedLibraryPlayback
}

export function shouldPollEmbedAfterControl(
  controlProvider: StreamingProvider | null | undefined,
): boolean {
  return !controlProvider
}

export function shouldSuppressEmbedPollWhileDriving(
  drivingTrackId: string | null,
  libraryTrack: Track | null,
  incoming: EmbedNowPlaying | null,
): boolean {
  if (!drivingTrackId || !libraryTrack || libraryTrack.id !== drivingTrackId) return false
  if (!incoming?.title?.trim()) return true
  return !embedMatchesQueuedLibraryTrack(libraryTrack, incoming)
}

export function pickEmbedDriveProvider(track: Track): StreamingProvider | null {
  return getEmbedProviderForTrack(track)
}

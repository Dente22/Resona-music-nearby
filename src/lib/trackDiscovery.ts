import type { FreeTrackResult } from "./freeMusicSearch"
import type { RecordingMatch } from "./musicBrainzClient"
import type { TrackIdentity } from "./trackAnalyzer"

export interface DiscoveryPlan {
  musicBrainzQuery: string
  jamendoQuery: string
  identity: TrackIdentity
}

export interface DiscoveryResult {
  identified: RecordingMatch | TrackIdentity
  freeDownloads: FreeTrackResult[]
}

export function buildDiscoveryPlan(identity: TrackIdentity): DiscoveryPlan {
  const musicBrainzParts: string[] = []
  if (identity.title) musicBrainzParts.push(`recording:"${identity.title}"`)
  if (identity.artist) musicBrainzParts.push(`artist:"${identity.artist}"`)

  return {
    identity,
    musicBrainzQuery: musicBrainzParts.join(" AND ") || identity.searchQuery,
    jamendoQuery: identity.searchQuery,
  }
}

export function mergeDiscoveryResults(
  metadata: RecordingMatch | null,
  freeDownloads: FreeTrackResult[],
  fallbackIdentity?: TrackIdentity,
): DiscoveryResult {
  return {
    identified: metadata ?? fallbackIdentity ?? {
      title: "",
      artist: "",
      album: "",
      duration: 0,
      searchQuery: "",
      source: "filename",
    },
    freeDownloads,
  }
}

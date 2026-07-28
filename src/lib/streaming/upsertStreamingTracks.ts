import type { Track } from "../types.js"
import { createStreamingTrack } from "./trackFactory.js"
import type { StreamingTrackInput } from "./types.js"

export function upsertStreamingTracks(
  existing: Track[],
  incoming: StreamingTrackInput[],
): Track[] {
  let next = [...existing]
  for (const item of incoming) {
    const prev = existing.find(
      t => t.externalId === item.externalId && t.source === (item.source ?? "local"),
    )
    const track = createStreamingTrack(item, prev?.id)
    next = next.filter(
      t => !(t.externalId === track.externalId && t.source === track.source),
    )
    next.push(track)
  }
  return next
}

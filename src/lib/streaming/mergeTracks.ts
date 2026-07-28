import type { Track } from "../types.js"
import { streamingTrackKey } from "./trackFactory.js"

export function mergeLibraryAndStreaming(local: Track[], streaming: Track[]): Track[] {
  const seen = new Set<string>()
  const result: Track[] = []

  for (const track of local) {
    const key = streamingTrackKey(track)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(track)
  }

  for (const track of streaming) {
    const key = streamingTrackKey(track)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(track)
  }

  return result
}

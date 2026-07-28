import { v4 as uuidv4 } from "uuid"
import type { Track } from "../types.js"
import type { StreamingTrackInput } from "./types.js"

export function isStreamingTrack(track: Track): boolean {
  return track.source === "spotify" || track.source === "yandex"
}

export function getPlaybackUri(track: Track): string {
  if (track.streamUrl?.trim()) return track.streamUrl.trim()
  return track.filePath
}

export function createStreamingTrack(input: StreamingTrackInput, id?: string): Track {
  const source = input.source ?? "local"
  return {
    id: id ?? uuidv4(),
    title: input.title,
    artist: input.artist,
    album: input.album,
    duration: input.duration,
    downloaded: source === "local",
    img: input.img,
    filePath: input.filePath ?? "",
    streamUrl: input.streamUrl,
    pageUrl: input.pageUrl,
    externalId: input.externalId || undefined,
    source,
    addedAt: Date.now(),
  }
}

export function streamingTrackKey(track: Track): string {
  if (track.externalId && track.source) return `${track.source}:${track.externalId}`
  return track.id
}

import type { Track } from "../types.js"

/** Browser (Spotify/Yandex) tracks need the network; dim them when offline. */
export function shouldDimOfflineBrowserTrack(
  track: Pick<Track, "source" | "downloaded">,
  isOnline: boolean,
): boolean {
  if (isOnline) return false
  if (track.source !== "spotify" && track.source !== "yandex") return false
  return !track.downloaded
}

export const OFFLINE_BROWSER_TRACK_OPACITY = 0.42

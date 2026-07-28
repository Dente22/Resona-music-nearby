import type { EmbedNowPlaying } from "./embedNowPlaying.js"
import { pickBestEmbedImportUrl } from "./embedTrackUrl.js"
import { shouldHoldEmbedProgressAfterReset } from "../playbackProgress.js"

export function mergeEmbedPlayback(
  prev: EmbedNowPlaying | null,
  incoming: EmbedNowPlaying | null,
): EmbedNowPlaying | null {
  if (!incoming?.title?.trim()) {
    return prev?.title?.trim() ? prev : null
  }

  const sameTrack = prev?.title?.trim() === incoming.title?.trim()
    && prev?.artist?.trim() === incoming.artist?.trim()
  const pageUrl = incoming.pageUrl?.trim() || (sameTrack ? (prev?.pageUrl?.trim() ?? "") : "")
  const duration = incoming.duration > 0
    ? incoming.duration
    : (sameTrack && prev?.duration ? prev.duration : incoming.duration)
  const progress = Number.isFinite(incoming.progress)
    ? Math.max(0, Math.floor(incoming.progress))
    : 0
  if (!sameTrack) {
    return { ...incoming, pageUrl, duration, progress }
  }
  let mergedProgress = incoming.duration > 0 || incoming.progress > 0
    ? incoming.progress
    : (prev?.progress ?? incoming.progress)
  if (
    prev
    && shouldHoldEmbedProgressAfterReset(prev.progress, incoming.progress)
  ) {
    mergedProgress = 0
  }
  return { ...incoming, pageUrl, duration, progress: mergedProgress }
}

export function serializeEmbedPlayback(info: EmbedNowPlaying): string {
  return JSON.stringify(info)
}

export function parseStoredEmbedPlayback(raw: string | null): EmbedNowPlaying | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<EmbedNowPlaying>
    if (!parsed.title?.trim() || !parsed.provider) return null
    return {
      provider: parsed.provider,
      title: parsed.title.trim(),
      artist: (parsed.artist ?? "").trim(),
      album: (parsed.album ?? "").trim(),
      img: parsed.img?.trim() ?? "",
      isPlaying: Boolean(parsed.isPlaying),
      duration: Number.isFinite(parsed.duration) ? Math.max(0, Math.floor(parsed.duration!)) : 0,
      progress: Number.isFinite(parsed.progress) ? Math.max(0, Math.floor(parsed.progress!)) : 0,
      pageUrl: parsed.pageUrl?.trim() ?? "",
    }
  } catch {
    return null
  }
}

export function resolveEmbedImportUrl(
  embed: EmbedNowPlaying | null,
  livePageUrl: string,
): string | null {
  return pickBestEmbedImportUrl(embed?.pageUrl ?? "", livePageUrl)
}

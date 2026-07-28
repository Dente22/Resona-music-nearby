export function hasActivePlaybackTrack(
  currentTrackId: string | null | undefined,
  embedTitle: string | null | undefined,
): boolean {
  return Boolean(currentTrackId?.trim() || embedTitle?.trim())
}

export const STALE_EMBED_PROGRESS_THRESHOLD_SEC = 20

export function shouldHoldEmbedProgressAfterReset(
  previousProgress: number,
  incomingProgress: number,
): boolean {
  return (
    previousProgress === 0
    && incomingProgress > STALE_EMBED_PROGRESS_THRESHOLD_SEC
  )
}

export function shouldRestartDelegatedTrackFromStart(embedProgress: number): boolean {
  return embedProgress > STALE_EMBED_PROGRESS_THRESHOLD_SEC
}

export function isAwaitingEmbedProgress(input: {
  isEmbed: boolean
  pinnedLibraryPlayback: boolean
  embedMatchesQueue: boolean
  embedProgress?: number
  progressResetPending?: boolean
  embedIsPlaying?: boolean
}): boolean {
  if (!input.isEmbed) return false
  if (
    input.progressResetPending
    && input.embedMatchesQueue
    && shouldHoldEmbedProgressAfterReset(0, input.embedProgress ?? 0)
  ) {
    return true
  }

  if (input.pinnedLibraryPlayback && !input.embedMatchesQueue) {
    const progress = input.embedProgress ?? 0
    // Show near-start progress while titles catch up; hide only foreign mid-track polls.
    if (input.embedIsPlaying && progress <= STALE_EMBED_PROGRESS_THRESHOLD_SEC) {
      return false
    }
    return true
  }

  return false
}

export function resolveSliderProgress(input: {
  progress: number
  duration: number
  isPlaying: boolean
  hasActiveTrack: boolean
  awaitingEmbedSync: boolean
}): number {
  if (!input.hasActiveTrack) return 0
  if (input.awaitingEmbedSync) return 0

  const duration = Number.isFinite(input.duration) ? Math.max(0, Math.floor(input.duration)) : 0
  if (duration <= 0) return 0

  const progress = Number.isFinite(input.progress) ? Math.max(0, Math.floor(input.progress)) : 0
  return Math.min(progress, duration)
}

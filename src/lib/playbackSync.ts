export interface PlaybackSyncPlan {
  shouldLoad: boolean
  shouldPlay: boolean
}

export interface PlaybackSyncTarget {
  trackId: string | null
  filePath: string
  playbackUri: string
  isPlaying: boolean
}

export function planPlaybackSync(
  prev: PlaybackSyncTarget | null,
  next: PlaybackSyncTarget,
): PlaybackSyncPlan {
  const uri = next.playbackUri.trim()
  if (!uri) {
    return { shouldLoad: false, shouldPlay: false }
  }

  const trackChanged =
    !prev ||
    prev.trackId !== next.trackId ||
    prev.playbackUri !== next.playbackUri

  return {
    shouldLoad: trackChanged,
    shouldPlay: next.isPlaying,
  }
}

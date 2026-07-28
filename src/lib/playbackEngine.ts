import type { PlaybackState, RepeatMode, Track } from "./types"

export function createInitialPlayback(): PlaybackState {
  return {
    currentTrackId: null,
    isPlaying: false,
    progress: 0,
    isShuffled: false,
    repeatMode: "off",
  }
}

export function selectTrack(
  state: PlaybackState,
  trackId: string,
  autoplay = false,
): PlaybackState {
  return { ...state, currentTrackId: trackId, isPlaying: autoplay, progress: 0 }
}

export function togglePlay(state: PlaybackState): PlaybackState {
  return { ...state, isPlaying: !state.isPlaying }
}

export function setProgress(state: PlaybackState, progress: number): PlaybackState {
  return { ...state, progress }
}

export function toggleShuffle(state: PlaybackState): PlaybackState {
  return { ...state, isShuffled: !state.isShuffled }
}

export function cycleRepeatMode(state: PlaybackState): PlaybackState {
  const next: Record<RepeatMode, RepeatMode> = { off: "all", all: "one", one: "off" }
  return { ...state, repeatMode: next[state.repeatMode] }
}

export function getNextTrackId(
  tracks: Track[],
  currentId: string,
  isShuffled: boolean,
  repeatMode: RepeatMode,
): string | null {
  if (tracks.length === 0) return null
  if (repeatMode === "one") return currentId

  const idx = tracks.findIndex(t => t.id === currentId)
  if (idx === -1) return tracks[0]?.id ?? null

  if (isShuffled) {
    if (tracks.length === 1) return repeatMode === "all" ? currentId : null
    let nextIdx = idx
    while (nextIdx === idx) {
      nextIdx = Math.floor(Math.random() * tracks.length)
    }
    return tracks[nextIdx].id
  }

  if (idx < tracks.length - 1) return tracks[idx + 1].id
  if (repeatMode === "all") return tracks[0].id
  return null
}

export function getPrevTrackId(tracks: Track[], currentId: string): string | null {
  if (tracks.length === 0) return null
  const idx = tracks.findIndex(t => t.id === currentId)
  if (idx === -1) return tracks[0]?.id ?? null
  const prevIdx = (idx - 1 + tracks.length) % tracks.length
  return tracks[prevIdx].id
}

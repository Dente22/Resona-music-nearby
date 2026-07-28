import type { LibraryState, Track } from "./types"

export function createEmptyLibrary(): LibraryState {
  return { tracks: [] }
}

export function addTrack(state: LibraryState, track: Track): LibraryState {
  return { tracks: [...state.tracks, track] }
}

export function removeTrack(state: LibraryState, trackId: string): LibraryState {
  const filtered = state.tracks.filter(t => t.id !== trackId)
  if (filtered.length === state.tracks.length) return state
  return { tracks: filtered }
}

export function searchTracks(state: LibraryState, query: string): Track[] {
  const q = query.trim().toLowerCase()
  if (!q) return state.tracks
  return state.tracks.filter(
    t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q),
  )
}

export function getTrackById(state: LibraryState, trackId: string): Track | undefined {
  return state.tracks.find(t => t.id === trackId)
}

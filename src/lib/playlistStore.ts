import { v4 as uuidv4 } from "uuid"
import type { PlaylistsState } from "./types"

export function createEmptyPlaylists(): PlaylistsState {
  return { playlists: [] }
}

export function createPlaylist(state: PlaylistsState, name: string, img: string): PlaylistsState {
  return {
    playlists: [
      ...state.playlists,
      {
        id: uuidv4(),
        name: name.trim(),
        trackIds: [],
        img,
        createdAt: Date.now(),
      },
    ],
  }
}

export function deletePlaylist(state: PlaylistsState, playlistId: string): PlaylistsState {
  return {
    playlists: state.playlists.filter(p => p.id !== playlistId),
  }
}

export function addTrackToPlaylist(
  state: PlaylistsState,
  playlistId: string,
  trackId: string,
): PlaylistsState {
  return {
    playlists: state.playlists.map(p =>
      p.id === playlistId && !p.trackIds.includes(trackId)
        ? { ...p, trackIds: [...p.trackIds, trackId] }
        : p,
    ),
  }
}

export function removeTrackFromPlaylist(
  state: PlaylistsState,
  playlistId: string,
  trackId: string,
): PlaylistsState {
  return {
    playlists: state.playlists.map(p =>
      p.id === playlistId
        ? { ...p, trackIds: p.trackIds.filter(id => id !== trackId) }
        : p,
    ),
  }
}

export function renamePlaylist(
  state: PlaylistsState,
  playlistId: string,
  name: string,
): PlaylistsState {
  return {
    playlists: state.playlists.map(p =>
      p.id === playlistId ? { ...p, name: name.trim() } : p,
    ),
  }
}

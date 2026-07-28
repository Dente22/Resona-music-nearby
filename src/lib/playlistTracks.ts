import { addTrackToPlaylist } from "./playlistStore"
import type { Playlist, PlaylistsState, Track } from "./types"

export function resolvePlaylistTracks(playlist: Playlist, allTracks: Track[]): Track[] {
  const byId = new Map(allTracks.map(t => [t.id, t]))
  return playlist.trackIds.map(id => byId.get(id)).filter((t): t is Track => Boolean(t))
}

export function countResolvedPlaylistTracks(playlist: Playlist, allTracks: Track[]): number {
  return resolvePlaylistTracks(playlist, allTracks).length
}

export function prunePlaylistTrackIds(playlist: Playlist, allTracks: Track[]): Playlist {
  const valid = new Set(allTracks.map(t => t.id))
  const trackIds = playlist.trackIds.filter(id => valid.has(id))
  if (trackIds.length === playlist.trackIds.length) return playlist
  return { ...playlist, trackIds }
}

export function pruneAllPlaylistTrackIds(playlists: Playlist[], allTracks: Track[]): Playlist[] {
  return playlists.map(p => prunePlaylistTrackIds(p, allTracks))
}

export function addManyTracksToPlaylist(
  state: PlaylistsState,
  playlistId: string,
  trackIds: string[],
): PlaylistsState {
  let next = state
  for (const trackId of trackIds) {
    next = addTrackToPlaylist(next, playlistId, trackId)
  }
  return next
}

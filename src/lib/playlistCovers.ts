import type { Playlist, Track } from "./types"
import { resolvePlaylistTracks } from "./playlistTracks"

export function computePlaylistCover(playlist: Playlist, allTracks: Track[]): string {
  const tracks = resolvePlaylistTracks(playlist, allTracks)
  const withImg = tracks.map(t => t.img?.trim()).filter(Boolean) as string[]
  if (withImg.length === 0) return playlist.img
  return withImg[0]
}

export function syncAllPlaylistCovers(playlists: Playlist[], allTracks: Track[]): Playlist[] {
  return playlists.map(pl => {
    const img = computePlaylistCover(pl, allTracks)
    return img && img !== pl.img ? { ...pl, img } : pl
  })
}

export function syncPlaylistCoverAfterAdd(
  playlist: Playlist,
  allTracks: Track[],
): Playlist {
  return { ...playlist, img: computePlaylistCover(playlist, allTracks) }
}

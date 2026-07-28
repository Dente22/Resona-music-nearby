import type { AppLocale } from "./i18n"
import { parseStreamingUrl } from "./streaming/urlParser"
import { streamingTrackKey } from "./streaming/trackFactory"
import type { Playlist, PlaylistsState, Track } from "./types"

export const LIKES_PLAYLIST_ID = "violetwave-likes"

const LIKES_PLAYLIST_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%231E1E32' width='400' height='400'/%3E%3Cpath d='M200 290 L95 185 a55 55 0 0 1 78-78 L200 134l27-27a55 55 0 0 1 78 78Z' fill='%23EF4444'/%3E%3C/svg%3E"

export function getLikesPlaylistName(language: AppLocale): string {
  return language === "en" ? "Liked" : "Нравится"
}

export function isLikesPlaylist(playlist: Pick<Playlist, "id">): boolean {
  return playlist.id === LIKES_PLAYLIST_ID
}

export function ensureLikesPlaylist(state: PlaylistsState, name: string): PlaylistsState {
  const existing = state.playlists.find(p => isLikesPlaylist(p))
  if (existing) {
    if (existing.name === name) return state
    return {
      playlists: state.playlists.map(p =>
        isLikesPlaylist(p) ? { ...p, name } : p,
      ),
    }
  }
  const likes: Playlist = {
    id: LIKES_PLAYLIST_ID,
    name,
    trackIds: [],
    img: LIKES_PLAYLIST_IMG,
    createdAt: 0,
    kind: "likes",
  }
  return { playlists: [likes, ...state.playlists] }
}

export function getLikesPlaylist(state: PlaylistsState): Playlist | undefined {
  return state.playlists.find(p => isLikesPlaylist(p))
}

export function resolveLikesTracks(state: PlaylistsState, allTracks: Track[]): Track[] {
  const likes = getLikesPlaylist(state)
  if (!likes) return []
  const byId = new Map(allTracks.map(t => [t.id, t]))
  return likes.trackIds.map(id => byId.get(id)).filter((t): t is Track => Boolean(t))
}

export function isTrackInLikesPlaylist(
  state: PlaylistsState,
  trackId: string | null | undefined,
): boolean {
  if (!trackId) return false
  const likes = getLikesPlaylist(state)
  return Boolean(likes?.trackIds.includes(trackId))
}

export function findLikedTrackByPageUrl(allTracks: Track[], pageUrl: string): Track | undefined {
  const parsed = parseStreamingUrl(pageUrl)
  if (!parsed.provider || parsed.type !== "track" || !parsed.id) return undefined
  return allTracks.find(
    t => t.source === parsed.provider && t.externalId === parsed.id,
  )
}

export function findLikedTrackForEmbed(
  state: PlaylistsState,
  allTracks: Track[],
  pageUrl: string,
): Track | undefined {
  const match = findLikedTrackByPageUrl(allTracks, pageUrl)
  if (!match) return undefined
  return isTrackInLikesPlaylist(state, match.id) ? match : undefined
}

export function sortPlaylistsWithLikesFirst(playlists: Playlist[]): Playlist[] {
  const likes = playlists.filter(isLikesPlaylist)
  const rest = playlists.filter(p => !isLikesPlaylist(p))
  return [...likes, ...rest]
}

export function trackLikeKey(track: Track): string {
  return streamingTrackKey(track)
}

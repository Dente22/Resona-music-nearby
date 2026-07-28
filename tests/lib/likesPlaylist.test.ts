import { describe, it, expect } from "vitest"
import {
  ensureLikesPlaylist,
  findLikedTrackByPageUrl,
  getLikesPlaylistName,
  isLikesPlaylist,
  isTrackInLikesPlaylist,
  LIKES_PLAYLIST_ID,
} from "@/lib/likesPlaylist"
import { createStreamingTrack } from "@/lib/streaming/trackFactory"
import { createEmptyPlaylists } from "@/lib/playlistStore"

describe("likesPlaylist", () => {
  it("creates system likes playlist at the top", () => {
    const state = ensureLikesPlaylist(createEmptyPlaylists(), "Нравится")
    expect(state.playlists[0].id).toBe(LIKES_PLAYLIST_ID)
    expect(state.playlists[0].kind).toBe("likes")
    expect(isLikesPlaylist(state.playlists[0])).toBe(true)
  })

  it("tracks membership in likes playlist", () => {
    const track = createStreamingTrack({
      source: "spotify",
      externalId: "abc123",
      title: "Test",
      artist: "Artist",
      album: "",
      duration: 180,
      img: "",
      pageUrl: "https://open.spotify.com/track/abc123",
    })
    let state = ensureLikesPlaylist(createEmptyPlaylists(), "Liked")
    state = {
      playlists: state.playlists.map(p =>
        isLikesPlaylist(p) ? { ...p, trackIds: [track.id] } : p,
      ),
    }
    expect(isTrackInLikesPlaylist(state, track.id)).toBe(true)
  })

  it("finds streaming track by page url", () => {
    const track = createStreamingTrack({
      source: "yandex",
      externalId: "42",
      title: "Yandex",
      artist: "Artist",
      album: "",
      duration: 200,
      img: "",
      pageUrl: "https://music.yandex.ru/track/42",
    })
    const found = findLikedTrackByPageUrl(
      [track],
      "https://music.yandex.ru/album/1/track/42",
    )
    expect(found?.id).toBe(track.id)
  })

  it("localizes likes playlist name", () => {
    expect(getLikesPlaylistName("ru")).toBe("Нравится")
    expect(getLikesPlaylistName("en")).toBe("Liked")
  })
})

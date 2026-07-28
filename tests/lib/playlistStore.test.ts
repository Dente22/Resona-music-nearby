import { describe, it, expect } from "vitest"
import {
  createEmptyPlaylists,
  createPlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  renamePlaylist,
} from "@/lib/playlistStore"

describe("playlistStore", () => {
  it("creates empty playlists state", () => {
    expect(createEmptyPlaylists().playlists).toEqual([])
  })

  it("creates a new playlist", () => {
    const state = createEmptyPlaylists()
    const next = createPlaylist(state, "Chill Vibes", "img.png")
    expect(next.playlists).toHaveLength(1)
    expect(next.playlists[0].name).toBe("Chill Vibes")
    expect(next.playlists[0].trackIds).toEqual([])
  })

  it("deletes a playlist", () => {
    let state = createEmptyPlaylists()
    state = createPlaylist(state, "A", "img.png")
    const id = state.playlists[0].id
    state = createPlaylist(state, "B", "img.png")
    const next = deletePlaylist(state, id)
    expect(next.playlists).toHaveLength(1)
    expect(next.playlists[0].name).toBe("B")
  })

  it("adds and removes tracks from playlist", () => {
    let state = createEmptyPlaylists()
    state = createPlaylist(state, "Mix", "img.png")
    const plId = state.playlists[0].id
    state = addTrackToPlaylist(state, plId, "t1")
    state = addTrackToPlaylist(state, plId, "t2")
    expect(state.playlists[0].trackIds).toEqual(["t1", "t2"])
    state = removeTrackFromPlaylist(state, plId, "t1")
    expect(state.playlists[0].trackIds).toEqual(["t2"])
  })

  it("renames a playlist", () => {
    let state = createEmptyPlaylists()
    state = createPlaylist(state, "Old", "img.png")
    const id = state.playlists[0].id
    state = renamePlaylist(state, id, "New Name")
    expect(state.playlists[0].name).toBe("New Name")
  })
})

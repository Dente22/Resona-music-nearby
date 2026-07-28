import { describe, it, expect } from "vitest"
import {
  resolvePlaylistTracks,
  addManyTracksToPlaylist,
} from "@/lib/playlistTracks"
import { createEmptyPlaylists, createPlaylist } from "@/lib/playlistStore"
import type { Track } from "@/lib/types"

const local: Track = {
  id: "local-1",
  title: "Local Song",
  artist: "Artist",
  album: "Album",
  duration: 180,
  downloaded: true,
  img: "",
  filePath: "/music/a.mp3",
  addedAt: 1,
  source: "local",
}

const spotify: Track = {
  id: "sp-1",
  title: "Spotify Song",
  artist: "Sp Artist",
  album: "",
  duration: 200,
  downloaded: false,
  img: "",
  filePath: "",
  streamUrl: "https://preview.spotify.com/x.mp3",
  externalId: "track-sp",
  addedAt: 2,
  source: "spotify",
}

const yandex: Track = {
  id: "ya-1",
  title: "Yandex Song",
  artist: "Ya Artist",
  album: "",
  duration: 210,
  downloaded: false,
  img: "",
  filePath: "",
  streamUrl: "https://yandex.cdn/track.mp3",
  externalId: "track-ya",
  addedAt: 3,
  source: "yandex",
}

describe("resolvePlaylistTracks", () => {
  it("returns mixed local and streaming tracks in playlist order", () => {
    const playlist = {
      id: "pl1",
      name: "Mix",
      trackIds: ["local-1", "sp-1", "ya-1", "missing"],
      img: "",
      createdAt: 0,
    }
    const resolved = resolvePlaylistTracks(playlist, [local, spotify, yandex])
    expect(resolved.map(t => t.id)).toEqual(["local-1", "sp-1", "ya-1"])
  })
})

describe("addManyTracksToPlaylist", () => {
  it("adds multiple track ids without duplicates", () => {
    let state = createEmptyPlaylists()
    state = createPlaylist(state, "Mix", "img.png")
    const plId = state.playlists[0].id
    state = addManyTracksToPlaylist(state, plId, ["local-1", "sp-1"])
    state = addManyTracksToPlaylist(state, plId, ["sp-1", "ya-1"])
    expect(state.playlists[0].trackIds).toEqual(["local-1", "sp-1", "ya-1"])
  })
})

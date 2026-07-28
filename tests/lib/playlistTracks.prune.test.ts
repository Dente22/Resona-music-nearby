import { describe, it, expect } from "vitest"
import {
  prunePlaylistTrackIds,
  pruneAllPlaylistTrackIds,
  countResolvedPlaylistTracks,
} from "@/lib/playlistTracks"
import type { Track } from "@/lib/types"

const t1: Track = {
  id: "a",
  title: "One",
  artist: "A",
  album: "",
  duration: 100,
  downloaded: true,
  img: "",
  filePath: "/a.mp3",
  addedAt: 1,
  source: "local",
}

describe("prunePlaylistTrackIds", () => {
  it("drops ids that no longer exist in the library", () => {
    const playlist = {
      id: "pl",
      name: "Mix",
      trackIds: ["a", "gone", "missing"],
      img: "",
      createdAt: 0,
    }
    const pruned = prunePlaylistTrackIds(playlist, [t1])
    expect(pruned.trackIds).toEqual(["a"])
  })

  it("countResolvedPlaylistTracks matches visible tracks", () => {
    const playlist = {
      id: "pl",
      name: "Mix",
      trackIds: ["a", "gone"],
      img: "",
      createdAt: 0,
    }
    expect(countResolvedPlaylistTracks(playlist, [t1])).toBe(1)
  })
})

describe("pruneAllPlaylistTrackIds", () => {
  it("prunes every playlist in state", () => {
    const playlists = [
      { id: "p1", name: "A", trackIds: ["a", "x"], img: "", createdAt: 0 },
      { id: "p2", name: "B", trackIds: ["y"], img: "", createdAt: 0 },
    ]
    const next = pruneAllPlaylistTrackIds(playlists, [t1])
    expect(next[0].trackIds).toEqual(["a"])
    expect(next[1].trackIds).toEqual([])
  })
})

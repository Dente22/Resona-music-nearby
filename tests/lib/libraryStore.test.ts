import { describe, it, expect } from "vitest"
import {
  addTrack,
  removeTrack,
  searchTracks,
  getTrackById,
  createEmptyLibrary,
} from "@/lib/libraryStore"
import { createTrackFromFile } from "@/lib/types"

function makeTrack(id: string, title: string, artist = "Artist") {
  return createTrackFromFile(`/music/${id}.mp3`, { title, artist, duration: 180 }, id)
}

describe("libraryStore", () => {
  it("starts with empty library", () => {
    const lib = createEmptyLibrary()
    expect(lib.tracks).toEqual([])
  })

  it("adds a track to the library", () => {
    const lib = createEmptyLibrary()
    const track = makeTrack("1", "Midnight Protocol")
    const next = addTrack(lib, track)
    expect(next.tracks).toHaveLength(1)
    expect(next.tracks[0].title).toBe("Midnight Protocol")
  })

  it("removes a track by id", () => {
    const lib = addTrack(createEmptyLibrary(), makeTrack("1", "A"))
    const lib2 = addTrack(lib, makeTrack("2", "B"))
    const next = removeTrack(lib2, "1")
    expect(next.tracks).toHaveLength(1)
    expect(next.tracks[0].id).toBe("2")
  })

  it("does nothing when removing unknown track", () => {
    const lib = addTrack(createEmptyLibrary(), makeTrack("1", "A"))
    const next = removeTrack(lib, "missing")
    expect(next.tracks).toHaveLength(1)
  })

  it("searches tracks by title and artist", () => {
    let lib = createEmptyLibrary()
    lib = addTrack(lib, makeTrack("1", "Neon Rain", "Synthwave Dreams"))
    lib = addTrack(lib, makeTrack("2", "Void Walker", "Echoes"))
    const results = searchTracks(lib, "neon")
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe("Neon Rain")
  })

  it("returns track by id", () => {
    const track = makeTrack("42", "Test")
    const lib = addTrack(createEmptyLibrary(), track)
    expect(getTrackById(lib, "42")).toEqual(track)
    expect(getTrackById(lib, "missing")).toBeUndefined()
  })
})

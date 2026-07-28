import { describe, it, expect } from "vitest"
import { createTrackFromFile } from "@/lib/types"

describe("createTrackFromFile", () => {
  it("creates track with defaults from file path", () => {
    const track = createTrackFromFile("C:/music/My Song.mp3", {})
    expect(track.title).toBe("My Song")
    expect(track.artist).toBe("Unknown Artist")
    expect(track.downloaded).toBe(true)
    expect(track.filePath).toBe("C:/music/My Song.mp3")
  })

  it("uses provided metadata and id", () => {
    const track = createTrackFromFile(
      "/a.mp3",
      { title: "Custom", artist: "Band", album: "Al", duration: 200, img: "x.png" },
      "fixed-id",
    )
    expect(track.id).toBe("fixed-id")
    expect(track.title).toBe("Custom")
    expect(track.duration).toBe(200)
  })
})

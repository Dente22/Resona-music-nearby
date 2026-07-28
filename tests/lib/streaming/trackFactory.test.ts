import { describe, it, expect } from "vitest"
import { createStreamingTrack, isStreamingTrack, getPlaybackUri } from "@/lib/streaming/trackFactory"

describe("streaming trackFactory", () => {
  it("creates a spotify streaming track", () => {
    const track = createStreamingTrack({
      source: "spotify",
      externalId: "abc123",
      title: "Song",
      artist: "Artist",
      album: "Album",
      duration: 200,
      img: "https://img",
      streamUrl: "https://preview.spotify.com/x.mp3",
    })
    expect(track.source).toBe("spotify")
    expect(track.downloaded).toBe(false)
    expect(track.filePath).toBe("")
    expect(isStreamingTrack(track)).toBe(true)
    expect(getPlaybackUri(track)).toBe("https://preview.spotify.com/x.mp3")
  })

  it("detects local tracks", () => {
    const track = createStreamingTrack({
      source: "local",
      externalId: "",
      title: "Local",
      artist: "Me",
      album: "",
      duration: 100,
      img: "",
      filePath: "C:/music/a.mp3",
    })
    expect(isStreamingTrack(track)).toBe(false)
    expect(getPlaybackUri(track)).toBe("C:/music/a.mp3")
  })
})

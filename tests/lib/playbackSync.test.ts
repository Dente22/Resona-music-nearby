import { describe, it, expect } from "vitest"
import { planPlaybackSync } from "@/lib/playbackSync"

describe("playbackSync", () => {
  it("does nothing without a playback uri", () => {
    expect(
      planPlaybackSync(null, { trackId: "1", filePath: "", playbackUri: "", isPlaying: true }),
    ).toEqual({ shouldLoad: false, shouldPlay: false })
  })

  it("loads when track id or uri changes", () => {
    expect(
      planPlaybackSync(null, {
        trackId: "1",
        filePath: "/a.mp3",
        playbackUri: "/a.mp3",
        isPlaying: false,
      }),
    ).toEqual({ shouldLoad: true, shouldPlay: false })

    expect(
      planPlaybackSync(
        { trackId: "1", filePath: "/a.mp3", playbackUri: "/a.mp3", isPlaying: false },
        { trackId: "2", filePath: "/b.mp3", playbackUri: "/b.mp3", isPlaying: true },
      ),
    ).toEqual({ shouldLoad: true, shouldPlay: true })
  })

  it("plays without reload when only isPlaying toggles on same track", () => {
    expect(
      planPlaybackSync(
        { trackId: "1", filePath: "/a.mp3", playbackUri: "/a.mp3", isPlaying: false },
        { trackId: "1", filePath: "/a.mp3", playbackUri: "/a.mp3", isPlaying: true },
      ),
    ).toEqual({ shouldLoad: false, shouldPlay: true })
  })

  it("pauses when isPlaying becomes false", () => {
    expect(
      planPlaybackSync(
        { trackId: "1", filePath: "/a.mp3", playbackUri: "/a.mp3", isPlaying: true },
        { trackId: "1", filePath: "/a.mp3", playbackUri: "/a.mp3", isPlaying: false },
      ),
    ).toEqual({ shouldLoad: false, shouldPlay: false })
  })

  it("supports streaming URLs without file path", () => {
    expect(
      planPlaybackSync(null, {
        trackId: "1",
        filePath: "",
        playbackUri: "https://preview.mp3",
        isPlaying: true,
      }),
    ).toEqual({ shouldLoad: true, shouldPlay: true })
  })
})

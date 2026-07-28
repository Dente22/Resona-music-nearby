import { describe, it, expect } from "vitest"
import { shouldShowPlaybackBar } from "@/lib/playbackBar"
import { createInitialPlayback } from "@/lib/playbackEngine"
import type { Track } from "@/lib/types"

const track: Track = {
  id: "t1",
  title: "Song",
  artist: "Artist",
  album: "",
  duration: 100,
  downloaded: true,
  img: "",
  filePath: "/a.mp3",
  addedAt: 1,
  source: "local",
}

describe("shouldShowPlaybackBar", () => {
  it("hides on now playing tab", () => {
    expect(
      shouldShowPlaybackBar({
        screen: "nowplaying",
        displayTrack: track,
        playback: createInitialPlayback(),
        embedNowPlaying: null,
        emptyTitle: "No tracks",
      }),
    ).toBe(false)
  })

  it("shows on library when a track is queued", () => {
    expect(
      shouldShowPlaybackBar({
        screen: "library",
        displayTrack: track,
        playback: { ...createInitialPlayback(), currentTrackId: "t1" },
        embedNowPlaying: null,
        emptyTitle: "No tracks",
      }),
    ).toBe(true)
  })

  it("shows on settings when embed is active", () => {
    expect(
      shouldShowPlaybackBar({
        screen: "settings",
        displayTrack: track,
        playback: createInitialPlayback(),
        embedNowPlaying: {
          provider: "yandex",
          title: "My Wave",
          artist: "Yandex",
          album: "",
          img: "",
          isPlaying: true,
          duration: 100,
          progress: 10,
        },
        emptyTitle: "No tracks",
      }),
    ).toBe(true)
  })
})

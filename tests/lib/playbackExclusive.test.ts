import { describe, it, expect } from "vitest"
import { shouldClearLocalPlayingForEmbed, shouldDriveLocalAudioPlayer } from "@/lib/playbackExclusive"
import type { Track } from "@/lib/types"

const local: Track = {
  id: "l1",
  title: "Local",
  artist: "Me",
  album: "",
  duration: 100,
  downloaded: true,
  img: "",
  filePath: "/a.mp3",
  addedAt: 1,
  source: "local",
}

const embedDelegated: Track = {
  id: "y1",
  title: "Yandex",
  artist: "A",
  album: "",
  duration: 100,
  downloaded: false,
  img: "",
  filePath: "",
  pageUrl: "https://music.yandex.ru/track/1",
  externalId: "1",
  source: "yandex",
  addedAt: 1,
}

describe("shouldDriveLocalAudioPlayer", () => {
  it("drives local audio for local files", () => {
    expect(
      shouldDriveLocalAudioPlayer({ displayIsEmbed: false, currentTrack: local }),
    ).toBe(true)
  })

  it("stops local audio when embed display is active", () => {
    expect(
      shouldDriveLocalAudioPlayer({ displayIsEmbed: true, currentTrack: local }),
    ).toBe(false)
  })

  it("stops local audio for embed-delegated queue tracks", () => {
    expect(
      shouldDriveLocalAudioPlayer({ displayIsEmbed: false, currentTrack: embedDelegated }),
    ).toBe(false)
  })

  it("still drives local audio if browsing flag is stale after library play", () => {
    expect(
      shouldDriveLocalAudioPlayer({
        displayIsEmbed: false,
        currentTrack: local,
        embedBrowsingActive: true,
        embedIsPlaying: true,
      }),
    ).toBe(true)
  })
})

describe("shouldClearLocalPlayingForEmbed", () => {
  it("does not clear library play just because Yandex poll flipped browsing", () => {
    expect(
      shouldClearLocalPlayingForEmbed({
        localIsPlaying: true,
        currentTrack: local,
        displayIsEmbed: false,
        embedBrowsingActive: true,
        embedIsPlaying: true,
      }),
    ).toBe(false)
  })

  it("clears local playing when UI follows live embed", () => {
    expect(
      shouldClearLocalPlayingForEmbed({
        localIsPlaying: true,
        currentTrack: local,
        displayIsEmbed: true,
        embedBrowsingActive: true,
        embedIsPlaying: true,
      }),
    ).toBe(true)
  })

  it("does not clear when local owns playback", () => {
    expect(
      shouldClearLocalPlayingForEmbed({
        localIsPlaying: true,
        currentTrack: local,
        displayIsEmbed: false,
        embedBrowsingActive: false,
        embedIsPlaying: false,
      }),
    ).toBe(false)
  })

  it("does not clear for delegated embed library tracks", () => {
    expect(
      shouldClearLocalPlayingForEmbed({
        localIsPlaying: true,
        currentTrack: embedDelegated,
        displayIsEmbed: true,
        embedBrowsingActive: false,
        embedIsPlaying: true,
      }),
    ).toBe(false)
  })
})

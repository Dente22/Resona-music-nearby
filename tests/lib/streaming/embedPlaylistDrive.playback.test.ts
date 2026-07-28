import { describe, it, expect } from "vitest"
import {
  isPinnedDelegatedLibraryPlayback,
  shouldFollowBrowserEmbedPoll,
  shouldPollEmbedAfterControl,
  shouldQueueNowPlayingForEmbedTrack,
} from "@/lib/streaming/embedPlaylistDrive"
import type { Track } from "@/lib/types"

const delegated: Track = {
  id: "y1",
  title: "Queued Song",
  artist: "Artist A",
  album: "",
  duration: 200,
  downloaded: false,
  img: "",
  filePath: "",
  pageUrl: "https://music.yandex.kz/album/1/track/56220214",
  externalId: "56220214",
  source: "yandex",
  addedAt: 1,
}

describe("embedPlaylistDrive playback pinning", () => {
  it("queues now playing instead of internet for saved embed tracks", () => {
    expect(shouldQueueNowPlayingForEmbedTrack(delegated)).toBe(true)
    expect(shouldQueueNowPlayingForEmbedTrack({ ...delegated, streamUrl: "https://cdn/a.mp3" })).toBe(
      false,
    )
  })

  it("pins library playback while the delegated track is actively driven", () => {
    expect(isPinnedDelegatedLibraryPlayback(delegated, "y1", "y1")).toBe(true)
    expect(isPinnedDelegatedLibraryPlayback(delegated, "y2", "y1")).toBe(false)
    expect(isPinnedDelegatedLibraryPlayback({ ...delegated, streamUrl: "https://cdn/a.mp3" }, "y1", "y1")).toBe(
      false,
    )
  })

  it("does not follow browser poll while pinned library playback is active", () => {
    expect(shouldFollowBrowserEmbedPoll(true, true)).toBe(false)
    expect(shouldFollowBrowserEmbedPoll(true, false)).toBe(true)
  })

  it("skips embed poll after seek when library control provider is active", () => {
    expect(shouldPollEmbedAfterControl("yandex")).toBe(false)
    expect(shouldPollEmbedAfterControl(null)).toBe(true)
  })
})

import { describe, it, expect } from "vitest"
import {
  shouldOpenInternetForEmbedTrack,
  shouldSuppressEmbedPollWhileDriving,
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

describe("embedPlaylistDrive", () => {
  it("opens internet for delegated streaming tracks", () => {
    expect(shouldOpenInternetForEmbedTrack(delegated)).toBe(true)
    expect(shouldOpenInternetForEmbedTrack({ ...delegated, streamUrl: "https://cdn/a.mp3" })).toBe(
      false,
    )
  })

  it("suppresses stale poll while driving a different embed track", () => {
    expect(
      shouldSuppressEmbedPollWhileDriving("y1", delegated, {
        provider: "yandex",
        title: "Other Song",
        artist: "X",
        album: "",
        img: "",
        isPlaying: true,
        duration: 200,
        progress: 10,
        pageUrl: "https://music.yandex.ru/track/999",
      }),
    ).toBe(true)
  })

  it("accepts poll once embed matches queued track", () => {
    expect(
      shouldSuppressEmbedPollWhileDriving("y1", delegated, {
        provider: "yandex",
        title: "Queued Song",
        artist: "Artist A",
        album: "",
        img: "",
        isPlaying: true,
        duration: 200,
        progress: 0,
        pageUrl: "https://music.yandex.kz/album/1/track/56220214",
      }),
    ).toBe(false)
  })
})

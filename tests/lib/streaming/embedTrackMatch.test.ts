import { describe, it, expect } from "vitest"
import {
  embedMatchesLibraryTrack,
  filterEmbedPollForDelegatedTrack,
  streamingUrlsSame,
} from "@/lib/streaming/embedTrackMatch"
import { shouldSuppressEmbedPollWhileDriving } from "@/lib/streaming/embedPlaylistDrive"
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

describe("embedTrackMatch", () => {
  it("matches yandex tracks by external id across regional domains", () => {
    expect(
      streamingUrlsSame(
        "https://music.yandex.kz/album/1/track/56220214",
        "https://music.yandex.ru/track/56220214",
      ),
    ).toBe(true)
  })

  it("detects when embed poll is a different track", () => {
    expect(
      embedMatchesLibraryTrack(delegated, {
        provider: "yandex",
        title: "Other Song",
        pageUrl: "https://music.yandex.ru/track/999",
      }),
    ).toBe(false)
  })

  it("detects title mismatch even without track page url", () => {
    expect(
      embedMatchesLibraryTrack(delegated, {
        provider: "yandex",
        title: "My Wave Track",
        pageUrl: "",
      }),
    ).toBe(false)
  })

  it("follows live embed when poll mismatches during browsing session", () => {
    const filtered = filterEmbedPollForDelegatedTrack(
      {
        provider: "yandex",
        title: "My Wave",
        artist: "Yandex",
        album: "",
        img: "https://cover.jpg",
        isPlaying: true,
        duration: 180,
        progress: 90,
        pageUrl: "https://music.yandex.ru/landing",
      },
      delegated,
      { followBrowserOnMismatch: true },
    )
    expect(filtered?.title).toBe("My Wave")
    expect(filtered?.pageUrl).toBe("https://music.yandex.ru/landing")
    expect(filtered?.progress).toBe(90)
  })

  it("ignores stale poll while driving playlist embed track", () => {
    const filtered = filterEmbedPollForDelegatedTrack(
      {
        provider: "yandex",
        title: "My Wave",
        artist: "Yandex",
        album: "",
        img: "",
        isPlaying: true,
        duration: 180,
        progress: 90,
        pageUrl: "https://music.yandex.ru/landing",
      },
      delegated,
      { followBrowserOnMismatch: false },
    )
    expect(filtered).toBeNull()
  })

  it("accepts poll when it matches browsable track by title", () => {
    const filtered = filterEmbedPollForDelegatedTrack(
      {
        provider: "yandex",
        title: "Queued Song",
        artist: "Artist A",
        album: "",
        img: "",
        isPlaying: true,
        duration: 180,
        progress: 12,
        pageUrl: "",
      },
      { ...delegated, pageUrl: "", externalId: "browse-1" },
      { followBrowserOnMismatch: false },
    )
    expect(filtered?.title).toBe("Queued Song")
  })

  it("keeps accepting title/artist polls after pageUrl was saved for the library track", () => {
    const filtered = filterEmbedPollForDelegatedTrack(
      {
        provider: "yandex",
        title: "Queued Song",
        artist: "Artist A",
        album: "",
        img: "",
        isPlaying: true,
        duration: 196,
        progress: 42,
        pageUrl: "",
      },
      delegated,
      { followBrowserOnMismatch: false },
    )
    expect(filtered?.progress).toBe(42)
    expect(
      shouldSuppressEmbedPollWhileDriving("y1", delegated, {
        provider: "yandex",
        title: "Queued Song",
        artist: "Artist A",
        album: "",
        img: "",
        isPlaying: true,
        duration: 196,
        progress: 42,
        pageUrl: "",
      }),
    ).toBe(false)
  })
})

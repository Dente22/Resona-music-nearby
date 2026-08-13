import { describe, it, expect } from "vitest"
import { isEmbedControlActive, preferBrowserPlayback } from "@/lib/displayPlayback"
import { createInitialPlayback, selectTrack } from "@/lib/playbackEngine"
import type { Track } from "@/lib/types"

const local: Track = {
  id: "local-1",
  title: "Local",
  artist: "Me",
  album: "",
  duration: 100,
  downloaded: true,
  img: "/img.jpg",
  filePath: "/a.mp3",
  addedAt: 1,
  source: "local",
}

const embed = {
  provider: "yandex" as const,
  title: "My Wave",
  artist: "KSB muzic",
  album: "",
  img: "",
  isPlaying: true,
  duration: 200,
  progress: 40,
  pageUrl: "https://music.yandex.ru/landing",
}

describe("isEmbedControlActive", () => {
  it("is true when browsing session is active without delegated provider", () => {
    expect(isEmbedControlActive(null, true)).toBe(true)
  })

  it("is false when neither provider nor browsing session is set", () => {
    expect(isEmbedControlActive(null, false)).toBe(false)
  })
})

describe("preferBrowserPlayback", () => {
  it("keeps browser session on screen after pause so play/skip still work", () => {
    const pb = selectTrack(createInitialPlayback(), "local-1", false)
    const pausedEmbed = { ...embed, isPlaying: false }
    expect(
      preferBrowserPlayback(pausedEmbed, pb, local, false, true),
    ).toBe(true)
  })

  it("prefers browser on internet tab", () => {
    expect(
      preferBrowserPlayback(embed, createInitialPlayback(), local, true, false),
    ).toBe(true)
  })

  it("prefers browser on now playing when embed browsing session is active", () => {
    const pb = selectTrack(createInitialPlayback(), "local-1", false)
    expect(
      preferBrowserPlayback(embed, pb, local, false, true),
    ).toBe(true)
  })

  it("prefers live browser over paused local without an explicit browsing flag", () => {
    const pb = selectTrack(createInitialPlayback(), "local-1", false)
    expect(
      preferBrowserPlayback(embed, pb, local, false, false),
    ).toBe(true)
  })

  it("prefers live browser over stale local isPlaying after internet session", () => {
    const pb = selectTrack(createInitialPlayback(), "local-1", true)
    expect(
      preferBrowserPlayback(embed, pb, local, false, true),
    ).toBe(true)
  })

  it("keeps local when browsing ended and local is actively playing", () => {
    const pb = selectTrack(createInitialPlayback(), "local-1", true)
    expect(
      preferBrowserPlayback(embed, pb, local, false, false),
    ).toBe(false)
  })

  it("keeps paused local when embed is also paused (no live browser audio)", () => {
    const pb = selectTrack(createInitialPlayback(), "local-1", false)
    const pausedEmbed = { ...embed, isPlaying: false }
    expect(
      preferBrowserPlayback(pausedEmbed, pb, local, false, false),
    ).toBe(false)
  })

  it("does not follow stale browser audio on internet tab while pinned library playback is active", () => {
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
    const pb = selectTrack(createInitialPlayback(), "y1", true)
    expect(
      preferBrowserPlayback(embed, pb, delegated, true, false, "yandex", true),
    ).toBe(false)
  })

  it("follows matched embed on internet tab once pinned library track is playing", () => {
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
    const pb = selectTrack(createInitialPlayback(), "y1", true)
    const matchedEmbed = {
      ...embed,
      title: "Queued Song",
      artist: "Artist A",
      pageUrl: delegated.pageUrl,
      isPlaying: true,
    }
    expect(
      preferBrowserPlayback(matchedEmbed, pb, delegated, true, false, "yandex", true),
    ).toBe(true)
  })

  it("keeps library pin preferred while Yandex DOM lags behind play()", () => {
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
    const pb = selectTrack(createInitialPlayback(), "y1", true)
    const laggingEmbed = {
      ...embed,
      title: "Queued Song",
      artist: "Artist A",
      pageUrl: delegated.pageUrl,
      isPlaying: false,
    }
    expect(
      preferBrowserPlayback(laggingEmbed, pb, delegated, false, false, "yandex", true),
    ).toBe(true)
  })

  it("does not follow mismatched browser audio while driving playlist embed track", () => {
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
    const pb = selectTrack(createInitialPlayback(), "y1", true)
    expect(
      preferBrowserPlayback(embed, pb, delegated, false, false, "yandex"),
    ).toBe(false)
  })
})

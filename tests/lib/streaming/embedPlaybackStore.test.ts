import { describe, it, expect } from "vitest"
import {
  mergeEmbedPlayback,
  parseStoredEmbedPlayback,
  serializeEmbedPlayback,
  resolveEmbedImportUrl,
} from "@/lib/streaming/embedPlaybackStore"
import type { EmbedNowPlaying } from "@/lib/streaming/embedNowPlaying"

const sample: EmbedNowPlaying = {
  provider: "spotify",
  title: "Song",
  artist: "Artist",
  album: "Album",
  img: "https://cover.jpg",
  isPlaying: true,
  duration: 200,
  progress: 50,
  pageUrl: "https://open.spotify.com/track/abc123",
}

describe("embedPlaybackStore", () => {
  it("keeps last embed when poll returns null", () => {
    const merged = mergeEmbedPlayback(sample, null)
    expect(merged?.title).toBe("Song")
    expect(merged?.isPlaying).toBe(true)
  })

  it("updates embed when new track arrives", () => {
    const next: EmbedNowPlaying = { ...sample, title: "New Song", isPlaying: true }
    const merged = mergeEmbedPlayback(sample, next)
    expect(merged?.title).toBe("New Song")
  })

  it("preserves pageUrl when update lacks it for the same track", () => {
    const next: EmbedNowPlaying = { ...sample, pageUrl: "" }
    const merged = mergeEmbedPlayback(sample, next)
    expect(merged?.pageUrl).toBe("https://open.spotify.com/track/abc123")
  })

  it("drops stale pageUrl when a different track arrives", () => {
    const next: EmbedNowPlaying = {
      ...sample,
      title: "My Wave",
      artist: "Other",
      pageUrl: "",
    }
    const merged = mergeEmbedPlayback(sample, next)
    expect(merged?.title).toBe("My Wave")
    expect(merged?.pageUrl).toBe("")
  })

  it("drops stale progress when a different track arrives", () => {
    const next: EmbedNowPlaying = {
      ...sample,
      title: "My Wave",
      artist: "Other",
      progress: 120,
      pageUrl: "",
    }
    const merged = mergeEmbedPlayback(sample, next)
    expect(merged?.progress).toBe(120)
  })

  it("preserves duration when poll returns zero for same track", () => {
    const next: EmbedNowPlaying = { ...sample, duration: 0, progress: 0 }
    const merged = mergeEmbedPlayback(sample, next)
    expect(merged?.duration).toBe(200)
    expect(merged?.progress).toBe(50)
  })

  it("holds progress at zero when same track poll jumps mid-track after reset", () => {
    const prev: EmbedNowPlaying = { ...sample, progress: 0 }
    const next: EmbedNowPlaying = { ...sample, progress: 195 }
    const merged = mergeEmbedPlayback(prev, next)
    expect(merged?.progress).toBe(0)
  })

  it("accepts low progress after reset once embed catches up from start", () => {
    const prev: EmbedNowPlaying = { ...sample, progress: 0 }
    const next: EmbedNowPlaying = { ...sample, progress: 4 }
    const merged = mergeEmbedPlayback(prev, next)
    expect(merged?.progress).toBe(4)
  })

  it("round-trips storage", () => {
    const raw = serializeEmbedPlayback(sample)
    expect(parseStoredEmbedPlayback(raw)).toEqual(sample)
  })

  it("returns null for invalid storage", () => {
    expect(parseStoredEmbedPlayback(null)).toBeNull()
    expect(parseStoredEmbedPlayback("{bad")).toBeNull()
  })

  it("resolves import url from embed or live page url", () => {
    expect(resolveEmbedImportUrl(sample, "")).toBe("https://open.spotify.com/track/abc123")
    expect(
      resolveEmbedImportUrl({ ...sample, pageUrl: "" }, "https://music.yandex.ru/album/1/track/42"),
    ).toBe("https://music.yandex.ru/album/1/track/42")
    expect(resolveEmbedImportUrl({ ...sample, pageUrl: "" }, "")).toBeNull()
  })
})

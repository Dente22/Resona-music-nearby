import { describe, it, expect } from "vitest"
import { upsertStreamingTracks } from "@/lib/streaming/upsertStreamingTracks"
import { createStreamingTrack } from "@/lib/streaming/trackFactory"

describe("upsertStreamingTracks", () => {
  it("adds new streaming tracks", () => {
    const next = upsertStreamingTracks([], [
      {
        source: "spotify",
        externalId: "a",
        title: "A",
        artist: "X",
        album: "",
        duration: 100,
        img: "",
        streamUrl: "https://a.mp3",
      },
    ])
    expect(next).toHaveLength(1)
    expect(next[0].source).toBe("spotify")
  })

  it("replaces existing track with same provider and external id", () => {
    const existing = createStreamingTrack({
      source: "yandex",
      externalId: "123",
      title: "Old",
      artist: "A",
      album: "",
      duration: 100,
      img: "",
      streamUrl: "https://old.mp3",
    })
    const next = upsertStreamingTracks([existing], [
      {
        source: "yandex",
        externalId: "123",
        title: "New",
        artist: "B",
        album: "",
        duration: 120,
        img: "",
        streamUrl: "https://new.mp3",
      },
    ])
    expect(next).toHaveLength(1)
    expect(next[0].title).toBe("New")
    expect(next[0].id).toBe(existing.id)
  })

  it("preserves playlist references when re-importing browsable tracks", () => {
    const existing = createStreamingTrack({
      source: "yandex",
      externalId: "browse-42",
      title: "Song",
      artist: "A",
      album: "",
      duration: 100,
      img: "",
      streamUrl: "",
      pageUrl: "",
    })
    const next = upsertStreamingTracks([existing], [
      {
        source: "yandex",
        externalId: "browse-42",
        title: "Song",
        artist: "A",
        album: "Al",
        duration: 120,
        img: "https://cover.jpg",
        streamUrl: "",
        pageUrl: "https://music.yandex.ru/track/1",
      },
    ])
    expect(next[0].id).toBe(existing.id)
    expect(next[0].pageUrl).toBe("https://music.yandex.ru/track/1")
  })
})

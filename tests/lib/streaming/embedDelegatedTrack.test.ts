import { describe, it, expect } from "vitest"
import {
  getEmbedProviderForTrack,
  isEmbedDelegatedTrack,
  mergeStreamingTrackWithEmbed,
} from "@/lib/streaming/embedDelegatedTrack"
import type { Track } from "@/lib/types"

const yandexDelegated: Track = {
  id: "s1",
  title: "Yandex Music",
  artist: "",
  album: "",
  duration: 0,
  downloaded: false,
  img: "",
  filePath: "",
  pageUrl: "https://music.yandex.kz/album/1/track/56220214",
  externalId: "56220214",
  source: "yandex",
  addedAt: 1,
}

describe("embedDelegatedTrack", () => {
  it("detects yandex tracks with pageUrl only", () => {
    expect(isEmbedDelegatedTrack(yandexDelegated)).toBe(true)
    expect(getEmbedProviderForTrack(yandexDelegated)).toBe("yandex")
  })

  it("detects browsable yandex tracks saved without page url", () => {
    expect(
      isEmbedDelegatedTrack({
        ...yandexDelegated,
        pageUrl: "",
        externalId: "browse-99",
      }),
    ).toBe(true)
  })

  it("rejects tracks with streamUrl", () => {
    expect(isEmbedDelegatedTrack({ ...yandexDelegated, streamUrl: "https://cdn.example/a.mp3" })).toBe(
      false,
    )
  })

  it("merges embed metadata over placeholder title", () => {
    const merged = mergeStreamingTrackWithEmbed(yandexDelegated, {
      title: "Real Song",
      artist: "Artist",
      album: "Album",
      img: "https://cover.jpg",
      duration: 210,
    })
    expect(merged.title).toBe("Real Song")
    expect(merged.artist).toBe("Artist")
    expect(merged.duration).toBe(210)
    expect(merged.img).toBe("https://cover.jpg")
  })
})

import { describe, it, expect } from "vitest"
import {
  collectStreamingTrackInputs,
  collectStreamingTrackInputsFromEmbedOnly,
  enrichStreamingInput,
} from "@/lib/streaming/embedStreamImport"
import { parseStreamingUrl } from "@/lib/streaming/urlParser"

const embed = {
  provider: "yandex" as const,
  title: "непроизошло",
  artist: "ZOLOTO",
  album: "Album",
  img: "https://avatars.yandex.net/get-music-content/abc/50x50",
  isPlaying: true,
  duration: 233,
  progress: 40,
  pageUrl: "",
}

const trackUrl = "https://music.yandex.ru/album/5/track/42"

describe("collectStreamingTrackInputs", () => {
  it("builds from embed metadata when parsed url is missing", () => {
    const inputs = collectStreamingTrackInputs({
      url: "",
      parsed: null,
      importResult: { ok: false, tracks: [] },
      embed,
    })
    expect(inputs).toHaveLength(1)
    expect(inputs[0].title).toBe("непроизошло")
    expect(inputs[0].externalId).toMatch(/^browse-/)
  })

  it("builds from embed metadata when API import returns no tracks", () => {
    const parsed = parseStreamingUrl(trackUrl)!
    const inputs = collectStreamingTrackInputs({
      url: trackUrl,
      parsed,
      importResult: { ok: false, tracks: [] },
      embed,
    })
    expect(inputs).toHaveLength(1)
    expect(inputs[0].title).toBe("непроизошло")
    expect(inputs[0].artist).toBe("ZOLOTO")
    expect(inputs[0].externalId).toBe("42")
    expect(inputs[0].pageUrl).toBe(trackUrl)
  })

  it("merges API import with embed metadata and page url", () => {
    const parsed = parseStreamingUrl(trackUrl)!
    const inputs = collectStreamingTrackInputs({
      url: trackUrl,
      parsed,
      importResult: {
        ok: true,
        tracks: [{
          source: "yandex",
          externalId: "42",
          title: "Yandex Music",
          artist: "",
          album: "",
          duration: 0,
          img: "",
          streamUrl: "",
          pageUrl: "",
        }],
      },
      embed,
    })
    expect(inputs[0].title).toBe("непроизошло")
    expect(inputs[0].artist).toBe("ZOLOTO")
    expect(inputs[0].pageUrl).toBe(trackUrl)
    expect(inputs[0].img).toContain("600x600")
  })
})

describe("collectStreamingTrackInputsFromEmbedOnly", () => {
  it("returns empty without embed title", () => {
    expect(collectStreamingTrackInputsFromEmbedOnly(null)).toEqual([])
  })
})

describe("enrichStreamingInput", () => {
  it("keeps imported title when it is not a generic placeholder", () => {
    const out = enrichStreamingInput({
      source: "yandex",
      externalId: "1",
      title: "Real title",
      artist: "A",
      album: "",
      duration: 100,
      img: "",
      streamUrl: "",
      pageUrl: trackUrl,
    }, embed)
    expect(out.title).toBe("Real title")
  })
})

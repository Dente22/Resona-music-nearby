import { describe, it, expect } from "vitest"
import { buildYandexTrackInput } from "@/lib/streaming/yandexTrackImport"
import { parseStreamingUrl } from "@/lib/streaming/urlParser"

const KZ_SHARE_URL =
  "https://music.yandex.kz/album/8305394/track/56220214?utm_source=web&utm_medium=copy_link"

describe("yandexTrackImport", () => {
  it("builds storable track from kz share url without API metadata", () => {
    const parsed = parseStreamingUrl(KZ_SHARE_URL)
    const input = buildYandexTrackInput(parsed, null)
    expect(input).toMatchObject({
      source: "yandex",
      externalId: "56220214",
      pageUrl: "https://music.yandex.kz/album/8305394/track/56220214",
    })
  })

  it("merges API metadata when available", () => {
    const parsed = parseStreamingUrl(KZ_SHARE_URL)
    const input = buildYandexTrackInput(parsed, {
      id: "56220214",
      title: "Test Song",
      durationMs: 210000,
      artists: [{ name: "Artist" }],
      albums: [{ title: "Album", coverUri: "avatars.yandex.net/get-music-content/xxx/%%" }],
    })
    expect(input.title).toBe("Test Song")
    expect(input.artist).toBe("Artist")
    expect(input.duration).toBe(210)
    expect(input.pageUrl).toBe("https://music.yandex.kz/album/8305394/track/56220214")
  })
})

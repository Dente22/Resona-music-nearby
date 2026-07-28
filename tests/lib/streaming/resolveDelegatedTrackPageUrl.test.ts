import { describe, it, expect } from "vitest"
import { resolveDelegatedTrackPageUrl } from "@/lib/streaming/resolveDelegatedTrackPageUrl"
import type { Track } from "@/lib/types"

const base: Track = {
  id: "y1",
  title: "Song",
  artist: "Artist",
  album: "",
  duration: 200,
  downloaded: false,
  img: "",
  filePath: "",
  pageUrl: "",
  externalId: "56220214",
  source: "yandex",
  addedAt: 1,
}

describe("resolveDelegatedTrackPageUrl", () => {
  it("uses track page url when it points at a track", () => {
    expect(
      resolveDelegatedTrackPageUrl({
        ...base,
        pageUrl: "https://music.yandex.kz/album/1/track/56220214",
      }),
    ).toBe("https://music.yandex.kz/album/1/track/56220214")
  })

  it("builds yandex url from numeric external id", () => {
    expect(resolveDelegatedTrackPageUrl(base)).toBe("https://music.yandex.ru/track/56220214")
  })

  it("ignores landing page urls without track id", () => {
    expect(
      resolveDelegatedTrackPageUrl({
        ...base,
        pageUrl: "https://music.yandex.ru/landing",
      }),
    ).toBe("https://music.yandex.ru/track/56220214")
  })

  it("returns empty for browse-only ids", () => {
    expect(
      resolveDelegatedTrackPageUrl({
        ...base,
        externalId: "browse-99",
        pageUrl: "",
      }),
    ).toBe("")
  })
})

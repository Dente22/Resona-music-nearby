import { describe, it, expect } from "vitest"
import { pickEmbedCoverUrl, upscaleEmbedCoverUrl } from "@/lib/streaming/embedCoverArt"

describe("upscaleEmbedCoverUrl", () => {
  it("replaces Yandex %% placeholder with large size", () => {
    expect(
      upscaleEmbedCoverUrl("https://avatars.yandex.net/get-music-content/abc/%%"),
    ).toBe("https://avatars.yandex.net/get-music-content/abc/600x600")
  })

  it("upscales Yandex path dimensions", () => {
    expect(
      upscaleEmbedCoverUrl("https://avatars.yandex.net/get-music-content/abc/50x50"),
    ).toBe("https://avatars.yandex.net/get-music-content/abc/600x600")
  })

  it("upscales avatars.mds size query param", () => {
    expect(
      upscaleEmbedCoverUrl("https://avatars.mds.yandex.net/i?id=1&size=50"),
    ).toBe("https://avatars.mds.yandex.net/i?id=1&size=600")
  })

  it("upscales Spotify w/h params", () => {
    expect(
      upscaleEmbedCoverUrl("https://i.scdn.co/image/abc?w=64&h=64"),
    ).toBe("https://i.scdn.co/image/abc?w=600&h=600")
  })
})

describe("pickEmbedCoverUrl", () => {
  it("prefers media session art when DOM thumb is tiny", () => {
    const url = pickEmbedCoverUrl(
      "https://avatars.mds.yandex.net/i?id=1&size=50",
      [{ src: "https://avatars.yandex.net/get-music-content/abc/%%" }],
    )
    expect(url).toBe("https://avatars.yandex.net/get-music-content/abc/600x600")
  })

  it("keeps DOM art when it already looks large enough", () => {
    const url = pickEmbedCoverUrl(
      "https://avatars.yandex.net/get-music-content/abc/400x400",
      [{ src: "https://avatars.yandex.net/get-music-content/other/%%" }],
    )
    expect(url).toBe("https://avatars.yandex.net/get-music-content/abc/600x600")
  })
})

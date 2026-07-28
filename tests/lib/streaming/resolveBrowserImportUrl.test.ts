import { describe, it, expect } from "vitest"
import { resolveBrowserImportUrl } from "@/lib/streaming/embedTrackUrl"

describe("resolveBrowserImportUrl", () => {
  it("uses fetched player track url when field and page url are empty", async () => {
    const url = await resolveBrowserImportUrl({
      typedUrl: "",
      storedPageUrl: "",
      livePageUrl: "https://music.yandex.ru/",
      fetchFromEmbed: async () =>
        "https://music.yandex.kz/album/8305394/track/56220214?utm_source=web",
    })
    expect(url).toBe("https://music.yandex.kz/album/8305394/track/56220214")
  })
})

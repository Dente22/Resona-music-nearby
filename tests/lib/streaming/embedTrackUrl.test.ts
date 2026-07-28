import { describe, it, expect } from "vitest"
import { pickBestEmbedImportUrl } from "@/lib/streaming/embedTrackUrl"

describe("embedTrackUrl", () => {
  it("accepts yandex.kz share links with utm params", () => {
    expect(
      pickBestEmbedImportUrl(
        "",
        "https://music.yandex.kz/album/8305394/track/56220214?utm_source=web&utm_medium=copy_link",
      ),
    ).toBe("https://music.yandex.kz/album/8305394/track/56220214")
  })

  it("accepts yandex album/track page URLs", () => {
    expect(
      pickBestEmbedImportUrl(
        "",
        "https://music.yandex.ru/album/123/track/456",
      ),
    ).toBe("https://music.yandex.ru/album/123/track/456")
  })

  it("prefers stored pageUrl over generic home page", () => {
    expect(
      pickBestEmbedImportUrl(
        "https://open.spotify.com/track/abc123",
        "https://open.spotify.com/",
      ),
    ).toBe("https://open.spotify.com/track/abc123")
  })

  it("uses live page when it contains track path", () => {
    expect(
      pickBestEmbedImportUrl(
        "",
        "https://music.yandex.ru/album/99/track/42?utm=foo",
      ),
    ).toBe("https://music.yandex.ru/album/99/track/42")
  })

  it("returns null when no track URL available", () => {
    expect(pickBestEmbedImportUrl("", "https://music.yandex.ru/")).toBeNull()
  })
})

describe("EMBED_TRACK_URL_SCRIPT", () => {
  it("searches player bar scopes before whole document", async () => {
    const { EMBED_TRACK_URL_SCRIPT } = await import("@/lib/streaming/embedTrackUrl")
    expect(EMBED_TRACK_URL_SCRIPT).toContain("yandexPlayerRoot")
    expect(EMBED_TRACK_URL_SCRIPT).toContain("SonataPlayer")
    expect(EMBED_TRACK_URL_SCRIPT).toContain("searchScopes")
  })
})

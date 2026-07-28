import { describe, it, expect } from "vitest"
import { parseStreamingUrl } from "@/lib/streaming/urlParser"

describe("parseStreamingUrl", () => {
  it("parses spotify album track URL", () => {
    const r = parseStreamingUrl("https://open.spotify.com/album/abc/track/6rqhFgbbKwnb9MLmUQDhG6")
    expect(r.provider).toBe("spotify")
    expect(r.type).toBe("track")
    expect(r.id).toBe("6rqhFgbbKwnb9MLmUQDhG6")
  })

  it("parses yandex.kz share link with utm params", () => {
    const r = parseStreamingUrl(
      "https://music.yandex.kz/album/8305394/track/56220214?utm_source=web&utm_medium=copy_link",
    )
    expect(r.provider).toBe("yandex")
    expect(r.type).toBe("track")
    expect(r.id).toBe("56220214")
    expect(r.url).toBe("https://music.yandex.kz/album/8305394/track/56220214")
  })

  it("parses yandex track URL on regional domain", () => {
    const r = parseStreamingUrl("https://music.yandex.by/album/123/track/456")
    expect(r.provider).toBe("yandex")
    expect(r.type).toBe("track")
    expect(r.id).toBe("456")
  })

  it("parses spotify track URL", () => {
    const r = parseStreamingUrl("https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6")
    expect(r.provider).toBe("spotify")
    expect(r.type).toBe("track")
    expect(r.id).toBe("6rqhFgbbKwnb9MLmUQDhG6")
  })

  it("parses spotify playlist URL", () => {
    const r = parseStreamingUrl("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M")
    expect(r.provider).toBe("spotify")
    expect(r.type).toBe("playlist")
    expect(r.id).toBe("37i9dQZF1DXcBWIGoYBM5M")
  })

  it("parses yandex track URL", () => {
    const r = parseStreamingUrl("https://music.yandex.ru/album/123/track/456")
    expect(r.provider).toBe("yandex")
    expect(r.type).toBe("track")
    expect(r.id).toBe("456")
  })

  it("parses yandex playlist URL", () => {
    const r = parseStreamingUrl("https://music.yandex.ru/users/user/playlists/1001")
    expect(r.provider).toBe("yandex")
    expect(r.type).toBe("playlist")
    expect(r.id).toBe("1001")
  })

  it("returns unknown for unsupported URL", () => {
    const r = parseStreamingUrl("https://example.com/foo")
    expect(r.provider).toBeNull()
    expect(r.type).toBe("unknown")
    expect(r.id).toBeNull()
  })
})

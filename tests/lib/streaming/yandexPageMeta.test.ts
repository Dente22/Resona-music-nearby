import { describe, it, expect } from "vitest"
import { parseYandexTrackPageMeta } from "@/lib/streaming/yandexPageMeta"

describe("parseYandexTrackPageMeta", () => {
  it("parses og tags from yandex track page html", () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Midnight City — M83" />
          <meta property="og:description" content="M83 · Hurry Up, We're Dreaming" />
          <meta property="og:image" content="https://avatars.yandex.net/get-music-content/abc/%%" />
          <script type="application/ld+json">{"@type":"MusicRecording","name":"Midnight City","duration":"PT4M3S"}</script>
        </head>
      </html>
    `
    const meta = parseYandexTrackPageMeta(html)
    expect(meta).toMatchObject({
      title: "Midnight City",
      artist: "M83",
      img: "https://avatars.yandex.net/get-music-content/abc/%%",
      durationSec: 243,
    })
  })

  it("returns null when og:title is missing", () => {
    expect(parseYandexTrackPageMeta("<html></html>")).toBeNull()
  })
})

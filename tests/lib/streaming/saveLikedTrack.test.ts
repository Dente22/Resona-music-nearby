import { describe, it, expect } from "vitest"
import { resolveEmbedTrackPageUrl } from "@/lib/streaming/saveLikedTrack"

const KZ_SHARE_URL =
  "https://music.yandex.kz/album/8305394/track/56220214?utm_source=web&utm_medium=copy_link"

describe("resolveEmbedTrackPageUrl", () => {
  it("resolves yandex.kz share links from stored pageUrl", async () => {
    const url = await resolveEmbedTrackPageUrl({
      embed: {
        provider: "yandex",
        title: "Song",
        artist: "Artist",
        album: "",
        img: "",
        isPlaying: true,
        duration: 200,
        progress: 10,
      },
      storedUrl: KZ_SHARE_URL,
      liveUrl: "https://music.yandex.ru/",
    })
    expect(url).toBe("https://music.yandex.kz/album/8305394/track/56220214")
  })
})

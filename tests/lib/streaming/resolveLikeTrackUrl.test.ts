import { describe, it, expect } from "vitest"
import { resolveLikeTrackUrl, resolveLikeTrackUrlAsync } from "@/lib/streaming/embedTrackUrl"
import type { Track } from "@/lib/types"

const delegated: Track = {
  id: "y1",
  title: "Song",
  artist: "Artist",
  album: "",
  duration: 200,
  downloaded: false,
  img: "",
  filePath: "",
  pageUrl: "https://music.yandex.kz/album/1/track/56220214?utm_source=web",
  externalId: "56220214",
  source: "yandex",
  addedAt: 1,
}

describe("resolveLikeTrackUrl", () => {
  it("prefers library pageUrl for embed-delegated tracks", () => {
    expect(
      resolveLikeTrackUrl({
        currentTrack: delegated,
        embed: {
          provider: "yandex",
          title: "Other",
          artist: "",
          album: "",
          img: "",
          isPlaying: true,
          duration: 100,
          progress: 0,
          pageUrl: "https://music.yandex.ru/track/999",
        },
        livePageUrl: "https://music.yandex.ru/",
      }),
    ).toBe("https://music.yandex.kz/album/1/track/56220214")
  })

  it("falls back to fetched embed track url", async () => {
    const url = await resolveLikeTrackUrlAsync({
      currentTrack: null,
      embed: {
        provider: "yandex",
        title: "Playing",
        artist: "",
        album: "",
        img: "",
        isPlaying: true,
        duration: 100,
        progress: 0,
        pageUrl: "",
      },
      livePageUrl: "https://music.yandex.ru/",
      fetchFromEmbed: async () => "https://music.yandex.ru/album/5/track/42",
    })
    expect(url).toBe("https://music.yandex.ru/album/5/track/42")
  })
})

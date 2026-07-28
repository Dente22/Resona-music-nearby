import { describe, it, expect } from "vitest"
import {
  buildYandexSearchUrl,
  resolveDelegatedTrackPlaybackTarget,
} from "@/lib/streaming/resolveDelegatedTrackPlaybackTarget"
import type { Track } from "@/lib/types"

const browseTrack: Track = {
  id: "y1",
  title: "Только по дури",
  artist: "Ежемесячные",
  album: "",
  duration: 135,
  downloaded: false,
  img: "",
  filePath: "",
  pageUrl: "",
  externalId: "browse-123",
  source: "yandex",
  addedAt: 1,
}

describe("resolveDelegatedTrackPlaybackTarget", () => {
  it("uses direct track url when available", () => {
    expect(
      resolveDelegatedTrackPlaybackTarget({
        ...browseTrack,
        externalId: "56220214",
        pageUrl: "",
      }),
    ).toEqual({
      mode: "track",
      url: "https://music.yandex.ru/track/56220214",
    })
  })

  it("falls back to yandex search for browse-only tracks", () => {
    const target = resolveDelegatedTrackPlaybackTarget(browseTrack)
    expect(target?.mode).toBe("search")
    expect(target?.url).toBe(buildYandexSearchUrl("Только по дури", "Ежемесячные"))
    if (target?.mode === "search") {
      expect(target.title).toBe("Только по дури")
      expect(target.artist).toBe("Ежемесячные")
    }
  })
})

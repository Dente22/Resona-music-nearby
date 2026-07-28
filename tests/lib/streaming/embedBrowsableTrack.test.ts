import { describe, it, expect } from "vitest"
import {
  buildBrowsableStreamingInput,
  findStreamingTrackByEmbed,
  stableBrowsableExternalId,
} from "@/lib/streaming/embedBrowsableTrack"
import type { Track } from "@/lib/types"

const embed = {
  provider: "yandex" as const,
  title: "Только по дури",
  artist: "Ежемесячные",
  album: "Возьми на релиз",
  img: "https://avatars.yandex.net/get-music-content/abc/50x50",
  isPlaying: true,
  duration: 135,
  progress: 30,
  pageUrl: "",
}

describe("stableBrowsableExternalId", () => {
  it("is stable for the same title and artist", () => {
    expect(stableBrowsableExternalId(embed)).toBe(stableBrowsableExternalId(embed))
  })
})

describe("buildBrowsableStreamingInput", () => {
  it("creates a storable track without page url", () => {
    const input = buildBrowsableStreamingInput(embed)
    expect(input.externalId).toMatch(/^browse-/)
    expect(input.title).toBe("Только по дури")
    expect(input.pageUrl).toBe("")
    expect(input.img).toContain("600x600")
  })
})

describe("findStreamingTrackByEmbed", () => {
  const saved: Track = {
    id: "y-browse-1",
    title: "Только по дури",
    artist: "Ежемесячные",
    album: "",
    duration: 135,
    downloaded: false,
    img: "",
    filePath: "",
    externalId: stableBrowsableExternalId(embed),
    source: "yandex",
    addedAt: 1,
  }

  it("finds track saved by browsable id", () => {
    expect(findStreamingTrackByEmbed([saved], embed)?.id).toBe("y-browse-1")
  })

  it("finds track by title and artist when id differs", () => {
    const other = { ...saved, id: "y-2", externalId: "999" }
    expect(findStreamingTrackByEmbed([other], embed)?.id).toBe("y-2")
  })
})

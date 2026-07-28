import { describe, it, expect } from "vitest"
import {
  normalizeSearchText,
  buildTrackSearchQuery,
  analyzeTrackIdentity,
  type RawTrackTags,
} from "@/lib/trackAnalyzer"

describe("trackAnalyzer", () => {
  it("normalizes search text", () => {
    expect(normalizeSearchText("  Hello   World  ")).toBe("hello world")
    expect(normalizeSearchText("AC/DC")).toBe("ac/dc")
  })

  it("builds search query from artist and title", () => {
    expect(buildTrackSearchQuery("Daft Punk", "One More Time")).toBe("Daft Punk One More Time")
    expect(buildTrackSearchQuery("", "Song")).toBe("Song")
    expect(buildTrackSearchQuery("Artist", "")).toBe("Artist")
  })

  it("prefers ID3 tags over filename when analyzing", () => {
    const tags: RawTrackTags = {
      title: "Tagged Title",
      artist: "Tagged Artist",
      album: "Tagged Album",
      duration: 240,
    }
    const identity = analyzeTrackIdentity({
      filePath: "C:\\Music\\Unknown - Random Name.mp3",
      tags,
    })
    expect(identity.title).toBe("Tagged Title")
    expect(identity.artist).toBe("Tagged Artist")
    expect(identity.album).toBe("Tagged Album")
    expect(identity.duration).toBe(240)
    expect(identity.searchQuery).toBe("Tagged Artist Tagged Title")
  })

  it("falls back to filename parsing when tags missing", () => {
    const identity = analyzeTrackIdentity({
      filePath: "C:\\Music\\Artist Name - Song Title.mp3",
    })
    expect(identity.artist).toBe("Artist Name")
    expect(identity.title).toBe("Song Title")
    expect(identity.searchQuery).toBe("Artist Name Song Title")
  })

  it("parses Yandex-style download filenames", () => {
    const identity = analyzeTrackIdentity({
      filePath:
        "C:\\Users\\Paaaapa\\Downloads\\2517_-_A_golova_chto_by_dumat_nogi_chtoby_khodit_62681671.mp3",
    })
    expect(identity.artist).toBe("2517")
    expect(identity.title).toMatch(/голова/i)
    expect(identity.searchQuery).toContain("2517")
  })
})

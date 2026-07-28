import { describe, it, expect } from "vitest"
import {
  buildRecordingSearchUrl,
  parseRecordingSearchResponse,
  pickBestRecordingMatch,
} from "@/lib/musicBrainzClient"

describe("musicBrainzClient", () => {
  it("builds recording search URL", () => {
    const url = buildRecordingSearchUrl("Daft Punk", "One More Time")
    expect(url).toContain("musicbrainz.org/ws/2/recording")
    expect(url).toContain("fmt=json")
    expect(url).toMatch(/One(\+|%20)More(\+|%20)Time/)
    expect(url).toMatch(/Daft(\+|%20)Punk/)
  })

  it("parses recording search response", () => {
    const parsed = parseRecordingSearchResponse({
      recordings: [
        {
          id: "rec-1",
          title: "One More Time",
          length: 320000,
          "artist-credit": [{ name: "Daft Punk" }],
          releases: [{ title: "Discovery", date: "2001" }],
        },
      ],
    })
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toMatchObject({
      id: "rec-1",
      title: "One More Time",
      artist: "Daft Punk",
      album: "Discovery",
      year: "2001",
      durationSec: 320,
    })
  })

  it("picks best match by normalized title and artist", () => {
    const candidates = parseRecordingSearchResponse({
      recordings: [
        {
          id: "a",
          title: "Other Song",
          "artist-credit": [{ name: "Someone" }],
        },
        {
          id: "b",
          title: "One More Time",
          "artist-credit": [{ name: "Daft Punk" }],
        },
      ],
    })
    const best = pickBestRecordingMatch(candidates, "Daft Punk", "One More Time")
    expect(best?.id).toBe("b")
  })
})

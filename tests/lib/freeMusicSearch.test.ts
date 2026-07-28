import { describe, it, expect } from "vitest"
import {
  buildJamendoSearchUrl,
  parseJamendoSearchResponse,
  rankFreeTracks,
} from "@/lib/freeMusicSearch"

describe("freeMusicSearch", () => {
  it("builds Jamendo search URL with client id", () => {
    const url = buildJamendoSearchUrl("ambient chill", "my-client-id")
    expect(url).toContain("api.jamendo.com/v3.0/tracks")
    expect(url).toContain("client_id=my-client-id")
    expect(url).toContain("ambient")
    expect(url).toContain("chill")
  })

  it("parses Jamendo search response", () => {
    const tracks = parseJamendoSearchResponse({
      results: [
        {
          id: "123",
          name: "Free Track",
          artist_name: "CC Artist",
          album_name: "Free Album",
          duration: 180,
          audio: "https://mp3d.jamendo.com/?track=123",
          image: "https://usercontent.jamendo.com/cover.jpg",
          license_ccurl: "https://creativecommons.org/licenses/by/3.0/",
        },
      ],
    })
    expect(tracks).toHaveLength(1)
    expect(tracks[0]).toMatchObject({
      source: "jamendo",
      id: "123",
      title: "Free Track",
      artist: "CC Artist",
      downloadUrl: "https://mp3d.jamendo.com/?track=123",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    })
  })

  it("ranks tracks by artist/title similarity", () => {
    const tracks = parseJamendoSearchResponse({
      results: [
        {
          id: "1",
          name: "Unrelated",
          artist_name: "Other",
          audio: "https://mp3d.jamendo.com/?track=1",
        },
        {
          id: "2",
          name: "Chill Beat",
          artist_name: "LoFi Guy",
          audio: "https://mp3d.jamendo.com/?track=2",
        },
      ],
    })
    const ranked = rankFreeTracks(tracks, "LoFi Guy", "Chill Beat")
    expect(ranked[0].id).toBe("2")
  })
})

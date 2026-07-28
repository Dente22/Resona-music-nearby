import { describe, it, expect } from "vitest"
import {
  buildJamendoAlbumTracksUrl,
  buildJamendoPlaylistTracksUrl,
  parseJamendoPlaylistTracksResponse,
} from "@/lib/playlistImport"

describe("playlistImport", () => {
  it("builds Jamendo album tracks API URL", () => {
    const url = buildJamendoAlbumTracksUrl("123", "client-abc")
    expect(url).toContain("albums/tracks")
    expect(url).toContain("id=123")
    expect(url).toContain("client_id=client-abc")
  })

  it("builds Jamendo playlist tracks API URL", () => {
    const url = buildJamendoPlaylistTracksUrl("456", "client-abc")
    expect(url).toContain("playlists/tracks")
    expect(url).toContain("id=456")
  })

  it("parses Jamendo playlist tracks response", () => {
    const tracks = parseJamendoPlaylistTracksResponse({
      results: [
        {
          id: 1,
          name: "Track One",
          artist_name: "Artist A",
          album_name: "Album X",
          duration: 200,
          audio: "https://mp3d.jamendo.com/?track=1",
          image: "https://usercontent.jamendo.com/cover.jpg",
          license_ccurl: "https://creativecommons.org/licenses/by/3.0/",
        },
        {
          id: 2,
          name: "Bad Track",
          artist_name: "Artist B",
          audio: "https://pirate.example.com/song.mp3",
        },
      ],
    })
    expect(tracks).toHaveLength(1)
    expect(tracks[0]).toMatchObject({
      title: "Track One",
      artist: "Artist A",
      downloadUrl: "https://mp3d.jamendo.com/?track=1",
    })
  })
})

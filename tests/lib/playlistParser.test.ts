import { describe, it, expect } from "vitest"
import {
  parsePlaylistUrl,
  parseM3uContent,
  filterAllowedPlaylistUrls,
  isBlockedPlaylistUrl,
} from "@/lib/playlistParser"

describe("playlistParser", () => {
  it("detects Jamendo album links", () => {
    const parsed = parsePlaylistUrl("https://www.jamendo.com/album/123456/chill-beats")
    expect(parsed.type).toBe("jamendo-album")
    expect(parsed.id).toBe("123456")
  })

  it("detects Jamendo playlist links", () => {
    const parsed = parsePlaylistUrl("https://www.jamendo.com/playlist/789/lofi")
    expect(parsed.type).toBe("jamendo-playlist")
    expect(parsed.id).toBe("789")
  })

  it("detects M3U playlist URLs", () => {
    const parsed = parsePlaylistUrl("https://example.com/music/playlist.m3u")
    expect(parsed.type).toBe("m3u-url")
    expect(parsed.url).toContain("playlist.m3u")
  })

  it("blocks Spotify and YouTube playlist links", () => {
    expect(parsePlaylistUrl("https://open.spotify.com/playlist/abc").type).toBe("blocked")
    expect(parsePlaylistUrl("https://www.youtube.com/playlist?list=abc").type).toBe("blocked")
    expect(isBlockedPlaylistUrl("https://open.spotify.com/playlist/abc")).toBe(true)
  })

  it("parses M3U content and keeps http entries", () => {
    const content = `#EXTM3U
#EXTINF:123,Artist - Song
https://mp3d.jamendo.com/?track=1
https://archive.org/download/album/track.mp3
https://evil.com/track.mp3
`
    const urls = parseM3uContent(content)
    expect(urls).toHaveLength(3)
    expect(filterAllowedPlaylistUrls(urls)).toEqual([
      "https://mp3d.jamendo.com/?track=1",
      "https://archive.org/download/album/track.mp3",
    ])
  })
})

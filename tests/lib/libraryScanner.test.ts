import { describe, it, expect } from "vitest"
import {
  isAudioFile,
  getDefaultMusicPaths,
  filterNewTracks,
  parseTrackMetaFromPath,
  AUDIO_EXTENSIONS,
} from "@/lib/libraryScanner"

describe("libraryScanner", () => {
  it("recognizes audio extensions", () => {
    expect(isAudioFile("song.mp3")).toBe(true)
    expect(isAudioFile("track.FLAC")).toBe(true)
    expect(isAudioFile("readme.txt")).toBe(false)
    expect(AUDIO_EXTENSIONS.has("opus")).toBe(true)
  })

  it("returns Windows music folders", () => {
    const paths = getDefaultMusicPaths("win32", "C:\\Users\\Me")
    expect(paths).toContain("C:\\Users\\Me\\Music")
    expect(paths).toContain("C:\\Users\\Me\\Downloads")
  })

  it("returns macOS music folders", () => {
    const paths = getDefaultMusicPaths("darwin", "/Users/me")
    expect(paths).toContain("/Users/me/Music")
    expect(paths).toContain("/Users/me/Downloads")
  })

  it("returns Linux music folders", () => {
    const paths = getDefaultMusicPaths("linux", "/home/me")
    expect(paths).toContain("/home/me/Music")
    expect(paths).toContain("/home/me/Downloads")
  })

  it("filters already imported tracks", () => {
    const files = ["/a/song.mp3", "/b/new.flac", "/c/old.wav"]
    const existing = new Set(["/c/old.wav"])
    expect(filterNewTracks(files, existing)).toEqual(["/a/song.mp3", "/b/new.flac"])
  })

  it("parses title from filename", () => {
    const meta = parseTrackMetaFromPath("C:\\Music\\Artist - Title.mp3")
    expect(meta.title).toBe("Title")
    expect(meta.artist).toBe("Artist")
    expect(meta.filePath).toBe("C:\\Music\\Artist - Title.mp3")
  })

  it("parses Yandex download filename", () => {
    const meta = parseTrackMetaFromPath(
      "C:\\Users\\Paaaapa\\Downloads\\2517_-_A_golova_chto_by_dumat_nogi_chtoby_khodit_62681671.mp3",
    )
    expect(meta.artist).toBe("2517")
    expect(meta.title).toMatch(/голова/i)
  })
})

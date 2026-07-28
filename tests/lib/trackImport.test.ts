import { describe, it, expect } from "vitest"
import {
  isPathInsideDir,
  shouldCopyToLibrary,
  buildLibraryDestPath,
  collectKnownSourcePaths,
} from "@/lib/trackImport"

describe("trackImport", () => {
  it("detects paths inside music library folder", () => {
    const musicDir = "C:\\Users\\Me\\AppData\\Roaming\\violetwave\\music"
    expect(isPathInsideDir(`${musicDir}\\song.mp3`, musicDir)).toBe(true)
    expect(isPathInsideDir("C:\\Users\\Me\\Downloads\\song.mp3", musicDir)).toBe(false)
  })

  it("requires copy for external paths", () => {
    const musicDir = "C:/Users/Me/AppData/violetwave/music"
    expect(shouldCopyToLibrary("C:/Users/Me/Downloads/a.mp3", musicDir)).toBe(true)
    expect(shouldCopyToLibrary(`${musicDir}/a.mp3`, musicDir)).toBe(false)
  })

  it("builds unique destination filename in library", () => {
    const dest = buildLibraryDestPath(
      "C:/lib/music",
      "C:/Users/Me/Downloads/song.mp3",
      1700000000000,
    )
    expect(dest.replace(/\\/g, "/")).toBe("C:/lib/music/1700000000000-song.mp3")
  })

  it("collects file and original paths for dedupe", () => {
    const paths = collectKnownSourcePaths([
      { filePath: "C:/lib/music/a.mp3", originalPath: "C:/Downloads/a.mp3" },
      { filePath: "C:/Downloads/b.mp3" },
    ])
    expect(paths).toContain("C:/lib/music/a.mp3")
    expect(paths).toContain("C:/Downloads/a.mp3")
    expect(paths).toContain("C:/Downloads/b.mp3")
  })
})

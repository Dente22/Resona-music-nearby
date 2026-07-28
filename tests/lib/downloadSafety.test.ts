import { describe, it, expect } from "vitest"
import { isAllowedDownloadUrl, ALLOWED_DOWNLOAD_HOSTS } from "@/lib/downloadSafety"

describe("downloadSafety", () => {
  it("allows Jamendo audio URLs", () => {
    expect(isAllowedDownloadUrl("https://mp3d.jamendo.com/?track=123")).toBe(true)
    expect(isAllowedDownloadUrl("https://storage.jamendo.com/download/track/abc.mp3")).toBe(true)
  })

  it("allows Internet Archive URLs", () => {
    expect(isAllowedDownloadUrl("https://archive.org/download/netlabel/album/track.mp3")).toBe(true)
  })

  it("blocks unknown hosts", () => {
    expect(isAllowedDownloadUrl("https://random-pirate-site.com/song.mp3")).toBe(false)
    expect(isAllowedDownloadUrl("https://youtube.com/watch?v=abc")).toBe(false)
  })

  it("blocks non-http protocols", () => {
    expect(isAllowedDownloadUrl("file:///C:/music/song.mp3")).toBe(false)
    expect(isAllowedDownloadUrl("javascript:alert(1)")).toBe(false)
  })

  it("exports allowed host list", () => {
    expect(ALLOWED_DOWNLOAD_HOSTS).toContain("jamendo.com")
    expect(ALLOWED_DOWNLOAD_HOSTS).toContain("archive.org")
  })
})

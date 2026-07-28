import { describe, it, expect } from "vitest"
import { toVioletwaveMediaUrl, parseVioletwaveMediaUrl } from "@/lib/audioUrl"

describe("audioUrl", () => {
  it("builds violetwave media URL from Windows path", () => {
    const url = toVioletwaveMediaUrl("C:\\Users\\Me\\music\\song.mp3")
    expect(url.startsWith("violetwave-media://local?path=")).toBe(true)
    expect(parseVioletwaveMediaUrl(url)).toBe("C:\\Users\\Me\\music\\song.mp3")
  })

  it("round-trips encoded paths", () => {
    const original = "C:\\Users\\Paaaapa\\AppData\\Roaming\\violetwave\\music\\track.mp3"
    const url = toVioletwaveMediaUrl(original)
    expect(parseVioletwaveMediaUrl(url)).toBe(original)
  })
})

import { describe, it, expect } from "vitest"
import { shouldMuteEmbedAudio, clampVolumePercent } from "../../src/lib/streaming/volumePercent"

describe("embed BrowserView volume", () => {
  it("maps slider zero to Chromium mute", () => {
    expect(shouldMuteEmbedAudio(0)).toBe(true)
    expect(shouldMuteEmbedAudio(clampVolumePercent(-3))).toBe(true)
    expect(shouldMuteEmbedAudio(1)).toBe(false)
    expect(shouldMuteEmbedAudio(72)).toBe(false)
  })
})

import { describe, it, expect } from "vitest"
import {
  EMBED_IS_PLAYING_SCRIPT,
  EMBED_READ_PROGRESS_SCRIPT,
  EMBED_START_TRACK_SCRIPT,
  getTrackPageSettleMs,
} from "@/lib/streaming/embedLoadPlay"

describe("EMBED_START_TRACK_SCRIPT", () => {
  it("delegates to runtime play and verifies media is actually playing", () => {
    expect(EMBED_START_TRACK_SCRIPT).toContain("__VW_EMBED__.play")
    expect(EMBED_START_TRACK_SCRIPT).toContain("__VW_EMBED__.isPlaying")
  })

  it("does not treat stale pause buttons as successful start", () => {
    expect(EMBED_START_TRACK_SCRIPT).not.toMatch(/if \(isPauseLabel\(label\)\) return true/)
  })
})

describe("EMBED_IS_PLAYING_SCRIPT", () => {
  it("checks runtime playback state", () => {
    expect(EMBED_IS_PLAYING_SCRIPT).toContain("__VW_EMBED__.isPlaying")
  })
})

describe("EMBED_READ_PROGRESS_SCRIPT", () => {
  it("reads runtime media progress", () => {
    expect(EMBED_READ_PROGRESS_SCRIPT).toContain("__VW_EMBED__.readProgress")
  })
})

describe("getTrackPageSettleMs", () => {
  it("waits longer on yandex track pages before pressing play", () => {
    expect(getTrackPageSettleMs("yandex")).toBeGreaterThan(getTrackPageSettleMs("spotify"))
  })
})

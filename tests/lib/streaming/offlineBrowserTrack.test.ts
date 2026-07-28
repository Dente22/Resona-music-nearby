import { describe, it, expect } from "vitest"
import {
  OFFLINE_BROWSER_TRACK_OPACITY,
  shouldDimOfflineBrowserTrack,
} from "@/lib/streaming/offlineBrowserTrack"

describe("shouldDimOfflineBrowserTrack", () => {
  it("dims yandex/spotify tracks when offline", () => {
    expect(
      shouldDimOfflineBrowserTrack({ source: "yandex", downloaded: false }, false),
    ).toBe(true)
    expect(
      shouldDimOfflineBrowserTrack({ source: "spotify", downloaded: false }, false),
    ).toBe(true)
  })

  it("keeps browser tracks full opacity when online", () => {
    expect(
      shouldDimOfflineBrowserTrack({ source: "yandex", downloaded: false }, true),
    ).toBe(false)
  })

  it("does not dim local tracks offline", () => {
    expect(
      shouldDimOfflineBrowserTrack({ source: "local", downloaded: true }, false),
    ).toBe(false)
  })

  it("exports a soft opacity for offline browser rows", () => {
    expect(OFFLINE_BROWSER_TRACK_OPACITY).toBeGreaterThan(0.3)
    expect(OFFLINE_BROWSER_TRACK_OPACITY).toBeLessThan(0.6)
  })
})

import { describe, it, expect } from "vitest"
import { resolvePlayButtonVisual } from "@/lib/playButtonVisual"
import {
  EMBED_SEARCH_FIND_MAX_ATTEMPTS,
  EMBED_SEARCH_FIND_RETRY_MS,
  EMBED_SEARCH_PAGE_SETTLE_MS,
  EMBED_START_MAX_ATTEMPTS,
  EMBED_START_RETRY_MS,
  EMBED_START_VERIFY_MS,
} from "@/lib/streaming/embedDelegatedPlayback"
import {
  EMBED_TRACK_PAGE_SETTLE_MS,
  EMBED_YANDEX_TRACK_PAGE_SETTLE_MS,
} from "@/lib/streaming/embedLoadPlay"

describe("resolvePlayButtonVisual", () => {
  it("shows loading while a browser track is starting", () => {
    expect(resolvePlayButtonVisual(false, true)).toBe("loading")
    expect(resolvePlayButtonVisual(true, true)).toBe("loading")
  })

  it("shows pause or play when not loading", () => {
    expect(resolvePlayButtonVisual(true, false)).toBe("pause")
    expect(resolvePlayButtonVisual(false, false)).toBe("play")
  })
})

describe("embed delegated start timings", () => {
  it("keeps settle/retry delays snappy for library → browser play", () => {
    expect(EMBED_SEARCH_PAGE_SETTLE_MS).toBeLessThanOrEqual(800)
    expect(EMBED_SEARCH_FIND_RETRY_MS).toBeLessThanOrEqual(450)
    expect(EMBED_SEARCH_FIND_MAX_ATTEMPTS).toBeLessThanOrEqual(3)
    expect(EMBED_YANDEX_TRACK_PAGE_SETTLE_MS).toBeLessThanOrEqual(1000)
    expect(EMBED_TRACK_PAGE_SETTLE_MS).toBeLessThanOrEqual(500)
    expect(EMBED_START_RETRY_MS).toBeLessThanOrEqual(400)
    expect(EMBED_START_VERIFY_MS).toBeLessThanOrEqual(200)
    expect(EMBED_START_MAX_ATTEMPTS).toBeLessThanOrEqual(5)
  })
})

import { describe, it, expect } from "vitest"
import { BOOT_SPLASH_MIN_MS, shouldShowBootSplash } from "@/lib/bootSplash"

describe("shouldShowBootSplash", () => {
  it("keeps splash visible until the minimum intro time passes", () => {
    expect(
      shouldShowBootSplash({ dataLoaded: true, elapsedMs: 200, minMs: BOOT_SPLASH_MIN_MS }),
    ).toBe(true)
  })

  it("hides splash after min time when data is ready", () => {
    expect(
      shouldShowBootSplash({
        dataLoaded: true,
        elapsedMs: BOOT_SPLASH_MIN_MS,
        minMs: BOOT_SPLASH_MIN_MS,
      }),
    ).toBe(false)
  })

  it("stays up after min time if data is still loading", () => {
    expect(
      shouldShowBootSplash({
        dataLoaded: false,
        elapsedMs: BOOT_SPLASH_MIN_MS + 500,
        minMs: BOOT_SPLASH_MIN_MS,
      }),
    ).toBe(true)
  })
})

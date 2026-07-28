import { describe, it, expect } from "vitest"
import { isElectronRenderer, shouldInstallBrowserFallback } from "@/lib/isElectron"

describe("isElectron", () => {
  it("detects electron renderer from user agent", () => {
    expect(
      isElectronRenderer("Mozilla/5.0 Electron/35.0.0 Chrome/130.0.0"),
    ).toBe(true)
    expect(
      isElectronRenderer("Mozilla/5.0 Chrome/130.0.0 Safari/537.36"),
    ).toBe(false)
  })

  it("does not install browser fallback when electron bridge exists", () => {
    expect(
      shouldInstallBrowserFallback({
        hasBridge: true,
        userAgent: "Mozilla/5.0 Chrome/130.0.0",
      }),
    ).toBe(false)
  })

  it("installs browser fallback only in plain browser dev", () => {
    expect(
      shouldInstallBrowserFallback({
        hasBridge: false,
        userAgent: "Mozilla/5.0 Chrome/130.0.0",
      }),
    ).toBe(true)
    expect(
      shouldInstallBrowserFallback({
        hasBridge: false,
        userAgent: "Mozilla/5.0 Electron/35.0.0",
      }),
    ).toBe(false)
  })
})

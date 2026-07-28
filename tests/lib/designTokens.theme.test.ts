import { describe, it, expect } from "vitest"
import { normalizeAppTheme } from "@/lib/designTokens"
import { loadSettings, updateSettings } from "@/lib/settingsStore"
import { DEFAULT_SETTINGS } from "@/lib/types"

describe("app theme", () => {
  it("defaults to light", () => {
    expect(DEFAULT_SETTINGS.theme).toBe("light")
    expect(loadSettings(null).theme).toBe("light")
  })

  it("normalizes invalid theme values to light", () => {
    expect(normalizeAppTheme("dark")).toBe("dark")
    expect(normalizeAppTheme("light")).toBe("light")
    expect(normalizeAppTheme("neon")).toBe("light")
    expect(normalizeAppTheme(undefined)).toBe("light")
  })

  it("loads stored dark theme", () => {
    const settings = loadSettings(JSON.stringify({ theme: "dark" }))
    expect(settings.theme).toBe("dark")
  })

  it("updates theme through settings store", () => {
    const next = updateSettings(DEFAULT_SETTINGS, { theme: "dark" })
    expect(next.theme).toBe("dark")
  })
})

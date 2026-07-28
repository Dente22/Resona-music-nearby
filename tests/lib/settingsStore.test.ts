import { describe, it, expect } from "vitest"
import {
  loadSettings,
  saveSettings,
  updateSettings,
  validateHotkey,
} from "@/lib/settingsStore"
import { DEFAULT_SETTINGS } from "@/lib/types"

describe("settingsStore", () => {
  it("returns defaults when storage is empty", () => {
    const settings = loadSettings(null)
    expect(settings).toEqual(DEFAULT_SETTINGS)
  })

  it("merges stored settings with defaults", () => {
    const stored = JSON.stringify({ volume: 50 })
    const settings = loadSettings(stored)
    expect(settings.volume).toBe(50)
    expect(settings.hotkey).toBe(DEFAULT_SETTINGS.hotkey)
  })

  it("saves settings as JSON", () => {
    const json = saveSettings({ ...DEFAULT_SETTINGS, volume: 30 })
    expect(JSON.parse(json).volume).toBe(30)
  })

  it("updates partial settings", () => {
    const next = updateSettings(DEFAULT_SETTINGS, { panelEdge: "left" })
    expect(next.panelEdge).toBe("left")
    expect(next.volume).toBe(DEFAULT_SETTINGS.volume)
  })

  it("validates hotkey format", () => {
    expect(validateHotkey("F9")).toBe(true)
    expect(validateHotkey("CommandOrControl+Alt+M")).toBe(true)
    expect(validateHotkey("")).toBe(false)
    expect(validateHotkey("invalid key combo")).toBe(false)
  })
})

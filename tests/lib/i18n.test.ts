import { describe, it, expect } from "vitest"
import {
  getTranslations,
  isAppLocale,
  getMoodLabel,
  formatTracksCount,
  formatPlaylistsCount,
} from "@/lib/i18n"

describe("i18n", () => {
  it("recognizes supported locales", () => {
    expect(isAppLocale("en")).toBe(true)
    expect(isAppLocale("ru")).toBe(true)
    expect(isAppLocale("de")).toBe(false)
  })

  it("returns English translations", () => {
    const t = getTranslations("en")
    expect(t.settings.title).toBe("Settings")
    expect(t.nav.library).toBe("Library")
    expect(t.settings.libraryFolder).toBe("Music library folder")
  })

  it("returns Russian translations", () => {
    const t = getTranslations("ru")
    expect(t.settings.title).toBe("Настройки")
    expect(t.nav.library).toBe("Библиотека")
    expect(t.settings.libraryFolder).toBe("Папка библиотеки")
  })

  it("localizes mood labels", () => {
    expect(getMoodLabel("sad", "en")).toBe("Sad")
    expect(getMoodLabel("sad", "ru")).toBe("Грустный")
    expect(getMoodLabel("unknown", "en")).toBe("Unknown")
  })

  it("formats track and playlist counts", () => {
    expect(formatTracksCount(1, "en")).toBe("1 track")
    expect(formatTracksCount(5, "en")).toBe("5 tracks")
    expect(formatTracksCount(1, "ru")).toBe("1 трек")
    expect(formatTracksCount(3, "ru")).toBe("3 трека")
    expect(formatPlaylistsCount(2, "ru")).toBe("2 плейлиста")
  })
})

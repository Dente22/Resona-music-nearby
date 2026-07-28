import { describe, it, expect } from "vitest"
import path from "path"
import {
  getDefaultMusicLibraryPath,
  resolveMusicLibraryPath,
} from "@/lib/libraryPaths"

describe("libraryPaths", () => {
  const userData = "C:/Users/Me/AppData/Roaming/Violetwave"

  it("returns default music folder under userData", () => {
    const dir = getDefaultMusicLibraryPath(userData)
    expect(dir.replace(/\\/g, "/")).toBe(`${userData}/music`)
  })

  it("uses custom path when set", () => {
    const custom = "D:/My Music/Violetwave"
    const dir = resolveMusicLibraryPath(custom, userData)
    expect(dir.replace(/\\/g, "/")).toBe(custom)
  })

  it("falls back to default when custom path is empty", () => {
    expect(resolveMusicLibraryPath("", userData).replace(/\\/g, "/")).toBe(`${userData}/music`)
    expect(resolveMusicLibraryPath("   ", userData).replace(/\\/g, "/")).toBe(`${userData}/music`)
    expect(resolveMusicLibraryPath(undefined, userData).replace(/\\/g, "/")).toBe(`${userData}/music`)
  })

  it("normalizes custom path separators", () => {
    const dir = resolveMusicLibraryPath("D:\\Music\\Violetwave", userData)
    expect(path.normalize(dir)).toBe(path.normalize("D:\\Music\\Violetwave"))
  })
})

import { describe, it, expect } from "vitest"
import path from "path"
import {
  APP_DATA_DIR_NAME,
  APP_UPLOADS_DIR_NAME,
  getAppDataFile,
  getAppDataJsonDir,
  getUploadsDir,
  resolveAppDataRoot,
  resolveMusicLibraryPath,
  getDefaultMusicLibraryPath,
} from "@/lib/appDataPaths"

describe("resolveAppDataRoot", () => {
  it("stores all runtime data under project userdata in development", () => {
    const root = resolveAppDataRoot({
      isPackaged: false,
      projectRoot: "D:/Project/music_Player",
      electronUserData: "C:/Users/Me/AppData/Roaming/Violetwave",
    })
    expect(root.replace(/\\/g, "/")).toBe("D:/Project/music_Player/userdata")
    expect(root).toContain(APP_DATA_DIR_NAME)
  })

  it("uses Electron userData when packaged (not frontend)", () => {
    const electronUserData = "C:/Users/Me/AppData/Roaming/Violetwave"
    const root = resolveAppDataRoot({
      isPackaged: true,
      projectRoot: "D:/Project/music_Player",
      electronUserData,
    })
    expect(root.replace(/\\/g, "/")).toBe(electronUserData.replace(/\\/g, "/"))
  })

  it("does not place data under src or frontend", () => {
    const root = resolveAppDataRoot({
      isPackaged: false,
      projectRoot: "D:/Project/music_Player",
      electronUserData: "C:/x",
    })
    expect(root).not.toMatch(/[/\\]src([/\\]|$)/)
    expect(root).not.toMatch(/[/\\]frontend([/\\]|$)/)
  })
})

describe("app data layout", () => {
  const root = "D:/Project/music_Player/userdata"

  it("keeps json state under userdata/data", () => {
    expect(getAppDataJsonDir(root).replace(/\\/g, "/")).toBe(`${root}/data`)
    expect(getAppDataFile(root, "library.json").replace(/\\/g, "/")).toBe(
      `${root}/data/library.json`,
    )
    expect(getAppDataFile(root, "embed-playback.json").replace(/\\/g, "/")).toBe(
      `${root}/data/embed-playback.json`,
    )
  })

  it("keeps music under userdata/music by default", () => {
    expect(getDefaultMusicLibraryPath(root).replace(/\\/g, "/")).toBe(`${root}/music`)
    expect(resolveMusicLibraryPath("", root).replace(/\\/g, "/")).toBe(`${root}/music`)
  })
})

describe("uploads folder", () => {
  it("points at a repo uploads directory outside userdata", () => {
    const dir = getUploadsDir("D:/Project/music_Player")
    expect(dir.replace(/\\/g, "/")).toBe("D:/Project/music_Player/uploads")
    expect(dir).toContain(APP_UPLOADS_DIR_NAME)
    expect(dir).not.toContain(APP_DATA_DIR_NAME)
  })
})

describe("path normalize", () => {
  it("normalizes custom music path", () => {
    const dir = resolveMusicLibraryPath("D:\\Music\\Violetwave", "D:/userdata")
    expect(path.normalize(dir)).toBe(path.normalize("D:\\Music\\Violetwave"))
  })
})

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"
import {
  listAppIconCandidates,
  resolveAppIconPath,
  preferWindowsIco,
} from "../../electron/appIcon"

const root = path.resolve(process.cwd())

describe("appIcon", () => {
  it("prefers .ico before .png on Windows", () => {
    expect(preferWindowsIco("win32")).toEqual(["icon.ico", "icon.png"])
    expect(preferWindowsIco("darwin")).toEqual(["icon.png", "icon.ico"])
    expect(preferWindowsIco("linux")).toEqual(["icon.png", "icon.ico"])
  })

  it("lists packaged and project icon locations", () => {
    const candidates = listAppIconCandidates({
      platform: "win32",
      appPath: path.join(root, "app-asar"),
      resourcesPath: path.join(root, "resources"),
      cwd: root,
    })
    expect(candidates[0]).toMatch(/icon\.ico$/)
    expect(candidates.some(p => p.includes(path.join("build", "icon.ico")))).toBe(true)
    expect(candidates.some(p => p.includes(path.join("resources", "icons")))).toBe(true)
  })

  it("resolves an existing build icon from the project", () => {
    const ico = path.join(root, "build", "icon.ico")
    const png = path.join(root, "build", "icon.png")
    expect(fs.existsSync(ico) || fs.existsSync(png)).toBe(true)

    const resolved = resolveAppIconPath({
      platform: "win32",
      appPath: root,
      resourcesPath: path.join(root, "missing-resources"),
      cwd: root,
    })
    expect(resolved).not.toBeNull()
    expect(fs.existsSync(resolved!)).toBe(true)
    if (fs.existsSync(ico)) {
      expect(resolved).toBe(ico)
    }
  })
})

describe("electron-builder icon packaging", () => {
  it("embeds Windows icon into the executable", () => {
    const config = JSON.parse(
      fs.readFileSync(path.join(root, "electron-builder.json"), "utf8"),
    ) as {
      icon?: string
      files?: string[]
      asarUnpack?: string[]
      extraResources?: Array<{ from: string; to: string }>
      win?: { icon?: string; signAndEditExecutable?: boolean; executableName?: string }
      nsis?: {
        installerIcon?: string
        uninstallerIcon?: string
        installerHeaderIcon?: string
        shortcutName?: string
      }
    }

    expect(config.win?.signAndEditExecutable).not.toBe(false)
    expect(config.win?.icon).toMatch(/icon\.ico$/)
    expect(config.win?.executableName).toBe("Resona")
    expect(config.nsis?.installerIcon).toMatch(/icon\.ico$/)
    expect(config.nsis?.uninstallerIcon).toMatch(/icon\.ico$/)
    expect(config.nsis?.installerHeaderIcon).toMatch(/icon\.ico$/)
    expect(config.nsis?.shortcutName).toBe("Resona")
    expect(config.extraResources?.some(r => r.from.includes("icon.ico"))).toBe(true)
    expect(config.asarUnpack?.some(p => p.includes("icon."))).toBe(true)
  })
})

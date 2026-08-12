import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

describe("win-app-volume helper binary", () => {
  it("is built for Windows packaging", () => {
    const exe = path.join(process.cwd(), "electron", "bin", "win-app-volume.exe")
    expect(fs.existsSync(exe)).toBe(true)
    expect(fs.statSync(exe).size).toBeGreaterThan(4_000)
  })
})

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"
import { execFileSync } from "child_process"

const root = process.cwd()

describe("generate-icons", () => {
  it("writes Windows .ico and public favicon from the Resona source", () => {
    execFileSync(process.execPath, [path.join(root, "scripts", "generate-icons.mjs")], {
      cwd: root,
      stdio: "pipe",
    })

    const required = [
      path.join(root, "build", "icon.png"),
      path.join(root, "build", "icon.ico"),
      path.join(root, "public", "icon.png"),
      path.join(root, "public", "favicon.ico"),
    ]
    for (const file of required) {
      expect(fs.existsSync(file), file).toBe(true)
      expect(fs.statSync(file).size).toBeGreaterThan(1000)
    }

    // ICO magic: starts with reserved 0, type 1 (icon)
    const ico = fs.readFileSync(path.join(root, "build", "icon.ico"))
    expect(ico[0]).toBe(0)
    expect(ico[1]).toBe(0)
    expect(ico[2]).toBe(1)
    expect(ico[3]).toBe(0)
  })
})

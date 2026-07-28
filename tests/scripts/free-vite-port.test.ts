import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const SCRIPT = path.join(process.cwd(), "scripts", "free-vite-port.mjs")
const PACKAGE = path.join(process.cwd(), "package.json")

describe("free-vite-port", () => {
  it("exists as a node script", () => {
    expect(fs.existsSync(SCRIPT)).toBe(true)
    const src = fs.readFileSync(SCRIPT, "utf-8")
    expect(src).toContain("netstat")
    expect(src).toContain("taskkill")
    expect(src).toContain("5173")
  })

  it("runs before electron:dev", () => {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE, "utf-8"))
    expect(pkg.scripts["free:port"]).toMatch(/free-vite-port/)
    expect(pkg.scripts["electron:dev"]).toMatch(/free:port/)
  })
})

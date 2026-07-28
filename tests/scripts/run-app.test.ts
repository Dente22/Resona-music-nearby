import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const BAT_PATH = path.join(process.cwd(), "run-app.bat")

function readBat(): string {
  return fs.readFileSync(BAT_PATH, "utf-8")
}

describe("run-app.bat", () => {
  it("exists at project root", () => {
    expect(fs.existsSync(BAT_PATH)).toBe(true)
  })

  it("changes to script directory before running npm", () => {
    expect(readBat()).toMatch(/cd \/d "%~dp0"/i)
  })

  it("launches the electron dev app", () => {
    expect(readBat()).toMatch(/npm run electron:dev/)
  })

  it("installs dependencies when node_modules is missing", () => {
    expect(readBat()).toMatch(/npm install/)
  })

  it("keeps the window open after the app closes", () => {
    expect(readBat()).toMatch(/pause/i)
  })
})

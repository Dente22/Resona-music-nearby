import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"
import { execSync } from "child_process"

const BAT_PATH = path.join(process.cwd(), "run-tests.bat")

function readBat(): string {
  return fs.readFileSync(BAT_PATH, "utf-8")
}

describe("run-tests.bat", () => {
  it("exists at project root", () => {
    expect(fs.existsSync(BAT_PATH)).toBe(true)
  })

  it("changes to script directory before running npm", () => {
    expect(readBat()).toMatch(/cd \/d "%~dp0"/i)
  })

  it("runs unit tests by default", () => {
    expect(readBat()).toMatch(/npm test/)
  })

  it("supports coverage mode", () => {
    expect(readBat()).toMatch(/npm run test:coverage/)
  })

  it("supports e2e mode", () => {
    expect(readBat()).toMatch(/npm run test:e2e/)
  })

  it("supports all mode with unit and e2e", () => {
    const content = readBat()
    expect(content).toMatch(/:all/i)
    expect(content).toMatch(/npm test/)
    expect(content).toMatch(/npm run test:e2e/)
  })

  it("propagates exit codes", () => {
    expect(readBat()).toMatch(/exit \/b %ERR%/i)
  })

  it("pauses on finish so double-click users can read output", () => {
    expect(readBat()).toMatch(/pause/i)
  })

  it("supports --no-pause for scripted runs", () => {
    expect(readBat()).toMatch(/--no-pause/i)
  })

  it("rejects unknown mode with non-zero exit", () => {
    const content = readBat()
    expect(content).toMatch(/Unknown test mode/i)

    try {
      execSync(`cmd /c "${BAT_PATH}" --no-pause invalid-mode`, { stdio: "pipe" })
      expect.fail("expected non-zero exit for unknown mode")
    } catch (error) {
      const execError = error as { status?: number }
      expect(execError.status).toBeGreaterThan(0)
    }
  })
})

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

describe("repo data layout", () => {
  it("gitignores userdata so runtime data is never committed", () => {
    const gitignore = fs.readFileSync(path.join(process.cwd(), ".gitignore"), "utf-8")
    expect(gitignore).toMatch(/userdata\//)
    expect(gitignore).toMatch(/node_modules/)
    expect(gitignore).toMatch(/dist\//)
  })

  it("keeps an uploads folder for repository files", () => {
    const uploads = path.join(process.cwd(), "uploads")
    expect(fs.existsSync(uploads)).toBe(true)
    expect(fs.existsSync(path.join(uploads, "README.md"))).toBe(true)
  })
})

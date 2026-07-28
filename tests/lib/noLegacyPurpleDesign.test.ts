import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const OLD_PURPLE = [
  "#8B5CF6",
  "#7C3AED",
  "#A78BFA",
  "accent-violet",
  "rgba(139,92,246",
]

function collectSourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectSourceFiles(full))
    else if (/\.(tsx?|css)$/.test(entry.name)) out.push(full)
  }
  return out
}

describe("Resona design — no VioletWave purple leftovers in src", () => {
  it("does not use the old purple accent palette in active UI code", () => {
    const root = path.join(process.cwd(), "src")
    const offenders: string[] = []
    for (const file of collectSourceFiles(root)) {
      const text = fs.readFileSync(file, "utf8")
      for (const needle of OLD_PURPLE) {
        if (text.includes(needle)) {
          offenders.push(`${path.relative(process.cwd(), file)} → ${needle}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it("does not keep the legacy frontend/ or design backup trees", () => {
    expect(fs.existsSync(path.join(process.cwd(), "frontend"))).toBe(false)
    expect(fs.existsSync(path.join(process.cwd(), "backups"))).toBe(false)
  })
})

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const ELECTRON_LIB_SOURCES = [
  "src/lib/libraryScanner.ts",
  "src/lib/trackAnalyzer.ts",
  "src/lib/musicBrainzClient.ts",
  "src/lib/freeMusicSearch.ts",
  "src/lib/trackDiscovery.ts",
  "src/lib/downloadSafety.ts",
  "src/lib/playlistParser.ts",
  "src/lib/playlistImport.ts",
  "src/lib/filenameParser.ts",
  "src/lib/i18n/index.ts",
  "src/lib/moodAnalyzer.ts",
]

function collectTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...collectTsFiles(full))
    else if (entry.name.endsWith(".ts")) files.push(full)
  }
  return files
}

function relativeImportNeedsJs(line: string): boolean {
  if (!line.includes('from "./') && !line.includes('from "../')) return false
  if (/^\s*import\s+type\s/.test(line.trim())) return false
  if (/^\s*export\s+type\s/.test(line.trim())) return false
  const match = line.match(/from "(\.[^"]+)"/)
  if (!match) return false
  return !match[1].endsWith(".js")
}

function findBadRelativeImports(content: string): string[] {
  return content
    .split("\n")
    .filter(relativeImportNeedsJs)
    .map(line => line.trim())
}

describe("electron module resolution", () => {
  it("uses .js extensions in relative imports for Node ESM", () => {
    for (const rel of ELECTRON_LIB_SOURCES) {
      const filePath = path.join(process.cwd(), rel)
      const bad = findBadRelativeImports(fs.readFileSync(filePath, "utf-8"))
      expect(bad, rel).toEqual([])
    }
  })

  it("uses .js extensions in streaming lib compiled for Electron main", () => {
    const streamingDir = path.join(process.cwd(), "src/lib/streaming")
    for (const filePath of collectTsFiles(streamingDir)) {
      const rel = path.relative(process.cwd(), filePath)
      const bad = findBadRelativeImports(fs.readFileSync(filePath, "utf-8"))
      expect(bad, rel).toEqual([])
    }
  })
})

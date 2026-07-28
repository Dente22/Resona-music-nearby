import fs from "fs"
import path from "path"
import os from "os"
import {
  getDefaultMusicPaths,
  isAudioFile,
  filterNewTracks,
  parseTrackMetaFromPath,
  type Platform,
  type ScannedTrackMeta,
} from "../src/lib/libraryScanner.js"

const MAX_DEPTH = 4
const MAX_FILES = 5000

function walkDir(dir: string, depth = 0, results: string[] = []): string[] {
  if (depth > MAX_DEPTH || results.length >= MAX_FILES) return results
  if (!fs.existsSync(dir)) return results

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return results
  }

  for (const entry of entries) {
    if (results.length >= MAX_FILES) break
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
        walkDir(full, depth + 1, results)
      }
    } else if (entry.isFile() && isAudioFile(entry.name)) {
      results.push(full)
    }
  }
  return results
}

export function scanMusicFolders(
  homeDir: string,
  platform: Platform,
  existingPaths: string[],
  customDirs: string[] = [],
): ScannedTrackMeta[] {
  const dirs = [...new Set([...getDefaultMusicPaths(platform, homeDir), ...customDirs])]
  const allFiles: string[] = []

  for (const dir of dirs) {
    walkDir(dir, 0, allFiles)
  }

  const unique = [...new Set(allFiles)]
  const fresh = filterNewTracks(unique, new Set(existingPaths))

  return fresh.map(parseTrackMetaFromPath)
}

export function getHomeAndPlatform() {
  return {
    homeDir: os.homedir(),
    platform: process.platform as Platform,
  }
}

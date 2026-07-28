import fs from "fs"
import path from "path"
import {
  buildLibraryDestPath,
  isPathInsideDir,
  shouldCopyToLibrary,
} from "../src/lib/trackImport.js"

export function copyTrackIntoLibrary(
  sourcePath: string,
  musicDir: string,
  timestamp = Date.now(),
): string {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`)
  }

  if (isPathInsideDir(sourcePath, musicDir)) {
    return sourcePath
  }

  fs.mkdirSync(musicDir, { recursive: true })
  const dest = buildLibraryDestPath(musicDir, sourcePath, timestamp)
  fs.copyFileSync(sourcePath, dest)
  return dest
}

export function ensureTrackStoredInLibrary(
  filePath: string,
  musicDir: string,
  originalPath?: string,
): { filePath: string; originalPath: string } {
  const source = originalPath ?? filePath
  if (!shouldCopyToLibrary(filePath, musicDir)) {
    return { filePath, originalPath: source }
  }

  const dest = copyTrackIntoLibrary(filePath, musicDir)
  return { filePath: dest, originalPath: source }
}

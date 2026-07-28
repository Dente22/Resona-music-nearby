import path from "path"

export interface TrackPathRef {
  filePath: string
  originalPath?: string
}

export function normalizePath(p: string): string {
  return path.normalize(p).replace(/\\/g, "/").toLowerCase()
}

export function isPathInsideDir(filePath: string, dirPath: string): boolean {
  const file = normalizePath(path.resolve(filePath))
  const dir = normalizePath(path.resolve(dirPath))
  return file === dir || file.startsWith(`${dir}/`)
}

export function shouldCopyToLibrary(filePath: string, musicDir: string): boolean {
  if (!filePath.trim()) return false
  return !isPathInsideDir(filePath, musicDir)
}

export function buildLibraryDestPath(
  musicDir: string,
  sourcePath: string,
  timestamp = Date.now(),
): string {
  const fileName = path.basename(sourcePath)
  return path.join(musicDir, `${timestamp}-${fileName}`)
}

export function collectKnownSourcePaths(tracks: TrackPathRef[]): string[] {
  const paths = new Set<string>()
  for (const track of tracks) {
    if (track.filePath) paths.add(track.filePath)
    if (track.originalPath) paths.add(track.originalPath)
  }
  return [...paths]
}

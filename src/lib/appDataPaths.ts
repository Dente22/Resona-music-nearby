import path from "path"

export const APP_DATA_DIR_NAME = "userdata"
export const APP_DATA_JSON_DIR = "data"
export const APP_DATA_MUSIC_DIR = "music"
export const APP_DATA_COVERS_DIR = "covers"
export const APP_UPLOADS_DIR_NAME = "uploads"

export interface AppDataRootInput {
  /** True when running a packaged Electron build. */
  isPackaged: boolean
  /** Absolute project root (dev / electron:dev). */
  projectRoot: string
  /** Electron `app.getPath("userData")` for packaged installs. */
  electronUserData: string
}

/**
 * Runtime user data lives outside `src/` / frontend.
 * Dev: `<project>/userdata` (gitignored, not copied into the repo).
 * Packaged: Electron userData (AppData), same layout.
 * Never migrates or copies data between roots.
 */
export function resolveAppDataRoot(input: AppDataRootInput): string {
  if (!input.isPackaged) {
    return path.join(input.projectRoot, APP_DATA_DIR_NAME)
  }
  return input.electronUserData
}

export function getAppDataJsonDir(appDataRoot: string): string {
  return path.join(appDataRoot, APP_DATA_JSON_DIR)
}

export function getAppDataCoversDir(appDataRoot: string): string {
  return path.join(appDataRoot, APP_DATA_COVERS_DIR)
}

export function getAppDataLogFile(appDataRoot: string): string {
  return path.join(appDataRoot, "app.log")
}

export function getDefaultMusicLibraryPath(userDataPath: string): string {
  return path.join(userDataPath, APP_DATA_MUSIC_DIR)
}

export function resolveMusicLibraryPath(
  customPath: string | undefined | null,
  userDataPath: string,
): string {
  const trimmed = customPath?.trim()
  if (trimmed) return path.normalize(trimmed)
  return getDefaultMusicLibraryPath(userDataPath)
}

export function getAppDataFile(
  appDataRoot: string,
  name:
    | "library.json"
    | "playlists.json"
    | "streaming-library.json"
    | "settings.json"
    | "streaming-auth.json"
    | "embed-playback.json",
): string {
  return path.join(getAppDataJsonDir(appDataRoot), name)
}

/** Folder for assets intended to be committed to the git repository. */
export function getUploadsDir(projectRoot: string): string {
  return path.join(projectRoot, APP_UPLOADS_DIR_NAME)
}

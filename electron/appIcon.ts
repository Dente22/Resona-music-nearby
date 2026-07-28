import fs from "fs"
import path from "path"

export type AppIconLookup = {
  platform: NodeJS.Platform
  appPath: string
  resourcesPath: string
  cwd: string
}

/** Windows shell/tray look best with multi-size .ico; other platforms prefer PNG. */
export function preferWindowsIco(platform: NodeJS.Platform): string[] {
  return platform === "win32" ? ["icon.ico", "icon.png"] : ["icon.png", "icon.ico"]
}

/**
 * Candidate paths for the branded app icon (window, tray, notifications).
 * Packaged builds also ship copies under resources/icons via electron-builder.
 */
export function listAppIconCandidates(lookup: AppIconLookup): string[] {
  const names = preferWindowsIco(lookup.platform)
  const roots = [
    path.join(lookup.appPath, "build"),
    path.join(lookup.resourcesPath, "icons"),
    path.join(lookup.resourcesPath, "build"),
    path.join(lookup.cwd, "build"),
  ]
  const candidates: string[] = []
  for (const name of names) {
    for (const root of roots) {
      candidates.push(path.join(root, name))
    }
  }
  return candidates
}

export function resolveAppIconPath(lookup: AppIconLookup): string | null {
  return listAppIconCandidates(lookup).find(p => fs.existsSync(p)) ?? null
}

/** Fallback when no packaged icon file is present (dev / broken install). */
export function createResonaFallbackIconSvg(size = 256): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="48" fill="#142B2F"/>
  <path d="M136 64c34 17 56 50 56 64s-22 47-56 64" stroke="#FF5C3A" stroke-width="14" stroke-linecap="round" fill="none"/>
  <path d="M160 40c45 22 74 63 74 88s-29 66-74 88" stroke="#2A9D8F" stroke-width="11" stroke-linecap="round" fill="none" opacity="0.85"/>
  <path d="M184 20c54 27 90 75 90 108s-36 81-90 108" stroke="#3DB8A8" stroke-width="9" stroke-linecap="round" fill="none" opacity="0.55"/>
  <path d="M56 74v108l86-54-86-54z" fill="#FF5C3A"/>
</svg>`
}

import { clampVolumePercent } from "./volumePercent.js"

/** Convert UI percent to Windows mixer scalar (0–1). */
export function volumePercentToMixerScalar(percent: number): number {
  return clampVolumePercent(percent) / 100
}

/**
 * Process names that may own Resona audio sessions.
 * Prefer the real executable; keep "electron" only for unpackaged `electron .` dev runs.
 */
export function listResonaAudioProcessNames(executableName?: string): string[] {
  const names = new Set<string>(["Resona"])
  const base = executableName?.replace(/\.exe$/i, "").trim()
  if (base) names.add(base)
  // Dev: `electron .` — do NOT match every Electron app on the machine when we have a PID.
  if (base && /^electron$/i.test(base)) names.add("electron")
  return [...names]
}

export function buildWinAppVolumeSetNameArgs(
  percent: number,
  processNames: string[],
): string[] {
  const pct = clampVolumePercent(percent)
  return ["set-name", String(pct), ...processNames]
}

/** Prefer PID targeting so we never touch other Electron apps (Cursor, VS Code, …). */
export function buildWinAppVolumeSetPidArgs(percent: number, pids: number[]): string[] {
  const pct = clampVolumePercent(percent)
  const clean = [...new Set(pids.filter(p => Number.isInteger(p) && p > 0))]
  return ["set", String(pct), ...clean.map(String)]
}

/** Parse `ok touched=N percent=…` from win-app-volume.exe stdout. */
export function parseWinAppVolumeTouched(stdout: string | undefined): number {
  if (!stdout) return 0
  const match = /\btouched\s*=\s*(\d+)\b/i.exec(stdout)
  if (!match) return 0
  const n = Number(match[1])
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

/**
 * Local HTMLAudioElement should stay at full scale when OS mixer owns gain,
 * otherwise volumes multiply (UI% × mixer%).
 */
export function localMediaVolumeWhenUsingSystemMixer(): number {
  return 1
}

/**
 * When Windows mixer owns gain, leave Spotify/Yandex page volume alone.
 * Injecting setVolumeUi / gain hooks into the embed breaks now-playing DOM.
 */
export function shouldDriveEmbedPageVolume(systemMixerActive: boolean): boolean {
  return !systemMixerActive
}

/**
 * Use media/AudioContext gain only (no setVolumeUi) when mixer found no sessions yet.
 * Avoids double attenuation once mixer starts touching sessions.
 */
export function shouldApplyEmbedGainFallback(
  systemMixerSupported: boolean,
  mixerTouchedSessions: number,
): boolean {
  return systemMixerSupported && mixerTouchedSessions <= 0
}

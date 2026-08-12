import { clampVolumePercent } from "./volumePercent.js"

/** Convert UI percent to Windows mixer scalar (0–1). */
export function volumePercentToMixerScalar(percent: number): number {
  return clampVolumePercent(percent) / 100
}

/** Process names that may own Resona / Electron audio sessions. */
export function listResonaAudioProcessNames(executableName?: string): string[] {
  const names = new Set<string>(["Resona", "electron"])
  if (executableName?.trim()) {
    const base = executableName.replace(/\.exe$/i, "").trim()
    if (base) names.add(base)
  }
  return [...names]
}

export function buildWinAppVolumeSetNameArgs(
  percent: number,
  processNames: string[],
): string[] {
  const pct = clampVolumePercent(percent)
  return ["set-name", String(pct), ...processNames]
}

/**
 * Local HTMLAudioElement should stay at full scale when OS mixer owns gain,
 * otherwise volumes multiply (UI% × mixer%).
 */
export function localMediaVolumeWhenUsingSystemMixer(): number {
  return 1
}

/** Clamp UI volume (0–100) for settings + embed scripts. */
export function clampVolumePercent(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

/** Convert UI percent to HTMLMediaElement.volume (0–1). */
export function volumePercentToMediaLevel(percent: number): number {
  return clampVolumePercent(percent) / 100
}

/** Chromium BrowserView mute — only when the user effectively silenced output. */
export function shouldMuteEmbedAudio(percent: unknown): boolean {
  return clampVolumePercent(percent) <= 0
}

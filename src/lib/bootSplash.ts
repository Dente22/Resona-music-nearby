/** Minimum time the launch splash stays visible so intro motion can play. */
export const BOOT_SPLASH_MIN_MS = 1800

export function shouldShowBootSplash(input: {
  dataLoaded: boolean
  elapsedMs: number
  minMs?: number
}): boolean {
  const minMs = input.minMs ?? BOOT_SPLASH_MIN_MS
  if (input.elapsedMs < minMs) return true
  return !input.dataLoaded
}

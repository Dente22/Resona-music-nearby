/**
 * OS application mixer volume (Windows WASAPI / Linux PipeWire+Pulse).
 * Keeps a single API for main.ts regardless of platform.
 */
import {
  getDesiredWindowsAppVolume,
  isWindowsAppVolumeSupported,
  resolveWinAppVolumeExe,
  setWindowsAppVolume,
  startWindowsAppVolumeWatchdog,
  stopWindowsAppVolumeWatchdog,
  type WindowsAppVolumeResult,
} from "./windowsAppVolume.js"
import {
  getDesiredLinuxAppVolume,
  isLinuxAppVolumeSupported,
  setLinuxAppVolume,
  startLinuxAppVolumeWatchdog,
  stopLinuxAppVolumeWatchdog,
  type LinuxAppVolumeResult,
} from "./linuxAppVolume.js"

export type SystemAppVolumeResult = WindowsAppVolumeResult | LinuxAppVolumeResult

export function isSystemAppVolumeSupported(): boolean {
  if (isWindowsAppVolumeSupported()) return Boolean(resolveWinAppVolumeExe())
  if (isLinuxAppVolumeSupported()) return true
  return false
}

export async function setSystemAppVolume(
  percent: number,
  options?: { force?: boolean },
): Promise<SystemAppVolumeResult> {
  if (isWindowsAppVolumeSupported()) {
    return setWindowsAppVolume(percent, options)
  }
  if (isLinuxAppVolumeSupported()) {
    return setLinuxAppVolume(percent, options)
  }
  return { ok: false, percent, supported: false, touched: 0 }
}

export function getDesiredSystemAppVolume(): number {
  if (isWindowsAppVolumeSupported()) return getDesiredWindowsAppVolume()
  if (isLinuxAppVolumeSupported()) return getDesiredLinuxAppVolume()
  return 72
}

export function startSystemAppVolumeWatchdog(
  getPercent: () => number = () => getDesiredSystemAppVolume(),
  onResult?: (result: SystemAppVolumeResult) => void,
): void {
  if (isWindowsAppVolumeSupported()) {
    startWindowsAppVolumeWatchdog(getPercent, onResult)
    return
  }
  if (isLinuxAppVolumeSupported()) {
    startLinuxAppVolumeWatchdog(getPercent, onResult)
  }
}

export function stopSystemAppVolumeWatchdog(): void {
  stopWindowsAppVolumeWatchdog()
  stopLinuxAppVolumeWatchdog()
}

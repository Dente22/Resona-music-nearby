import fs from "fs"
import path from "path"
import { spawn } from "child_process"
import { app } from "electron"
import {
  buildWinAppVolumeSetNameArgs,
  listResonaAudioProcessNames,
} from "../src/lib/streaming/windowsMixerVolume.js"
import { clampVolumePercent } from "../src/lib/streaming/volumePercent.js"

const WATCH_MS = 2000

export type WindowsAppVolumeResult = {
  ok: boolean
  percent: number
  supported: boolean
  stdout?: string
  error?: string
}

let desiredPercent = 72
let watchTimer: ReturnType<typeof setInterval> | null = null
let inFlight: Promise<WindowsAppVolumeResult> | null = null
let queued: number | null = null

export function isWindowsAppVolumeSupported(): boolean {
  return process.platform === "win32"
}

export function resolveWinAppVolumeExe(): string | null {
  if (!isWindowsAppVolumeSupported()) return null
  const candidates = [
    path.join(process.resourcesPath, "bin", "win-app-volume.exe"),
    path.join(app.getAppPath(), "electron", "bin", "win-app-volume.exe"),
    path.join(process.cwd(), "electron", "bin", "win-app-volume.exe"),
  ]
  return candidates.find(p => fs.existsSync(p)) ?? null
}

function processNamesForApp(): string[] {
  const exe = path.basename(process.execPath || "Resona.exe")
  return listResonaAudioProcessNames(exe)
}

function runHelper(percent: number): Promise<WindowsAppVolumeResult> {
  const exe = resolveWinAppVolumeExe()
  const pct = clampVolumePercent(percent)
  if (!exe) {
    return Promise.resolve({
      ok: false,
      percent: pct,
      supported: false,
      error: "helper_missing",
    })
  }

  const args = buildWinAppVolumeSetNameArgs(pct, processNamesForApp())
  return new Promise(resolve => {
    const child = spawn(exe, args, { windowsHide: true })
    let stdout = ""
    let stderr = ""
    child.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString("utf8")
    })
    child.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString("utf8")
    })
    child.on("error", err => {
      resolve({
        ok: false,
        percent: pct,
        supported: true,
        error: err.message,
        stdout,
      })
    })
    child.on("close", code => {
      resolve({
        ok: code === 0,
        percent: pct,
        supported: true,
        stdout: stdout.trim(),
        error: code === 0 ? undefined : stderr.trim() || `exit_${code}`,
      })
    })
  })
}

/** Apply volume to Windows mixer for Resona/Electron audio sessions. */
export async function setWindowsAppVolume(percent: number): Promise<WindowsAppVolumeResult> {
  if (!isWindowsAppVolumeSupported()) {
    return { ok: false, percent: clampVolumePercent(percent), supported: false }
  }

  desiredPercent = clampVolumePercent(percent)

  if (inFlight) {
    queued = desiredPercent
    return inFlight
  }

  inFlight = runHelper(desiredPercent).finally(() => {
    inFlight = null
  })
  const result = await inFlight

  if (queued !== null) {
    const next = queued
    queued = null
    if (next !== result.percent) {
      return setWindowsAppVolume(next)
    }
  }

  return result
}

export function getDesiredWindowsAppVolume(): number {
  return desiredPercent
}

/** Re-apply volume so newly created sessions (Spotify/Yandex) pick up the level. */
export function startWindowsAppVolumeWatchdog(getPercent: () => number = () => desiredPercent): void {
  if (!isWindowsAppVolumeSupported()) return
  stopWindowsAppVolumeWatchdog()
  watchTimer = setInterval(() => {
    void setWindowsAppVolume(getPercent())
  }, WATCH_MS)
  if (typeof watchTimer === "object" && watchTimer && "unref" in watchTimer) {
    watchTimer.unref()
  }
}

export function stopWindowsAppVolumeWatchdog(): void {
  if (watchTimer) {
    clearInterval(watchTimer)
    watchTimer = null
  }
}

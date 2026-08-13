import fs from "fs"
import path from "path"
import { spawn } from "child_process"
import { app } from "electron"
import {
  buildWinAppVolumeSetNameArgs,
  buildWinAppVolumeSetPidArgs,
  listResonaAudioProcessNames,
  parseWinAppVolumeTouched,
} from "../src/lib/streaming/windowsMixerVolume.js"
import { clampVolumePercent } from "../src/lib/streaming/volumePercent.js"

/** Re-apply so new Spotify/Yandex sessions pick up the level after play starts. */
const WATCH_MS = 4000

export type WindowsAppVolumeResult = {
  ok: boolean
  percent: number
  supported: boolean
  touched?: number
  stdout?: string
  error?: string
}

let desiredPercent = 72
let lastAppliedPercent: number | null = null
let lastTouched = 0
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

/** All Chromium processes that belong to this Electron app (safe — not every Electron on the PC). */
export function listResonaAudioPids(): number[] {
  const pids = new Set<number>([process.pid])
  try {
    for (const metric of app.getAppMetrics()) {
      if (metric.pid > 0) pids.add(metric.pid)
    }
  } catch {
    // getAppMetrics unavailable before ready
  }
  return [...pids]
}

function processNamesForApp(): string[] {
  const exe = path.basename(process.execPath || "Resona.exe")
  return listResonaAudioProcessNames(exe)
}

function runHelper(args: string[]): Promise<WindowsAppVolumeResult> {
  const exe = resolveWinAppVolumeExe()
  const pct = clampVolumePercent(Number(args[1]) || desiredPercent)
  if (!exe) {
    return Promise.resolve({
      ok: false,
      percent: pct,
      supported: false,
      touched: 0,
      error: "helper_missing",
    })
  }

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
        touched: 0,
        error: err.message,
        stdout,
      })
    })
    child.on("close", code => {
      const touched = parseWinAppVolumeTouched(stdout)
      resolve({
        ok: code === 0,
        percent: pct,
        supported: true,
        touched,
        stdout: stdout.trim(),
        error: code === 0 ? undefined : stderr.trim() || `exit_${code}`,
      })
    })
  })
}

async function runHelperWithFallback(percent: number): Promise<WindowsAppVolumeResult> {
  const pct = clampVolumePercent(percent)
  const pids = listResonaAudioPids()
  let result = await runHelper(buildWinAppVolumeSetPidArgs(pct, pids))

  // No active session for these PIDs yet (common right after play) — also try by name.
  if ((result.touched ?? 0) <= 0) {
    const byName = await runHelper(buildWinAppVolumeSetNameArgs(pct, processNamesForApp()))
    if ((byName.touched ?? 0) > (result.touched ?? 0) || (!result.ok && byName.ok)) {
      result = byName
    }
  }

  return result
}

/** Apply volume to Windows mixer for Resona/Electron audio sessions. */
export async function setWindowsAppVolume(
  percent: number,
  options?: { force?: boolean },
): Promise<WindowsAppVolumeResult> {
  if (!isWindowsAppVolumeSupported()) {
    return { ok: false, percent: clampVolumePercent(percent), supported: false, touched: 0 }
  }

  desiredPercent = clampVolumePercent(percent)
  const force = Boolean(options?.force)

  // Skip only when we already successfully touched sessions at this level.
  if (
    !force
    && lastAppliedPercent === desiredPercent
    && lastTouched > 0
    && !inFlight
  ) {
    return {
      ok: true,
      percent: desiredPercent,
      supported: Boolean(resolveWinAppVolumeExe()),
      touched: lastTouched,
      stdout: "skipped_unchanged",
    }
  }

  if (inFlight) {
    queued = desiredPercent
    return inFlight
  }

  inFlight = runHelperWithFallback(desiredPercent)
    .then(result => {
      if (result.ok) {
        lastTouched = result.touched ?? 0
        // Only remember "applied" when sessions were actually changed/matched,
        // otherwise keep retrying via watchdog once audio starts.
        if (lastTouched > 0) lastAppliedPercent = result.percent
        else lastAppliedPercent = null
      }
      return result
    })
    .finally(() => {
      inFlight = null
    })
  const result = await inFlight

  if (queued !== null) {
    const next = queued
    queued = null
    if (next !== result.percent) {
      return setWindowsAppVolume(next, { force: true })
    }
  }

  return result
}

export function getDesiredWindowsAppVolume(): number {
  return desiredPercent
}

export function getLastWindowsAppVolumeTouched(): number {
  return lastTouched
}

/** Re-apply volume so newly created sessions (Spotify/Yandex) pick up the level. */
export function startWindowsAppVolumeWatchdog(
  getPercent: () => number = () => desiredPercent,
  onResult?: (result: WindowsAppVolumeResult) => void,
): void {
  if (!isWindowsAppVolumeSupported()) return
  stopWindowsAppVolumeWatchdog()
  watchTimer = setInterval(() => {
    // Force while we have not matched any session yet; soft once gain is latched.
    const force = lastTouched <= 0 || lastAppliedPercent !== clampVolumePercent(getPercent())
    void setWindowsAppVolume(getPercent(), { force }).then(result => {
      try {
        onResult?.(result)
      } catch {
        // ignore listener errors
      }
    })
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

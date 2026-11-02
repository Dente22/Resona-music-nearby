import { spawn } from "child_process"
import path from "path"
import { app } from "electron"
import { clampVolumePercent } from "../src/lib/streaming/volumePercent.js"
import {
  listResonaPulseBinaries,
  parsePactlSinkInputs,
  selectResonaSinkInputs,
  volumePercentToPactlArg,
} from "../src/lib/streaming/linuxMixerVolume.js"

/** Re-apply so new Spotify/Yandex / Chromium streams pick up the level. */
const WATCH_MS = 4000

export type LinuxAppVolumeResult = {
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
let inFlight: Promise<LinuxAppVolumeResult> | null = null
let queued: number | null = null
let pactlAvailable: boolean | null = null

export function isLinuxAppVolumeSupported(): boolean {
  return process.platform === "linux"
}

function runCmd(
  command: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise(resolve => {
    const child = spawn(command, args, {
      env: { ...process.env, LC_ALL: "C", ...env },
    })
    let stdout = ""
    let stderr = ""
    child.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString("utf8")
    })
    child.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString("utf8")
    })
    child.on("error", err => {
      resolve({ code: null, stdout, stderr: err.message })
    })
    child.on("close", code => {
      resolve({ code, stdout, stderr })
    })
  })
}

async function ensurePactl(): Promise<boolean> {
  if (pactlAvailable != null) return pactlAvailable
  const which = await runCmd("which", ["pactl"])
  pactlAvailable = which.code === 0 && which.stdout.trim().length > 0
  return pactlAvailable
}

/** Chromium/Electron PIDs that belong to this Resona process tree. */
export function listResonaAudioPids(): number[] {
  const pids = new Set<number>([process.pid])
  try {
    for (const metric of app.getAppMetrics()) {
      if (metric.pid > 0) pids.add(metric.pid)
    }
  } catch {
    // before ready
  }
  return [...pids]
}

async function listMatchedSinkInputs() {
  const listed = await runCmd("pactl", ["list", "sink-inputs"])
  if (listed.code !== 0) {
    return { inputs: [], error: listed.stderr.trim() || `pactl_list_${listed.code}` }
  }
  const all = parsePactlSinkInputs(listed.stdout)
  const exe = path.basename(process.execPath || "resona")
  const matched = selectResonaSinkInputs(
    all,
    listResonaAudioPids(),
    listResonaPulseBinaries(exe),
  )
  return { inputs: matched, error: undefined as string | undefined }
}

async function applyToSinkInputs(percent: number): Promise<LinuxAppVolumeResult> {
  const pct = clampVolumePercent(percent)
  if (!(await ensurePactl())) {
    return {
      ok: false,
      percent: pct,
      supported: false,
      touched: 0,
      error: "pactl_missing",
    }
  }

  const { inputs, error } = await listMatchedSinkInputs()
  if (error && inputs.length === 0) {
    return { ok: false, percent: pct, supported: true, touched: 0, error }
  }
  if (inputs.length === 0) {
    return {
      ok: true,
      percent: pct,
      supported: true,
      touched: 0,
      stdout: "ok touched=0 percent=" + pct,
    }
  }

  const vol = volumePercentToPactlArg(pct)
  let touched = 0
  const notes: string[] = []
  for (const input of inputs) {
    const set = await runCmd("pactl", ["set-sink-input-volume", String(input.index), vol])
    if (set.code === 0) {
      touched += 1
      notes.push(`#${input.index}`)
    } else {
      notes.push(`#${input.index}:fail`)
    }
  }

  return {
    ok: touched > 0,
    percent: pct,
    supported: true,
    touched,
    stdout: `ok touched=${touched} percent=${pct} ${notes.join(",")}`,
    error: touched > 0 ? undefined : "no_sink_updated",
  }
}

/** Apply volume to PipeWire/Pulse sink-inputs for this Resona app. */
export async function setLinuxAppVolume(
  percent: number,
  options?: { force?: boolean },
): Promise<LinuxAppVolumeResult> {
  if (!isLinuxAppVolumeSupported()) {
    return { ok: false, percent: clampVolumePercent(percent), supported: false, touched: 0 }
  }

  desiredPercent = clampVolumePercent(percent)
  const force = Boolean(options?.force)

  if (
    !force
    && lastAppliedPercent === desiredPercent
    && lastTouched > 0
    && !inFlight
  ) {
    return {
      ok: true,
      percent: desiredPercent,
      supported: true,
      touched: lastTouched,
      stdout: "skipped_unchanged",
    }
  }

  if (inFlight) {
    queued = desiredPercent
    return inFlight
  }

  inFlight = applyToSinkInputs(desiredPercent)
    .then(result => {
      if (result.ok || (result.touched ?? 0) >= 0) {
        lastTouched = result.touched ?? 0
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
      return setLinuxAppVolume(next, { force: true })
    }
  }

  return result
}

export function getDesiredLinuxAppVolume(): number {
  return desiredPercent
}

export function getLastLinuxAppVolumeTouched(): number {
  return lastTouched
}

export function startLinuxAppVolumeWatchdog(
  getPercent: () => number = () => desiredPercent,
  onResult?: (result: LinuxAppVolumeResult) => void,
): void {
  if (!isLinuxAppVolumeSupported()) return
  stopLinuxAppVolumeWatchdog()
  watchTimer = setInterval(() => {
    const force = lastTouched <= 0 || lastAppliedPercent !== clampVolumePercent(getPercent())
    void setLinuxAppVolume(getPercent(), { force }).then(result => {
      try {
        onResult?.(result)
      } catch {
        // ignore
      }
    })
  }, WATCH_MS)
  if (typeof watchTimer === "object" && watchTimer && "unref" in watchTimer) {
    watchTimer.unref()
  }
}

export function stopLinuxAppVolumeWatchdog(): void {
  if (watchTimer) {
    clearInterval(watchTimer)
    watchTimer = null
  }
}

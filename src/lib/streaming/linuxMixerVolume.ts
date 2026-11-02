import { clampVolumePercent } from "./volumePercent.js"

/** UI % → pactl volume argument (`72%`). */
export function volumePercentToPactlArg(percent: number): string {
  return `${clampVolumePercent(percent)}%`
}

export type PulseSinkInput = {
  index: number
  processId: number | null
  processBinary: string
  applicationName: string
}

/**
 * Parse `LC_ALL=C pactl list sink-inputs` into sink-input records.
 * Matches by `application.process.id` / `application.process.binary`.
 */
export function parsePactlSinkInputs(text: string): PulseSinkInput[] {
  const blocks = text.split(/\n(?=Sink Input #)/)
  const out: PulseSinkInput[] = []

  for (const block of blocks) {
    const indexMatch = /^Sink Input #(\d+)/m.exec(block)
    if (!indexMatch) continue
    const index = Number(indexMatch[1])
    if (!Number.isFinite(index)) continue

    const pidMatch = /application\.process\.id\s*=\s*"(\d+)"/.exec(block)
    const binaryMatch = /application\.process\.binary\s*=\s*"([^"]*)"/.exec(block)
    const nameMatch = /application\.name\s*=\s*"([^"]*)"/.exec(block)

    out.push({
      index,
      processId: pidMatch ? Number(pidMatch[1]) : null,
      processBinary: (binaryMatch?.[1] ?? "").toLowerCase(),
      applicationName: nameMatch?.[1] ?? "",
    })
  }

  return out
}

/** Binaries that may own Resona audio under PipeWire/Pulse. */
export function listResonaPulseBinaries(executableName?: string): string[] {
  const names = new Set<string>(["resona"])
  const base = executableName?.replace(/\.(exe|bin)$/i, "").trim().toLowerCase()
  if (base) names.add(base)
  if (base === "electron" || !base) names.add("electron")
  return [...names]
}

/**
 * Prefer PID match (safe vs other Chromium apps). Fall back to binary name
 * only for our Resona/electron binaries.
 */
export function selectResonaSinkInputs(
  inputs: PulseSinkInput[],
  pids: number[],
  binaries: string[],
): PulseSinkInput[] {
  const pidSet = new Set(pids.filter(p => Number.isInteger(p) && p > 0))
  const binSet = new Set(binaries.map(b => b.toLowerCase()))

  const byPid = inputs.filter(i => i.processId != null && pidSet.has(i.processId))
  if (byPid.length > 0) return byPid

  return inputs.filter(i => binSet.has(i.processBinary))
}

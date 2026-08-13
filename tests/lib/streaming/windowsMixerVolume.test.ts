import { describe, it, expect } from "vitest"
import {
  volumePercentToMixerScalar,
  listResonaAudioProcessNames,
  buildWinAppVolumeSetNameArgs,
  buildWinAppVolumeSetPidArgs,
  localMediaVolumeWhenUsingSystemMixer,
  shouldDriveEmbedPageVolume,
  parseWinAppVolumeTouched,
  shouldApplyEmbedGainFallback,
} from "@/lib/streaming/windowsMixerVolume"

describe("windowsMixerVolume", () => {
  it("maps percent to WASAPI scalar", () => {
    expect(volumePercentToMixerScalar(0)).toBe(0)
    expect(volumePercentToMixerScalar(50)).toBe(0.5)
    expect(volumePercentToMixerScalar(100)).toBe(1)
    expect(volumePercentToMixerScalar(150)).toBe(1)
  })

  it("includes Resona and the running executable name", () => {
    expect(listResonaAudioProcessNames("Resona.exe")).toEqual(
      expect.arrayContaining(["Resona"]),
    )
    expect(listResonaAudioProcessNames("electron.exe")).toEqual(
      expect.arrayContaining(["Resona", "electron"]),
    )
  })

  it("builds set-name CLI args for the helper", () => {
    expect(buildWinAppVolumeSetNameArgs(72, ["Resona", "electron"])).toEqual([
      "set-name",
      "72",
      "Resona",
      "electron",
    ])
  })

  it("builds set PID CLI args for precise targeting", () => {
    expect(buildWinAppVolumeSetPidArgs(50, [1234, 1234, -1])).toEqual([
      "set",
      "50",
      "1234",
    ])
  })

  it("keeps local media at full when mixer controls gain", () => {
    expect(localMediaVolumeWhenUsingSystemMixer()).toBe(1)
  })

  it("skips embed page volume when mixer is active", () => {
    expect(shouldDriveEmbedPageVolume(true)).toBe(false)
    expect(shouldDriveEmbedPageVolume(false)).toBe(true)
  })

  it("parses touched count from helper stdout", () => {
    expect(parseWinAppVolumeTouched("ok touched=2 percent=40")).toBe(2)
    expect(parseWinAppVolumeTouched("ok touched=0 percent=40")).toBe(0)
    expect(parseWinAppVolumeTouched(undefined)).toBe(0)
  })

  it("uses gain-only fallback when mixer finds no sessions", () => {
    expect(shouldApplyEmbedGainFallback(true, 0)).toBe(true)
    expect(shouldApplyEmbedGainFallback(true, 2)).toBe(false)
    expect(shouldApplyEmbedGainFallback(false, 0)).toBe(false)
  })
})

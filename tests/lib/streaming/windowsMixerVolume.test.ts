import { describe, it, expect } from "vitest"
import {
  volumePercentToMixerScalar,
  listResonaAudioProcessNames,
  buildWinAppVolumeSetNameArgs,
  localMediaVolumeWhenUsingSystemMixer,
} from "@/lib/streaming/windowsMixerVolume"

describe("windowsMixerVolume", () => {
  it("maps percent to WASAPI scalar", () => {
    expect(volumePercentToMixerScalar(0)).toBe(0)
    expect(volumePercentToMixerScalar(50)).toBe(0.5)
    expect(volumePercentToMixerScalar(100)).toBe(1)
    expect(volumePercentToMixerScalar(150)).toBe(1)
  })

  it("includes Resona and electron process names", () => {
    expect(listResonaAudioProcessNames("Resona.exe")).toEqual(
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

  it("keeps local media at full when mixer controls gain", () => {
    expect(localMediaVolumeWhenUsingSystemMixer()).toBe(1)
  })
})

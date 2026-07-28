import { describe, it, expect } from "vitest"
import { clampVolumePercent, shouldMuteEmbedAudio } from "@/lib/streaming/volumePercent"
import {
  EMBED_CONTROLS_BOOTSTRAP,
  EMBED_CONTROLS_VERSION,
  buildEmbedVolumeScript,
} from "@/lib/streaming/embedPlayerControls"

describe("volumePercent", () => {
  it("clamps to 0–100 integers", () => {
    expect(clampVolumePercent(72)).toBe(72)
    expect(clampVolumePercent(-5)).toBe(0)
    expect(clampVolumePercent(150)).toBe(100)
  })

  it("mutes Chromium audio only at near-zero", () => {
    expect(shouldMuteEmbedAudio(0)).toBe(true)
    expect(shouldMuteEmbedAudio(1)).toBe(false)
    expect(shouldMuteEmbedAudio(50)).toBe(false)
  })
})

describe("embed volume control", () => {
  it("installs media + AudioContext gain hooks", () => {
    expect(EMBED_CONTROLS_VERSION).toBeGreaterThanOrEqual(13)
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("__VW_VOL_HOOK__")
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("AudioContext")
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("__VW_MASTER_GAINS__")
    expect(buildEmbedVolumeScript(0)).toContain("setVolume(0)")
  })
})

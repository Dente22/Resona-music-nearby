import { describe, expect, it } from "vitest"
import {
  listResonaPulseBinaries,
  parsePactlSinkInputs,
  selectResonaSinkInputs,
  volumePercentToPactlArg,
} from "@/lib/streaming/linuxMixerVolume"

const SAMPLE = `
Sink Input #42
        Driver: PipeWire
        application.name = "Chromium"
        application.process.id = "1234"
        application.process.binary = "resona"
        media.name = "Playback"

Sink Input #99
        Driver: PipeWire
        application.name = "Firefox"
        application.process.id = "999"
        application.process.binary = "firefox"
`

describe("linuxMixerVolume", () => {
  it("formats pactl volume args", () => {
    expect(volumePercentToPactlArg(72)).toBe("72%")
    expect(volumePercentToPactlArg(150)).toBe("100%")
  })

  it("parses sink inputs", () => {
    const inputs = parsePactlSinkInputs(SAMPLE)
    expect(inputs).toHaveLength(2)
    expect(inputs[0]).toMatchObject({
      index: 42,
      processId: 1234,
      processBinary: "resona",
    })
  })

  it("prefers PID match over other apps", () => {
    const inputs = parsePactlSinkInputs(SAMPLE)
    const selected = selectResonaSinkInputs(inputs, [1234], listResonaPulseBinaries("resona"))
    expect(selected.map(s => s.index)).toEqual([42])
  })

  it("falls back to binary name", () => {
    const inputs = parsePactlSinkInputs(SAMPLE)
    const selected = selectResonaSinkInputs(inputs, [], ["resona"])
    expect(selected.map(s => s.index)).toEqual([42])
  })
})

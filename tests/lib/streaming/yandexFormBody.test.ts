import { describe, it, expect } from "vitest"
import { buildYandexFormBody } from "@/lib/streaming/yandexFormBody"

describe("buildYandexFormBody", () => {
  it("encodes single track id for likes API", () => {
    expect(buildYandexFormBody({ "track-ids": "106716742" })).toBe("track-ids=106716742")
  })

  it("encodes multiple track ids", () => {
    expect(buildYandexFormBody({ "track-ids": ["1", "2"] })).toBe("track-ids=1&track-ids=2")
  })
})

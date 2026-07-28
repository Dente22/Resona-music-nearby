import { describe, it, expect } from "vitest"
import {
  acceptStreamingTrackUrl,
  sanitizeStreamingTrackUrl,
} from "@/lib/streaming/streamingTrackUrl"

const KZ_SHARE_URL =
  "https://music.yandex.kz/album/8305394/track/56220214?utm_source=web&utm_medium=copy_link"

describe("streamingTrackUrl", () => {
  it("accepts yandex.kz album/track share links with utm params", () => {
    expect(acceptStreamingTrackUrl(KZ_SHARE_URL)).toBe(true)
    expect(sanitizeStreamingTrackUrl(KZ_SHARE_URL)).toBe(
      "https://music.yandex.kz/album/8305394/track/56220214",
    )
  })

  it("extracts yandex track id from regional share links", () => {
    const parsed = sanitizeStreamingTrackUrl(KZ_SHARE_URL)
    expect(parsed).toContain("/track/56220214")
  })

  it("accepts plain yandex.ru track links", () => {
    expect(acceptStreamingTrackUrl("https://music.yandex.ru/track/56220214")).toBe(true)
  })

  it("rejects yandex home page", () => {
    expect(acceptStreamingTrackUrl("https://music.yandex.kz/")).toBe(false)
  })
})

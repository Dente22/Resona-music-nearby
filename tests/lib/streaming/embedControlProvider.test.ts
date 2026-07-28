import { describe, it, expect } from "vitest"
import {
  resolveEmbedControlProvider,
  shouldKeepEmbedWebviewsAlive,
} from "@/lib/streaming/embedControlProvider"

describe("resolveEmbedControlProvider", () => {
  it("prefers explicit control provider for delegated library playback", () => {
    expect(resolveEmbedControlProvider("yandex", "spotify", "spotify")).toBe("yandex")
  })

  it("uses live embed playback provider when control provider is unset", () => {
    expect(resolveEmbedControlProvider(null, "yandex", "spotify")).toBe("yandex")
  })

  it("falls back to active internet tab provider", () => {
    expect(resolveEmbedControlProvider(null, null, "spotify")).toBe("spotify")
  })
})

describe("shouldKeepEmbedWebviewsAlive", () => {
  it("keeps webviews alive for embed transport off the internet tab", () => {
    expect(
      shouldKeepEmbedWebviewsAlive({
        useEmbedTransport: true,
        embedControlProvider: null,
        hasEmbedPlayback: true,
      }),
    ).toBe(true)
  })

  it("keeps webviews alive for restored embed playback on startup", () => {
    expect(
      shouldKeepEmbedWebviewsAlive({
        useEmbedTransport: false,
        embedControlProvider: null,
        hasEmbedPlayback: true,
      }),
    ).toBe(true)
  })

  it("does not keep webviews alive without embed playback", () => {
    expect(
      shouldKeepEmbedWebviewsAlive({
        useEmbedTransport: false,
        embedControlProvider: null,
        hasEmbedPlayback: false,
      }),
    ).toBe(false)
  })
})

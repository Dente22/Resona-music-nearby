import { describe, it, expect } from "vitest"
import {
  EMBED_CONTROLS_BOOTSTRAP,
  EMBED_CONTROLS_VERSION,
  EMBED_PREV_SCRIPT,
  EMBED_NEXT_SCRIPT,
  EMBED_EXPAND_YANDEX_PLAYER_SCRIPT,
  EMBED_YANDEX_TRANSPORT_READY_SCRIPT,
  buildEmbedSeekScript,
} from "@/lib/streaming/embedPlayerControls"

describe("embedPlayerControls", () => {
  it("play() only succeeds when playback is verified", () => {
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("dismissYandexMobilePromo")
    const playFn = EMBED_CONTROLS_BOOTSTRAP.match(/function play\(\)\s*\{([\s\S]*?\n  \}\n  function clickYandexTransport)/)
    expect(playFn?.[1]).not.toMatch(/\|\| true/)
  })

  it("bootstrap installs versioned __VW_EMBED__ runtime", () => {
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("window.__VW_EMBED__")
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("seek:")
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("HTMLInputElement.prototype")
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("seekSpotify")
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("PointerEvent")
    expect(EMBED_CONTROLS_VERSION).toBe(14)
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("readProgress:")
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("like:")
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("play:")
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("isPlaying:")
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("clickYandexTrackPageListen")
  })

  it("prev/next delegate to runtime", () => {
    expect(EMBED_PREV_SCRIPT).toContain("__VW_EMBED__.prev")
    expect(EMBED_NEXT_SCRIPT).toContain("__VW_EMBED__.next")
    expect(EMBED_PREV_SCRIPT).toContain("window.__VW_EMBED__")
  })

  it("yandex expand helpers are exported", () => {
    expect(EMBED_YANDEX_TRANSPORT_READY_SCRIPT).toContain("yandexTransportReady")
    expect(EMBED_EXPAND_YANDEX_PLAYER_SCRIPT).toContain("expandYandexPlayer")
    expect(EMBED_CONTROLS_BOOTSTRAP).toContain("expandYandexPlayer")
    expect(EMBED_CONTROLS_BOOTSTRAP).not.toContain("clickYandexTransportLegacy")
  })

  it("seek script passes target seconds", () => {
    expect(buildEmbedSeekScript(42)).toContain("__VW_EMBED__.seek(42)")
  })

  it("prefers media currentTime before bar clicks when seeking", () => {
    expect(EMBED_CONTROLS_BOOTSTRAP).toMatch(/seek:\s*function[\s\S]*pickMedia\(\)[\s\S]*currentTime/)
  })
})

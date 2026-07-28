import { describe, it, expect } from "vitest"
import {
  shouldMountEmbedWebviews,
  shouldPinWebviews,
  shouldPaintEmbedWebview,
  shouldKeepWebviewScriptable,
  getInternetHostVisible,
  PANEL_HIDE_WEBVIEW_MS,
  EMBED_MOUNT_DELAY_MS,
} from "@/lib/streaming/embedPanelLifecycle"

describe("embedPanelLifecycle", () => {
  it("pins webviews after first internet visit", () => {
    expect(shouldPinWebviews(false, false)).toBe(false)
    expect(shouldPinWebviews(true, false)).toBe(true)
    expect(shouldPinWebviews(false, true)).toBe(true)
  })

  it("keeps webviews mounted when pinned", () => {
    expect(shouldMountEmbedWebviews(false)).toBe(false)
    expect(shouldMountEmbedWebviews(true)).toBe(true)
  })

  it("paints webview only on internet tab", () => {
    expect(shouldPaintEmbedWebview(true, true, "spotify", "spotify")).toBe(true)
    expect(shouldPaintEmbedWebview(false, true, "spotify", "spotify")).toBe(false)
  })

  it("keeps active and control webviews scriptable off-tab", () => {
    expect(shouldKeepWebviewScriptable(true, "spotify", "spotify")).toBe(true)
    expect(shouldKeepWebviewScriptable(true, "spotify", "yandex", "yandex")).toBe(true)
    expect(shouldKeepWebviewScriptable(true, "spotify", "yandex")).toBe(false)
    expect(shouldKeepWebviewScriptable(false, "spotify", "yandex", "yandex")).toBe(false)
  })

  it("shows internet host only on internet tab", () => {
    expect(getInternetHostVisible(true)).toBe(true)
    expect(getInternetHostVisible(false)).toBe(false)
  })

  it("exports timing constants", () => {
    expect(PANEL_HIDE_WEBVIEW_MS).toBeGreaterThan(0)
    expect(EMBED_MOUNT_DELAY_MS).toBeGreaterThan(0)
  })
})

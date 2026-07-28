import { describe, it, expect } from "vitest"
import {
  isValidEmbedHostBounds,
  planEmbedBrowserLayout,
} from "@/lib/streaming/embedPanelLayout"

describe("planEmbedBrowserLayout", () => {
  const host = { x: 10, y: 200, width: 360, height: 420 }
  const viewport = { width: 390, height: 844 }

  it("attaches only on internet tab with valid host bounds", () => {
    expect(
      planEmbedBrowserLayout({
        internetTabVisible: true,
        panelVisible: true,
        webviewsPinned: true,
        activeProvider: "yandex",
        hostBounds: host,
        viewport,
      }),
    ).toEqual({
      mode: "attached",
      provider: "yandex",
      bounds: { x: 10, y: 200, width: 360, height: 420 },
    })
  })

  it("never attaches off-screen when another tab is active", () => {
    expect(
      planEmbedBrowserLayout({
        internetTabVisible: false,
        panelVisible: true,
        webviewsPinned: true,
        activeProvider: "yandex",
        hostBounds: host,
        viewport,
      }),
    ).toEqual({ mode: "hidden" })
  })

  it("hides when host is not measurable", () => {
    expect(
      planEmbedBrowserLayout({
        internetTabVisible: true,
        panelVisible: true,
        webviewsPinned: true,
        activeProvider: "spotify",
        hostBounds: null,
      }),
    ).toEqual({ mode: "hidden" })
  })

  it("rejects bounds that cover the whole window", () => {
    expect(
      planEmbedBrowserLayout({
        internetTabVisible: true,
        panelVisible: true,
        webviewsPinned: true,
        activeProvider: "yandex",
        hostBounds: { x: 0, y: 0, width: 390, height: 820 },
        viewport,
      }),
    ).toEqual({ mode: "hidden" })
  })
})

describe("isValidEmbedHostBounds", () => {
  const viewport = { width: 390, height: 844 }

  it("accepts host area above bottom nav", () => {
    expect(isValidEmbedHostBounds({ x: 12, y: 180, width: 366, height: 600 }, viewport)).toBe(true)
  })

  it("rejects full-window bounds", () => {
    expect(isValidEmbedHostBounds({ x: 0, y: 0, width: 390, height: 844 }, viewport)).toBe(false)
  })
})

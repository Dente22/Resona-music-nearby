import { describe, it, expect } from "vitest"
import { getEmbedWebviewPlacement } from "@/lib/streaming/embedWebviewPlacement"

describe("getEmbedWebviewPlacement", () => {
  it("shows active provider on internet tab", () => {
    expect(getEmbedWebviewPlacement("yandex", true, true, "yandex", null)).toBe("visible")
    expect(getEmbedWebviewPlacement("spotify", true, true, "yandex", null)).toBe("none")
  })

  it("docks control provider when on another tab", () => {
    expect(getEmbedWebviewPlacement("yandex", false, true, "spotify", "yandex")).toBe("dock")
    expect(getEmbedWebviewPlacement("spotify", false, true, "spotify", "yandex")).toBe("none")
  })

  it("docks control provider while browsing another service on internet tab", () => {
    expect(getEmbedWebviewPlacement("yandex", true, true, "spotify", "yandex")).toBe("dock")
    expect(getEmbedWebviewPlacement("spotify", true, true, "spotify", "yandex")).toBe("visible")
  })

  it("returns none before webviews are ready", () => {
    expect(getEmbedWebviewPlacement("spotify", true, false, "spotify", null)).toBe("none")
  })
})

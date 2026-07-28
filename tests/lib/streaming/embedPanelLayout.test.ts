import { describe, it, expect } from "vitest"
import {
  getEmbedWebviewStyle,
  getEmbedDockStyle,
} from "@/lib/streaming/embedPanelLayout"

describe("embedPanelLayout webview control", () => {
  it("styles visible webview inside host bounds", () => {
    const style = getEmbedWebviewStyle("visible")
    expect(style.position).toBe("absolute")
    expect(style.visibility).toBe("visible")
    expect(style.display).toBe("inline-flex")
  })

  it("hides dock webview without fixed positioning", () => {
    const style = getEmbedWebviewStyle("dock")
    expect(style.position).toBe("absolute")
    expect(style.visibility).toBe("hidden")
    expect(style).not.toHaveProperty("left", -10_000)
  })

  it("unmounts hidden providers", () => {
    expect(getEmbedWebviewStyle("none").display).toBe("none")
  })

  it("dock stays off-screen", () => {
    expect(getEmbedDockStyle().left).toBeLessThan(0)
  })
})

import { describe, it, expect } from "vitest"
import {
  createInitialPanel,
  showPanel,
  hidePanel,
  togglePanel,
  getPanelOffset,
} from "@/lib/panelState"

describe("panelState", () => {
  it("starts hidden on the right edge", () => {
    const panel = createInitialPanel("right", 390)
    expect(panel.isVisible).toBe(false)
    expect(panel.edge).toBe("right")
    expect(panel.width).toBe(390)
  })

  it("shows and hides panel", () => {
    let panel = createInitialPanel("right", 390)
    panel = showPanel(panel)
    expect(panel.isVisible).toBe(true)
    panel = hidePanel(panel)
    expect(panel.isVisible).toBe(false)
  })

  it("toggles visibility", () => {
    let panel = createInitialPanel("left", 400)
    panel = togglePanel(panel)
    expect(panel.isVisible).toBe(true)
    panel = togglePanel(panel)
    expect(panel.isVisible).toBe(false)
  })

  it("returns 0 offset when visible", () => {
    const panel = showPanel(createInitialPanel("right", 390))
    expect(getPanelOffset(panel)).toBe(0)
  })

  it("returns negative offset when hidden on right", () => {
    const panel = createInitialPanel("right", 390)
    expect(getPanelOffset(panel)).toBe(-390)
  })

  it("returns positive offset when hidden on left", () => {
    const panel = createInitialPanel("left", 400)
    expect(getPanelOffset(panel)).toBe(400)
  })
})

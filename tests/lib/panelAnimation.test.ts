import { describe, it, expect } from "vitest"
import {
  createPanelAnimationState,
  requestShow,
  requestHide,
  completeAnimation,
  canStartHide,
  canStartShow,
} from "@/lib/panelAnimation"

describe("panelAnimation", () => {
  it("starts idle and hidden", () => {
    const s = createPanelAnimationState()
    expect(s.visible).toBe(false)
    expect(s.phase).toBe("idle")
  })

  it("allows hide when visible and idle", () => {
    let s = createPanelAnimationState()
    s = requestShow(s)
    s = completeAnimation(s, true)
    expect(canStartHide(s)).toBe(true)
    expect(canStartShow(s)).toBe(false)
  })

  it("blocks duplicate show while animating", () => {
    let s = requestShow(createPanelAnimationState())
    expect(s.phase).toBe("animating")
    expect(canStartShow(s)).toBe(false)
    expect(requestShow(s)).toEqual(s)
  })

  it("allows hide while show animation is running (cancel)", () => {
    const s = requestShow(createPanelAnimationState())
    expect(canStartHide(s)).toBe(true)
    const hide = requestHide(s)
    expect(hide.phase).toBe("animating")
    expect(hide.visible).toBe(false)
  })

  it("completes hide animation", () => {
    let s = createPanelAnimationState()
    s = requestShow(s)
    s = completeAnimation(s, true)
    s = requestHide(s)
    s = completeAnimation(s, false)
    expect(s.visible).toBe(false)
    expect(s.phase).toBe("idle")
  })
})

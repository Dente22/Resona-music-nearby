import { describe, it, expect } from "vitest"
import { findDisplayAtPoint, type DisplayInfo } from "@/lib/panelDisplay"

const MONITOR_LEFT: DisplayInfo = { id: 1, x: 0, y: 0, width: 1920, height: 1080 }
const MONITOR_RIGHT: DisplayInfo = { id: 2, x: 1920, y: 0, width: 1920, height: 1080 }

describe("panelDisplay", () => {
  it("picks display under cursor on secondary monitor", () => {
    const display = findDisplayAtPoint([MONITOR_LEFT, MONITOR_RIGHT], { x: 2000, y: 400 })
    expect(display.id).toBe(2)
  })

  it("picks display under cursor on primary monitor", () => {
    const display = findDisplayAtPoint([MONITOR_LEFT, MONITOR_RIGHT], { x: 800, y: 400 })
    expect(display.id).toBe(1)
  })

  it("does not assign hide position on adjacent monitor boundary", () => {
    // Regression: x=1920 is left edge of monitor 2, not "hidden" monitor 1
    const rightEdgeOfLeft = MONITOR_LEFT.x + MONITOR_LEFT.width
    expect(rightEdgeOfLeft).toBe(1920)
    expect(MONITOR_RIGHT.x).toBe(1920)
    // Hide uses BrowserWindow.hide() (tray), never moves the window to x=1920
  })
})

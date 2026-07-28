import { describe, it, expect } from "vitest"
import {
  findDisplayAtPoint,
  getVisibleBounds,
  resolvePanelShowDisplayId,
  usesTrayHide,
  PANEL_HIDE_STRATEGY,
  shouldShowPanelOnStartup,
} from "../../electron/slidePanel"

describe("slidePanel findDisplayAtPoint", () => {
  const MONITOR_LEFT = { id: 1, x: 0, y: 0, width: 1920, height: 1080 }
  const MONITOR_RIGHT = { id: 2, x: 1920, y: 0, width: 1920, height: 1080 }

  it("finds secondary monitor under cursor", () => {
    expect(findDisplayAtPoint([MONITOR_LEFT, MONITOR_RIGHT], { x: 2000, y: 400 }).id).toBe(2)
    expect(findDisplayAtPoint([MONITOR_LEFT, MONITOR_RIGHT], { x: 800, y: 400 }).id).toBe(1)
  })

  it("keeps panel fully on chosen monitor", () => {
    const bounds = getVisibleBounds(MONITOR_RIGHT, "right", 390)
    expect(bounds.x + 390).toBe(MONITOR_RIGHT.x + MONITOR_RIGHT.width)
  })
})

describe("resolvePanelShowDisplayId", () => {
  it("restores panel to the monitor where it was hidden", () => {
    expect(resolvePanelShowDisplayId(2, [1, 2], 1)).toBe(2)
  })

  it("falls back to cursor monitor when anchor is unknown", () => {
    expect(resolvePanelShowDisplayId(null, [1, 2], 2)).toBe(2)
  })

  it("falls back to cursor when anchored monitor was disconnected", () => {
    expect(resolvePanelShowDisplayId(99, [1, 2], 1)).toBe(1)
  })
})

describe("panel hide strategy", () => {
  it("hides to system tray instead of sliding onto adjacent monitor", () => {
    expect(PANEL_HIDE_STRATEGY).toBe("tray")
    expect(usesTrayHide()).toBe(true)
    expect(usesTrayHide("offscreen")).toBe(false)
  })
})

describe("shouldShowPanelOnStartup", () => {
  it("always shows the panel during electron:dev", () => {
    expect(shouldShowPanelOnStartup({ startMinimized: true, isDev: true })).toBe(true)
    expect(shouldShowPanelOnStartup({ startMinimized: false, isDev: true })).toBe(true)
  })

  it("honors startMinimized only in packaged builds", () => {
    expect(shouldShowPanelOnStartup({ startMinimized: true, isDev: false })).toBe(false)
    expect(shouldShowPanelOnStartup({ startMinimized: false, isDev: false })).toBe(true)
  })
})

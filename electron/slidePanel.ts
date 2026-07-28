export type PanelEdge = "left" | "right"

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export interface WorkArea {
  x: number
  y: number
  width: number
  height: number
}

export function getVisibleBounds(
  workArea: WorkArea,
  edge: PanelEdge,
  panelWidth: number,
): Bounds {
  const x = edge === "right"
    ? workArea.x + workArea.width - panelWidth
    : workArea.x
  return { x, y: workArea.y, width: panelWidth, height: workArea.height }
}

export function findDisplayAtPoint(
  displays: Array<WorkArea & { id: number }>,
  point: { x: number; y: number },
): WorkArea & { id: number } {
  for (const d of displays) {
    if (
      point.x >= d.x &&
      point.x < d.x + d.width &&
      point.y >= d.y &&
      point.y < d.y + d.height
    ) {
      return d
    }
  }

  let nearest = displays[0]
  let minDist = Infinity
  for (const d of displays) {
    const cx = d.x + d.width / 2
    const cy = d.y + d.height / 2
    const dist = (point.x - cx) ** 2 + (point.y - cy) ** 2
    if (dist < minDist) {
      minDist = dist
      nearest = d
    }
  }
  return nearest
}

/**
 * Off-screen slide bounds (legacy). Do not use for hide — prefer BrowserWindow.hide()
 * so the panel never appears on an adjacent monitor.
 */
export function getHiddenBounds(
  workArea: WorkArea,
  edge: PanelEdge,
  panelWidth: number,
): Bounds {
  const visible = getVisibleBounds(workArea, edge, panelWidth)
  const x = edge === "right"
    ? visible.x + panelWidth
    : visible.x - panelWidth
  return { x, y: visible.y, width: panelWidth, height: visible.height }
}

/**
 * Restore the panel on the monitor where it was last shown/hidden.
 * Only fall back to the cursor monitor when the anchor is unknown or disconnected.
 */
export function resolvePanelShowDisplayId(
  anchorDisplayId: number | null,
  availableDisplayIds: number[],
  cursorDisplayId: number,
): number {
  if (
    anchorDisplayId !== null
    && availableDisplayIds.includes(anchorDisplayId)
  ) {
    return anchorDisplayId
  }
  return cursorDisplayId
}

/**
 * Hide strategy: park the panel in the system tray via BrowserWindow.hide().
 * Never slide the window off-screen — that lands on the next monitor and causes bugs.
 */
export type PanelHideStrategy = "tray" | "offscreen"

export const PANEL_HIDE_STRATEGY: PanelHideStrategy = "tray"

export function usesTrayHide(strategy: PanelHideStrategy = PANEL_HIDE_STRATEGY): boolean {
  return strategy === "tray"
}

/** Dev always opens the panel; packaged builds honor the startMinimized setting. */
export function shouldShowPanelOnStartup(input: {
  startMinimized: boolean
  isDev: boolean
}): boolean {
  if (input.isDev) return true
  return !input.startMinimized
}

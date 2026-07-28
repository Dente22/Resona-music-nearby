import { getVisibleBounds, type PanelEdge } from "../../electron/slidePanel"

export interface DisplayInfo {
  id: number
  x: number
  y: number
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export function findDisplayAtPoint(displays: DisplayInfo[], point: Point): DisplayInfo {
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

export function getPanelBounds(
  workArea: Omit<DisplayInfo, "id">,
  edge: PanelEdge,
  panelWidth: number,
) {
  return getVisibleBounds(workArea, edge, panelWidth)
}

import type { PanelState } from "./types"

export function createInitialPanel(edge: "left" | "right", width: number): PanelState {
  return { isVisible: false, edge, width }
}

export function showPanel(state: PanelState): PanelState {
  return { ...state, isVisible: true }
}

export function hidePanel(state: PanelState): PanelState {
  return { ...state, isVisible: false }
}

export function togglePanel(state: PanelState): PanelState {
  return { ...state, isVisible: !state.isVisible }
}

export function getPanelOffset(state: PanelState): number {
  if (state.isVisible) return 0
  return state.edge === "right" ? -state.width : state.width
}

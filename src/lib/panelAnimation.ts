export type PanelPhase = "idle" | "animating"

export interface PanelAnimationState {
  visible: boolean
  phase: PanelPhase
}

export function createPanelAnimationState(): PanelAnimationState {
  return { visible: false, phase: "idle" }
}

export function canStartShow(state: PanelAnimationState): boolean {
  return state.phase === "idle" && !state.visible
}

export function canStartHide(state: PanelAnimationState): boolean {
  return state.phase === "idle" ? state.visible : true
}

export function requestShow(state: PanelAnimationState): PanelAnimationState {
  if (!canStartShow(state) && state.phase === "idle") return state
  return { visible: true, phase: "animating" }
}

export function requestHide(state: PanelAnimationState): PanelAnimationState {
  if (state.phase === "idle" && !state.visible) return state
  return { visible: false, phase: "animating" }
}

export function completeAnimation(
  state: PanelAnimationState,
  visible: boolean,
): PanelAnimationState {
  return { visible, phase: "idle" }
}

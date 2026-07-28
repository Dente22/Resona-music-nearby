import type { CSSProperties } from "react"
import type { EmbedWebviewPlacement } from "./embedWebviewPlacement.js"
import {
  getInternetHostVisible,
  shouldMountEmbedWebviews,
} from "./embedPanelLifecycle.js"

export function getInternetContainerStyle(internetTabVisible: boolean): CSSProperties {
  if (getInternetHostVisible(internetTabVisible)) {
    return {
      display: "flex",
      flexDirection: "column",
      flex: 1,
      minHeight: 0,
      overflow: "hidden",
      position: "relative",
      zIndex: 1,
      background: "#0C1416",
    }
  }
  return { display: "none" }
}

/** Off-screen dock for background embed webviews (Now tab controls). */
export function getEmbedDockStyle(): CSSProperties {
  return {
    position: "fixed",
    left: -10_000,
    top: 0,
    width: 390,
    height: 720,
    overflow: "hidden",
    visibility: "hidden",
    pointerEvents: "none",
    zIndex: -1,
    opacity: 0,
  }
}

export function getVisibleWebviewHostStyle(): CSSProperties {
  return {
    flex: "1 1 auto",
    minHeight: 180,
    margin: "0 12px 12px",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    isolation: "isolate",
    border: "1px solid rgba(255,255,255,0.06)",
    background: "#000",
  }
}

export function getDockWebviewHostStyle(): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
  }
}

export function getEmbedWebviewStyle(placement: EmbedWebviewPlacement): CSSProperties {
  if (placement === "none") {
    return { display: "none", visibility: "hidden" }
  }

  const base: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    border: "none",
    display: "inline-flex",
  }

  if (placement === "visible") {
    return { ...base, visibility: "visible" }
  }

  return {
    ...base,
    visibility: "hidden",
    pointerEvents: "none",
  }
}

export { shouldMountEmbedWebviews }

export interface EmbedBrowserBounds {
  x: number
  y: number
  width: number
  height: number
}

export type EmbedBrowserLayoutPlan =
  | { mode: "hidden" }
  | { mode: "attached"; provider: string; bounds: EmbedBrowserBounds }

export interface EmbedViewport {
  width: number
  height: number
}

/** Reject bounds that would cover the whole panel (Windows black overlay bug). */
export function isValidEmbedHostBounds(
  bounds: EmbedBrowserBounds,
  viewport: EmbedViewport,
): boolean {
  if (bounds.width < 2 || bounds.height < 2) return false
  if (bounds.x < 0 || bounds.y < 0) return false
  if (bounds.width > viewport.width + 1) return false
  if (bounds.height > viewport.height + 1) return false
  if (bounds.x + bounds.width > viewport.width + 2) return false
  // Keep bottom navigation uncovered (~56px). Mini player sits outside the embed host.
  if (bounds.y + bounds.height > viewport.height - 56) return false
  return true
}

/** Never attach BrowserView off-screen — Windows paints a full-window black overlay. */
export function planEmbedBrowserLayout(input: {
  internetTabVisible: boolean
  panelVisible: boolean
  webviewsPinned: boolean
  activeProvider: string
  hostBounds: EmbedBrowserBounds | null
  viewport?: EmbedViewport | null
}): EmbedBrowserLayoutPlan {
  if (!input.internetTabVisible || !input.panelVisible || !input.webviewsPinned) {
    return { mode: "hidden" }
  }
  const bounds = input.hostBounds
  if (!bounds || bounds.width < 2 || bounds.height < 2) {
    return { mode: "hidden" }
  }
  const viewport = input.viewport
  if (viewport && !isValidEmbedHostBounds(bounds, viewport)) {
    return { mode: "hidden" }
  }
  return {
    mode: "attached",
    provider: input.activeProvider,
    bounds: {
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
    },
  }
}

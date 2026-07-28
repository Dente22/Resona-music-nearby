import type { StreamingProvider } from "./types.js"

export type EmbedWebviewPlacement = "visible" | "dock" | "none"

/** Where each provider webview lives — never `fixed` on the webview itself (Windows black overlay). */
export function getEmbedWebviewPlacement(
  provider: StreamingProvider,
  internetTabVisible: boolean,
  webviewsReady: boolean,
  activeProvider: StreamingProvider,
  controlProvider: StreamingProvider | null,
): EmbedWebviewPlacement {
  if (!webviewsReady) return "none"

  if (internetTabVisible && provider === activeProvider) return "visible"

  const isControl = controlProvider === provider
  if (isControl && (!internetTabVisible || provider !== activeProvider)) return "dock"

  return "none"
}

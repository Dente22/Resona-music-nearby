import type { StreamingProvider } from "./types"

export function resolveEmbedControlProvider(
  controlProvider: StreamingProvider | null | undefined,
  embedPlaybackProvider: StreamingProvider | null | undefined,
  activeProvider: StreamingProvider,
): StreamingProvider {
  return controlProvider ?? embedPlaybackProvider ?? activeProvider
}

export function shouldKeepEmbedWebviewsAlive(input: {
  useEmbedTransport: boolean
  embedControlProvider: StreamingProvider | null
  hasEmbedPlayback: boolean
}): boolean {
  return (
    input.useEmbedTransport
    || input.embedControlProvider !== null
    || input.hasEmbedPlayback
  )
}

/**
 * Prefer embed prev/next when the UI is following the live browser queue.
 * Library playlist skip stays on the local queue when `useEmbedTransport` is false.
 */
export function shouldRouteSkipToEmbed(display: {
  isEmbed: boolean
  useEmbedTransport: boolean
}): boolean {
  return display.useEmbedTransport
}

/** Play/pause must drive the embed when the UI is showing browser playback. */
export function shouldRouteTransportToEmbed(display: {
  isEmbed: boolean
  useEmbedTransport: boolean
}): boolean {
  return display.isEmbed || display.useEmbedTransport
}

/**
 * Prev/next: embed when browsing; otherwise library queue; if library has no neighbor
 * while embed audio is on screen, fall back to embed so buttons are never dead.
 */
export function shouldFallbackSkipToEmbed(input: {
  isEmbed: boolean
  useEmbedTransport: boolean
  hasLibraryNeighbor: boolean
}): boolean {
  if (input.useEmbedTransport) return true
  if (input.isEmbed && !input.hasLibraryNeighbor) return true
  return false
}

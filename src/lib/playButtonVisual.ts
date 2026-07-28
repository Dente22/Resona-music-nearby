export type PlayButtonVisual = "play" | "pause" | "loading"

/** Play button glyph while local/embed transport is busy starting a browser track. */
export function resolvePlayButtonVisual(
  isPlaying: boolean,
  isLoading: boolean,
): PlayButtonVisual {
  if (isLoading) return "loading"
  return isPlaying ? "pause" : "play"
}

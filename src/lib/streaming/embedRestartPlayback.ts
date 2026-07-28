import type { StreamingProvider } from "./types.js"

export interface EmbedRestartPlaybackDeps {
  seek: (seconds: number) => void
  executeSeek: (provider: StreamingProvider, seconds: number) => Promise<unknown>
  play: () => void
  onProgressReset: () => void
}

/** Seek embed player to the start, then resume playback. */
export async function restartEmbedPlaybackFromStart(
  provider: StreamingProvider,
  deps: EmbedRestartPlaybackDeps,
): Promise<void> {
  deps.seek(0)
  await deps.executeSeek(provider, 0)
  deps.onProgressReset()
  deps.play()
}

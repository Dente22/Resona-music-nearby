import { describe, it, expect, vi } from "vitest"
import { restartEmbedPlaybackFromStart } from "@/lib/streaming/embedRestartPlayback"

describe("restartEmbedPlaybackFromStart", () => {
  it("seeks to zero and plays", async () => {
    const seek = vi.fn()
    const executeSeek = vi.fn().mockResolvedValue(true)
    const play = vi.fn()
    const onProgressReset = vi.fn()

    await restartEmbedPlaybackFromStart("yandex", {
      seek,
      executeSeek,
      play,
      onProgressReset,
    })

    expect(seek).toHaveBeenCalledWith(0)
    expect(executeSeek).toHaveBeenCalledWith("yandex", 0)
    expect(onProgressReset).toHaveBeenCalled()
    expect(play).toHaveBeenCalled()
  })
})

import { describe, it, expect } from "vitest"
import {
  parseContextMenuConsoleMessage,
  isAddableStreamingUrl,
  EMBED_CONTEXT_MENU_MARKER,
} from "@/lib/streaming/embedContextMenu"

describe("embedContextMenu", () => {
  it("parses console marker URL", () => {
    const url = parseContextMenuConsoleMessage(
      `${EMBED_CONTEXT_MENU_MARKER}https://open.spotify.com/track/abc`,
    )
    expect(url).toBe("https://open.spotify.com/track/abc")
  })

  it("accepts spotify track URLs", () => {
    expect(isAddableStreamingUrl("https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6")).toBe(true)
  })

  it("accepts yandex share links with utm params from context menu", () => {
    expect(
      isAddableStreamingUrl(
        "https://music.yandex.kz/album/8305394/track/56220214?utm_source=web&utm_medium=copy_link",
      ),
    ).toBe(true)
  })

  it("rejects unrelated URLs", () => {
    expect(isAddableStreamingUrl("https://example.com/page")).toBe(false)
  })
})

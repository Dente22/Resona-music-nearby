import { describe, it, expect } from "vitest"
import { mergeLibraryAndStreaming } from "@/lib/streaming/mergeTracks"
import type { Track } from "@/lib/types"

const local: Track = {
  id: "l1",
  title: "Local",
  artist: "A",
  album: "",
  duration: 60,
  downloaded: true,
  img: "",
  filePath: "/a.mp3",
  addedAt: 1,
  source: "local",
}

const stream: Track = {
  id: "s1",
  title: "Stream",
  artist: "B",
  album: "",
  duration: 90,
  downloaded: false,
  img: "",
  filePath: "",
  streamUrl: "https://x.mp3",
  externalId: "ext",
  addedAt: 2,
  source: "spotify",
}

describe("mergeLibraryAndStreaming", () => {
  it("combines local and streaming tracks", () => {
    const merged = mergeLibraryAndStreaming([local], [stream])
    expect(merged).toHaveLength(2)
    expect(merged.map(t => t.id)).toEqual(["l1", "s1"])
  })

  it("dedupes streaming track by external id", () => {
    const dup = { ...stream, id: "s2" }
    const merged = mergeLibraryAndStreaming([], [stream, dup])
    expect(merged).toHaveLength(1)
  })
})

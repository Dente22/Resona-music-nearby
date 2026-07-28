import { describe, it, expect, vi } from "vitest"
import {
  createInitialPlayback,
  selectTrack,
  togglePlay,
  setProgress,
  getNextTrackId,
  getPrevTrackId,
  toggleShuffle,
  cycleRepeatMode,
} from "@/lib/playbackEngine"
import type { Track } from "@/lib/types"

const TRACKS: Track[] = [
  {
    id: "1", title: "A", artist: "X", album: "Al", duration: 100,
    downloaded: true, img: "", filePath: "/a.mp3", addedAt: 1,
  },
  {
    id: "2", title: "B", artist: "Y", album: "Al", duration: 100,
    downloaded: true, img: "", filePath: "/b.mp3", addedAt: 2,
  },
  {
    id: "3", title: "C", artist: "Z", album: "Al", duration: 100,
    downloaded: true, img: "", filePath: "/c.mp3", addedAt: 3,
  },
]

describe("playbackEngine", () => {
  it("starts with no track selected", () => {
    const pb = createInitialPlayback()
    expect(pb.currentTrackId).toBeNull()
    expect(pb.isPlaying).toBe(false)
  })

  it("selects track paused by default", () => {
    let pb = createInitialPlayback()
    pb = selectTrack(pb, "2")
    expect(pb.currentTrackId).toBe("2")
    expect(pb.isPlaying).toBe(false)
    expect(pb.progress).toBe(0)
  })

  it("can select track with autoplay", () => {
    let pb = createInitialPlayback()
    pb = selectTrack(pb, "2", true)
    expect(pb.isPlaying).toBe(true)
  })

  it("toggles play state", () => {
    let pb = selectTrack(createInitialPlayback(), "1", true)
    pb = togglePlay(pb)
    expect(pb.isPlaying).toBe(false)
    pb = togglePlay(pb)
    expect(pb.isPlaying).toBe(true)
  })

  it("updates progress", () => {
    let pb = selectTrack(createInitialPlayback(), "1", true)
    pb = setProgress(pb, 42)
    expect(pb.progress).toBe(42)
  })

  it("gets next track in order", () => {
    expect(getNextTrackId(TRACKS, "1", false, "off")).toBe("2")
    expect(getNextTrackId(TRACKS, "3", false, "off")).toBeNull()
  })

  it("wraps next track when repeat all", () => {
    expect(getNextTrackId(TRACKS, "3", false, "all")).toBe("1")
  })

  it("repeats same track when repeat one", () => {
    expect(getNextTrackId(TRACKS, "2", false, "one")).toBe("2")
  })

  it("gets previous track with wrap", () => {
    expect(getPrevTrackId(TRACKS, "2")).toBe("1")
    expect(getPrevTrackId(TRACKS, "1")).toBe("3")
  })

  it("toggles shuffle", () => {
    let pb = createInitialPlayback()
    pb = toggleShuffle(pb)
    expect(pb.isShuffled).toBe(true)
  })

  it("cycles repeat mode off -> all -> one -> off", () => {
    let pb = createInitialPlayback()
    expect(pb.repeatMode).toBe("off")
    pb = cycleRepeatMode(pb)
    expect(pb.repeatMode).toBe("all")
    pb = cycleRepeatMode(pb)
    expect(pb.repeatMode).toBe("one")
    pb = cycleRepeatMode(pb)
    expect(pb.repeatMode).toBe("off")
  })

  it("gets shuffled next track", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99)
    expect(getNextTrackId(TRACKS, "1", true, "off")).toBe("3")
    vi.restoreAllMocks()
  })

  it("returns null for unknown current track when list empty-ish", () => {
    expect(getNextTrackId([], "1", false, "off")).toBeNull()
    expect(getNextTrackId(TRACKS, "missing", false, "off")).toBe("1")
  })
})

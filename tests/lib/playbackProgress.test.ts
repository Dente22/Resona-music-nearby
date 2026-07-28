import { describe, it, expect } from "vitest"
import {
  hasActivePlaybackTrack,
  isAwaitingEmbedProgress,
  resolveSliderProgress,
  shouldHoldEmbedProgressAfterReset,
  shouldRestartDelegatedTrackFromStart,
} from "@/lib/playbackProgress"

describe("hasActivePlaybackTrack", () => {
  it("is false without queue id or embed title", () => {
    expect(hasActivePlaybackTrack(null, null)).toBe(false)
    expect(hasActivePlaybackTrack("", "")).toBe(false)
  })

  it("is true with a queued track or live embed title", () => {
    expect(hasActivePlaybackTrack("t1", null)).toBe(true)
    expect(hasActivePlaybackTrack(null, "My Wave")).toBe(true)
  })
})

describe("isAwaitingEmbedProgress", () => {
  it("waits for embed sync while pinned library playback has not matched yet", () => {
    expect(
      isAwaitingEmbedProgress({
        isEmbed: true,
        pinnedLibraryPlayback: true,
        embedMatchesQueue: false,
      }),
    ).toBe(true)
  })

  it("does not wait once embed matches the queued track", () => {
    expect(
      isAwaitingEmbedProgress({
        isEmbed: true,
        pinnedLibraryPlayback: true,
        embedMatchesQueue: true,
      }),
    ).toBe(false)
  })

  it("shows early progress while pinned titles are still catching up", () => {
    expect(
      isAwaitingEmbedProgress({
        isEmbed: true,
        pinnedLibraryPlayback: true,
        embedMatchesQueue: false,
        embedIsPlaying: true,
        embedProgress: 8,
      }),
    ).toBe(false)
  })

  it("hides foreign mid-track progress while pinned library track is syncing", () => {
    expect(
      isAwaitingEmbedProgress({
        isEmbed: true,
        pinnedLibraryPlayback: true,
        embedMatchesQueue: false,
        embedIsPlaying: true,
        embedProgress: 95,
      }),
    ).toBe(true)
  })

  it("waits while embed still reports stale mid-track position after library reset", () => {
    expect(
      isAwaitingEmbedProgress({
        isEmbed: true,
        pinnedLibraryPlayback: false,
        embedMatchesQueue: true,
        embedProgress: 195,
        progressResetPending: true,
      }),
    ).toBe(true)
  })
})

describe("shouldHoldEmbedProgressAfterReset", () => {
  it("holds when poll jumps to mid-track after explicit zero reset", () => {
    expect(shouldHoldEmbedProgressAfterReset(0, 195)).toBe(true)
  })

  it("allows low progress after reset", () => {
    expect(shouldHoldEmbedProgressAfterReset(0, 5)).toBe(false)
  })

  it("does not hold when playback was already advancing", () => {
    expect(shouldHoldEmbedProgressAfterReset(30, 35)).toBe(false)
  })
})

describe("shouldRestartDelegatedTrackFromStart", () => {
  it("restarts when embed resumes mid-track", () => {
    expect(shouldRestartDelegatedTrackFromStart(195)).toBe(true)
  })

  it("does not restart when already near the beginning", () => {
    expect(shouldRestartDelegatedTrackFromStart(8)).toBe(false)
  })
})

describe("resolveSliderProgress", () => {
  it("returns 0 when there is no active track", () => {
    expect(
      resolveSliderProgress({
        progress: 88,
        duration: 200,
        isPlaying: true,
        hasActiveTrack: false,
        awaitingEmbedSync: false,
      }),
    ).toBe(0)
  })

  it("returns 0 while waiting for embed playback to sync", () => {
    expect(
      resolveSliderProgress({
        progress: 100,
        duration: 200,
        isPlaying: true,
        hasActiveTrack: true,
        awaitingEmbedSync: true,
      }),
    ).toBe(0)
  })

  it("returns 0 when duration is unknown", () => {
    expect(
      resolveSliderProgress({
        progress: 40,
        duration: 0,
        isPlaying: true,
        hasActiveTrack: true,
        awaitingEmbedSync: false,
      }),
    ).toBe(0)
  })

  it("clamps progress to duration while playing", () => {
    expect(
      resolveSliderProgress({
        progress: 250,
        duration: 200,
        isPlaying: true,
        hasActiveTrack: true,
        awaitingEmbedSync: false,
      }),
    ).toBe(200)
  })

  it("keeps paused mid-track position", () => {
    expect(
      resolveSliderProgress({
        progress: 95,
        duration: 200,
        isPlaying: false,
        hasActiveTrack: true,
        awaitingEmbedSync: false,
      }),
    ).toBe(95)
  })
})

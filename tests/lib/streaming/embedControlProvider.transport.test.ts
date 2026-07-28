import { describe, it, expect } from "vitest"
import {
  shouldFallbackSkipToEmbed,
  shouldKeepEmbedWebviewsAlive,
  shouldRouteSkipToEmbed,
  shouldRouteTransportToEmbed,
} from "@/lib/streaming/embedControlProvider"

describe("shouldRouteTransportToEmbed", () => {
  it("routes controls to embed while browser playback is on screen", () => {
    expect(shouldRouteTransportToEmbed({ isEmbed: true, useEmbedTransport: true })).toBe(true)
    expect(shouldRouteTransportToEmbed({ isEmbed: true, useEmbedTransport: false })).toBe(true)
  })

  it("keeps local transport for local files", () => {
    expect(shouldRouteTransportToEmbed({ isEmbed: false, useEmbedTransport: false })).toBe(false)
  })
})

describe("shouldRouteSkipToEmbed", () => {
  it("uses embed skip only when browsing transport is active", () => {
    expect(shouldRouteSkipToEmbed({ isEmbed: true, useEmbedTransport: true })).toBe(true)
    expect(shouldRouteSkipToEmbed({ isEmbed: true, useEmbedTransport: false })).toBe(false)
  })
})

describe("shouldFallbackSkipToEmbed", () => {
  it("falls back to embed when library has no neighbor", () => {
    expect(
      shouldFallbackSkipToEmbed({
        isEmbed: true,
        useEmbedTransport: false,
        hasLibraryNeighbor: false,
      }),
    ).toBe(true)
  })

  it("keeps library skip when playlist has a neighbor", () => {
    expect(
      shouldFallbackSkipToEmbed({
        isEmbed: true,
        useEmbedTransport: false,
        hasLibraryNeighbor: true,
      }),
    ).toBe(false)
  })
})

describe("shouldKeepEmbedWebviewsAlive", () => {
  it("stays alive for live embed playback without control provider", () => {
    expect(
      shouldKeepEmbedWebviewsAlive({
        useEmbedTransport: true,
        embedControlProvider: null,
        hasEmbedPlayback: true,
      }),
    ).toBe(true)
  })
})

import { describe, it, expect } from "vitest"
import { buildDiscoveryPlan, mergeDiscoveryResults } from "@/lib/trackDiscovery"
import type { FreeTrackResult } from "@/lib/freeMusicSearch"
import type { RecordingMatch } from "@/lib/musicBrainzClient"

describe("trackDiscovery", () => {
  it("builds discovery plan from track identity", () => {
    const plan = buildDiscoveryPlan({
      title: "Chill Beat",
      artist: "LoFi Guy",
      album: "",
      duration: 0,
      searchQuery: "LoFi Guy Chill Beat",
      source: "filename",
    })
    expect(plan.musicBrainzQuery).toContain("Chill Beat")
    expect(plan.jamendoQuery).toBe("LoFi Guy Chill Beat")
  })

  it("merges metadata and free download results", () => {
    const metadata: RecordingMatch = {
      id: "mb-1",
      title: "Chill Beat",
      artist: "LoFi Guy",
      album: "Beats",
      year: "2020",
      durationSec: 180,
    }
    const free: FreeTrackResult[] = [
      {
        source: "jamendo",
        id: "j1",
        title: "Chill Beat",
        artist: "LoFi Guy",
        album: "Free",
        durationSec: 180,
        downloadUrl: "https://mp3d.jamendo.com/?track=1",
        imageUrl: "",
        licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
      },
    ]
    const result = mergeDiscoveryResults(metadata, free)
    expect(result.identified.title).toBe("Chill Beat")
    expect(result.freeDownloads).toHaveLength(1)
    expect(result.freeDownloads[0].licenseUrl).toContain("creativecommons.org")
  })
})

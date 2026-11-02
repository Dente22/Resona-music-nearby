import { describe, expect, it } from "vitest"
import { catalogEndpoint, catalogHasEntries, hubHeaders } from "@/lib/resonaHub"

describe("resonaHub", () => {
  it("uses the portal path on Tailscale HTTPS", () => {
    expect(catalogEndpoint("https://mono.tail.ts.net/", "playlists")).toBe(
      "https://mono.tail.ts.net/api/resona/catalog/playlists",
    )
  })

  it("talks to Jarvis directly on port 8767", () => {
    expect(catalogEndpoint("http://100.64.0.2:8767", "library")).toBe(
      "http://100.64.0.2:8767/v1/resona/catalog/library",
    )
  })

  it("rejects empty and non-http addresses", () => {
    expect(catalogEndpoint("", "library")).toBeNull()
    expect(catalogEndpoint("ftp://server", "library")).toBeNull()
  })

  it("sends the hub write header and an optional bearer token", () => {
    expect(hubHeaders("", true)["X-Hub-Request"]).toBe("1")
    expect(hubHeaders("", true).Authorization).toBeUndefined()
    expect(hubHeaders("secret", false).Authorization).toBe("Bearer secret")
  })

  it("treats an empty server catalog as seedable from a local list", () => {
    expect(catalogHasEntries("library", { tracks: [{ id: "a" }] })).toBe(true)
    expect(catalogHasEntries("playlists", { playlists: [] })).toBe(false)
  })
})

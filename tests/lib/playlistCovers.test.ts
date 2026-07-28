import { describe, it, expect } from "vitest"
import { computePlaylistCover, syncAllPlaylistCovers } from "@/lib/playlistCovers"
import type { Playlist, Track } from "@/lib/types"

const track = (id: string, img: string): Track => ({
  id,
  title: id,
  artist: "A",
  album: "",
  duration: 60,
  downloaded: true,
  img,
  filePath: `/music/${id}.mp3`,
  addedAt: 1,
  source: "local",
})

describe("playlistCovers", () => {
  it("uses first track cover for playlist", () => {
    const pl: Playlist = {
      id: "p1",
      name: "Mix",
      trackIds: ["t1", "t2"],
      img: "",
      createdAt: 0,
    }
    const cover = computePlaylistCover(pl, [
      track("t1", "https://cover1.jpg"),
      track("t2", "https://cover2.jpg"),
    ])
    expect(cover).toBe("https://cover1.jpg")
  })

  it("syncs all playlist covers", () => {
    const playlists: Playlist[] = [
      { id: "p1", name: "A", trackIds: ["t1"], img: "", createdAt: 0 },
    ]
    const synced = syncAllPlaylistCovers(playlists, [track("t1", "https://c.jpg")])
    expect(synced[0].img).toBe("https://c.jpg")
  })
})

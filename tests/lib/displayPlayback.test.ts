import { describe, it, expect } from "vitest"
import { parseEmbedNowPlaying } from "@/lib/streaming/embedNowPlaying"
import { pickDisplayPlayback } from "@/lib/displayPlayback"
import { createInitialPlayback, selectTrack } from "@/lib/playbackEngine"
import type { Track } from "@/lib/types"

describe("parseEmbedNowPlaying", () => {
  it("parses media session data", () => {
    const info = parseEmbedNowPlaying(
      {
        title: "Song",
        artist: "Artist",
        album: "Album",
        img: "https://cover.jpg",
        isPlaying: true,
        duration: 200,
        progress: 50,
      },
      "spotify",
    )
    expect(info?.title).toBe("Song")
    expect(info?.provider).toBe("spotify")
    expect(info?.isPlaying).toBe(true)
  })

  it("parses float duration and progress", () => {
    const info = parseEmbedNowPlaying(
      {
        title: "Song",
        duration: 251.7,
        progress: 42.3,
        isPlaying: true,
      },
      "yandex",
    )
    expect(info?.duration).toBe(251)
    expect(info?.progress).toBe(42)
  })

  it("upscales tiny cover URLs", () => {
    const info = parseEmbedNowPlaying(
      {
        title: "Song",
        img: "https://avatars.mds.yandex.net/i?id=1&size=50",
        isPlaying: true,
      },
      "yandex",
    )
    expect(info?.img).toBe("https://avatars.mds.yandex.net/i?id=1&size=600")
  })
})

describe("pickDisplayPlayback", () => {
  const local: Track = {
    id: "local-1",
    title: "Local",
    artist: "Me",
    album: "",
    duration: 100,
    downloaded: true,
    img: "/img.jpg",
    filePath: "/a.mp3",
    addedAt: 1,
    source: "local",
  }

  const placeholder = "placeholder.png"

  it("prefers local track when playing", () => {
    const pb = selectTrack(createInitialPlayback(), "local-1", true)
    const d = pickDisplayPlayback(
      pb,
      local,
      {
        provider: "spotify",
        title: "Browser",
        artist: "Web",
        album: "",
        img: "https://x.jpg",
        isPlaying: true,
        duration: 100,
        progress: 10,
      },
      placeholder,
    )
    expect(d.isEmbed).toBe(false)
    expect(d.useEmbedTransport).toBe(false)
    expect(d.track?.title).toBe("Local")
  })

  it("shows embed when browser is playing and local is idle", () => {
    const d = pickDisplayPlayback(
      createInitialPlayback(),
      local,
      {
        provider: "yandex",
        title: "Browser",
        artist: "Web",
        album: "",
        img: "https://x.jpg",
        isPlaying: true,
        duration: 100,
        progress: 10,
      },
      placeholder,
    )
    expect(d.isEmbed).toBe(true)
    expect(d.track?.title).toBe("Browser")
    expect(d.track?.img).toBe("https://x.jpg")
  })

  it("shows live embed on now playing even if local isPlaying was left stale", () => {
    const pb = selectTrack(createInitialPlayback(), "local-1", true)
    const d = pickDisplayPlayback(
      pb,
      local,
      {
        provider: "yandex",
        title: "My Wave",
        artist: "KSB muzic",
        album: "",
        img: "https://cover.jpg",
        isPlaying: true,
        duration: 200,
        progress: 55,
        pageUrl: "https://music.yandex.ru/landing",
      },
      placeholder,
      false,
      true,
    )
    expect(d.isEmbed).toBe(true)
    expect(d.track?.title).toBe("My Wave")
    expect(d.isPlaying).toBe(true)
  })

  it("shows live embed on now playing after internet browsing session", () => {
    const pb = selectTrack(createInitialPlayback(), "local-1", false)
    const d = pickDisplayPlayback(
      pb,
      local,
      {
        provider: "yandex",
        title: "My Wave",
        artist: "KSB muzic",
        album: "",
        img: "https://cover.jpg",
        isPlaying: true,
        duration: 200,
        progress: 55,
        pageUrl: "https://music.yandex.ru/landing",
      },
      placeholder,
      false,
      true,
    )
    expect(d.isEmbed).toBe(true)
    expect(d.track?.title).toBe("My Wave")
  })

  it("shows live embed on now playing when browser is active and local queue is paused", () => {
    const pb = selectTrack(createInitialPlayback(), "local-1", false)
    const d = pickDisplayPlayback(
      pb,
      local,
      {
        provider: "yandex",
        title: "My Wave",
        artist: "KSB muzic",
        album: "",
        img: "https://cover.jpg",
        isPlaying: true,
        duration: 200,
        progress: 55,
        pageUrl: "https://music.yandex.ru/landing",
      },
      placeholder,
      false,
      true,
    )
    expect(d.isEmbed).toBe(true)
    expect(d.useEmbedTransport).toBe(true)
    expect(d.track?.title).toBe("My Wave")
    expect(d.isPlaying).toBe(true)
    expect(d.progress).toBe(55)
  })

  it("shows live browser track over paused local selection", () => {
    const pb = selectTrack(createInitialPlayback(), "local-1", false)
    const d = pickDisplayPlayback(
      pb,
      local,
      {
        provider: "yandex",
        title: "I Cant Handle Change",
        artist: "wapoixy",
        album: "",
        img: "https://x.jpg",
        isPlaying: true,
        duration: 100,
        progress: 10,
      },
      placeholder,
      false,
      false,
    )
    expect(d.isEmbed).toBe(true)
    expect(d.track?.title).toBe("I Cant Handle Change")
    expect(d.track?.artist).toBe("wapoixy")
    expect(d.isPlaying).toBe(true)
    expect(d.useEmbedTransport).toBe(true)
  })

  it("keeps paused local when embed is paused and browsing is inactive", () => {
    const pb = selectTrack(createInitialPlayback(), "local-1", false)
    const d = pickDisplayPlayback(
      pb,
      local,
      {
        provider: "yandex",
        title: "Browser",
        artist: "Web",
        album: "",
        img: "https://x.jpg",
        isPlaying: false,
        duration: 100,
        progress: 10,
      },
      placeholder,
      false,
      false,
    )
    expect(d.isEmbed).toBe(false)
    expect(d.track?.title).toBe("Local")
    expect(d.isPlaying).toBe(false)
  })

  it("shows live embed when user navigates away from library yandex track", () => {
    const delegated: Track = {
      id: "y1",
      title: "Queued Song",
      artist: "Artist A",
      album: "",
      duration: 200,
      downloaded: false,
      img: "",
      filePath: "",
      pageUrl: "https://music.yandex.kz/album/1/track/56220214",
      externalId: "56220214",
      source: "yandex",
      addedAt: 1,
    }
    const pb = selectTrack(createInitialPlayback(), "y1", true)
    const d = pickDisplayPlayback(
      pb,
      delegated,
      {
        provider: "yandex",
        title: "My Wave",
        artist: "Yandex",
        album: "",
        img: "https://cover.jpg",
        isPlaying: true,
        duration: 200,
        progress: 40,
        pageUrl: "https://music.yandex.ru/landing",
      },
      placeholder,
      false,
      true,
    )
    expect(d.isEmbed).toBe(true)
    expect(d.useEmbedTransport).toBe(true)
    expect(d.track?.title).toBe("My Wave")
    expect(d.progress).toBe(40)
  })

  it("shows playing on library Yandex card even if embed DOM still says paused", () => {
    const delegated: Track = {
      id: "y1",
      title: "Queued Song",
      artist: "Artist A",
      album: "",
      duration: 200,
      downloaded: false,
      img: "https://cover.jpg",
      filePath: "",
      pageUrl: "https://music.yandex.kz/album/1/track/56220214",
      externalId: "56220214",
      source: "yandex",
      addedAt: 1,
    }
    const pb = selectTrack(createInitialPlayback(), "y1", true)
    const d = pickDisplayPlayback(
      pb,
      delegated,
      {
        provider: "yandex",
        title: "Queued Song",
        artist: "Artist A",
        album: "",
        img: "https://cover.jpg",
        isPlaying: false,
        duration: 200,
        progress: 0,
        pageUrl: delegated.pageUrl,
      },
      placeholder,
      false,
      false,
      "yandex",
      true,
    )
    expect(d.isEmbed).toBe(true)
    expect(d.isPlaying).toBe(true)
    expect(d.useEmbedTransport).toBe(true)
    expect(d.track?.title).toBe("Queued Song")
  })

  it("keeps queued library track visible while switching playlist embed items", () => {
    const delegated: Track = {
      id: "y1",
      title: "Queued Song",
      artist: "Artist A",
      album: "",
      duration: 200,
      downloaded: false,
      img: "",
      filePath: "",
      pageUrl: "https://music.yandex.kz/album/1/track/56220214",
      externalId: "56220214",
      source: "yandex",
      addedAt: 1,
    }
    const pb = selectTrack(createInitialPlayback(), "y1", true)
    const d = pickDisplayPlayback(
      pb,
      delegated,
      {
        provider: "yandex",
        title: "Other Song",
        artist: "Someone else",
        album: "",
        img: "",
        isPlaying: true,
        duration: 200,
        progress: 40,
        pageUrl: "https://music.yandex.ru/track/999",
      },
      placeholder,
      false,
      false,
      "yandex",
    )
    expect(d.isEmbed).toBe(true)
    expect(d.useEmbedTransport).toBe(false)
    expect(d.track?.title).toBe("Queued Song")
    expect(d.isPlaying).toBe(true)
  })

  it("shows library metadata when delegated track paused and embed mismatches off internet tab", () => {
    const delegated: Track = {
      id: "y1",
      title: "Queued Song",
      artist: "Artist A",
      album: "",
      duration: 200,
      downloaded: false,
      img: "",
      filePath: "",
      pageUrl: "https://music.yandex.kz/album/1/track/56220214",
      externalId: "56220214",
      source: "yandex",
      addedAt: 1,
    }
    const pb = selectTrack(createInitialPlayback(), "y1", false)
    const embed = {
      provider: "yandex" as const,
      title: "Other Song",
      artist: "Someone else",
      album: "",
      img: "",
      isPlaying: false,
      duration: 200,
      progress: 40,
      pageUrl: "https://music.yandex.ru/track/999",
    }
    const d = pickDisplayPlayback(pb, delegated, embed, placeholder, false, false, "yandex")
    expect(d.isEmbed).toBe(true)
    expect(d.useEmbedTransport).toBe(false)
    expect(d.track?.title).toBe("Queued Song")
    expect(d.isPlaying).toBe(false)
  })

  it("routes skip to embed on internet tab while delegated track waits to sync", () => {
    const delegated: Track = {
      id: "y1",
      title: "Queued Song",
      artist: "Artist A",
      album: "",
      duration: 200,
      downloaded: false,
      img: "",
      filePath: "",
      pageUrl: "https://music.yandex.kz/album/1/track/56220214",
      externalId: "56220214",
      source: "yandex",
      addedAt: 1,
    }
    const pb = selectTrack(createInitialPlayback(), "y1", true)
    const d = pickDisplayPlayback(
      pb,
      delegated,
      {
        provider: "yandex",
        title: "Other Song",
        artist: "Someone else",
        album: "",
        img: "",
        isPlaying: true,
        duration: 200,
        progress: 40,
        pageUrl: "https://music.yandex.ru/track/999",
      },
      placeholder,
      true,
      false,
      "yandex",
    )
    expect(d.isEmbed).toBe(true)
    expect(d.useEmbedTransport).toBe(true)
  })

  it("keeps embed transport after library merge while browsing", () => {
    const delegated: Track = {
      id: "y1",
      title: "Same Song",
      artist: "Artist A",
      album: "",
      duration: 200,
      downloaded: false,
      img: "",
      filePath: "",
      pageUrl: "https://music.yandex.kz/album/1/track/56220214",
      externalId: "56220214",
      source: "yandex",
      addedAt: 1,
    }
    const pb = selectTrack(createInitialPlayback(), "y1", false)
    const d = pickDisplayPlayback(
      pb,
      delegated,
      {
        provider: "yandex",
        title: "Same Song",
        artist: "Artist A",
        album: "",
        img: "https://cover.jpg",
        isPlaying: true,
        duration: 200,
        progress: 40,
        pageUrl: "https://music.yandex.ru/album/1/track/56220214",
      },
      placeholder,
      false,
      true,
    )
    expect(d.isEmbed).toBe(true)
    expect(d.useEmbedTransport).toBe(true)
    expect(d.track?.title).toBe("Same Song")
  })

  it("keeps queued library track on internet tab while pinned playback has not synced", () => {
    const delegated: Track = {
      id: "y1",
      title: "Queued Song",
      artist: "Artist A",
      album: "",
      duration: 200,
      downloaded: false,
      img: "",
      filePath: "",
      pageUrl: "https://music.yandex.kz/album/1/track/56220214",
      externalId: "56220214",
      source: "yandex",
      addedAt: 1,
    }
    const pb = selectTrack(createInitialPlayback(), "y1", true)
    const d = pickDisplayPlayback(
      pb,
      delegated,
      {
        provider: "yandex",
        title: "My Wave",
        artist: "KSB muzic",
        album: "",
        img: "https://cover.jpg",
        isPlaying: true,
        duration: 200,
        progress: 100,
        pageUrl: "https://music.yandex.ru/landing",
      },
      placeholder,
      true,
      false,
      "yandex",
      true,
    )
    expect(d.track?.title).toBe("Queued Song")
    expect(d.useEmbedTransport).toBe(true)
    expect(d.isPlaying).toBe(true)
    expect(d.progress).toBe(0)
  })

  it("shows live embed on internet tab when browsing without pinned library playback", () => {
    const delegated: Track = {
      id: "y1",
      title: "Queued Song",
      artist: "Artist A",
      album: "",
      duration: 200,
      downloaded: false,
      img: "",
      filePath: "",
      pageUrl: "https://music.yandex.kz/album/1/track/56220214",
      externalId: "56220214",
      source: "yandex",
      addedAt: 1,
    }
    const pb = selectTrack(createInitialPlayback(), "y1", false)
    const d = pickDisplayPlayback(
      pb,
      delegated,
      {
        provider: "yandex",
        title: "My Wave",
        artist: "KSB muzic",
        album: "",
        img: "https://cover.jpg",
        isPlaying: true,
        duration: 200,
        progress: 40,
        pageUrl: "https://music.yandex.ru/landing",
      },
      placeholder,
      true,
      false,
      null,
      false,
    )
    expect(d.track?.title).toBe("My Wave")
    expect(d.useEmbedTransport).toBe(true)
  })

  it("keeps embed transport after pause during browsing session", () => {
    const d = pickDisplayPlayback(
      createInitialPlayback(),
      local,
      {
        provider: "yandex",
        title: "My Wave",
        artist: "KSB muzic",
        album: "",
        img: "https://cover.jpg",
        isPlaying: false,
        duration: 200,
        progress: 55,
        pageUrl: "https://music.yandex.ru/landing",
      },
      placeholder,
      false,
      true,
    )
    expect(d.isEmbed).toBe(true)
    expect(d.useEmbedTransport).toBe(true)
    expect(d.track?.title).toBe("My Wave")
  })
})

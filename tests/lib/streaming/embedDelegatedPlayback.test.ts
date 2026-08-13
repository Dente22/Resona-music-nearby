import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { playDelegatedTrackInEmbed } from "@/lib/streaming/embedDelegatedPlayback"

function startScriptCalls(scripts: string[]) {
  return scripts.filter(s => s.includes("__VW_EMBED__.play"))
}

function verifyScriptCalls(scripts: string[]) {
  return scripts.filter(s => s.includes("__VW_EMBED__.isPlaying"))
}

describe("playDelegatedTrackInEmbed", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("loads track page and starts playback once when start succeeds", async () => {
    const embedLoadUrl = vi.fn().mockResolvedValue(true)
    const embedExecute = vi.fn().mockResolvedValue(true)

    const promise = playDelegatedTrackInEmbed(
      "yandex",
      { mode: "track", url: "https://music.yandex.ru/track/56220214" },
      { embedLoadUrl, embedExecute },
    )
    await vi.runAllTimersAsync()
    const startedUrl = await promise

    expect(startedUrl).toBe("https://music.yandex.ru/track/56220214")
    expect(embedLoadUrl).toHaveBeenCalledTimes(1)
    expect(startScriptCalls(embedExecute.mock.calls.map(c => String(c[1])))).toHaveLength(1)
  })

  it("retries start until the track page is ready", async () => {
    const embedLoadUrl = vi.fn().mockResolvedValue(true)
    let playAttempts = 0
    const embedExecute = vi.fn().mockImplementation(async (_provider, script: string) => {
      const text = String(script)
      if (text.includes("__VW_EMBED__.play")) {
        playAttempts += 1
        return playAttempts >= 3
      }
      if (text.includes("__VW_EMBED__.isPlaying")) return playAttempts >= 3
      return false
    })

    const promise = playDelegatedTrackInEmbed(
      "yandex",
      { mode: "track", url: "https://music.yandex.ru/track/56220214" },
      { embedLoadUrl, embedExecute },
    )
    await vi.runAllTimersAsync()
    const startedUrl = await promise

    expect(startedUrl).toBe("https://music.yandex.ru/track/56220214")
    expect(playAttempts).toBe(3)
    expect(verifyScriptCalls(embedExecute.mock.calls.map(c => String(c[1]))).length).toBeGreaterThan(0)
  })

  it("resolves search to a track url then starts that track", async () => {
    const trackUrl = "https://music.yandex.ru/album/1/track/999"
    const embedLoadUrl = vi.fn().mockResolvedValue(true)
    const embedExecute = vi.fn().mockImplementation(async (_provider, script: string) => {
      if (String(script).includes("Только по дури")) return trackUrl
      if (String(script).includes("location.href") || String(script).includes("isTrackUrl")) return ""
      return true
    })

    const promise = playDelegatedTrackInEmbed(
      "yandex",
      {
        mode: "search",
        provider: "yandex",
        url: "https://music.yandex.ru/search?text=test",
        title: "Только по дури",
        artist: "Ежемесячные",
      },
      { embedLoadUrl, embedExecute },
    )
    await vi.runAllTimersAsync()
    const startedUrl = await promise

    expect(startedUrl).toBe(trackUrl)
    expect(embedLoadUrl).toHaveBeenCalledTimes(1)
    expect(embedLoadUrl).toHaveBeenCalledWith("yandex", trackUrl)
    expect(startScriptCalls(embedExecute.mock.calls.map(c => String(c[1])))).toHaveLength(1)
  })

  it("starts without reload when already on the same track page", async () => {
    const trackUrl = "https://music.yandex.ru/album/1/track/56220214"
    const embedLoadUrl = vi.fn().mockResolvedValue(true)
    const embedExecute = vi.fn().mockImplementation(async (_provider, script: string) => {
      const text = String(script)
      if (text.includes("isTrackUrl") || text.includes("fromPathname") || text.includes("EMBED_TRACK")) {
        return trackUrl
      }
      if (text.includes("location.href") || text.includes("pathname")) return trackUrl
      if (text.includes("__VW_EMBED__.play")) return true
      if (text.includes("__VW_EMBED__.isPlaying")) return true
      return trackUrl
    })
    const embedGetUrl = vi.fn().mockResolvedValue(trackUrl)

    const promise = playDelegatedTrackInEmbed(
      "yandex",
      { mode: "track", url: "https://music.yandex.ru/track/56220214" },
      { embedLoadUrl, embedExecute, embedGetUrl },
    )
    await vi.runAllTimersAsync()
    const startedUrl = await promise

    expect(startedUrl).toBe(trackUrl)
    expect(embedLoadUrl).not.toHaveBeenCalled()
    expect(startScriptCalls(embedExecute.mock.calls.map(c => String(c[1]))).length).toBeGreaterThan(0)
  })

  it("retries find then opens search result when href is missing at first", async () => {
    const trackUrl = "https://music.yandex.ru/album/2/track/777"
    const embedLoadUrl = vi.fn().mockResolvedValue(true)
    let findCalls = 0
    const embedExecute = vi.fn().mockImplementation(async (_provider, script: string) => {
      const text = String(script)
      if (text.includes("dismissPromo") || text.includes("return candidates")) {
        findCalls += 1
        return findCalls >= 3 ? trackUrl : ""
      }
      if (text.includes("window.__VW_EMBED__.play")) return true
      if (text.includes("window.__VW_EMBED__.isPlaying")) return true
      if (text.includes("isTrackUrl") || text.includes("fromPathname")) return ""
      return false
    })

    const promise = playDelegatedTrackInEmbed(
      "yandex",
      {
        mode: "search",
        provider: "yandex",
        url: "https://music.yandex.ru/search?text=%D0%A2%D0%BC%D1%81%D1%82%D1%81",
        title: "Тмстс",
        artist: "Пошлая Молли",
      },
      { embedLoadUrl, embedExecute },
    )
    await vi.runAllTimersAsync()
    const startedUrl = await promise

    expect(startedUrl).toBe(trackUrl)
    expect(findCalls).toBeGreaterThanOrEqual(3)
    expect(embedLoadUrl).toHaveBeenCalledWith("yandex", trackUrl)
  })

  it("opens matching search card when find never returns a href", async () => {
    const trackUrl = "https://music.yandex.ru/track/555"
    const embedLoadUrl = vi.fn().mockResolvedValue(true)
    const embedExecute = vi.fn().mockImplementation(async (_provider, script: string) => {
      const text = String(script)
      if (text.includes("dismissPromo") || text.includes("return candidates")) return ""
      if (text.includes("click(trackLink)") || text.includes("click(titleEl)")) return true
      if (text.includes("isTrackUrl") || text.includes("fromPathname")) return trackUrl
      if (text.includes("window.__VW_EMBED__.play")) return true
      if (text.includes("window.__VW_EMBED__.isPlaying")) return true
      return false
    })

    const promise = playDelegatedTrackInEmbed(
      "yandex",
      {
        mode: "search",
        provider: "yandex",
        url: "https://music.yandex.ru/search?text=test",
        title: "Тмстс",
        artist: "Пошлая Молли",
      },
      { embedLoadUrl, embedExecute },
    )
    await vi.runAllTimersAsync()
    expect(await promise).toBe(trackUrl)
  })

  it("returns null when search finds no track url", async () => {
    const embedLoadUrl = vi.fn().mockResolvedValue(true)
    const embedExecute = vi.fn().mockResolvedValue("")

    const promise = playDelegatedTrackInEmbed(
      "yandex",
      {
        mode: "search",
        provider: "yandex",
        url: "https://music.yandex.ru/search?text=test",
        title: "Missing",
        artist: "Nobody",
      },
      { embedLoadUrl, embedExecute },
    )
    await vi.runAllTimersAsync()
    expect(await promise).toBeNull()
    expect(embedLoadUrl).toHaveBeenCalledTimes(1)
  })

  it("returns null without target url", async () => {
    const ok = await playDelegatedTrackInEmbed(
      "yandex",
      { mode: "track", url: "" },
      { embedLoadUrl: vi.fn(), embedExecute: vi.fn() },
    )
    expect(ok).toBeNull()
  })

  it("does not seek to zero after start to avoid yandex track skips", async () => {
    const embedLoadUrl = vi.fn().mockResolvedValue(true)
    const embedExecute = vi.fn().mockImplementation(async (_provider, script: string) => {
      const text = String(script)
      if (text.includes("__VW_EMBED__.play")) return true
      if (text.includes("__VW_EMBED__.isPlaying")) return true
      return false
    })

    const promise = playDelegatedTrackInEmbed(
      "yandex",
      { mode: "track", url: "https://music.yandex.ru/track/56220214" },
      { embedLoadUrl, embedExecute },
    )
    await vi.runAllTimersAsync()
    await promise

    const seekCalls = embedExecute.mock.calls.filter(([, script]) =>
      String(script).includes("__VW_EMBED__.seek(0)"),
    )
    expect(seekCalls).toHaveLength(0)
  })
})

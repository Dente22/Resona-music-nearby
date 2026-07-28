import { describe, it, expect } from "vitest"
import { getEmbedConfig, hasLoginCookies, isLoginCookie } from "@/lib/streaming/embedConfig"

describe("embedConfig", () => {
  it("returns spotify web url and partition", () => {
    const cfg = getEmbedConfig("spotify")
    expect(cfg.url).toBe("https://open.spotify.com")
    expect(cfg.partition).toContain("spotify")
  })

  it("detects spotify login cookies", () => {
    expect(isLoginCookie("sp_dc", "spotify")).toBe(true)
    expect(
      hasLoginCookies([{ name: "sp_dc", domain: ".spotify.com" }], "spotify"),
    ).toBe(true)
  })

  it("detects yandex login cookies on regional music domains", () => {
    expect(
      hasLoginCookies([{ name: "Session_id", domain: ".music.yandex.kz" }], "yandex"),
    ).toBe(true)
    expect(
      hasLoginCookies([{ name: "Session_id", domain: ".yandex.ru" }], "yandex"),
    ).toBe(true)
  })
})

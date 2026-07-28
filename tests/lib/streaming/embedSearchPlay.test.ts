import { describe, it, expect } from "vitest"
import {
  buildEmbedFindTrackUrlScript,
  buildEmbedOpenSearchTrackScript,
} from "@/lib/streaming/embedSearchPlay"

describe("buildEmbedFindTrackUrlScript", () => {
  it("embeds title and artist and returns a track href without starting playback", () => {
    const script = buildEmbedFindTrackUrlScript("Только по дури", "Ежемесячные")
    expect(script).toContain("Только по дури")
    expect(script).toContain("Ежемесячные")
    expect(script).toContain("/track/")
    expect(script).toContain("return candidates[0].href")
    expect(script).not.toContain("window.__VW_EMBED__.play()")
    expect(script).toContain("dismissPromo")
    expect(script).toContain("findScope")
    expect(script.trim()).toMatch(/return "";\s*\}\)\(\)\s*$/)
  })

  it("avoids bare closest(div) that drops the artist from the match scope", () => {
    const script = buildEmbedFindTrackUrlScript("Тмстс", "Пошлая Молли")
    expect(script).not.toMatch(/closest\([^)]*'div'/)
    expect(script).toContain("HorizontalCard")
    expect(script).toContain("scoreText")
  })
})

describe("buildEmbedOpenSearchTrackScript", () => {
  it("clicks the matching search card without calling embed play()", () => {
    const script = buildEmbedOpenSearchTrackScript("Тмстс", "Пошлая Молли")
    expect(script).toContain("Тмстс")
    expect(script).toContain("Пошлая Молли")
    expect(script).toContain(".click()")
    expect(script).not.toContain("window.__VW_EMBED__.play()")
  })
})

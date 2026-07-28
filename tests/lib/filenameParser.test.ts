import { describe, it, expect } from "vitest"
import {
  stripTrailingNumericId,
  humanizeFilenameSegment,
  parseArtistTitleFromBaseName,
  looksLikeLatinTranslit,
  latinTranslitToCyrillic,
  parseFilenameToTrackMeta,
} from "@/lib/filenameParser"

describe("filenameParser", () => {
  it("strips trailing numeric download ids", () => {
    expect(stripTrailingNumericId("song_title_62681671")).toBe("song_title")
    expect(stripTrailingNumericId("Artist - Title 12345678")).toBe("Artist - Title")
  })

  it("humanizes underscore segments", () => {
    expect(humanizeFilenameSegment("A_golova_chto_by_dumat")).toBe("A golova chto by dumat")
  })

  it("parses Yandex-style Artist_-_Title filenames", () => {
    const parsed = parseArtistTitleFromBaseName(
      "2517_-_A_golova_chto_by_dumat_nogi_chtoby_khodit_62681671",
    )
    expect(parsed.artist).toBe("2517")
    expect(parsed.title).toMatch(/голова/i)
    expect(parsed.title).toMatch(/ходить/i)
  })

  it("parses standard Artist - Title filenames", () => {
    const parsed = parseArtistTitleFromBaseName("Artist Name - Song Title")
    expect(parsed.artist).toBe("Artist Name")
    expect(parsed.title).toBe("Song Title")
  })

  it("detects latin transliteration", () => {
    expect(looksLikeLatinTranslit("A golova chto by dumat")).toBe(true)
    expect(looksLikeLatinTranslit("Daft Punk")).toBe(false)
    expect(looksLikeLatinTranslit("А голова")).toBe(false)
  })

  it("transliterates russian latin filenames to cyrillic", () => {
    const cyr = latinTranslitToCyrillic("golova chto by dumat")
    expect(cyr).toContain("голова")
    expect(cyr).toContain("что")
  })

  it("builds full track meta from downloads path", () => {
    const meta = parseFilenameToTrackMeta(
      "c:\\Users\\Paaaapa\\Downloads\\2517_-_A_golova_chto_by_dumat_nogi_chtoby_khodit_62681671.mp3",
    )
    expect(meta.artist).toBe("2517")
    expect(meta.title).toMatch(/голова/i)
    expect(meta.title).toMatch(/ходить/i)
  })
})

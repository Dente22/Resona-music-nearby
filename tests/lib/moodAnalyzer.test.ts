import { describe, it, expect } from "vitest"
import {
  detectMoodFromTag,
  detectMoodFromText,
  resolveTrackMood,
  moodLabel,
  type TrackMood,
} from "@/lib/moodAnalyzer"

describe("moodAnalyzer", () => {
  it("maps ID3 mood tags", () => {
    expect(detectMoodFromTag("Sad")).toBe("sad")
    expect(detectMoodFromTag("Happy")).toBe("happy")
    expect(detectMoodFromTag("Energetic")).toBe("energetic")
  })

  it("detects sad mood from russian keywords", () => {
    expect(detectMoodFromText("Грустная песня", "Artist")).toBe("sad")
    expect(detectMoodFromText("Melancholy night", "Artist")).toBe("sad")
  })

  it("detects energetic mood from keywords", () => {
    expect(detectMoodFromText("Party banger", "DJ")).toBe("energetic")
    expect(detectMoodFromText("Бодрый утренний трек", "")).toBe("energetic")
  })

  it("prefers explicit mood tag over text guess", () => {
    expect(resolveTrackMood({ moodTag: "Calm", title: "Party hard", artist: "" })).toBe("calm")
  })

  it("falls back to text analysis", () => {
    expect(resolveTrackMood({ title: "Romantic evening", artist: "Love" })).toBe("romantic")
  })

  it("returns unknown when no signals", () => {
    expect(resolveTrackMood({ title: "Track 7", artist: "2517" })).toBe("unknown")
  })

  it("provides localized labels", () => {
    const moods: TrackMood[] = ["sad", "happy", "energetic", "calm", "unknown"]
    for (const m of moods) {
      expect(moodLabel(m).length).toBeGreaterThan(0)
    }
  })
})

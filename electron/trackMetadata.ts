import { analyzeTrackIdentity } from "../src/lib/trackAnalyzer.js"
import { resolveTrackMood, type TrackMood } from "../src/lib/moodAnalyzer.js"
import { readTrackTags } from "./discoveryService.js"
import { extractCoverArtUrl } from "./coverArt.js"

export interface ImportedTrackMeta {
  filePath: string
  title: string
  artist: string
  album: string
  duration: number
  img: string
  mood: TrackMood
}

export async function analyzeTrackForImport(
  filePath: string,
  coversDir: string,
): Promise<ImportedTrackMeta> {
  const tags = await readTrackTags(filePath)
  const identity = analyzeTrackIdentity({ filePath, tags })
  const mood = resolveTrackMood({
    moodTag: tags.mood,
    genre: tags.genre,
    title: identity.title,
    artist: identity.artist,
  })
  const img = await extractCoverArtUrl(filePath, coversDir)

  return {
    filePath,
    title: identity.title,
    artist: identity.artist,
    album: identity.album || "Unknown Album",
    duration: identity.duration,
    img,
    mood,
  }
}

import { getMoodLabel, type AppLocale } from "./i18n/index.js"

export type TrackMood =
  | "sad"
  | "happy"
  | "energetic"
  | "calm"
  | "aggressive"
  | "romantic"
  | "unknown"

export interface MoodInput {
  moodTag?: string
  genre?: string
  title?: string
  artist?: string
}

const TAG_MAP: Record<string, TrackMood> = {
  sad: "sad",
  sorrow: "sad",
  melancholy: "sad",
  depressing: "sad",
  happy: "happy",
  joy: "happy",
  cheerful: "happy",
  upbeat: "happy",
  energetic: "energetic",
  energy: "energetic",
  dance: "energetic",
  party: "energetic",
  calm: "calm",
  relaxing: "calm",
  chill: "calm",
  peaceful: "calm",
  aggressive: "aggressive",
  angry: "aggressive",
  intense: "aggressive",
  romantic: "romantic",
  love: "romantic",
}

const KEYWORD_RULES: Array<{ mood: TrackMood; pattern: RegExp }> = [
  { mood: "sad", pattern: /груст|печал|слез|тоск|melanchol|sorrow|sad|blue|depress|lonely|одинок/i },
  { mood: "happy", pattern: /радост|весел|happy|joy|smile|sunshine|счаст/i },
  { mood: "energetic", pattern: /бодр|энерг|drive|power|party|club|dance|workout|fast|uptempo|banger/i },
  { mood: "calm", pattern: /спокой|relax|chill|ambient|lofi|lo-fi|meditat|soft|lullaby|dream/i },
  { mood: "aggressive", pattern: /агресс|rage|angry|hardcore|metal|punk|brutal|fight|war/i },
  { mood: "romantic", pattern: /romantic|love|любов|нежн|kiss|heart|сердц/i },
]

export function detectMoodFromTag(tag: string): TrackMood | null {
  const key = tag.trim().toLowerCase()
  if (TAG_MAP[key]) return TAG_MAP[key]
  for (const [fragment, mood] of Object.entries(TAG_MAP)) {
    if (key.includes(fragment)) return mood
  }
  return null
}

export function detectMoodFromText(title: string, artist: string, genre = ""): TrackMood {
  const haystack = `${title} ${artist} ${genre}`.trim()
  if (!haystack) return "unknown"

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(haystack)) return rule.mood
  }
  return "unknown"
}

export function resolveTrackMood(input: MoodInput): TrackMood {
  if (input.moodTag) {
    const fromTag = detectMoodFromTag(input.moodTag)
    if (fromTag) return fromTag
  }
  if (input.genre) {
    const fromGenre = detectMoodFromTag(input.genre) ?? detectMoodFromText("", "", input.genre)
    if (fromGenre !== "unknown") return fromGenre
  }
  return detectMoodFromText(input.title ?? "", input.artist ?? "", input.genre ?? "")
}

export function moodLabel(mood: TrackMood, locale: AppLocale = "ru"): string {
  return getMoodLabel(mood, locale)
}

export function moodEmoji(mood: TrackMood): string {
  const icons: Record<TrackMood, string> = {
    sad: "😢",
    happy: "😊",
    energetic: "⚡",
    calm: "🌙",
    aggressive: "🔥",
    romantic: "💜",
    unknown: "🎵",
  }
  return icons[mood]
}

import type { TrackMood } from "@/lib/moodAnalyzer"
import { moodEmoji } from "@/lib/moodAnalyzer"
import { useI18n } from "@/context/I18nContext"
import { getMoodLabel } from "@/lib/i18n"

const MOOD_COLORS: Record<TrackMood, string> = {
  sad: "#60A5FA",
  happy: "#FBBF24",
  energetic: "#F97316",
  calm: "#34D399",
  aggressive: "#EF4444",
  romantic: "#F472B6",
  unknown: "#7878A0",
}

interface MoodBadgeProps {
  mood?: TrackMood
  compact?: boolean
}

export function MoodBadge({ mood = "unknown", compact }: MoodBadgeProps) {
  const { locale } = useI18n()
  const color = MOOD_COLORS[mood]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{
        background: `${color}18`,
        border: `1px solid ${color}33`,
        color,
        fontSize: compact ? "10px" : "11px",
        fontWeight: 600,
      }}
      data-testid={`mood-${mood}`}
    >
      <span>{moodEmoji(mood)}</span>
      {!compact && <span>{getMoodLabel(mood, locale)}</span>}
    </span>
  )
}

import type { TrackMood } from "@/lib/moodAnalyzer"
import { useI18n } from "@/context/I18nContext"
import { getMoodLabel } from "@/lib/i18n"

const MOOD_COLORS: Record<TrackMood, string> = {
  sad: "#2F7FD1",
  happy: "#E8B84A",
  energetic: "#FF5C3A",
  calm: "#2A9D8F",
  aggressive: "#E04545",
  romantic: "#D46A8C",
  unknown: "#6E878A",
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
      className="inline-flex items-center gap-1 px-2 py-0.5"
      style={{
        background: `${color}18`,
        border: `1px solid ${color}33`,
        color,
        fontSize: compact ? "10px" : "11px",
        fontWeight: 700,
        borderRadius: 8,
      }}
      data-testid={`mood-${mood}`}
    >
      {!compact && <span>{getMoodLabel(mood, locale)}</span>}
      {compact && <span>{getMoodLabel(mood, locale)}</span>}
    </span>
  )
}

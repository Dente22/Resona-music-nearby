import { Play, Pause, SkipBack, SkipForward, ChevronUp } from "lucide-react"
import type { Track } from "@/lib/types"

interface PlaybackBarProps {
  track: Track
  isPlaying: boolean
  progress: number
  useEmbedTransport: boolean
  onTogglePlay: () => void
  onPrev: () => void
  onNext: () => void
  onExpand: () => void
}

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60)
  return `${m}:${(seconds % 60).toString().padStart(2, "0")}`
}

export function PlaybackBar({
  track,
  isPlaying,
  progress,
  useEmbedTransport,
  onTogglePlay,
  onPrev,
  onNext,
  onExpand,
}: PlaybackBarProps) {
  const duration = track.duration > 0 ? track.duration : 0
  const progressPct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0

  return (
    <div
      className="mx-3 mb-1 rounded-2xl overflow-hidden select-none"
      style={{
        background: "linear-gradient(135deg, #1E1E32 0%, #1A1A2A 100%)",
        border: "1px solid rgba(139, 92, 246, 0.15)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
      data-testid="playback-bar"
    >
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={onExpand}
      >
        <img
          src={track.img}
          alt={track.title}
          className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "#F0F0FA" }}>
            {track.title}
          </p>
          <p className="text-xs truncate" style={{ color: "#7878A0" }}>
            {track.artist}
          </p>
        </div>
        <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "#4A4A68" }} />
      </button>

      {duration > 0 && (
        <div className="px-4 pb-2">
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${progressPct}%`, background: "#8B5CF6" }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: "#7878A0" }}>{fmt(progress)}</span>
            <span className="text-[10px]" style={{ color: "#7878A0" }}>{fmt(duration)}</span>
          </div>
        </div>
      )}

      <div
        className="flex items-center justify-center gap-5 px-4 pb-3"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onPrev}
          className="w-8 h-8 flex items-center justify-center"
          aria-label="Previous"
        >
          <SkipBack className="w-5 h-5" style={{ color: "#7878A0" }} />
        </button>
        <button
          type="button"
          onClick={onTogglePlay}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(139, 92, 246, 0.25)" }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying
            ? <Pause className="w-5 h-5" style={{ color: "#8B5CF6" }} />
            : <Play className="w-5 h-5 ml-0.5" style={{ color: "#8B5CF6" }} />
          }
        </button>
        <button
          type="button"
          onClick={onNext}
          className="w-8 h-8 flex items-center justify-center"
          aria-label={useEmbedTransport ? "Next in browser" : "Next track"}
        >
          <SkipForward className="w-5 h-5" style={{ color: "#7878A0" }} />
        </button>
      </div>
    </div>
  )
}

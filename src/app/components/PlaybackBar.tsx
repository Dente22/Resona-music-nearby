import { Play, Pause, SkipBack, SkipForward, ChevronUp, Loader2 } from "lucide-react"
import type { Track } from "@/lib/types"
import { resolvePlayButtonVisual } from "@/lib/playButtonVisual"
import { VW } from "@/lib/designTokens"

interface PlaybackBarProps {
  track: Track
  isPlaying: boolean
  isLoading?: boolean
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
  isLoading = false,
  progress,
  useEmbedTransport,
  onTogglePlay,
  onPrev,
  onNext,
  onExpand,
}: PlaybackBarProps) {
  const duration = track.duration > 0 ? track.duration : 0
  const progressPct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0
  const playVisual = resolvePlayButtonVisual(isPlaying, isLoading)

  return (
    <div
      className="mx-3 mb-1 overflow-hidden select-none vw-glass"
      style={{ borderRadius: 20 }}
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
          className="w-11 h-11 object-cover flex-shrink-0"
          style={{ borderRadius: 14 }}
        />
        <div className="flex-1 min-w-0">
          <p className="vw-display text-sm truncate" style={{ color: VW.ink, fontWeight: 700 }}>
            {track.title}
          </p>
          <p className="text-xs truncate" style={{ color: VW.muted }}>
            {track.artist}
          </p>
        </div>
        <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: VW.faint }} />
      </button>

      {duration > 0 && (
        <div className="px-4 pb-2">
          <div
            className="h-1 overflow-hidden"
            style={{ background: VW.track, borderRadius: 999 }}
          >
            <div
              className="h-full"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${VW.sea}, ${VW.accent})`,
                borderRadius: 999,
                transition: "width 0.25s ease",
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: VW.muted }}>{fmt(progress)}</span>
            <span className="text-[10px]" style={{ color: VW.muted }}>{fmt(duration)}</span>
          </div>
        </div>
      )}

      <div
        className="flex items-center justify-center gap-5 px-4 pb-3"
        onClick={e => e.stopPropagation()}
      >
        <button type="button" onClick={onPrev} className="w-8 h-8 flex items-center justify-center" aria-label="Previous">
          <SkipBack className="w-5 h-5" style={{ color: VW.inkSoft }} />
        </button>
        <button
          type="button"
          onClick={onTogglePlay}
          disabled={isLoading}
          aria-busy={isLoading}
          className="w-11 h-11 flex items-center justify-center disabled:opacity-90"
          style={{ background: VW.accent, borderRadius: 16 }}
          aria-label={playVisual === "loading" ? "Loading" : isPlaying ? "Pause" : "Play"}
        >
          {playVisual === "loading"
            ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: VW.white }} />
            : playVisual === "pause"
              ? <Pause className="w-5 h-5" style={{ color: VW.white, fill: VW.white }} />
              : <Play className="w-5 h-5 ml-0.5" style={{ color: VW.white, fill: VW.white }} />
          }
        </button>
        <button
          type="button"
          onClick={onNext}
          className="w-8 h-8 flex items-center justify-center"
          aria-label={useEmbedTransport ? "Next in browser" : "Next track"}
        >
          <SkipForward className="w-5 h-5" style={{ color: VW.inkSoft }} />
        </button>
      </div>
    </div>
  )
}

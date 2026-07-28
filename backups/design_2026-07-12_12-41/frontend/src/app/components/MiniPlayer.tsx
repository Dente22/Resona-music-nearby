import { Play, Pause, SkipForward, ChevronUp } from "lucide-react"

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  downloaded: boolean
  img: string
}

interface MiniPlayerProps {
  track: Track
  isPlaying: boolean
  onTogglePlay: () => void
  onNext: () => void
  onClick: () => void
}

export function MiniPlayer({ track, isPlaying, onTogglePlay, onNext, onClick }: MiniPlayerProps) {
  return (
    <div
      className="mx-3 mb-1 rounded-2xl flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
      style={{
        background: "linear-gradient(135deg, #1E1E32 0%, #1A1A2A 100%)",
        border: "1px solid rgba(139, 92, 246, 0.15)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
      onClick={onClick}
    >
      {/* Album art */}
      <img
        src={track.img}
        alt={track.title}
        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
      />

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "#F0F0FA" }}>
          {track.title}
        </p>
        <p className="text-xs truncate" style={{ color: "#7878A0" }}>
          {track.artist}
        </p>
      </div>

      {/* Expand hint */}
      <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "#4A4A68" }} />

      {/* Controls */}
      <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={onTogglePlay}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 active:scale-95"
          style={{ background: "rgba(139, 92, 246, 0.2)" }}
        >
          {isPlaying
            ? <Pause className="w-4 h-4" style={{ color: "#8B5CF6" }} />
            : <Play className="w-4 h-4 ml-0.5" style={{ color: "#8B5CF6" }} />
          }
        </button>
        <button
          onClick={onNext}
          className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-80 active:scale-95"
        >
          <SkipForward className="w-5 h-5" style={{ color: "#7878A0" }} />
        </button>
      </div>
    </div>
  )
}

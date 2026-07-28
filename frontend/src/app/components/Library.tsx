import { useState } from "react"
import { Search, Plus, CheckCircle2, CloudDownload, WifiOff, Play, Pause, Clock } from "lucide-react"
import type { Track } from "./MiniPlayer"

type Filter = "all" | "downloaded" | "recent"

interface LibraryProps {
  tracks: Track[]
  currentTrackId: string
  onSelectTrack: (id: string) => void
  isPlaying?: boolean
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, "0")}`
}

const ACCENT = "#8B5CF6"
const TEXT = "#F0F0FA"
const SUBTEXT = "#7878A0"
const BORDER = "rgba(255,255,255,0.06)"

export function Library({ tracks, currentTrackId, onSelectTrack, isPlaying }: LibraryProps) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [addPulse, setAddPulse] = useState(false)

  const displayed = tracks.filter(t => {
    const q = query.toLowerCase()
    const matches = t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    if (filter === "downloaded") return matches && t.downloaded
    if (filter === "recent") return matches
    return matches
  })

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "downloaded", label: "Downloaded" },
    { id: "recent", label: "Recent" },
  ]

  const handleAddTracks = () => {
    setAddPulse(true)
    setTimeout(() => setAddPulse(false), 400)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#09090F" }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-3">
        <div className="flex items-center justify-between mb-5">
          <h1 style={{ color: TEXT, fontSize: "26px", fontWeight: 700, lineHeight: 1 }}>
            Library
          </h1>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(52, 211, 153, 0.12)", border: "1px solid rgba(52,211,153,0.2)" }}
          >
            <WifiOff className="w-3 h-3" style={{ color: "#34D399" }} />
            <span style={{ color: "#34D399", fontSize: "11px", fontWeight: 600 }}>Offline</span>
          </div>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4"
          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: SUBTEXT }} />
          <input
            type="text"
            placeholder="Search tracks, artists…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none placeholder:text-[#4A4A68]"
            style={{ color: TEXT, fontSize: "14px" }}
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-4 py-1.5 rounded-full transition-all duration-200 active:scale-95"
              style={{
                background: filter === f.id ? ACCENT : "rgba(255,255,255,0.05)",
                color: filter === f.id ? "#FFFFFF" : SUBTEXT,
                fontSize: "12px",
                fontWeight: filter === f.id ? 600 : 400,
                border: filter === f.id ? "none" : `1px solid ${BORDER}`,
              }}
            >
              {f.label}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-auto">
            <span style={{ color: SUBTEXT, fontSize: "12px" }}>{displayed.length} tracks</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: BORDER, marginBottom: "4px" }} />

      {/* Track list */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <Search className="w-7 h-7" style={{ color: SUBTEXT }} />
            </div>
            <p style={{ color: SUBTEXT, fontSize: "14px", textAlign: "center" }}>
              No tracks match your search
            </p>
          </div>
        ) : (
          <div className="py-2">
            {displayed.map((track, i) => {
              const isCurrent = track.id === currentTrackId
              return (
                <button
                  key={track.id}
                  onClick={() => onSelectTrack(track.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 transition-all duration-150 active:opacity-70"
                  style={{
                    background: isCurrent ? "rgba(139,92,246,0.08)" : "transparent",
                    borderLeft: isCurrent ? `2px solid ${ACCENT}` : "2px solid transparent",
                  }}
                >
                  {/* Art + play overlay */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={track.img}
                      alt={track.title}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    {isCurrent && (
                      <div
                        className="absolute inset-0 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(9,9,15,0.6)" }}
                      >
                        {isPlaying
                          ? <Pause className="w-4 h-4" style={{ color: ACCENT, fill: ACCENT }} />
                          : <Play className="w-4 h-4" style={{ color: ACCENT, fill: ACCENT }} />
                        }
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <p
                      className="truncate"
                      style={{
                        color: isCurrent ? ACCENT : TEXT,
                        fontSize: "14px",
                        fontWeight: isCurrent ? 600 : 500,
                      }}
                    >
                      {track.title}
                    </p>
                    <p className="truncate mt-0.5" style={{ color: SUBTEXT, fontSize: "12px" }}>
                      {track.artist}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span style={{ color: SUBTEXT, fontSize: "12px" }}>{fmt(track.duration)}</span>
                    {track.downloaded ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: "#34D399" }} />
                    ) : (
                      <CloudDownload className="w-4 h-4" style={{ color: SUBTEXT }} />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB – Add tracks */}
      <div className="absolute bottom-[90px] right-5">
        <button
          onClick={handleAddTracks}
          className="flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-200 active:scale-95"
          style={{
            background: `linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)`,
            boxShadow: `0 0 24px rgba(139,92,246,0.5), 0 8px 20px rgba(0,0,0,0.5)`,
            transform: addPulse ? "scale(0.93)" : "scale(1)",
            transitionProperty: "transform, box-shadow",
          }}
        >
          <Plus className="w-4 h-4" style={{ color: "#FFFFFF" }} />
          <span style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 600 }}>Add tracks</span>
        </button>
      </div>
    </div>
  )
}

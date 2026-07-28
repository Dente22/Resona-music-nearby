import { useState } from "react"
import { Search, Plus, CheckCircle2, WifiOff, Play, Pause, Trash2, FolderSearch, Globe, ListPlus } from "lucide-react"
import type { Track, Playlist } from "@/lib/types"
import { MoodBadge } from "./MoodBadge"
import { useI18n } from "@/context/I18nContext"
import { isStreamingTrack } from "@/lib/streaming/trackFactory"
import { getLikesPlaylist } from "@/lib/likesPlaylist"
import { formatTracksCount } from "@/lib/i18n"
import { AddToPlaylistDialog } from "./AddToPlaylistDialog"

type Filter = "all" | "downloaded" | "recent" | "likes"

interface LibraryProps {
  tracks: Track[]
  currentTrackId: string | null
  onSelectTrack: (id: string) => void
  onAddTracks: () => void
  onScanFolders: () => void
  onDeleteTrack: (id: string) => void
  isPlaying?: boolean
  playlists: Playlist[]
  onAddTracksToPlaylist: (playlistId: string, trackIds: string[]) => void
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, "0")}`
}

const ACCENT = "#8B5CF6"
const TEXT = "#F0F0FA"
const SUBTEXT = "#7878A0"
const BORDER = "rgba(255,255,255,0.06)"

export function Library({
  tracks,
  currentTrackId,
  onSelectTrack,
  onAddTracks,
  onScanFolders,
  onDeleteTrack,
  isPlaying,
  playlists,
  onAddTracksToPlaylist,
}: LibraryProps) {
  const { t, locale } = useI18n()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [addPulse, setAddPulse] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false)
  const [trackForPlaylist, setTrackForPlaylist] = useState<string | null>(null)

  const likedIds = new Set(getLikesPlaylist({ playlists })?.trackIds ?? [])

  const displayed = tracks.filter(t => {
    const q = query.toLowerCase()
    const matches = t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    if (filter === "downloaded") return matches && t.downloaded
    if (filter === "likes") return matches && likedIds.has(t.id)
    if (filter === "recent") return matches
    return matches
  })

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t.library.filterAll },
    { id: "likes", label: t.library.filterLikes },
    { id: "downloaded", label: t.library.filterDownloaded },
    { id: "recent", label: t.library.filterRecent },
  ]

  const handleAddTracks = () => {
    setAddPulse(true)
    onAddTracks()
    setTimeout(() => setAddPulse(false), 400)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#09090F" }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-3">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="w-9 h-9 rounded-xl" aria-hidden />
            <h1 style={{ color: TEXT, fontSize: "26px", fontWeight: 700, lineHeight: 1 }}>
              {t.library.title}
            </h1>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: tracks.some(isStreamingTrack)
                ? "rgba(96, 165, 250, 0.12)"
                : "rgba(52, 211, 153, 0.12)",
              border: tracks.some(isStreamingTrack)
                ? "1px solid rgba(96,165,250,0.2)"
                : "1px solid rgba(52,211,153,0.2)",
            }}
          >
            <WifiOff className="w-3 h-3" style={{ color: tracks.some(isStreamingTrack) ? "#60A5FA" : "#34D399" }} />
            <span
              style={{
                color: tracks.some(isStreamingTrack) ? "#60A5FA" : "#34D399",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              {tracks.some(isStreamingTrack) ? t.library.online : t.library.offline}
            </span>
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
            placeholder={t.library.searchPlaceholder}
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
            <span style={{ color: SUBTEXT, fontSize: "12px" }}>{formatTracksCount(displayed.length, locale)}</span>
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
              {t.library.noResults}
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
                    {track.mood && (
                      <div className="mt-1">
                        <MoodBadge mood={track.mood} compact />
                      </div>
                    )}
                    {isStreamingTrack(track) && (
                      <div className="mt-1">
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: "rgba(96,165,250,0.15)", color: "#60A5FA" }}
                        >
                          {t.library.onlineBadge} · {track.source}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Duration + delete */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span style={{ color: SUBTEXT, fontSize: "12px" }}>{fmt(track.duration)}</span>
                    {track.downloaded ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: "#34D399" }} />
                    ) : (
                      <Globe className="w-4 h-4" style={{ color: "#60A5FA" }} />
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setTrackForPlaylist(track.id)
                        setPlaylistDialogOpen(true)
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-full"
                      style={{ background: "rgba(139,92,246,0.12)" }}
                      title={t.playlists.addToPlaylist}
                    >
                      <ListPlus className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (deleteConfirm === track.id) {
                          onDeleteTrack(track.id)
                          setDeleteConfirm(null)
                        } else {
                          setDeleteConfirm(track.id)
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-full"
                      style={{
                        background: deleteConfirm === track.id
                          ? "rgba(239,68,68,0.85)"
                          : "rgba(255,255,255,0.06)",
                      }}
                      data-testid={`delete-track-${track.id}`}
                    >
                      <Trash2
                        className="w-3.5 h-3.5"
                        style={{ color: deleteConfirm === track.id ? "#FFF" : SUBTEXT }}
                      />
                    </button>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* FABs */}
      <div className="absolute bottom-[90px] right-5 flex flex-col gap-2 items-end">
        <button
          onClick={onScanFolders}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 active:scale-95"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: `1px solid ${BORDER}`,
          }}
          data-testid="scan-folders"
        >
          <FolderSearch className="w-4 h-4" style={{ color: ACCENT }} />
          <span style={{ color: TEXT, fontSize: "12px", fontWeight: 600 }}>{t.library.scanFolders}</span>
        </button>
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
          <span style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 600 }}>{t.library.addTracks}</span>
        </button>
      </div>

      <AddToPlaylistDialog
        open={playlistDialogOpen}
        onOpenChange={setPlaylistDialogOpen}
        playlists={playlists}
        onSelect={playlistId => {
          if (trackForPlaylist) onAddTracksToPlaylist(playlistId, [trackForPlaylist])
          setTrackForPlaylist(null)
        }}
      />
    </div>
  )
}

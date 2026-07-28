import { useState } from "react"
import { Search, Plus, CheckCircle2, WifiOff, Play, Pause, Trash2, FolderSearch, Globe, ListPlus } from "lucide-react"
import type { Track, Playlist } from "@/lib/types"
import { MoodBadge } from "./MoodBadge"
import { useI18n } from "@/context/I18nContext"
import { isStreamingTrack } from "@/lib/streaming/trackFactory"
import {
  OFFLINE_BROWSER_TRACK_OPACITY,
  shouldDimOfflineBrowserTrack,
} from "@/lib/streaming/offlineBrowserTrack"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { getLikesPlaylist } from "@/lib/likesPlaylist"
import { formatTracksCount } from "@/lib/i18n"
import { AddToPlaylistDialog } from "./AddToPlaylistDialog"
import { VW } from "@/lib/designTokens"

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
  const isOnline = useOnlineStatus()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [addPulse, setAddPulse] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false)
  const [trackForPlaylist, setTrackForPlaylist] = useState<string | null>(null)

  const likedIds = new Set(getLikesPlaylist({ playlists })?.trackIds ?? [])
  const hasStreaming = tracks.some(isStreamingTrack)

  const displayed = tracks.filter(tr => {
    const q = query.toLowerCase()
    const matches = tr.title.toLowerCase().includes(q) || tr.artist.toLowerCase().includes(q)
    if (filter === "downloaded") return matches && tr.downloaded
    if (filter === "likes") return matches && likedIds.has(tr.id)
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
    <div className="flex flex-col flex-1 overflow-hidden relative vw-fade-up">
      <div className="px-6 pt-14 pb-3">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="vw-display mb-1" style={{ color: VW.sea, fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              {t.app.name}
            </p>
            <h1 className="vw-display" style={{ color: VW.ink, fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
              {t.library.title}
            </h1>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5"
            style={{
              background: hasStreaming ? VW.onlineSoft : VW.seaSoft,
              border: `1px solid ${hasStreaming ? "rgba(47,127,209,0.2)" : "rgba(42,157,143,0.2)"}`,
              borderRadius: 12,
            }}
          >
            <WifiOff className="w-3 h-3" style={{ color: hasStreaming ? VW.online : VW.sea }} />
            <span style={{ color: hasStreaming ? VW.online : VW.sea, fontSize: 11, fontWeight: 700 }}>
              {hasStreaming ? t.library.online : t.library.offline}
            </span>
          </div>
        </div>

        <div
          className="flex items-center gap-3 px-4 py-3 mb-4"
          style={{ background: VW.surface, border: `1px solid ${VW.border}`, borderRadius: 16 }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: VW.muted }} />
          <input
            type="text"
            placeholder={t.library.searchPlaceholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ color: VW.ink, fontSize: 14 }}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-3.5 py-1.5 transition-all duration-200 active:scale-95 flex-shrink-0"
              style={{
                background: filter === f.id ? VW.ink : VW.surface,
                color: filter === f.id ? VW.white : VW.muted,
                fontSize: 12,
                fontWeight: filter === f.id ? 700 : 500,
                border: filter === f.id ? "none" : `1px solid ${VW.border}`,
                borderRadius: 12,
              }}
            >
              {f.label}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-auto pl-2">
            <span style={{ color: VW.muted, fontSize: 12 }}>{formatTracksCount(displayed.length, locale)}</span>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: VW.border, marginBottom: 4 }} />

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
            <div
              className="w-16 h-16 flex items-center justify-center"
              style={{ background: VW.surface, borderRadius: 20 }}
            >
              <Search className="w-7 h-7" style={{ color: VW.muted }} />
            </div>
            <p style={{ color: VW.muted, fontSize: 14, textAlign: "center" }}>
              {t.library.noResults}
            </p>
          </div>
        ) : (
          <div className="py-2 px-3">
            {displayed.map(track => {
              const isCurrent = track.id === currentTrackId
              const dimOffline = shouldDimOfflineBrowserTrack(track, isOnline)
              return (
                <button
                  key={track.id}
                  onClick={() => onSelectTrack(track.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 mb-1 transition-all duration-150 active:opacity-80"
                  style={{
                    background: isCurrent ? VW.accentSoft : "transparent",
                    borderRadius: 16,
                    border: isCurrent ? `1px solid rgba(255,92,58,0.2)` : "1px solid transparent",
                    opacity: dimOffline ? OFFLINE_BROWSER_TRACK_OPACITY : 1,
                  }}
                  title={dimOffline ? t.library.offline : undefined}
                  aria-disabled={dimOffline || undefined}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={track.img}
                      alt={track.title}
                      className="w-12 h-12 object-cover"
                      style={{ borderRadius: 14 }}
                    />
                    {isCurrent && (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: VW.overlay, borderRadius: 14 }}
                      >
                        {isPlaying
                          ? <Pause className="w-4 h-4" style={{ color: VW.white, fill: VW.white }} />
                          : <Play className="w-4 h-4" style={{ color: VW.white, fill: VW.white }} />
                        }
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <p
                      className="truncate"
                      style={{
                        color: isCurrent ? VW.accentStrong : VW.ink,
                        fontSize: 14,
                        fontWeight: isCurrent ? 700 : 600,
                      }}
                    >
                      {track.title}
                    </p>
                    <p className="truncate mt-0.5" style={{ color: VW.muted, fontSize: 12 }}>
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
                          className="inline-flex px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: VW.onlineSoft, color: VW.online, borderRadius: 8 }}
                        >
                          {t.library.onlineBadge} · {track.source}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span style={{ color: VW.muted, fontSize: 12 }}>{fmt(track.duration)}</span>
                    {track.downloaded ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: VW.sea }} />
                    ) : (
                      <Globe className="w-4 h-4" style={{ color: VW.online }} />
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setTrackForPlaylist(track.id)
                        setPlaylistDialogOpen(true)
                      }}
                      className="w-7 h-7 flex items-center justify-center"
                      style={{ background: VW.seaSoft, borderRadius: 10 }}
                      title={t.playlists.addToPlaylist}
                    >
                      <ListPlus className="w-3.5 h-3.5" style={{ color: VW.sea }} />
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
                      className="w-7 h-7 flex items-center justify-center"
                      style={{
                        background: deleteConfirm === track.id ? VW.danger : "rgba(20,43,47,0.05)",
                        borderRadius: 10,
                      }}
                      data-testid={`delete-track-${track.id}`}
                    >
                      <Trash2
                        className="w-3.5 h-3.5"
                        style={{ color: deleteConfirm === track.id ? VW.white : VW.muted }}
                      />
                    </button>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="absolute bottom-[90px] right-5 flex flex-col gap-2 items-end">
        <button
          onClick={onScanFolders}
          className="flex items-center gap-2 px-4 py-2.5 transition-all duration-200 active:scale-95"
          style={{
            background: VW.surface,
            border: `1px solid ${VW.border}`,
            borderRadius: 14,
          }}
          data-testid="scan-folders"
        >
          <FolderSearch className="w-4 h-4" style={{ color: VW.sea }} />
          <span style={{ color: VW.ink, fontSize: 12, fontWeight: 700 }}>{t.library.scanFolders}</span>
        </button>
        <button
          onClick={handleAddTracks}
          className="flex items-center gap-2 px-5 py-3 transition-all duration-200 active:scale-95"
          style={{
            background: VW.accent,
            boxShadow: "0 10px 24px var(--vw-accent-glow)",
            transform: addPulse ? "scale(0.93)" : "scale(1)",
            borderRadius: 16,
          }}
        >
          <Plus className="w-4 h-4" style={{ color: VW.white }} />
          <span style={{ color: VW.white, fontSize: 13, fontWeight: 700 }}>{t.library.addTracks}</span>
        </button>
      </div>

      <AddToPlaylistDialog
        open={playlistDialogOpen}
        onOpenChange={open => {
          setPlaylistDialogOpen(open)
          if (!open) setTrackForPlaylist(null)
        }}
        playlists={playlists}
        track={
          trackForPlaylist
            ? (() => {
                const tr = tracks.find(t => t.id === trackForPlaylist)
                return tr
                  ? { title: tr.title, artist: tr.artist, img: tr.img }
                  : null
              })()
            : null
        }
        onSelect={playlistId => {
          if (trackForPlaylist) onAddTracksToPlaylist(playlistId, [trackForPlaylist])
          setTrackForPlaylist(null)
        }}
      />
    </div>
  )
}

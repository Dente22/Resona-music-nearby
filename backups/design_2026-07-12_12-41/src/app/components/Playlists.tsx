import { useState } from "react"
import { Plus, Trash2, ListMusic, X, Check, ArrowLeft, Link2, Play, Globe } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import type { Track, Playlist } from "@/lib/types"
import { useI18n } from "@/context/I18nContext"
import { formatPlaylistsCount, formatPlaylistTracksCount } from "@/lib/i18n"
import { resolvePlaylistTracks, countResolvedPlaylistTracks } from "@/lib/playlistTracks"
import { isStreamingTrack } from "@/lib/streaming/trackFactory"
import { isLikesPlaylist, sortPlaylistsWithLikesFirst } from "@/lib/likesPlaylist"

interface PlaylistsProps {
  tracks: Track[]
  playlists: Playlist[]
  onPlaylistsChange: (p: Playlist[]) => void
  onSelectTrack: (id: string) => void
  onAddTracksToPlaylist: (playlistId: string, trackIds: string[]) => void
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void
  onImportUrlToPlaylist: (playlistId: string, url: string) => Promise<{ ok: boolean; error?: string }>
}

const ACCENT = "#8B5CF6"
const TEXT = "#F0F0FA"
const SUBTEXT = "#7878A0"
const BORDER = "rgba(255,255,255,0.06)"

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, "0")}`
}

function importErrorMessage(error: string | undefined, t: ReturnType<typeof useI18n>["t"]) {
  if (error === "not_logged_in") return t.playlists.importErrorNotLoggedIn
  if (error === "unsupported_url") return t.playlists.importErrorUnsupported
  if (error === "no_stream_url") return t.playlists.importErrorNoStream
  return t.playlists.importErrorNoTracks
}

export function Playlists({
  tracks,
  playlists,
  onPlaylistsChange,
  onSelectTrack,
  onAddTracksToPlaylist,
  onRemoveTrackFromPlaylist,
  onImportUrlToPlaylist,
}: PlaylistsProps) {
  const { t, locale } = useI18n()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [urlDialogOpen, setUrlDialogOpen] = useState(false)
  const [importUrl, setImportUrl] = useState("")
  const [importError, setImportError] = useState("")
  const [importing, setImporting] = useState(false)
  const [pickedTrackIds, setPickedTrackIds] = useState<Set<string>>(new Set())

  const sortedPlaylists = sortPlaylistsWithLikesFirst(playlists)
  const selected = sortedPlaylists.find(p => p.id === selectedId) ?? null
  const selectedTracks = selected ? resolvePlaylistTracks(selected, tracks) : []

  const handleCreate = () => {
    if (!newName.trim()) return
    const fallbackImg = tracks[0]?.img ?? ""
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newName.trim(),
      trackIds: [],
      img: fallbackImg,
      createdAt: Date.now(),
    }
    onPlaylistsChange([...playlists, newPlaylist])
    setNewName("")
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (isLikesPlaylist({ id })) return
    if (confirmDelete === id) {
      onPlaylistsChange(playlists.filter(p => p.id !== id))
      setConfirmDelete(null)
      if (selectedId === id) setSelectedId(null)
    } else {
      setConfirmDelete(id)
    }
  }

  const getMosaicImgs = (pl: Playlist) => {
    const pts = resolvePlaylistTracks(pl, tracks)
    if (pts.length === 0) return [pl.img]
    return [...new Set(pts.map(tr => tr.img))].slice(0, 4)
  }

  const togglePickTrack = (id: string) => {
    setPickedTrackIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const confirmAddPicked = () => {
    if (!selected || pickedTrackIds.size === 0) return
    onAddTracksToPlaylist(selected.id, [...pickedTrackIds])
    setPickedTrackIds(new Set())
    setAddDialogOpen(false)
  }

  const handleImport = async () => {
    if (!selected || !importUrl.trim()) return
    setImporting(true)
    setImportError("")
    const result = await onImportUrlToPlaylist(selected.id, importUrl.trim())
    setImporting(false)
    if (!result.ok) {
      setImportError(importErrorMessage(result.error, t))
      return
    }
    setImportUrl("")
    setUrlDialogOpen(false)
  }

  if (selected) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#09090F" }}>
        <div className="px-5 pt-14 pb-3 shrink-0">
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1.5 mb-3 active:opacity-70"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: ACCENT }} />
            <span style={{ color: ACCENT, fontSize: "13px", fontWeight: 600 }}>{t.playlists.back}</span>
          </button>
          <h1 style={{ color: TEXT, fontSize: "22px", fontWeight: 700 }}>{selected.name}</h1>
          <p style={{ color: SUBTEXT, fontSize: "12px", marginTop: "4px" }}>
            {formatPlaylistTracksCount(selectedTracks.length, locale)} · {t.playlists.mixedHint}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                setPickedTrackIds(new Set())
                setAddDialogOpen(true)
              }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(139,92,246,0.15)", border: `1px solid rgba(139,92,246,0.35)`, color: ACCENT }}
            >
              {t.playlists.addTracks}
            </button>
            <button
              onClick={() => {
                setImportError("")
                setUrlDialogOpen(true)
              }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: TEXT }}
            >
              <Link2 className="w-3.5 h-3.5" />
              {t.playlists.addFromUrl}
            </button>
          </div>
        </div>

        <div style={{ height: "1px", background: BORDER }} />

        <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: "none" }}>
          {selectedTracks.length === 0 ? (
            <p className="text-center px-6 py-12" style={{ color: SUBTEXT, fontSize: "14px" }}>
              {t.playlists.noTracksInPlaylist}
            </p>
          ) : (
            selectedTracks.map(track => (
              <div
                key={track.id}
                className="flex items-center gap-3 px-5 py-3"
                style={{ borderLeft: `2px solid transparent` }}
              >
                <button
                  onClick={() => onSelectTrack(track.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-70"
                >
                  <img src={track.img} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate" style={{ color: TEXT, fontSize: "14px", fontWeight: 500 }}>
                      {track.title}
                    </p>
                    <p className="truncate" style={{ color: SUBTEXT, fontSize: "12px" }}>
                      {track.artist}
                    </p>
                    {isStreamingTrack(track) && (
                      <span
                        className="inline-flex mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={{ background: "rgba(96,165,250,0.15)", color: "#60A5FA" }}
                      >
                        {track.source}
                      </span>
                    )}
                  </div>
                  <span style={{ color: SUBTEXT, fontSize: "12px" }}>{fmt(track.duration)}</span>
                  <Play className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                </button>
                <button
                  onClick={() => onRemoveTrackFromPlaylist(selected.id, track.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                  title={t.playlists.removeFromPlaylist}
                >
                  <X className="w-3.5 h-3.5" style={{ color: SUBTEXT }} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pick from library */}
        <Dialog.Root open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)" }} />
            <Dialog.Content
              className="fixed z-50 left-1/2 top-1/2 w-[340px] max-h-[75vh] rounded-3xl p-5 outline-none flex flex-col"
              style={{ transform: "translate(-50%, -50%)", background: "#1A1A2C", border: `1px solid ${BORDER}` }}
            >
              <Dialog.Title style={{ color: TEXT, fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>
                {t.playlists.pickTracks}
              </Dialog.Title>
              <div className="flex-1 overflow-y-auto flex flex-col gap-1 mb-4" style={{ scrollbarWidth: "none" }}>
                {tracks.map(track => {
                  const picked = pickedTrackIds.has(track.id)
                  const inPlaylist = selected.trackIds.includes(track.id)
                  return (
                    <button
                      key={track.id}
                      disabled={inPlaylist}
                      onClick={() => togglePickTrack(track.id)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-left"
                      style={{
                        background: picked ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.04)",
                        opacity: inPlaylist ? 0.45 : 1,
                      }}
                    >
                      <img src={track.img} alt="" className="w-9 h-9 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ color: TEXT, fontSize: "13px" }}>{track.title}</p>
                        <p className="truncate" style={{ color: SUBTEXT, fontSize: "11px" }}>{track.artist}</p>
                      </div>
                      {isStreamingTrack(track) ? (
                        <Globe className="w-3.5 h-3.5" style={{ color: "#60A5FA" }} />
                      ) : picked ? (
                        <Check className="w-4 h-4" style={{ color: ACCENT }} />
                      ) : null}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={confirmAddPicked}
                disabled={pickedTrackIds.size === 0}
                className="w-full py-3 rounded-2xl font-semibold text-sm"
                style={{
                  background: pickedTrackIds.size ? "linear-gradient(135deg, #A78BFA, #7C3AED)" : "rgba(255,255,255,0.06)",
                  color: pickedTrackIds.size ? "#FFF" : SUBTEXT,
                }}
              >
                {t.playlists.addTracks}
              </button>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Import URL */}
        <Dialog.Root open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)" }} />
            <Dialog.Content
              className="fixed z-50 left-1/2 top-1/2 w-[320px] rounded-3xl p-5 outline-none"
              style={{ transform: "translate(-50%, -50%)", background: "#1A1A2C", border: `1px solid ${BORDER}` }}
            >
              <Dialog.Title style={{ color: TEXT, fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>
                {t.playlists.addFromUrl}
              </Dialog.Title>
              <input
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                placeholder={t.playlists.urlPlaceholder}
                className="w-full px-4 py-3 rounded-xl mb-3 outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: TEXT, fontSize: "13px" }}
              />
              {importError && (
                <p className="mb-3 text-xs" style={{ color: "#F87171" }}>{importError}</p>
              )}
              <button
                onClick={() => void handleImport()}
                disabled={!importUrl.trim() || importing}
                className="w-full py-3 rounded-2xl font-semibold text-sm"
                style={{
                  background: importUrl.trim() ? "linear-gradient(135deg, #A78BFA, #7C3AED)" : "rgba(255,255,255,0.06)",
                  color: importUrl.trim() ? "#FFF" : SUBTEXT,
                }}
              >
                {t.playlists.import}
              </button>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#09090F" }}>
      <div className="px-6 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <h1 style={{ color: TEXT, fontSize: "26px", fontWeight: 700, lineHeight: 1 }}>
            {t.playlists.title}
          </h1>
          <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
            <Dialog.Trigger asChild>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full active:scale-95 transition-transform duration-150"
                style={{ background: "rgba(139,92,246,0.15)", border: `1px solid rgba(139,92,246,0.3)` }}
              >
                <Plus className="w-4 h-4" style={{ color: ACCENT }} />
                <span style={{ color: ACCENT, fontSize: "13px", fontWeight: 600 }}>{t.playlists.new}</span>
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
              <Dialog.Content
                className="fixed z-50 left-1/2 top-1/2 w-[320px] rounded-3xl p-6 outline-none"
                style={{ transform: "translate(-50%, -50%)", background: "#1A1A2C", border: `1px solid ${BORDER}`, boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <Dialog.Title style={{ color: TEXT, fontSize: "18px", fontWeight: 700 }}>
                    {t.playlists.newPlaylist}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="w-7 h-7 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <X className="w-4 h-4" style={{ color: SUBTEXT }} />
                    </button>
                  </Dialog.Close>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-5" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}>
                  <ListMusic className="w-4 h-4 flex-shrink-0" style={{ color: SUBTEXT }} />
                  <input
                    autoFocus
                    type="text"
                    placeholder={t.playlists.namePlaceholder}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                    className="flex-1 bg-transparent outline-none placeholder:text-[#4A4A68]"
                    style={{ color: TEXT, fontSize: "15px" }}
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="w-full py-3.5 rounded-2xl transition-all duration-150 active:scale-98"
                  style={{
                    background: newName.trim() ? "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)" : "rgba(255,255,255,0.06)",
                    color: newName.trim() ? "#FFFFFF" : SUBTEXT,
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: newName.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  {t.playlists.create}
                </button>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
        <p style={{ color: SUBTEXT, fontSize: "13px", marginTop: "6px" }}>
          {formatPlaylistsCount(playlists.length, locale)}
        </p>
      </div>

      <div style={{ height: "1px", background: BORDER }} />

      <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: "none" }}>
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.08)", border: `1px dashed rgba(139,92,246,0.25)` }}>
              <ListMusic className="w-9 h-9" style={{ color: "rgba(139,92,246,0.4)" }} />
            </div>
            <p style={{ color: SUBTEXT, fontSize: "14px", textAlign: "center" }}>
              {t.playlists.empty} {t.playlists.emptyHint}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {sortedPlaylists.map(pl => {
              const imgs = getMosaicImgs(pl)
              const trackCount = countResolvedPlaylistTracks(pl, tracks)
              const isDeletePending = confirmDelete === pl.id
              const isLikes = isLikesPlaylist(pl)

              return (
                <div
                  key={pl.id}
                  className="relative flex flex-col rounded-2xl overflow-hidden active:scale-[0.97] transition-transform duration-150 cursor-pointer"
                  style={{ background: "#131320", border: `1px solid ${BORDER}` }}
                  onClick={() => {
                    setConfirmDelete(null)
                    setSelectedId(pl.id)
                  }}
                >
                  <div className="relative w-full aspect-square overflow-hidden">
                    {imgs.length >= 4 ? (
                      <div className="grid grid-cols-2 w-full h-full">
                        {imgs.slice(0, 4).map((img, idx) => (
                          <img key={idx} src={img} alt="" className="w-full h-full object-cover" />
                        ))}
                      </div>
                    ) : (
                      <img src={imgs[0] ?? pl.img} alt={pl.name} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(19,19,32,0.85) 0%, transparent 50%)" }} />
                    {trackCount === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(19,19,32,0.7)" }}>
                        <ListMusic className="w-8 h-8" style={{ color: "rgba(139,92,246,0.5)" }} />
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-3">
                    <p className="truncate" style={{ color: TEXT, fontSize: "13px", fontWeight: 600 }}>{pl.name}</p>
                    <p style={{ color: SUBTEXT, fontSize: "11px", marginTop: "2px" }}>
                      {formatPlaylistTracksCount(trackCount, locale)}
                    </p>
                  </div>
                  {!isLikes && (
                  <button
                    className="absolute top-2 right-2 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
                    onClick={e => {
                      e.stopPropagation()
                      handleDelete(pl.id)
                    }}
                    style={{
                      width: "28px",
                      height: "28px",
                      background: isDeletePending ? "rgba(239,68,68,0.85)" : "rgba(0,0,0,0.55)",
                      backdropFilter: "blur(4px)",
                      border: isDeletePending ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {isDeletePending
                      ? <Check className="w-3.5 h-3.5" style={{ color: "#FFFFFF" }} />
                      : <Trash2 className="w-3.5 h-3.5" style={{ color: "#7878A0" }} />
                    }
                  </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

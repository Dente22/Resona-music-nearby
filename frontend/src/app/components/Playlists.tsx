import { useState } from "react"
import { Plus, Trash2, ListMusic, X, Check } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import type { Track } from "./MiniPlayer"

export interface Playlist {
  id: string
  name: string
  trackIds: string[]
  img: string
}

interface PlaylistsProps {
  tracks: Track[]
  playlists: Playlist[]
  onPlaylistsChange: (p: Playlist[]) => void
  onSelectTrack: (id: string) => void
}

const ACCENT = "#8B5CF6"
const TEXT = "#F0F0FA"
const SUBTEXT = "#7878A0"
const BORDER = "rgba(255,255,255,0.06)"

export function Playlists({ tracks, playlists, onPlaylistsChange, onSelectTrack }: PlaylistsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleCreate = () => {
    if (!newName.trim()) return
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newName.trim(),
      trackIds: [],
      img: tracks[Math.floor(Math.random() * tracks.length)].img,
    }
    onPlaylistsChange([...playlists, newPlaylist])
    setNewName("")
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      onPlaylistsChange(playlists.filter(p => p.id !== id))
      setConfirmDelete(null)
      setDeleteTarget(null)
    } else {
      setConfirmDelete(id)
    }
  }

  const getPlaylistTracks = (pl: Playlist) =>
    pl.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]

  const getMosaicImgs = (pl: Playlist) => {
    const pts = getPlaylistTracks(pl)
    if (pts.length === 0) return [pl.img]
    const imgs = [...new Set(pts.map(t => t.img))]
    return imgs.slice(0, 4)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#09090F" }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <h1 style={{ color: TEXT, fontSize: "26px", fontWeight: 700, lineHeight: 1 }}>
            Playlists
          </h1>
          <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
            <Dialog.Trigger asChild>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full active:scale-95 transition-transform duration-150"
                style={{
                  background: "rgba(139,92,246,0.15)",
                  border: `1px solid rgba(139,92,246,0.3)`,
                }}
              >
                <Plus className="w-4 h-4" style={{ color: ACCENT }} />
                <span style={{ color: ACCENT, fontSize: "13px", fontWeight: 600 }}>New</span>
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay
                className="fixed inset-0 z-40"
                style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
              />
              <Dialog.Content
                className="fixed z-50 left-1/2 top-1/2 w-[320px] rounded-3xl p-6 outline-none"
                style={{
                  transform: "translate(-50%, -50%)",
                  background: "#1A1A2C",
                  border: `1px solid ${BORDER}`,
                  boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <Dialog.Title style={{ color: TEXT, fontSize: "18px", fontWeight: 700 }}>
                    New Playlist
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-full active:opacity-60"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <X className="w-4 h-4" style={{ color: SUBTEXT }} />
                    </button>
                  </Dialog.Close>
                </div>

                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-5"
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}
                >
                  <ListMusic className="w-4 h-4 flex-shrink-0" style={{ color: SUBTEXT }} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Playlist name…"
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
                    background: newName.trim()
                      ? "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)"
                      : "rgba(255,255,255,0.06)",
                    color: newName.trim() ? "#FFFFFF" : SUBTEXT,
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: newName.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Create Playlist
                </button>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
        <p style={{ color: SUBTEXT, fontSize: "13px", marginTop: "6px" }}>
          {playlists.length} playlist{playlists.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: BORDER }} />

      {/* Grid */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4"
        style={{ scrollbarWidth: "none" }}
      >
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.08)", border: `1px dashed rgba(139,92,246,0.25)` }}
            >
              <ListMusic className="w-9 h-9" style={{ color: "rgba(139,92,246,0.4)" }} />
            </div>
            <p style={{ color: SUBTEXT, fontSize: "14px", textAlign: "center" }}>
              No playlists yet. Tap <strong style={{ color: ACCENT }}>New</strong> to create one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {playlists.map(pl => {
              const imgs = getMosaicImgs(pl)
              const trackCount = pl.trackIds.length
              const isDeletePending = confirmDelete === pl.id

              return (
                <div
                  key={pl.id}
                  className="relative flex flex-col rounded-2xl overflow-hidden active:scale-[0.97] transition-transform duration-150 cursor-pointer"
                  style={{ background: "#131320", border: `1px solid ${BORDER}` }}
                  onClick={() => {
                    setConfirmDelete(null)
                    setDeleteTarget(null)
                    if (pl.trackIds.length > 0) onSelectTrack(pl.trackIds[0])
                  }}
                >
                  {/* Cover mosaic */}
                  <div className="relative w-full aspect-square overflow-hidden">
                    {imgs.length >= 4 ? (
                      <div className="grid grid-cols-2 w-full h-full">
                        {imgs.slice(0, 4).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ))}
                      </div>
                    ) : (
                      <img
                        src={imgs[0] ?? pl.img}
                        alt={pl.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {/* Gradient overlay */}
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(19,19,32,0.85) 0%, transparent 50%)" }}
                    />
                    {trackCount === 0 && (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(19,19,32,0.7)" }}
                      >
                        <ListMusic className="w-8 h-8" style={{ color: "rgba(139,92,246,0.5)" }} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-3 py-3">
                    <p
                      className="truncate"
                      style={{ color: TEXT, fontSize: "13px", fontWeight: 600 }}
                    >
                      {pl.name}
                    </p>
                    <p style={{ color: SUBTEXT, fontSize: "11px", marginTop: "2px" }}>
                      {trackCount} track{trackCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    className="absolute top-2 right-2 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
                    onClick={e => {
                      e.stopPropagation()
                      handleDelete(pl.id)
                    }}
                    style={{
                      width: isDeletePending ? "28px" : "28px",
                      height: "28px",
                      background: isDeletePending
                        ? "rgba(239,68,68,0.85)"
                        : "rgba(0,0,0,0.55)",
                      backdropFilter: "blur(4px)",
                      border: isDeletePending ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {isDeletePending
                      ? <Check className="w-3.5 h-3.5" style={{ color: "#FFFFFF" }} />
                      : <Trash2 className="w-3.5 h-3.5" style={{ color: "#7878A0" }} />
                    }
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { ListMusic, X } from "lucide-react"
import type { Playlist } from "@/lib/types"
import { useI18n } from "@/context/I18nContext"
import { formatPlaylistTracksCount } from "@/lib/i18n"
import { PLACEHOLDER_COVER, VW } from "@/lib/designTokens"

export interface AddToPlaylistTrackPreview {
  title: string
  artist: string
  img?: string
}

interface AddToPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlists: Playlist[]
  onSelect: (playlistId: string) => void
  track?: AddToPlaylistTrackPreview | null
}

export function AddToPlaylistDialog({
  open,
  onOpenChange,
  playlists,
  onSelect,
  track = null,
}: AddToPlaylistDialogProps) {
  const { t, locale } = useI18n()
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setPortalHost(document.querySelector(".vw-shell") as HTMLElement | null)
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={portalHost ?? undefined}>
        <Dialog.Overlay
          className="fixed inset-0 z-[200]"
          style={{
            background: "rgba(12, 20, 22, 0.72)",
            backdropFilter: "blur(10px)",
          }}
        />
        <Dialog.Content
          className="fixed z-[210] left-1/2 top-1/2 w-[min(340px,calc(100%-32px))] max-h-[70vh] p-5 outline-none flex flex-col"
          style={{
            transform: "translate(-50%, -50%)",
            background: "#FFFFFF",
            color: "#142B2F",
            border: "1px solid rgba(20,43,47,0.14)",
            boxShadow: "0 28px 64px rgba(0,0,0,0.45)",
            borderRadius: 24,
          }}
        >
          <div className="flex items-center justify-between mb-3 shrink-0">
            <Dialog.Title
              className="vw-display"
              style={{ color: "#142B2F", fontSize: 16, fontWeight: 800 }}
            >
              {t.playlists.selectPlaylist}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="w-8 h-8 flex items-center justify-center"
                style={{ background: "rgba(20,43,47,0.06)", borderRadius: 12 }}
                aria-label="Close"
              >
                <X className="w-4 h-4" style={{ color: "#6E878A" }} />
              </button>
            </Dialog.Close>
          </div>

          {track?.title?.trim() ? (
            <div
              className="flex items-center gap-3 mb-4 shrink-0 px-3 py-2.5"
              style={{
                background: "#E7EFEC",
                border: "1px solid rgba(20,43,47,0.08)",
                borderRadius: 16,
              }}
            >
              <img
                src={track.img?.trim() || PLACEHOLDER_COVER}
                alt=""
                className="w-11 h-11 object-cover shrink-0"
                style={{ borderRadius: 12, background: "#D8E8E4" }}
              />
              <div className="min-w-0 flex-1">
                <p style={{ color: "#6E878A", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                  {t.playlists.addToPlaylist}
                </p>
                <p className="truncate" style={{ color: "#142B2F", fontSize: 13, fontWeight: 800 }}>
                  {track.title}
                </p>
                <p className="truncate" style={{ color: "#6E878A", fontSize: 12 }}>
                  {track.artist || "—"}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto flex flex-col gap-2" style={{ scrollbarWidth: "none" }}>
            {playlists.length === 0 ? (
              <p style={{ color: "#6E878A", fontSize: 13, textAlign: "center", padding: "16px 0" }}>
                {t.playlists.empty}
              </p>
            ) : (
              playlists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => {
                    onSelect(pl.id)
                    onOpenChange(false)
                  }}
                  className="flex items-center gap-3 px-3 py-3 text-left active:scale-[0.98] transition-transform"
                  style={{
                    background: "#F3F7F5",
                    border: "1px solid rgba(20,43,47,0.1)",
                    borderRadius: 14,
                  }}
                >
                  <span
                    className="w-9 h-9 flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,92,58,0.14)", borderRadius: 12 }}
                  >
                    <ListMusic className="w-4 h-4" style={{ color: VW.accent }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate" style={{ color: "#142B2F", fontSize: 14, fontWeight: 700 }}>
                      {pl.name}
                    </p>
                    <p style={{ color: "#6E878A", fontSize: 12 }}>
                      {formatPlaylistTracksCount(pl.trackIds.length, locale)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

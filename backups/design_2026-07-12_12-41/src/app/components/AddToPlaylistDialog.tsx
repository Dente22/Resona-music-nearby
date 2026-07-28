import * as Dialog from "@radix-ui/react-dialog"
import { ListMusic, X } from "lucide-react"
import type { Playlist } from "@/lib/types"
import { useI18n } from "@/context/I18nContext"
import { formatPlaylistTracksCount } from "@/lib/i18n"

const ACCENT = "#8B5CF6"
const TEXT = "#F0F0FA"
const SUBTEXT = "#7878A0"
const BORDER = "rgba(255,255,255,0.06)"

interface AddToPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlists: Playlist[]
  onSelect: (playlistId: string) => void
}

export function AddToPlaylistDialog({
  open,
  onOpenChange,
  playlists,
  onSelect,
}: AddToPlaylistDialogProps) {
  const { t, locale } = useI18n()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        />
        <Dialog.Content
          className="fixed z-50 left-1/2 top-1/2 w-[320px] max-h-[70vh] rounded-3xl p-5 outline-none flex flex-col"
          style={{
            transform: "translate(-50%, -50%)",
            background: "#1A1A2C",
            border: `1px solid ${BORDER}`,
            boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          }}
        >
          <div className="flex items-center justify-between mb-4 shrink-0">
            <Dialog.Title style={{ color: TEXT, fontSize: "16px", fontWeight: 700 }}>
              {t.playlists.selectPlaylist}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="w-7 h-7 flex items-center justify-center rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <X className="w-4 h-4" style={{ color: SUBTEXT }} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2" style={{ scrollbarWidth: "none" }}>
            {playlists.length === 0 ? (
              <p style={{ color: SUBTEXT, fontSize: "13px", textAlign: "center", padding: "16px 0" }}>
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
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left active:scale-[0.98] transition-transform"
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}
                >
                  <ListMusic className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate" style={{ color: TEXT, fontSize: "13px", fontWeight: 600 }}>
                      {pl.name}
                    </p>
                    <p style={{ color: SUBTEXT, fontSize: "11px" }}>
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

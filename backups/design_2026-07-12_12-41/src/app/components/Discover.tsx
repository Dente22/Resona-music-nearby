import { useState } from "react"
import { Download, Globe, Search, Music2, Loader2, ListMusic } from "lucide-react"
import type { Track } from "@/lib/types"
import type { DiscoveryResult, PlaylistTrackItem } from "@/global"
import { useI18n } from "@/context/I18nContext"

interface DiscoverProps {
  tracks: Track[]
  jamendoConfigured: boolean
  onDiscover: (payload: {
    filePath?: string | null
    artist?: string
    title?: string
  }) => Promise<DiscoveryResult>
  onDownload: (payload: {
    downloadUrl: string
    title: string
    artist: string
  }) => Promise<void>
  onResolvePlaylist: (url: string) => Promise<{ tracks: PlaylistTrackItem[]; error?: string }>
  onImportPlaylist: (tracks: PlaylistTrackItem[]) => Promise<number>
}

const ACCENT = "#8B5CF6"
const TEXT = "#F0F0FA"
const SUBTEXT = "#7878A0"
const BORDER = "rgba(255,255,255,0.06)"

export function Discover({
  tracks,
  jamendoConfigured,
  onDiscover,
  onDownload,
  onResolvePlaylist,
  onImportPlaylist,
}: DiscoverProps) {
  const { t } = useI18n()
  const [artist, setArtist] = useState("")
  const [title, setTitle] = useState("")
  const [playlistUrl, setPlaylistUrl] = useState("")
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrackItem[]>([])
  const [selectedTrackId, setSelectedTrackId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [playlistLoading, setPlaylistLoading] = useState(false)
  const [importingPlaylist, setImportingPlaylist] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [result, setResult] = useState<DiscoveryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [playlistMessage, setPlaylistMessage] = useState<string | null>(null)

  const selectedTrack = tracks.find(t => t.id === selectedTrackId)

  async function handleSearch() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = selectedTrack
        ? { filePath: selectedTrack.filePath }
        : { artist, title }
      const data = await onDiscover(payload)
      setResult(data)
      if (!data.freeDownloads.length && !data.identified.title) {
        setError(t.discover.nothingFound)
      }
    } catch {
      setError(t.discover.searchError)
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(item: DiscoveryResult["freeDownloads"][0]) {
    setDownloadingId(item.id)
    setError(null)
    try {
      await onDownload({
        downloadUrl: item.downloadUrl,
        title: item.title,
        artist: item.artist,
      })
    } catch {
      setError(t.discover.downloadError)
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleLoadPlaylist() {
    setPlaylistLoading(true)
    setError(null)
    setPlaylistMessage(null)
    setPlaylistTracks([])
    try {
      const { tracks: found, error: resolveError } = await onResolvePlaylist(playlistUrl)
      if (resolveError) {
        setError(resolveError)
        return
      }
      setPlaylistTracks(found)
      setPlaylistMessage(t.discover.playlistFound(found.length))
    } catch {
      setError(t.discover.playlistLoadError)
    } finally {
      setPlaylistLoading(false)
    }
  }

  async function handleImportPlaylist() {
    if (!playlistTracks.length) return
    setImportingPlaylist(true)
    setError(null)
    try {
      const count = await onImportPlaylist(playlistTracks)
      setPlaylistMessage(t.discover.playlistImportSuccess(count))
      setPlaylistTracks([])
      setPlaylistUrl("")
    } catch {
      setError(t.discover.playlistImportError)
    } finally {
      setImportingPlaylist(false)
    }
  }

  const identified = result?.identified

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#09090F" }}>
      <div className="px-6 pt-14 pb-3">
        <div className="flex items-center gap-3 mb-2">
          <img src="/icon.png" alt="" className="w-9 h-9 rounded-xl" aria-hidden />
          <h1 style={{ color: TEXT, fontSize: "26px", fontWeight: 700 }}>{t.discover.title}</h1>
        </div>
        <p style={{ color: SUBTEXT, fontSize: "12px", lineHeight: 1.5 }}>
          {t.discover.subtitle}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
        <section
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "rgba(139,92,246,0.06)", border: `1px solid rgba(139,92,246,0.2)` }}
        >
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4" style={{ color: ACCENT }} />
            <span style={{ color: TEXT, fontSize: "14px", fontWeight: 600 }}>{t.discover.playlistSection}</span>
          </div>
          <input
            placeholder={t.discover.playlistPlaceholder}
            value={playlistUrl}
            onChange={e => setPlaylistUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-transparent outline-none"
            style={{ color: TEXT, border: `1px solid ${BORDER}`, fontSize: "13px" }}
            data-testid="playlist-url"
          />
          <p style={{ color: SUBTEXT, fontSize: "11px", lineHeight: 1.4 }}>
            {t.discover.playlistHint}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleLoadPlaylist}
              disabled={playlistLoading || !playlistUrl.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.08)", color: TEXT, fontSize: "13px", fontWeight: 600 }}
              data-testid="playlist-load"
            >
              {playlistLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {t.discover.loadList}
            </button>
            <button
              onClick={handleImportPlaylist}
              disabled={importingPlaylist || !playlistTracks.length}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl disabled:opacity-40"
              style={{ background: ACCENT, color: "#FFF", fontSize: "13px", fontWeight: 600 }}
              data-testid="playlist-import"
            >
              {importingPlaylist ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {t.discover.downloadAll}
            </button>
          </div>
          {playlistMessage && (
            <p style={{ color: "#34D399", fontSize: "12px" }} data-testid="playlist-message">
              {playlistMessage}
            </p>
          )}
          {playlistTracks.length > 0 && (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {playlistTracks.map((t, i) => (
                <p key={`${t.downloadUrl}-${i}`} className="truncate" style={{ color: SUBTEXT, fontSize: "11px" }}>
                  {t.artist} — {t.title}
                </p>
              ))}
            </div>
          )}
        </section>

        {!jamendoConfigured && (
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}
          >
            <p style={{ color: "#FCD34D", fontSize: "12px" }}>
              {t.discover.jamendoWarning}
            </p>
          </div>
        )}

        <section
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}
        >
          <span style={{ color: TEXT, fontSize: "14px", fontWeight: 600 }}>{t.discover.fromLibrary}</span>
          <select
            value={selectedTrackId}
            onChange={e => {
              setSelectedTrackId(e.target.value)
              const t = tracks.find(tr => tr.id === e.target.value)
              if (t) {
                setArtist(t.artist)
                setTitle(t.title)
              }
            }}
            className="w-full px-4 py-3 rounded-xl bg-transparent outline-none"
            style={{ color: TEXT, border: `1px solid ${BORDER}`, fontSize: "14px" }}
            data-testid="discover-track-select"
          >
            <option value="">{t.discover.selectTrack}</option>
            {tracks.map(t => (
              <option key={t.id} value={t.id}>
                {t.artist} — {t.title}
              </option>
            ))}
          </select>
        </section>

        <section
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}
        >
          <span style={{ color: TEXT, fontSize: "14px", fontWeight: 600 }}>{t.discover.manual}</span>
          <input
            placeholder={t.discover.artistPlaceholder}
            value={artist}
            onChange={e => setArtist(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-transparent outline-none"
            style={{ color: TEXT, border: `1px solid ${BORDER}`, fontSize: "14px" }}
            data-testid="discover-artist"
          />
          <input
            placeholder={t.discover.titlePlaceholder}
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-transparent outline-none"
            style={{ color: TEXT, border: `1px solid ${BORDER}`, fontSize: "14px" }}
            data-testid="discover-title"
          />
        </section>

        <button
          onClick={handleSearch}
          disabled={loading || (!selectedTrackId && !artist && !title)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: ACCENT, color: "#FFF", fontWeight: 600, fontSize: "14px" }}
          data-testid="discover-search"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? t.discover.searching : t.discover.search}
        </button>

        {error && (
          <p style={{ color: "#F87171", fontSize: "12px" }} data-testid="discover-error">
            {error}
          </p>
        )}

        {identified && (identified.title || identified.artist) && (
          <section
            className="rounded-2xl p-4"
            style={{ background: "rgba(139,92,246,0.08)", border: `1px solid rgba(139,92,246,0.2)` }}
            data-testid="discover-identified"
          >
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4" style={{ color: ACCENT }} />
              <span style={{ color: TEXT, fontSize: "13px", fontWeight: 600 }}>{t.discover.musicBrainz}</span>
            </div>
            <p style={{ color: TEXT, fontSize: "15px", fontWeight: 600 }}>{identified.title}</p>
            <p style={{ color: SUBTEXT, fontSize: "13px" }}>{identified.artist}</p>
            {identified.album && (
              <p style={{ color: SUBTEXT, fontSize: "12px" }}>
                {identified.album}
                {identified.year ? ` · ${identified.year}` : ""}
              </p>
            )}
          </section>
        )}

        {result?.freeDownloads.map(item => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}
            data-testid="discover-result"
          >
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(139,92,246,0.15)" }}
              >
                <Music2 className="w-5 h-5" style={{ color: ACCENT }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ color: TEXT, fontSize: "13px", fontWeight: 600 }}>
                {item.title}
              </p>
              <p className="truncate" style={{ color: SUBTEXT, fontSize: "12px" }}>
                {item.artist}
              </p>
              {item.licenseUrl && (
                <p className="truncate" style={{ color: "#34D399", fontSize: "10px" }}>
                  {t.discover.creativeCommons}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDownload(item)}
              disabled={downloadingId === item.id}
              className="p-2 rounded-lg"
              style={{ background: "rgba(139,92,246,0.2)" }}
              title={t.discover.downloadTitle}
              data-testid="discover-download"
            >
              {downloadingId === item.id ? (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: ACCENT }} />
              ) : (
                <Download className="w-4 h-4" style={{ color: ACCENT }} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

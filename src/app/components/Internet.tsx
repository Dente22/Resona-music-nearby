import { useCallback, useEffect, useRef, useState } from "react"
import { Globe, LogOut, RefreshCw, Link2, ListPlus } from "lucide-react"
import { useI18n } from "@/context/I18nContext"
import { getMusicPlayerApi } from "@/lib/electronApi"
import { shouldPinWebviews } from "@/lib/streaming/embedPanelLifecycle"
import { resolveEmbedControlProvider } from "@/lib/streaming/embedControlProvider"
import { shouldPollEmbedAfterControl } from "@/lib/streaming/embedPlaylistDrive"
import { planEmbedBrowserLayout } from "@/lib/streaming/embedPanelLayout"
import {
  EMBED_NOW_PLAYING_SCRIPT,
  EMBED_PAUSE_SCRIPT,
  EMBED_PLAY_SCRIPT,
  EMBED_NEXT_SCRIPT,
  EMBED_PREV_SCRIPT,
  EMBED_EXPAND_YANDEX_PLAYER_SCRIPT,
  EMBED_YANDEX_TRANSPORT_READY_SCRIPT,
  buildEmbedSeekScript,
  parseEmbedNowPlaying,
  type EmbedNowPlaying,
  type EmbedNowPlayingRaw,
} from "@/lib/streaming/embedNowPlaying"
import {
  EMBED_LIKE_SCRIPT,
  EMBED_UNLIKE_SCRIPT,
  buildEmbedVolumeScript,
} from "@/lib/streaming/embedPlayerControls"
import { clampVolumePercent } from "@/lib/streaming/volumePercent"
import {
  isAddableStreamingUrl,
  parseContextMenuConsoleMessage,
} from "@/lib/streaming/embedContextMenu"
import { EMBED_TRACK_URL_SCRIPT, resolveBrowserImportUrl } from "@/lib/streaming/embedTrackUrl"
import type { StreamingProvider } from "@/lib/streaming/types"
import type { Playlist } from "@/lib/types"
import { AddToPlaylistDialog } from "./AddToPlaylistDialog"
import { VW } from "@/lib/designTokens"

export interface EmbedSessionInfo {
  provider: StreamingProvider
  loggedIn: boolean
  url: string
  partition: string
}

interface InternetProps {
  visible: boolean
  panelVisible: boolean
  volume: number
  controlProvider?: StreamingProvider | null
  playbackProvider?: StreamingProvider | null
  keepWebviewsAlive?: boolean
  getEmbedStatus: () => Promise<{ spotify: EmbedSessionInfo; yandex: EmbedSessionInfo }>
  clearEmbedSession: (provider: StreamingProvider) => Promise<boolean>
  playlists: Playlist[]
  onImportUrlToPlaylist: (playlistId: string, url: string) => Promise<{ ok: boolean; error?: string }>
  onEmbedNowPlayingChange: (info: EmbedNowPlaying | null) => void
  onClearEmbedNowPlaying: () => void
  onRegisterEmbedControls: (controls: {
    play: () => void
    pause: () => void
    seek: (seconds: number) => void
    prev: () => void
    next: () => void
    like: () => void
    unlike: () => void
    setVolume: (percent: number) => void
    getPageUrl: () => string
  }) => void
  onEmbedHostReady?: () => void
  getEmbedImportUrl: () => string
}

const POLL_MS = 800
const YANDEX_EXPAND_DELAY_MS = 400

const ACCENT = VW.accent
const TEXT = VW.ink
const SUBTEXT = VW.muted
const BORDER = VW.border

function importErrorMessage(error: string | undefined, t: ReturnType<typeof useI18n>["t"]) {
  if (error === "not_logged_in") return t.playlists.importErrorNotLoggedIn
  if (error === "unsupported_url") return t.playlists.importErrorUnsupported
  if (error === "no_stream_url") return t.playlists.importErrorNoStream
  return t.playlists.importErrorNoTracks
}

export function Internet({
  visible,
  panelVisible,
  volume,
  controlProvider,
  playbackProvider,
  keepWebviewsAlive = false,
  getEmbedStatus,
  clearEmbedSession,
  playlists,
  onImportUrlToPlaylist,
  onEmbedNowPlayingChange,
  onClearEmbedNowPlaying,
  onRegisterEmbedControls,
  onEmbedHostReady,
  getEmbedImportUrl,
}: InternetProps) {
  const { t } = useI18n()
  const api = getMusicPlayerApi()
  const [activeProvider, setActiveProvider] = useState<StreamingProvider>("spotify")
  const [loggedIn, setLoggedIn] = useState(false)
  const [importUrl, setImportUrl] = useState("")
  const [importStatus, setImportStatus] = useState("")
  const [importing, setImporting] = useState(false)
  const [pendingUrl, setPendingUrl] = useState("")
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false)
  const [embedPinned, setEmbedPinned] = useState(false)
  const hostRef = useRef<HTMLDivElement>(null)

  const activeProviderRef = useRef(activeProvider)
  activeProviderRef.current = activeProvider
  const playlistsRef = useRef(playlists)
  playlistsRef.current = playlists
  const tRef = useRef(t)
  tRef.current = t
  const livePageUrlRef = useRef("")
  const controlProviderRef = useRef(controlProvider)
  controlProviderRef.current = controlProvider
  const playbackProviderRef = useRef(playbackProvider)
  playbackProviderRef.current = playbackProvider

  const getControlProvider = useCallback(
    () =>
      resolveEmbedControlProvider(
        controlProviderRef.current,
        playbackProviderRef.current,
        activeProviderRef.current,
      ),
    [],
  )

  const execOnProvider = useCallback(
    async (provider: StreamingProvider, script: string) => {
      return api.embedExecute(provider, script)
    },
    [api],
  )

  const focusControlProvider = useCallback(() => {
    const provider = controlProviderRef.current
    if (provider && provider !== activeProviderRef.current) {
      setActiveProvider(provider)
    }
  }, [])

  const webviewsActive = embedPinned || Boolean(controlProvider) || keepWebviewsAlive

  useEffect(() => {
    if (controlProvider) setEmbedPinned(true)
  }, [controlProvider])

  useEffect(() => {
    if (keepWebviewsAlive) setEmbedPinned(true)
  }, [keepWebviewsAlive])

  useEffect(() => {
    if (playbackProvider) setActiveProvider(playbackProvider)
  }, [playbackProvider])

  useEffect(() => {
    if (visible && !embedPinned) {
      setEmbedPinned(true)
    }
  }, [visible, embedPinned])

  useEffect(() => {
    if (visible && controlProvider) {
      setActiveProvider(controlProvider)
    }
  }, [visible, controlProvider])

  const syncEmbedLayout = useCallback(() => {
    if (!visible || !panelVisible || !embedPinned) {
      void api.embedLayout({ visible: false })
      return
    }

    const el = hostRef.current
    if (!el) {
      void api.embedLayout({ visible: false })
      return
    }

    const rect = el.getBoundingClientRect()
    const hostBounds = {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    }

    const plan = planEmbedBrowserLayout({
      internetTabVisible: visible,
      panelVisible,
      webviewsPinned: embedPinned,
      activeProvider,
      hostBounds,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    })

    if (plan.mode === "hidden") {
      void api.embedLayout({ visible: false })
      return
    }

    void api.embedLayout({
      visible: true,
      provider: plan.provider as StreamingProvider,
      bounds: plan.bounds,
    })
    onEmbedHostReady?.()
  }, [visible, panelVisible, embedPinned, activeProvider, api, onEmbedHostReady])

  useEffect(() => {
    if (!visible) {
      void api.embedLayout({ visible: false })
    }
  }, [visible, api])

  useEffect(() => {
    if (!visible || !panelVisible || !embedPinned) return

    let cancelled = false
    const measure = () => {
      if (!cancelled) syncEmbedLayout()
    }

    requestAnimationFrame(() => requestAnimationFrame(measure))

    const el = hostRef.current
    if (!el) return () => {
      cancelled = true
    }

    const observer = new ResizeObserver(() => measure())
    observer.observe(el)
    window.addEventListener("resize", measure)
    return () => {
      cancelled = true
      observer.disconnect()
      window.removeEventListener("resize", measure)
      void api.embedLayout({ visible: false })
    }
  }, [visible, panelVisible, embedPinned, syncEmbedLayout, api])

  const refreshLogin = useCallback(async () => {
    const status = await getEmbedStatus()
    setLoggedIn(status[activeProvider].loggedIn)
  }, [activeProvider, getEmbedStatus])

  const parsePollResult = useCallback(
    async (raw: EmbedNowPlayingRaw | null, provider: StreamingProvider) => {
      let parsed = parseEmbedNowPlaying(raw, provider)
      if (!parsed) return null
      if (!parsed.pageUrl?.trim()) {
        try {
          const trackUrl = (await execOnProvider(provider, EMBED_TRACK_URL_SCRIPT)) as string
          if (trackUrl?.trim()) parsed = { ...parsed, pageUrl: trackUrl.trim() }
        } catch {
          // ignore
        }
      }
      const pageUrl = parsed.pageUrl?.trim() || (await api.embedGetUrl(provider))
      livePageUrlRef.current = pageUrl
      return parsed
    },
    [api, execOnProvider],
  )

  const pollNowPlaying = useCallback(async () => {
    const providers: StreamingProvider[] = controlProviderRef.current
      ? [controlProviderRef.current]
      : ["spotify", "yandex"]

    let best: EmbedNowPlaying | null = null
    for (const provider of providers) {
      try {
        const raw = (await execOnProvider(
          provider,
          EMBED_NOW_PLAYING_SCRIPT,
        )) as EmbedNowPlayingRaw | null
        const parsed = await parsePollResult(raw, provider)
        if (!parsed?.title?.trim()) continue
        if (!best || parsed.isPlaying || (!best.isPlaying && parsed.progress > best.progress)) {
          best = parsed
        }
      } catch {
        // embed not ready
      }
    }
    if (best) onEmbedNowPlayingChange(best)
  }, [execOnProvider, onEmbedNowPlayingChange, parsePollResult])

  const pauseEmbed = useCallback(async () => {
    focusControlProvider()
    const provider = getControlProvider()
    try {
      await execOnProvider(provider, EMBED_PAUSE_SCRIPT)
      const raw = (await execOnProvider(
        provider,
        EMBED_NOW_PLAYING_SCRIPT,
      )) as EmbedNowPlayingRaw | null
      const parsed = await parsePollResult(
        raw ? { ...raw, isPlaying: false } : raw,
        provider,
      )
      onEmbedNowPlayingChange(parsed)
    } catch {
      // ignore
    }
  }, [execOnProvider, focusControlProvider, getControlProvider, onEmbedNowPlayingChange, parsePollResult])

  const playEmbed = useCallback(async () => {
    focusControlProvider()
    const provider = getControlProvider()
    try {
      await execOnProvider(provider, EMBED_PLAY_SCRIPT)
      await pollNowPlaying()
    } catch {
      // ignore
    }
  }, [execOnProvider, focusControlProvider, getControlProvider, pollNowPlaying])

  const prepareYandexTransport = useCallback(async (provider: StreamingProvider) => {
    if (provider !== "yandex") return
    try {
      const ready = await execOnProvider(provider, EMBED_YANDEX_TRANSPORT_READY_SCRIPT)
      if (!ready) {
        await execOnProvider(provider, EMBED_EXPAND_YANDEX_PLAYER_SCRIPT)
        await new Promise(resolve => setTimeout(resolve, YANDEX_EXPAND_DELAY_MS))
      }
    } catch {
      // embed not ready
    }
  }, [execOnProvider])

  const prevEmbed = useCallback(async () => {
    focusControlProvider()
    const provider = getControlProvider()
    try {
      await prepareYandexTransport(provider)
      let ok = await execOnProvider(provider, EMBED_PREV_SCRIPT)
      if (!ok && provider === "yandex") {
        await execOnProvider(provider, EMBED_EXPAND_YANDEX_PLAYER_SCRIPT)
        await new Promise(resolve => setTimeout(resolve, YANDEX_EXPAND_DELAY_MS))
        ok = await execOnProvider(provider, EMBED_PREV_SCRIPT)
      }
      await pollNowPlaying()
    } catch {
      // ignore
    }
  }, [execOnProvider, focusControlProvider, getControlProvider, pollNowPlaying, prepareYandexTransport])

  const nextEmbed = useCallback(async () => {
    focusControlProvider()
    const provider = getControlProvider()
    try {
      await prepareYandexTransport(provider)
      let ok = await execOnProvider(provider, EMBED_NEXT_SCRIPT)
      if (!ok && provider === "yandex") {
        await execOnProvider(provider, EMBED_EXPAND_YANDEX_PLAYER_SCRIPT)
        await new Promise(resolve => setTimeout(resolve, YANDEX_EXPAND_DELAY_MS))
        ok = await execOnProvider(provider, EMBED_NEXT_SCRIPT)
      }
      await pollNowPlaying()
    } catch {
      // ignore
    }
  }, [execOnProvider, focusControlProvider, getControlProvider, pollNowPlaying, prepareYandexTransport])

  const seekEmbed = useCallback(
    async (seconds: number) => {
      focusControlProvider()
      const provider = getControlProvider()
      try {
        await execOnProvider(provider, buildEmbedSeekScript(seconds))
        if (shouldPollEmbedAfterControl(controlProviderRef.current)) {
          await pollNowPlaying()
        }
      } catch {
        // ignore
      }
    },
    [execOnProvider, focusControlProvider, getControlProvider, pollNowPlaying],
  )

  const applyEmbedVolume = useCallback(
    async (percent: number) => {
      const pct = clampVolumePercent(percent)
      const script = buildEmbedVolumeScript(pct)
      const targets = new Set<StreamingProvider>()
      const control = getControlProvider()
      if (control) targets.add(control)
      if (playbackProvider) targets.add(playbackProvider)
      if (activeProviderRef.current) targets.add(activeProviderRef.current)
      if (targets.size === 0) {
        targets.add("spotify")
        targets.add("yandex")
      }
      await Promise.all(
        [...targets].map(async provider => {
          try {
            await api.embedExecute(provider, script)
          } catch {
            // embed not ready
          }
        }),
      )
    },
    [api, getControlProvider, playbackProvider],
  )

  useEffect(() => {
    void applyEmbedVolume(volume)
  }, [applyEmbedVolume, volume, webviewsActive, controlProvider, playbackProvider, activeProvider])

  useEffect(() => {
    onRegisterEmbedControls({
      play: () => void playEmbed(),
      pause: () => void pauseEmbed(),
      seek: (seconds: number) => void seekEmbed(seconds),
      prev: () => void prevEmbed(),
      next: () => void nextEmbed(),
      like: () => {
        const provider = getControlProvider()
        void execOnProvider(provider, EMBED_LIKE_SCRIPT)
      },
      unlike: () => {
        const provider = getControlProvider()
        void execOnProvider(provider, EMBED_UNLIKE_SCRIPT)
      },
      setVolume: (percent: number) => void applyEmbedVolume(percent),
      getPageUrl: () => livePageUrlRef.current,
    })
  }, [onRegisterEmbedControls, playEmbed, pauseEmbed, seekEmbed, prevEmbed, nextEmbed, execOnProvider, getControlProvider, applyEmbedVolume])

  useEffect(() => {
    void refreshLogin()
  }, [activeProvider, refreshLogin])

  useEffect(() => {
    if (!webviewsActive) return
    const interval = setInterval(() => void pollNowPlaying(), POLL_MS)
    return () => clearInterval(interval)
  }, [pollNowPlaying, webviewsActive])

  useEffect(() => {
    return api.onEmbedConsole(({ message }) => {
      const url = parseContextMenuConsoleMessage(message)
      if (!url || !isAddableStreamingUrl(url)) return
      setImportUrl(url)
      setPendingUrl(url)
      setImportStatus("")
      if (playlistsRef.current.length === 0) {
        setImportStatus(tRef.current.internet.noPlaylistsForContext)
        return
      }
      setPlaylistDialogOpen(true)
    })
  }, [api])

  async function handleLogout() {
    await clearEmbedSession(activeProvider)
    await api.embedReset(activeProvider)
    setLoggedIn(false)
    onClearEmbedNowPlaying()
    if (visible && panelVisible) {
      syncEmbedLayout()
    }
  }

  function handleReload() {
    void api.embedReload(activeProvider)
  }

  function useCurrentPageUrl() {
    void api.embedGetUrl(activeProvider).then(url => {
      if (url) setImportUrl(url)
    })
    const url = getEmbedImportUrl() || importUrl
    if (url) setImportUrl(url)
  }

  const prepareYandexForImport = useCallback(async (provider: StreamingProvider) => {
    if (provider !== "yandex") return
    try {
      const ready = await execOnProvider(provider, EMBED_YANDEX_TRANSPORT_READY_SCRIPT)
      if (!ready) {
        await execOnProvider(provider, EMBED_EXPAND_YANDEX_PLAYER_SCRIPT)
        await new Promise(resolve => setTimeout(resolve, YANDEX_EXPAND_DELAY_MS))
      }
    } catch {
      // embed not ready
    }
  }, [execOnProvider])

  async function startAddToPlaylist() {
    const provider = getControlProvider()
    await prepareYandexForImport(provider)
    const url = await resolveBrowserImportUrl({
      typedUrl: importUrl,
      storedPageUrl: getEmbedImportUrl(),
      livePageUrl: livePageUrlRef.current,
      fetchFromEmbed: () =>
        execOnProvider(provider, EMBED_TRACK_URL_SCRIPT).then(raw =>
          typeof raw === "string" ? raw : "",
        ),
    })
    if (!url) {
      setImportStatus(t.playlists.importErrorUnsupported)
      return
    }
    setImportUrl(url)
    setPendingUrl(url)
    setPlaylistDialogOpen(true)
  }

  const canImportCurrent = Boolean(importUrl.trim() || getEmbedImportUrl())

  async function handlePlaylistPick(playlistId: string) {
    if (!pendingUrl) return
    setImporting(true)
    setImportStatus("")
    const result = await onImportUrlToPlaylist(playlistId, pendingUrl)
    setImporting(false)
    if (!result.ok) {
      setImportStatus(importErrorMessage(result.error, t))
      return
    }
    setImportStatus(t.internet.importSuccess)
    setImportUrl("")
    setPendingUrl("")
  }

  if (!shouldPinWebviews(visible, webviewsActive)) return null

  if (!visible) {
    return <div aria-hidden data-testid="embed-background" style={{ display: "none" }} />
  }

  return (
    <div className="relative flex flex-col flex-1 min-h-0 no-drag">
      <div className="relative z-20 shrink-0 px-4 pt-14 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-6 h-6" style={{ color: ACCENT }} />
          <h1 className="vw-display" style={{ color: TEXT, fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em" }}>{t.internet.title}</h1>
        </div>
        <p style={{ color: SUBTEXT, fontSize: "11px", lineHeight: 1.4 }}>
          {t.internet.subtitle} {t.internet.contextHint}
        </p>

        <div className="flex gap-2 mt-3">
          {(["spotify", "yandex"] as const).map(p => (
            <button
              key={p}
              onClick={() => setActiveProvider(p)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold"
              style={{
                background: activeProvider === p ? "rgba(255,92,58,0.14)" : "rgba(20,43,47,0.04)",
                border: activeProvider === p ? `1px solid rgba(255,92,58,0.4)` : `1px solid ${BORDER}`,
                color: activeProvider === p ? ACCENT : SUBTEXT,
              }}
            >
              {p === "spotify" ? t.internet.spotify : t.internet.yandex}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-2 gap-2">
          <span style={{ color: loggedIn ? VW.sea : SUBTEXT, fontSize: "11px", fontWeight: 600 }}>
            {loggedIn ? t.internet.loggedIn : t.internet.loginHint}
          </span>
          <div className="flex gap-1">
            <button
              onClick={handleReload}
              className="p-1.5 rounded-lg"
              style={{ background: "rgba(20,43,47,0.06)" }}
              title={t.internet.reload}
            >
              <RefreshCw className="w-3.5 h-3.5" style={{ color: SUBTEXT }} />
            </button>
            {loggedIn && (
              <button
                onClick={() => void handleLogout()}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
                style={{ background: "rgba(20,43,47,0.06)", color: SUBTEXT }}
              >
                <LogOut className="w-3 h-3" />
                {t.internet.disconnect}
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 mt-2">
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl min-w-0"
            style={{ background: "rgba(255,255,255,0.78)", border: `1px solid ${BORDER}` }}
          >
            <Link2 className="w-3.5 h-3.5 shrink-0" style={{ color: SUBTEXT }} />
            <input
              value={importUrl}
              onChange={e => setImportUrl(e.target.value)}
              placeholder={t.internet.urlPlaceholder}
              className="flex-1 bg-transparent outline-none min-w-0"
              style={{ color: TEXT, fontSize: "11px" }}
            />
          </div>
          <button
            onClick={useCurrentPageUrl}
            className="px-2 py-2 rounded-xl text-[10px] font-semibold shrink-0"
            style={{ background: "rgba(20,43,47,0.06)", color: SUBTEXT }}
          >
            URL
          </button>
          <button
            onClick={() => void startAddToPlaylist()}
            disabled={!canImportCurrent || importing || playlists.length === 0}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-[10px] font-semibold shrink-0"
            style={{
              background: canImportCurrent ? "rgba(255,92,58,0.2)" : "rgba(20,43,47,0.04)",
              color: canImportCurrent ? ACCENT : SUBTEXT,
            }}
          >
            <ListPlus className="w-3.5 h-3.5" />
            {t.internet.addToPlaylist}
          </button>
        </div>
        {importStatus && (
          <p
            className="mt-1.5 text-[10px]"
            style={{ color: importStatus.includes(t.internet.importSuccess) ? "#34D399" : "#F87171" }}
          >
            {importStatus}
          </p>
        )}
      </div>

      <div
        ref={hostRef}
        className="relative flex-1 min-h-0"
        style={{ background: "transparent" }}
        data-testid="embed-host"
      />

      <AddToPlaylistDialog
        open={playlistDialogOpen}
        onOpenChange={setPlaylistDialogOpen}
        playlists={playlists}
        onSelect={playlistId => void handlePlaylistPick(playlistId)}
      />
    </div>
  )
}

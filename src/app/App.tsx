import { useCallback, useEffect, useRef, useState } from "react"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import { usePlayerApp } from "@/hooks/usePlayerApp"
import { NowPlaying } from "./components/NowPlaying"
import { Library } from "./components/Library"
import { Playlists } from "./components/Playlists"
import { Settings } from "./components/Settings"
import { Internet } from "./components/Internet"
import { getPlaybackUri } from "@/lib/streaming/trackFactory"
import { BottomNav } from "./components/BottomNav"
import { PlaybackBar } from "./components/PlaybackBar"
import { AddToPlaylistDialog } from "./components/AddToPlaylistDialog"
import { shouldShowPlaybackBar } from "@/lib/playbackBar"
import type { Track } from "@/lib/types"
import { I18nProvider, useI18n } from "@/context/I18nContext"
import { getTranslations } from "@/lib/i18n"
import { DEFAULT_SETTINGS } from "@/lib/types"
import { getMusicPlayerApi } from "@/lib/electronApi"
import { planPlaybackSync } from "@/lib/playbackSync"
import { shouldClearLocalPlayingForEmbed, shouldDriveLocalAudioPlayer } from "@/lib/playbackExclusive"
import { PLACEHOLDER_COVER, VW } from "@/lib/designTokens"
import { BootSplash } from "./components/BootSplash"
import { BRAND_TAGLINE_EN, BRAND_TAGLINE_RU } from "@/lib/brand"
import { BOOT_SPLASH_MIN_MS, shouldShowBootSplash } from "@/lib/bootSplash"

function makeEmptyTrack(t: ReturnType<typeof getTranslations>): Track {
  return {
    id: "",
    title: t.app.noTracksTitle,
    artist: t.app.noTracksArtist,
    album: "",
    duration: 0,
    downloaded: true,
    img: PLACEHOLDER_COVER,
    filePath: "",
    addedAt: 0,
  }
}

type PlayerApp = ReturnType<typeof usePlayerApp>

function PlayerShell({ app }: { app: PlayerApp }) {
  const { t } = useI18n()
  const handleNextRef = useRef(app.handleNext)
  handleNextRef.current = app.handleNext

  const setProgressRef = useRef(app.setProgress)
  setProgressRef.current = app.setProgress

  const pauseOnErrorRef = useRef(app.pausePlayback)
  pauseOnErrorRef.current = app.pausePlayback

  const onEnded = useCallback(() => handleNextRef.current(), [])
  const onProgress = useCallback((s: number) => setProgressRef.current(s), [])
  const onDuration = useCallback(() => {}, [])
  const onPlayError = useCallback(() => pauseOnErrorRef.current(), [])

  const [useSystemVolumeMixer, setUseSystemVolumeMixer] = useState(() => {
    // Optimistic on Windows Electron: avoid one frame of page-volume injection
    // that breaks Spotify/Yandex now-playing before systemVolumeSupported resolves.
    if (typeof window === "undefined") return false
    const ua = navigator.userAgent || ""
    return /Windows/i.test(ua) && Boolean(window.musicPlayer?.systemVolumeSupported)
  })
  const [mixerProbeDone, setMixerProbeDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    const probe = getMusicPlayerApi().systemVolumeSupported?.()
    if (!probe) {
      setUseSystemVolumeMixer(false)
      setMixerProbeDone(true)
      return
    }
    void probe
      .then(r => {
        if (cancelled) return
        setUseSystemVolumeMixer(Boolean(r?.supported))
      })
      .catch(() => {
        if (!cancelled) setUseSystemVolumeMixer(false)
      })
      .finally(() => {
        if (!cancelled) setMixerProbeDone(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const audio = useAudioPlayer({
    volume: app.settings.volume,
    useSystemVolumeMixer,
    onProgress,
    onEnded,
    onDuration,
    onPlayError,
  })

  const syncRef = useRef<{ trackId: string | null; filePath: string; isPlaying: boolean } | null>(null)
  const pausePlaybackRef = useRef(app.pausePlayback)
  pausePlaybackRef.current = app.pausePlayback

  useEffect(() => {
    const driveLocal = shouldDriveLocalAudioPlayer({
      displayIsEmbed: app.displayIsEmbed,
      currentTrack: app.currentTrack ?? null,
      embedBrowsingActive: app.embedBrowsingActive,
      embedIsPlaying: Boolean(app.embedNowPlaying?.isPlaying),
    })

    if (
      shouldClearLocalPlayingForEmbed({
        localIsPlaying: app.playback.isPlaying,
        currentTrack: app.currentTrack ?? null,
        displayIsEmbed: app.displayIsEmbed,
        embedBrowsingActive: app.embedBrowsingActive,
        embedIsPlaying: Boolean(app.embedNowPlaying?.isPlaying),
      })
    ) {
      pausePlaybackRef.current()
    }

    if (!driveLocal) {
      let cancelled = false
      void audio.setPlaying(false).then(() => {
        if (!cancelled) syncRef.current = null
      })
      return () => {
        cancelled = true
      }
    }

    let cancelled = false
    const next = {
      trackId: app.currentTrack?.id ?? null,
      filePath: app.currentTrack?.filePath ?? "",
      playbackUri: app.currentTrack ? getPlaybackUri(app.currentTrack) : "",
      isPlaying: app.playback.isPlaying,
    }
    const plan = planPlaybackSync(syncRef.current, next)
    syncRef.current = next

    void (async () => {
      if (plan.shouldLoad) {
        const ok = await audio.loadTrack(app.currentTrack)
        if (cancelled) return
        if (!ok) {
          pausePlaybackRef.current()
          return
        }
      }

      if (cancelled) return

      if (plan.shouldPlay) {
        const ok = await audio.setPlaying(true)
        if (!ok && !cancelled) pausePlaybackRef.current()
      } else {
        await audio.setPlaying(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    app.currentTrack?.id,
    app.currentTrack?.filePath,
    app.currentTrack?.streamUrl,
    app.playback.isPlaying,
    app.currentTrack,
    app.displayIsEmbed,
    app.embedBrowsingActive,
    app.embedNowPlaying?.isPlaying,
    audio.loadTrack,
    audio.setPlaying,
  ])

  const displayTrack = app.displayTrack ?? makeEmptyTrack(t)
  const screen = app.screen
  const showPlaybackBar = shouldShowPlaybackBar({
    screen,
    displayTrack,
    playback: app.playback,
    embedNowPlaying: app.embedNowPlaying,
    emptyTitle: t.app.noTracksTitle,
  })
  const playbackProgress = app.displayIsEmbed ? app.displayProgress : app.playback.progress
  const activeTrackId = app.displayTrack?.id || app.playback.currentTrackId

  useEffect(() => {
    if (screen === "internet") return
    if (app.embedControlProvider) return
    void getMusicPlayerApi().embedLayout({ visible: false })
  }, [screen, app.embedControlProvider])

  useEffect(() => {
    if (app.panelVisible) return
    void getMusicPlayerApi().embedLayout({ visible: false })
  }, [app.panelVisible])

  const internetEmbedProps = {
    panelVisible: app.panelVisible,
    volume: app.settings.volume,
    // Until probe finishes, treat as mixer-on on Windows so we never inject setVolumeUi.
    useSystemVolumeMixer: useSystemVolumeMixer || !mixerProbeDone,
    controlProvider: app.embedControlProvider,
    playbackProvider: app.embedPlaybackProvider,
    keepWebviewsAlive: app.keepEmbedWebviewsAlive,
    getEmbedStatus: app.getEmbedStatus,
    clearEmbedSession: app.clearEmbedSession,
    playlists: app.playlists,
    onImportUrlToPlaylist: async (playlistId: string, url: string) => {
      const r = await app.handleAddStreamingUrlToPlaylist(playlistId, url)
      return { ok: r.ok, error: r.error }
    },
    onEmbedNowPlayingChange: app.setEmbedNowPlaying,
    onClearEmbedNowPlaying: app.clearEmbedNowPlaying,
    onRegisterEmbedControls: app.registerEmbedControls,
    onEmbedHostReady: app.notifyEmbedHostReady,
    getEmbedImportUrl: app.getEmbedPageUrl,
  }

  return (
    <>
      <button
        onClick={() => app.togglePanel()}
        className="absolute top-3 right-3 z-50 w-8 h-8 flex items-center justify-center no-drag vw-glass"
        style={{ borderRadius: 12 }}
        title={t.app.hidePanel}
        data-testid="panel-hide"
      >
        <span style={{ color: VW.muted, fontSize: "18px", lineHeight: 1 }}>×</span>
      </button>

      <div className="flex-1 overflow-hidden flex flex-col relative no-drag">
        <div className="vw-wave" aria-hidden />

        <div
          className={
            screen === "internet"
              ? "relative z-10 flex flex-col flex-1 min-h-0 overflow-hidden"
              : "hidden"
          }
        >
          <Internet visible={screen === "internet"} {...internetEmbedProps} />
        </div>

        {screen !== "internet" && (
          <div className="relative z-10 flex flex-col flex-1 min-h-0 overflow-hidden">
            {screen === "nowplaying" && (
              <NowPlaying
                track={displayTrack}
                isPlaying={app.displayIsPlaying}
                isLoading={app.embedPlayLoading}
                isLiked={app.isLiked}
                progress={app.displayIsEmbed ? app.displayProgress : app.playback.progress}
                volume={app.settings.volume}
                isShuffled={app.playback.isShuffled}
                repeatMode={app.playback.repeatMode}
                isEmbed={app.displayIsEmbed}
                canAddToPlaylist={app.displayIsEmbed}
                onAddToPlaylist={() => void app.openEmbedPlaylistDialog()}
                onTogglePlay={app.togglePlay}
                onPrev={app.displayRouteTransportToEmbed ? app.handleEmbedPrev : app.handlePrev}
                onNext={app.displayRouteTransportToEmbed ? app.handleEmbedNext : app.handleNext}
                onProgressChange={v => {
                  if (app.displayIsEmbed) {
                    app.seekEmbed(v)
                  } else {
                    app.setProgress(v)
                    audio.seek(v)
                  }
                }}
                onVolumeChange={app.setVolume}
                onToggleLike={() => void app.toggleLike()}
                onToggleShuffle={app.toggleShuffle}
                onToggleRepeat={app.cycleRepeat}
              />
            )}

            {screen === "library" && (
              <Library
                tracks={app.tracks}
                currentTrackId={activeTrackId}
                onSelectTrack={app.handleSelectTrack}
                onAddTracks={app.handleAddTracks}
                onScanFolders={app.handleScanFolders}
                onDeleteTrack={app.handleDeleteTrack}
                isPlaying={app.displayIsPlaying}
                playlists={app.playlists}
                onAddTracksToPlaylist={app.handleAddTracksToPlaylist}
              />
            )}

            {screen === "playlists" && (
              <Playlists
                tracks={app.tracks}
                playlists={app.playlists}
                onPlaylistsChange={app.handlePlaylistsChange}
                onSelectTrack={app.handleSelectTrack}
                onAddTracksToPlaylist={app.handleAddTracksToPlaylist}
                onRemoveTrackFromPlaylist={app.handleRemoveTrackFromPlaylist}
                onImportUrlToPlaylist={async (playlistId, url) => {
                  const r = await app.handleAddStreamingUrlToPlaylist(playlistId, url)
                  return { ok: r.ok, error: r.error }
                }}
              />
            )}

            {screen === "settings" && (
              <Settings
                settings={app.settings}
                onChange={app.saveSettings}
                onClose={() => app.setScreen("library")}
              />
            )}
          </div>
        )}
      </div>

      {showPlaybackBar && (
        <PlaybackBar
          track={displayTrack}
          isPlaying={app.displayIsPlaying}
          isLoading={app.embedPlayLoading}
          progress={playbackProgress}
          useEmbedTransport={app.displayUseEmbedTransport}
          onTogglePlay={app.togglePlay}
          onPrev={app.displayRouteTransportToEmbed ? app.handleEmbedPrev : app.handlePrev}
          onNext={app.displayRouteTransportToEmbed ? app.handleEmbedNext : app.handleNext}
          onExpand={() => app.setScreen("nowplaying")}
        />
      )}

      <div className="relative z-30 shrink-0">
        <BottomNav current={screen} onChange={app.setScreen} />
      </div>

      <AddToPlaylistDialog
        open={app.embedPlaylistOpen}
        onOpenChange={app.setEmbedPlaylistOpen}
        playlists={app.playlists}
        track={
          app.displayTrack
            ? {
                title: app.displayTrack.title,
                artist: app.displayTrack.artist,
                img: app.displayTrack.img,
              }
            : null
        }
        onSelect={playlistId => void app.handleEmbedPlaylistPick(playlistId)}
      />
    </>
  )
}

export default function App() {
  const app = usePlayerApp()
  const locale = app.loaded ? app.settings.language : DEFAULT_SETTINGS.language
  const bootT = getTranslations(locale)
  const splashStartedAt = useRef(typeof performance !== "undefined" ? performance.now() : Date.now())
  const [splashElapsedMs, setSplashElapsedMs] = useState(0)

  useEffect(() => {
    let frame = 0
    const tick = () => {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now()
      const elapsed = now - splashStartedAt.current
      setSplashElapsedMs(elapsed)
      if (
        shouldShowBootSplash({
          dataLoaded: app.loaded,
          elapsedMs: elapsed,
          minMs: BOOT_SPLASH_MIN_MS,
        })
      ) {
        frame = requestAnimationFrame(tick)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [app.loaded])

  const showSplash = shouldShowBootSplash({
    dataLoaded: app.loaded,
    elapsedMs: splashElapsedMs,
    minMs: BOOT_SPLASH_MIN_MS,
  })

  if (showSplash) {
    return (
      <BootSplash
        loadingLabel={bootT.app.loading}
        tagline={locale === "en" ? BRAND_TAGLINE_EN : BRAND_TAGLINE_RU}
        theme={app.settings.theme === "dark" ? "dark" : "light"}
      />
    )
  }

  return (
    <I18nProvider locale={app.settings.language}>
      <div
        className="vw-shell relative w-full h-full overflow-hidden flex flex-col drag-region"
        data-theme={app.settings.theme === "dark" ? "dark" : "light"}
        style={{
          borderLeft: `1px solid ${VW.borderStrong}`,
          boxShadow: `-10px 0 36px ${VW.shadow}`,
        }}
      >
        <PlayerShell app={app} />
      </div>
    </I18nProvider>
  )
}

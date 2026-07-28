import { useCallback, useEffect, useRef } from "react"
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
import { shouldDriveLocalAudioPlayer } from "@/lib/playbackExclusive"

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%231E1E32' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' fill='%238B5CF6' font-size='48' text-anchor='middle' dy='.3em'%3E♪%3C/text%3E%3C/svg%3E"

function makeEmptyTrack(t: ReturnType<typeof getTranslations>): Track {
  return {
    id: "",
    title: t.app.noTracksTitle,
    artist: t.app.noTracksArtist,
    album: "",
    duration: 0,
    downloaded: true,
    img: PLACEHOLDER_IMG,
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

  const audio = useAudioPlayer({
    volume: app.settings.volume,
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
    })

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
        className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full flex items-center justify-center no-drag"
        style={{ background: "rgba(255,255,255,0.08)" }}
        title={t.app.hidePanel}
        data-testid="panel-hide"
      >
        <span style={{ color: "#7878A0", fontSize: "18px", lineHeight: 1 }}>×</span>
      </button>
      <div className="flex-1 overflow-hidden flex flex-col relative no-drag bg-[#09090F]">
        <div className="absolute inset-0 bg-[#09090F] pointer-events-none" aria-hidden />

        {/* Internet embed stays mounted; hidden off-tab to avoid remount races */}
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
          <div className="relative z-10 flex flex-col flex-1 min-h-0 overflow-hidden bg-[#09090F]">
            {screen === "nowplaying" && (
              <NowPlaying
            track={displayTrack}
            isPlaying={app.displayIsPlaying}
            isLiked={app.isLiked}
            progress={app.displayIsEmbed ? app.displayProgress : app.playback.progress}
            volume={app.settings.volume}
            isShuffled={app.playback.isShuffled}
            repeatMode={app.playback.repeatMode}
            isEmbed={app.displayIsEmbed}
            canAddToPlaylist={app.displayIsEmbed}
            onAddToPlaylist={() => void app.openEmbedPlaylistDialog()}
            onTogglePlay={app.togglePlay}
            onPrev={app.displayUseEmbedTransport ? app.handleEmbedPrev : app.handlePrev}
            onNext={app.displayUseEmbedTransport ? app.handleEmbedNext : app.handleNext}
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
          progress={playbackProgress}
          useEmbedTransport={app.displayUseEmbedTransport}
          onTogglePlay={app.togglePlay}
          onPrev={app.displayUseEmbedTransport ? app.handleEmbedPrev : app.handlePrev}
          onNext={app.displayUseEmbedTransport ? app.handleEmbedNext : app.handleNext}
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
        onSelect={playlistId => void app.handleEmbedPlaylistPick(playlistId)}
      />
    </>
  )
}

export default function App() {
  const app = usePlayerApp()
  const locale = app.loaded ? app.settings.language : DEFAULT_SETTINGS.language
  const bootT = getTranslations(locale)

  if (!app.loaded) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full h-full gap-3"
        style={{ background: "#09090F", color: "#7878A0" }}
      >
        <img src="/icon.png" alt="Violetwave" className="w-14 h-14 rounded-2xl" />
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#F0F0FA" }}>{bootT.app.name}</span>
        <span style={{ fontSize: "12px" }}>{bootT.app.loading}</span>
      </div>
    )
  }

  return (
    <I18nProvider locale={app.settings.language}>
      <div
        className="w-full h-full overflow-hidden flex flex-col drag-region relative"
        style={{
          background: "#09090F",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          borderLeft: "1px solid rgba(139,92,246,0.12)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.5)",
        }}
      >
        <PlayerShell app={app} />
      </div>
    </I18nProvider>
  )
}

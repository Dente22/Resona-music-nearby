import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  addTrack,
  createEmptyLibrary,
  removeTrack,
  searchTracks,
} from "@/lib/libraryStore"
import {
  createEmptyPlaylists,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
} from "@/lib/playlistStore"
import {
  ensureLikesPlaylist,
  findLikedTrackByPageUrl,
  getLikesPlaylistName,
  isTrackInLikesPlaylist,
  LIKES_PLAYLIST_ID,
} from "@/lib/likesPlaylist"
import { findStreamingTrackByEmbed } from "@/lib/streaming/embedBrowsableTrack"
import { addManyTracksToPlaylist, pruneAllPlaylistTrackIds } from "@/lib/playlistTracks"
import { syncAllPlaylistCovers, syncPlaylistCoverAfterAdd, computePlaylistCover } from "@/lib/playlistCovers"
import { pickDisplayPlayback } from "@/lib/displayPlayback"
import type { EmbedNowPlaying } from "@/lib/streaming/embedNowPlaying"
import {
  mergeEmbedPlayback,
  resolveEmbedImportUrl,
} from "@/lib/streaming/embedPlaybackStore"
import {
  createInitialPlayback,
  cycleRepeatMode,
  getNextTrackId,
  getPrevTrackId,
  selectTrack,
  setProgress as setPlaybackProgress,
  togglePlay as togglePlayback,
  toggleShuffle,
} from "@/lib/playbackEngine"
import { updateSettings } from "@/lib/settingsStore"
import { getMusicPlayerApi } from "@/lib/electronApi"
import {
  createTrackFromFile,
  DEFAULT_SETTINGS,
  type AppSettings,
  type Playlist,
  type Track,
} from "@/lib/types"
import { mergeLibraryAndStreaming } from "@/lib/streaming/mergeTracks"
import {
  getEmbedProviderForTrack,
  isEmbedDelegatedTrack,
} from "@/lib/streaming/embedDelegatedTrack"
import { playDelegatedTrackInEmbed } from "@/lib/streaming/embedDelegatedPlayback"
import {
  shouldQueueNowPlayingForEmbedTrack,
  isPinnedDelegatedLibraryPlayback,
  shouldFollowBrowserEmbedPoll,
  shouldSuppressEmbedPollWhileDriving,
} from "@/lib/streaming/embedPlaylistDrive"
import { EMBED_PAUSE_SCRIPT, EMBED_PLAY_SCRIPT } from "@/lib/streaming/embedNowPlaying"
import {
  buildEmbedSeekScript,
  EMBED_EXPAND_YANDEX_PLAYER_SCRIPT,
  EMBED_NEXT_SCRIPT,
  EMBED_PREV_SCRIPT,
  EMBED_YANDEX_TRANSPORT_READY_SCRIPT,
} from "@/lib/streaming/embedPlayerControls"
import { shouldFallbackSkipToEmbed, shouldKeepEmbedWebviewsAlive, shouldRouteSkipToEmbed, shouldRouteTransportToEmbed } from "@/lib/streaming/embedControlProvider"
import { resolveDelegatedTrackPlaybackTarget } from "@/lib/streaming/resolveDelegatedTrackPlaybackTarget"
import { restartEmbedPlaybackFromStart } from "@/lib/streaming/embedRestartPlayback"
import { isStreamingTrack } from "@/lib/streaming/trackFactory"
import { upsertStreamingTracks } from "@/lib/streaming/upsertStreamingTracks"
import { parseStreamingUrl } from "@/lib/streaming/urlParser"
import { normalizeStreamingPageUrl, resolveLikeTrackUrlAsync } from "@/lib/streaming/embedTrackUrl"
import { filterEmbedPollForDelegatedTrack, embedMatchesQueuedLibraryTrack } from "@/lib/streaming/embedTrackMatch"
import {
  hasActivePlaybackTrack,
  isAwaitingEmbedProgress,
  resolveSliderProgress,
  shouldRestartDelegatedTrackFromStart,
} from "@/lib/playbackProgress"
import { EMBED_READ_PROGRESS_SCRIPT } from "@/lib/streaming/embedLoadPlay"
import { sanitizeStreamingTrackUrl } from "@/lib/streaming/streamingTrackUrl"
import { EMBED_TRACK_URL_SCRIPT } from "@/lib/streaming/embedTrackUrl"
import { collectStreamingTrackInputs, collectStreamingTrackInputsFromEmbedOnly } from "@/lib/streaming/embedStreamImport"
import { mergePageUrlOnStreamingInput } from "@/lib/streaming/saveLikedTrack"
import type { StreamingProvider, StreamingTrackInput } from "@/lib/streaming/types"
import { EMBED_MOUNT_DELAY_MS } from "@/lib/streaming/embedPanelLifecycle"
import { PLACEHOLDER_COVER } from "@/lib/designTokens"
import { clampVolumePercent } from "@/lib/streaming/volumePercent"

export function usePlayerApp() {
  const api = getMusicPlayerApi()
  const [screen, setScreen] = useState<Screen>("library")
  const [library, setLibrary] = useState(createEmptyLibrary())
  const [streamingLibrary, setStreamingLibrary] = useState<{ tracks: Track[] }>({ tracks: [] })
  const [playlistsState, setPlaylistsState] = useState(createEmptyPlaylists())
  const [playback, setPlayback] = useState(createInitialPlayback())
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const [loaded, setLoaded] = useState(false)
  const [embedNowPlaying, setEmbedNowPlaying] = useState<EmbedNowPlaying | null>(null)
  const [embedControlProvider, setEmbedControlProvider] = useState<StreamingProvider | null>(null)
  const [embedBrowsingActive, setEmbedBrowsingActive] = useState(false)
  const [embedPlaylistOpen, setEmbedPlaylistOpen] = useState(false)
  const [embedPendingUrl, setEmbedPendingUrl] = useState("")
  const [panelVisible, setPanelVisible] = useState(true)
  const embedPlayRef = useRef<(() => void) | null>(null)
  const embedPauseRef = useRef<(() => void) | null>(null)
  const embedPrevRef = useRef<(() => void) | null>(null)
  const embedNextRef = useRef<(() => void) | null>(null)
  const embedSeekRef = useRef<((seconds: number) => void) | null>(null)
  const embedLikeRef = useRef<(() => void) | null>(null)
  const embedUnlikeRef = useRef<(() => void) | null>(null)
  const embedVolumeRef = useRef<((percent: number) => void) | null>(null)
  const embedGetPageUrlRef = useRef<(() => string) | null>(null)
  const pendingEmbedPlayRef = useRef<Track | null>(null)
  const embedDriveTrackIdRef = useRef<string | null>(null)
  const embedProgressResetPendingRef = useRef(false)
  const embedPlayGenerationRef = useRef(0)
  const [embedHostReadyTick, setEmbedHostReadyTick] = useState(0)
  const [embedPlayRequestTick, setEmbedPlayRequestTick] = useState(0)
  const [embedPlayLoading, setEmbedPlayLoading] = useState(false)
  const coversRefreshedRef = useRef(false)

  const tracks = mergeLibraryAndStreaming(library.tracks, streamingLibrary.tracks)
  const currentTrack =
    tracks.find(t => t.id === playback.currentTrackId) ?? tracks[0] ?? null
  const currentTrackRef = useRef(currentTrack)
  currentTrackRef.current = currentTrack
  const pinnedDelegatedPlayback = isPinnedDelegatedLibraryPlayback(
    currentTrack,
    playback.currentTrackId,
    embedDriveTrackIdRef.current,
  )
  const display = pickDisplayPlayback(
    playback,
    currentTrack,
    embedNowPlaying,
    PLACEHOLDER_COVER,
    screen === "internet",
    embedBrowsingActive,
    embedControlProvider,
    pinnedDelegatedPlayback,
  )

  useEffect(() => {
    if (embedDriveTrackIdRef.current) return
    if (embedNowPlaying?.isPlaying) {
      setEmbedBrowsingActive(true)
      return
    }
    if (!embedNowPlaying?.title?.trim()) {
      setEmbedBrowsingActive(false)
    }
  }, [embedNowPlaying?.isPlaying, embedNowPlaying?.title])

  const embedMatchesQueue = Boolean(
    currentTrack
    && embedNowPlaying
    && embedMatchesQueuedLibraryTrack(currentTrack, embedNowPlaying),
  )

  const displayProgress = resolveSliderProgress({
    progress: display.progress,
    duration: display.track?.duration ?? 0,
    isPlaying: display.isPlaying,
    hasActiveTrack: hasActivePlaybackTrack(
      playback.currentTrackId,
      display.isEmbed ? embedNowPlaying?.title : null,
    ),
    awaitingEmbedSync: isAwaitingEmbedProgress({
      isEmbed: display.isEmbed,
      pinnedLibraryPlayback: pinnedDelegatedPlayback,
      embedMatchesQueue,
      embedProgress: embedNowPlaying?.progress ?? 0,
      progressResetPending: embedProgressResetPendingRef.current,
      embedIsPlaying: Boolean(embedNowPlaying?.isPlaying),
    }),
  })

  const isLiked = useMemo(() => {
    if (currentTrack && isEmbedDelegatedTrack(currentTrack) && currentTrack.pageUrl) {
      const url = normalizeStreamingPageUrl(currentTrack.pageUrl)
      if (url) {
        const match = findLikedTrackByPageUrl(tracks, url)
        return match ? isTrackInLikesPlaylist(playlistsState, match.id) : false
      }
    }
    if (display.isEmbed && embedNowPlaying) {
      const match = findStreamingTrackByEmbed(tracks, embedNowPlaying)
      return match ? isTrackInLikesPlaylist(playlistsState, match.id) : false
    }
    if (display.track && !display.isEmbed) {
      return isTrackInLikesPlaylist(playlistsState, display.track.id)
    }
    return false
  }, [currentTrack, display.isEmbed, display.track, embedNowPlaying, playlistsState, tracks])

  useEffect(() => {
    async function load() {
      const [lib, streamLib, pl, st, storedEmbed] = await Promise.all([
        api.loadLibrary(),
        api.loadStreamingLibrary(),
        api.loadPlaylists(),
        api.loadSettings(),
        api.loadEmbedPlayback(),
      ])
      setLibrary(lib.tracks?.length ? { tracks: lib.tracks as Track[] } : createEmptyLibrary())
      setStreamingLibrary(
        streamLib.tracks?.length
          ? { tracks: streamLib.tracks as Track[] }
          : { tracks: [] },
      )
      setPlaylistsState(
        ensureLikesPlaylist(
          pl.playlists?.length
            ? { playlists: pl.playlists as Playlist[] }
            : createEmptyPlaylists(),
          getLikesPlaylistName({ ...DEFAULT_SETTINGS, ...st }.language),
        ),
      )
      setSettings({ ...DEFAULT_SETTINGS, ...st })
      if (storedEmbed?.title?.trim()) {
        setEmbedNowPlaying(storedEmbed)
      }
      if (lib.tracks?.length) {
        setPlayback(prev =>
          prev.currentTrackId ? prev : selectTrack(prev, (lib.tracks as Track[])[0].id),
        )
      }
      setLoaded(true)
    }
    load()
  }, [api])

  useEffect(() => {
    const unsub = api.onPanelVisibility((visible: boolean) => {
      setPanelVisible(visible)
    })
    return unsub
  }, [api])

  useEffect(() => {
    if (!loaded) return
    void api.embedSetVolume?.(clampVolumePercent(settings.volume))
  }, [api, loaded, settings.volume])

  useEffect(() => {
    if (!loaded || coversRefreshedRef.current) return
    const missing = library.tracks.filter(
      t => t.source === "local" && !t.img?.trim() && t.filePath,
    )
    if (!missing.length) {
      coversRefreshedRef.current = true
      return
    }
    coversRefreshedRef.current = true
    void api.refreshTrackCovers(missing.map(t => t.filePath)).then(updates => {
      if (!updates.length) return
      setLibrary(prev => ({
        tracks: prev.tracks.map(t => {
          const hit = updates.find(u => u.filePath === t.filePath)
          return hit ? { ...t, img: hit.img } : t
        }),
      }))
    })
  }, [loaded, library.tracks, api])

  useEffect(() => {
    if (!loaded) return
    setPlaylistsState(prev => {
      const pruned = pruneAllPlaylistTrackIds(prev.playlists, tracks)
      const synced = syncAllPlaylistCovers(pruned, tracks)
      const same =
        synced.length === prev.playlists.length
        && synced.every((p, i) =>
          p.img === prev.playlists[i]?.img
          && p.trackIds.length === prev.playlists[i]?.trackIds.length
          && p.trackIds.every((id, j) => id === prev.playlists[i]?.trackIds[j]),
        )
      return same ? prev : { playlists: synced }
    })
  }, [tracks, loaded])

  useEffect(() => {
    if (!loaded) return
    api.saveLibrary(library)
  }, [library, loaded, api])

  useEffect(() => {
    if (!loaded) return
    api.saveStreamingLibrary(streamingLibrary)
  }, [streamingLibrary, loaded, api])

  useEffect(() => {
    if (!loaded) return
    api.savePlaylists(playlistsState)
  }, [playlistsState, loaded, api])

  const saveSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = updateSettings(settingsRef.current, patch)
    settingsRef.current = next
    setSettings(next)
    if (patch.language) {
      setPlaylistsState(prev =>
        ensureLikesPlaylist(prev, getLikesPlaylistName(next.language)),
      )
    }
    if (typeof patch.volume === "number") {
      const pct = clampVolumePercent(patch.volume)
      void api.embedSetVolume?.(pct)
      embedVolumeRef.current?.(pct)
    }
    await api.saveSettings(next)
  }, [api])

  const setVolume = useCallback(
    (v: number) => {
      const next = clampVolumePercent(v)
      void (async () => {
        try {
          if (typeof api.embedSetVolume === "function") {
            await api.embedSetVolume(next)
          }
        } catch {
          // embed layer unavailable
        }
        embedVolumeRef.current?.(next)
        await saveSettings({ volume: next })
      })()
    },
    [api, saveSettings],
  )

  const handleAddTracks = useCallback(async () => {
    const imported = await api.pickTracks()
    if (!imported.length) return

    let nextLibrary = library
    for (const meta of imported) {
      const track = createTrackFromFile(meta.filePath, {
        ...meta,
        img: meta.img || PLACEHOLDER_COVER,
        mood: meta.mood,
        originalPath: meta.originalPath,
      })
      nextLibrary = addTrack(nextLibrary, track)
    }
    setLibrary(nextLibrary)

    if (!playback.currentTrackId && nextLibrary.tracks.length) {
      setPlayback(selectTrack(playback, nextLibrary.tracks[0].id))
    }
  }, [library, playback, api])

  const handleScanFolders = useCallback(async () => {
    const imported = await api.scanMusicFolders()
    if (!imported.length) return

    let nextLibrary = library
    for (const meta of imported) {
      const track = createTrackFromFile(meta.filePath, {
        ...meta,
        img: meta.img || PLACEHOLDER_COVER,
        mood: meta.mood,
        originalPath: meta.originalPath,
      })
      nextLibrary = addTrack(nextLibrary, track)
    }
    setLibrary(nextLibrary)

    if (!playback.currentTrackId && nextLibrary.tracks.length) {
      setPlayback(selectTrack(playback, nextLibrary.tracks[0].id))
    }
  }, [library, playback, api])

  const handleAddStreamingTracks = useCallback(async (items: StreamingTrackInput[]) => {
    const playable = items.filter(i => i.streamUrl?.trim())
    if (!playable.length) return 0
    const next = upsertStreamingTracks(streamingLibrary.tracks, playable)
    setStreamingLibrary({ tracks: next })
    return playable.length
  }, [streamingLibrary.tracks])

  const handleImportStreamingUrl = useCallback(async (
    url: string,
    embed: EmbedNowPlaying | null = null,
  ) => {
    const clean = normalizeStreamingPageUrl(url) || url.trim()
    const parsed = clean ? parseStreamingUrl(clean) : null

    if (!parsed?.provider || parsed.type !== "track" || !parsed.id) {
      const inputs = collectStreamingTrackInputsFromEmbedOnly(embed)
      if (!inputs.length) {
        return {
          ok: false as const,
          trackIds: [] as string[],
          error: "unsupported_url" as const,
        }
      }
      const next = upsertStreamingTracks(streamingLibrary.tracks, inputs)
      setStreamingLibrary({ tracks: next })
      const trackIds = inputs.map(
        item => next.find(t => t.externalId === item.externalId && t.source === item.source)!.id,
      )
      return { ok: true as const, trackIds }
    }

    const result = await api.streamingImportUrl(clean)
    const inputs = collectStreamingTrackInputs({
      url: clean,
      parsed,
      importResult: result,
      embed,
    })
    if (!inputs.length) {
      return {
        ok: false as const,
        trackIds: [] as string[],
        error: result.error ?? "no_stream_url",
      }
    }
    const next = upsertStreamingTracks(streamingLibrary.tracks, inputs)
    setStreamingLibrary({ tracks: next })
    const trackIds = inputs.map(
      item => next.find(t => t.externalId === item.externalId && t.source === item.source)!.id,
    )
    return { ok: true as const, trackIds }
  }, [api, streamingLibrary.tracks])

  const prepareYandexEmbedForTrackUrl = useCallback(async (provider: StreamingProvider | null) => {
    if (provider !== "yandex") return
    try {
      const ready = await api.embedExecute(provider, EMBED_YANDEX_TRANSPORT_READY_SCRIPT)
      if (!ready) {
        await api.embedExecute(provider, EMBED_EXPAND_YANDEX_PLAYER_SCRIPT)
        await new Promise(resolve => setTimeout(resolve, 400))
      }
    } catch {
      // embed not ready
    }
  }, [api])

  const resolveEmbedActionUrl = useCallback(async (): Promise<string | null> => {
    const provider = embedNowPlaying?.provider ?? embedControlProvider
    await prepareYandexEmbedForTrackUrl(provider)
    return resolveLikeTrackUrlAsync({
      currentTrack,
      embed: embedNowPlaying,
      livePageUrl: embedGetPageUrlRef.current?.() ?? "",
      fetchFromEmbed: () =>
        provider
          ? api.embedExecute(provider, EMBED_TRACK_URL_SCRIPT).then(raw =>
              typeof raw === "string" ? raw : "",
            )
          : Promise.resolve(""),
    })
  }, [
    api,
    currentTrack,
    embedControlProvider,
    embedNowPlaying,
    prepareYandexEmbedForTrackUrl,
  ])

  const handleAddTracksToPlaylist = useCallback((playlistId: string, trackIds: string[]) => {
    setPlaylistsState(prev => {
      const withTracks = addManyTracksToPlaylist(prev, playlistId, trackIds)
      return {
        playlists: withTracks.playlists.map(p =>
          p.id === playlistId ? syncPlaylistCoverAfterAdd(p, tracks) : p,
        ),
      }
    })
  }, [tracks])

  const handleAddStreamingUrlToPlaylist = useCallback(async (
    playlistId: string,
    url: string,
    embed: EmbedNowPlaying | null = null,
  ) => {
    const imported = await handleImportStreamingUrl(url, embed ?? embedNowPlaying)
    if (!imported.ok) return imported
    handleAddTracksToPlaylist(playlistId, imported.trackIds)
    return imported
  }, [embedNowPlaying, handleImportStreamingUrl, handleAddTracksToPlaylist])

  const handleRemoveTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylistsState(prev => {
      const removed = removeTrackFromPlaylist(prev, playlistId, trackId)
      const pruned = pruneAllPlaylistTrackIds(removed.playlists, tracks)
      return {
        playlists: pruned.map(p =>
          p.id === playlistId
            ? { ...p, img: computePlaylistCover(p, tracks) }
            : p,
        ),
      }
    })
  }, [tracks])

  const handleDeleteTrack = useCallback(async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    if (isStreamingTrack(track)) {
      setStreamingLibrary(prev => ({ tracks: prev.tracks.filter(t => t.id !== trackId) }))
    } else {
      await api.deleteTrackFile(track.filePath)
      setLibrary(removeTrack(library, trackId))
    }

    if (playback.currentTrackId === trackId) {
      const remaining = tracks.filter(t => t.id !== trackId)
      setPlayback(
        remaining.length
          ? selectTrack({ ...playback, currentTrackId: null, isPlaying: false }, remaining[0].id)
          : createInitialPlayback(),
      )
    }
  }, [tracks, library, playback, api])

  const updateEmbedNowPlaying = useCallback((
    incoming: EmbedNowPlaying | null | ((prev: EmbedNowPlaying | null) => EmbedNowPlaying | null),
    options?: { libraryTrack?: Track | null; direct?: boolean },
  ) => {
    setEmbedNowPlaying(prev => {
      const next = typeof incoming === "function" ? incoming(prev) : incoming

      if (next === null && typeof incoming !== "function") {
        void api.saveEmbedPlayback(null)
        return null
      }

      const libraryTrack = options?.libraryTrack ?? currentTrackRef.current
      if (
        !options?.direct
        && typeof incoming !== "function"
        && shouldSuppressEmbedPollWhileDriving(embedDriveTrackIdRef.current, libraryTrack, next)
      ) {
        return prev
      }

      const filtered = options?.direct
        ? next
        : filterEmbedPollForDelegatedTrack(next, libraryTrack, {
            followBrowserOnMismatch: shouldFollowBrowserEmbedPoll(
              embedBrowsingActive,
              isPinnedDelegatedLibraryPlayback(
                libraryTrack,
                currentTrackRef.current?.id ?? null,
                embedDriveTrackIdRef.current,
              ),
            ),
          })
      if (!filtered) return prev
      const merged = options?.direct
        ? filtered
        : mergeEmbedPlayback(prev, filtered)
      if (merged?.title?.trim()) {
        void api.saveEmbedPlayback(merged)
      }
      return merged
    })
  }, [api, embedBrowsingActive])

  const notifyEmbedHostReady = useCallback(() => {
    setEmbedHostReadyTick(tick => tick + 1)
  }, [])

  const queueEmbedTrackPlay = useCallback((track: Track) => {
    embedPlayGenerationRef.current += 1
    pendingEmbedPlayRef.current = track
    embedDriveTrackIdRef.current = track.id
    setEmbedPlayLoading(true)
    setEmbedPlayRequestTick(tick => tick + 1)
    if (shouldQueueNowPlayingForEmbedTrack(track)) {
      setScreen("nowplaying")
    }
  }, [])

  const restartEmbedFromStart = useCallback(async (provider: StreamingProvider) => {
    await restartEmbedPlaybackFromStart(provider, {
      seek: seconds => embedSeekRef.current?.(seconds),
      executeSeek: (p, seconds) => api.embedExecute(p, buildEmbedSeekScript(seconds)),
      play: () => embedPlayRef.current?.(),
      onProgressReset: () => {
        updateEmbedNowPlaying(current => (current ? { ...current, progress: 0 } : current))
      },
    })
  }, [api, updateEmbedNowPlaying])

  const persistDelegatedTrackPageUrl = useCallback((trackId: string, pageUrl: string) => {
    const clean = sanitizeStreamingTrackUrl(pageUrl) ?? pageUrl.trim()
    if (!clean) return
    setStreamingLibrary(prev => ({
      tracks: prev.tracks.map(track =>
        track.id === trackId ? { ...track, pageUrl: clean } : track,
      ),
    }))
  }, [])

  const playStreamingTrackInEmbed = useCallback(async (track: Track) => {
    const provider = getEmbedProviderForTrack(track)
    if (!provider) {
      setEmbedPlayLoading(false)
      return false
    }

    const playbackTarget = resolveDelegatedTrackPlaybackTarget(track)
    if (!playbackTarget) {
      setEmbedPlayLoading(false)
      return false
    }

    const generation = embedPlayGenerationRef.current
    embedDriveTrackIdRef.current = track.id
    embedProgressResetPendingRef.current = true
    setEmbedPlayLoading(true)
    await api.embedExecute(provider, EMBED_PAUSE_SCRIPT)
    if (generation !== embedPlayGenerationRef.current) {
      setEmbedPlayLoading(false)
      return false
    }

    currentTrackRef.current = track
    setEmbedControlProvider(provider)
    setEmbedBrowsingActive(false)
    updateEmbedNowPlaying({
      provider,
      title: track.title,
      artist: track.artist,
      album: track.album,
      img: track.img,
      isPlaying: true,
      duration: track.duration,
      progress: 0,
      pageUrl: playbackTarget.mode === "track" ? playbackTarget.url : "",
    }, { libraryTrack: track, direct: true })

    let startedUrl: string | null = null
    try {
      startedUrl = await playDelegatedTrackInEmbed(provider, playbackTarget, api)
      if (generation !== embedPlayGenerationRef.current) return false
      if (startedUrl) {
        persistDelegatedTrackPageUrl(track.id, startedUrl)
        updateEmbedNowPlaying(current =>
          current ? { ...current, pageUrl: startedUrl!, progress: 0, isPlaying: true } : current,
        )
        await new Promise(resolve => setTimeout(resolve, 150))
        if (generation !== embedPlayGenerationRef.current) return false
        const rawProgress = await api.embedExecute(provider, EMBED_READ_PROGRESS_SCRIPT)
        const embedProgress =
          typeof rawProgress === "number"
            ? Math.max(0, Math.floor(rawProgress))
            : Math.max(0, Math.floor(Number(rawProgress) || 0))
        if (shouldRestartDelegatedTrackFromStart(embedProgress)) {
          await restartEmbedFromStart(provider)
        }
        embedProgressResetPendingRef.current = false
      }
    } finally {
      if (generation === embedPlayGenerationRef.current) {
        setEmbedPlayLoading(false)
      }
      if (generation === embedPlayGenerationRef.current && !startedUrl) {
        embedDriveTrackIdRef.current = null
        embedProgressResetPendingRef.current = false
        setPlayback(prev =>
          prev.currentTrackId === track.id ? { ...prev, isPlaying: false } : prev,
        )
        updateEmbedNowPlaying(current =>
          current && current.title === track.title
            ? { ...current, isPlaying: false, progress: 0 }
            : current,
        )
      }
    }
    return Boolean(startedUrl)
  }, [api, persistDelegatedTrackPageUrl, restartEmbedFromStart, updateEmbedNowPlaying])

  const flushPendingEmbedPlay = useCallback(() => {
    const track = pendingEmbedPlayRef.current
    if (!track) return
    pendingEmbedPlayRef.current = null
    void playStreamingTrackInEmbed(track)
  }, [playStreamingTrackInEmbed])

  useEffect(() => {
    if (!pendingEmbedPlayRef.current) return
    const timer = setTimeout(() => {
      flushPendingEmbedPlay()
    }, EMBED_MOUNT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [embedPlayRequestTick, embedHostReadyTick, flushPendingEmbedPlay])

  const suspendEmbedPlayback = useCallback(() => {
    embedPauseRef.current?.()
    updateEmbedNowPlaying(current => (current ? { ...current, isPlaying: false } : current))
  }, [updateEmbedNowPlaying])

  const handleSelectTrack = useCallback((id: string) => {
    const track = tracks.find(t => t.id === id)
    if (!track) return

    if (isEmbedDelegatedTrack(track)) {
      const provider = getEmbedProviderForTrack(track)
      if (provider) {
        setEmbedControlProvider(provider)
        setEmbedBrowsingActive(false)
      }
      currentTrackRef.current = track

      if (playback.currentTrackId === id && playback.isPlaying) {
        embedPauseRef.current?.()
        updateEmbedNowPlaying(current =>
          current ? { ...current, isPlaying: false } : current,
        )
        setPlayback(prev => ({ ...prev, isPlaying: false }))
        return
      }

      setPlayback(prev =>
        prev.currentTrackId === id ? { ...prev, isPlaying: true } : selectTrack(prev, id, true),
      )
      queueEmbedTrackPlay(track)
      return
    }

    embedDriveTrackIdRef.current = null
    setEmbedPlayLoading(false)
    setEmbedControlProvider(null)
    setEmbedBrowsingActive(false)
    suspendEmbedPlayback()
    setPlayback(prev => {
      if (prev.currentTrackId === id) return togglePlayback(prev)
      return selectTrack(prev, id, true)
    })
    setScreen("nowplaying")
  }, [tracks, queueEmbedTrackPlay, updateEmbedNowPlaying, suspendEmbedPlayback, playback])

  const handlePrev = useCallback(() => {
    setPlayback(prev => {
      const id = prev.currentTrackId
      if (!id) return prev
      const prevId = getPrevTrackId(tracks, id)
      if (!prevId) return prev
      const prevTrack = tracks.find(t => t.id === prevId)
      if (prevTrack && isEmbedDelegatedTrack(prevTrack) && prev.isPlaying) {
        currentTrackRef.current = prevTrack
        queueEmbedTrackPlay(prevTrack)
      }
      if (prevTrack && !isEmbedDelegatedTrack(prevTrack)) {
        setEmbedControlProvider(null)
        setEmbedBrowsingActive(false)
        suspendEmbedPlayback()
      }
      return selectTrack(prev, prevId, prev.isPlaying)
    })
  }, [tracks, queueEmbedTrackPlay, suspendEmbedPlayback])

  const handleNext = useCallback(() => {
    setPlayback(prev => {
      const id = prev.currentTrackId
      if (!id) return prev
      const nextId = getNextTrackId(tracks, id, prev.isShuffled, prev.repeatMode)
      if (!nextId) return { ...prev, isPlaying: false }
      const nextTrack = tracks.find(t => t.id === nextId)
      if (nextTrack && isEmbedDelegatedTrack(nextTrack) && prev.isPlaying) {
        currentTrackRef.current = nextTrack
        queueEmbedTrackPlay(nextTrack)
      }
      if (nextTrack && !isEmbedDelegatedTrack(nextTrack)) {
        setEmbedControlProvider(null)
        setEmbedBrowsingActive(false)
        suspendEmbedPlayback()
      }
      return selectTrack(prev, nextId, prev.isPlaying)
    })
  }, [tracks, queueEmbedTrackPlay, suspendEmbedPlayback])

  const pausePlayback = useCallback(() => {
    setPlayback(prev => (prev.isPlaying ? { ...prev, isPlaying: false } : prev))
  }, [])

  const handlePlaylistsChange = useCallback((playlists: Playlist[]) => {
    setPlaylistsState({ playlists: syncAllPlaylistCovers(playlists, tracks) })
  }, [tracks])

  const clearEmbedNowPlaying = useCallback(() => {
    setEmbedNowPlaying(null)
    void api.saveEmbedPlayback(null)
  }, [api])

  const getEmbedPageUrl = useCallback(() => {
    const live = embedGetPageUrlRef.current?.() ?? ""
    return resolveEmbedImportUrl(embedNowPlaying, live) ?? ""
  }, [embedNowPlaying])

  const registerEmbedControls = useCallback((controls: {
    play: () => void
    pause: () => void
    seek: (seconds: number) => void
    prev: () => void
    next: () => void
    like: () => void
    unlike: () => void
    setVolume: (percent: number) => void
    getPageUrl: () => string
  }) => {
    embedPlayRef.current = controls.play
    embedPauseRef.current = controls.pause
    embedSeekRef.current = controls.seek
    embedPrevRef.current = controls.prev
    embedNextRef.current = controls.next
    embedLikeRef.current = controls.like
    embedUnlikeRef.current = controls.unlike
    embedVolumeRef.current = controls.setVolume
    embedGetPageUrlRef.current = controls.getPageUrl
  }, [])

  const keepEmbedWebviewsAlive = shouldKeepEmbedWebviewsAlive({
    useEmbedTransport: display.useEmbedTransport,
    embedControlProvider,
    hasEmbedPlayback: Boolean(embedNowPlaying?.title?.trim()),
  })

  const runEmbedTransport = useCallback(
    async (direction: "prev" | "next") => {
      const registered = direction === "prev" ? embedPrevRef.current : embedNextRef.current
      // Prefer Internet handlers: they focus the playing provider and refresh now-playing.
      if (registered) {
        registered()
        return
      }

      const provider = embedControlProvider ?? embedNowPlaying?.provider ?? null
      if (!provider) return

      try {
        if (provider === "yandex") {
          const ready = await api.embedExecute(provider, EMBED_YANDEX_TRANSPORT_READY_SCRIPT)
          if (!ready) {
            await api.embedExecute(provider, EMBED_EXPAND_YANDEX_PLAYER_SCRIPT)
            await new Promise(resolve => setTimeout(resolve, 350))
          }
        }
        await api.embedExecute(
          provider,
          direction === "prev" ? EMBED_PREV_SCRIPT : EMBED_NEXT_SCRIPT,
        )
      } catch {
        // embed not ready
      }
    },
    [api, embedControlProvider, embedNowPlaying?.provider],
  )

  const handleEmbedPrev = useCallback(() => {
    const id = playback.currentTrackId
    const hasLibraryNeighbor = Boolean(id && getPrevTrackId(tracks, id))
    if (
      shouldFallbackSkipToEmbed({
        isEmbed: display.isEmbed,
        useEmbedTransport: display.useEmbedTransport,
        hasLibraryNeighbor,
      })
    ) {
      void runEmbedTransport("prev")
      return
    }
    handlePrev()
  }, [display.isEmbed, display.useEmbedTransport, playback.currentTrackId, tracks, runEmbedTransport, handlePrev])

  const handleEmbedNext = useCallback(() => {
    const id = playback.currentTrackId
    const hasLibraryNeighbor = Boolean(
      id && getNextTrackId(tracks, id, playback.isShuffled, playback.repeatMode),
    )
    if (
      shouldFallbackSkipToEmbed({
        isEmbed: display.isEmbed,
        useEmbedTransport: display.useEmbedTransport,
        hasLibraryNeighbor,
      })
    ) {
      void runEmbedTransport("next")
      return
    }
    handleNext()
  }, [
    display.isEmbed,
    display.useEmbedTransport,
    playback.currentTrackId,
    playback.isShuffled,
    playback.repeatMode,
    tracks,
    runEmbedTransport,
    handleNext,
  ])

  const seekEmbed = useCallback((seconds: number) => {
    embedSeekRef.current?.(seconds)
    updateEmbedNowPlaying(current => (current ? { ...current, progress: seconds } : current))
  }, [updateEmbedNowPlaying])

  const runEmbedPlayPause = useCallback(
    async (play: boolean) => {
      if (play) {
        if (embedPlayRef.current) {
          embedPlayRef.current()
          return
        }
      } else if (embedPauseRef.current) {
        embedPauseRef.current()
        return
      }

      const provider = embedControlProvider ?? embedNowPlaying?.provider ?? null
      if (!provider) return
      try {
        await api.embedExecute(provider, play ? EMBED_PLAY_SCRIPT : EMBED_PAUSE_SCRIPT)
      } catch {
        // embed not ready
      }
    },
    [api, embedControlProvider, embedNowPlaying?.provider],
  )

  const handleTogglePlay = useCallback(() => {
    if (shouldRouteTransportToEmbed(display)) {
      const playing = display.isPlaying
      if (playing) {
        void runEmbedPlayPause(false)
        updateEmbedNowPlaying(current => (current ? { ...current, isPlaying: false } : current))
        if (currentTrack && isEmbedDelegatedTrack(currentTrack)) {
          setPlayback(prev => ({ ...prev, isPlaying: false }))
        } else if (playback.isPlaying) {
          setPlayback(prev => ({ ...prev, isPlaying: false }))
        }
        return
      }

      if (currentTrack && isEmbedDelegatedTrack(currentTrack) && !display.useEmbedTransport) {
        queueEmbedTrackPlay(currentTrack)
        setPlayback(prev => ({ ...prev, isPlaying: true }))
        return
      }

      void runEmbedPlayPause(true)
      updateEmbedNowPlaying(current => (current ? { ...current, isPlaying: true } : current))
      return
    }

    if (
      currentTrack
      && playback.currentTrackId === currentTrack.id
      && !isEmbedDelegatedTrack(currentTrack)
    ) {
      if (playback.isPlaying) {
        suspendEmbedPlayback()
      }
      setPlayback(prev => togglePlayback(prev))
      return
    }

    setPlayback(prev => togglePlayback(prev))
  }, [
    currentTrack,
    display,
    playback.currentTrackId,
    playback.isPlaying,
    queueEmbedTrackPlay,
    runEmbedPlayPause,
    suspendEmbedPlayback,
    updateEmbedNowPlaying,
  ])

  const openEmbedPlaylistDialog = useCallback(async () => {
    const url = await resolveEmbedActionUrl()
    setEmbedPendingUrl(url ?? "")
    setEmbedPlaylistOpen(true)
  }, [resolveEmbedActionUrl])

  const handleEmbedPlaylistPick = useCallback(async (playlistId: string) => {
    const url = embedPendingUrl || await resolveEmbedActionUrl() || ""
    const result = await handleAddStreamingUrlToPlaylist(playlistId, url, embedNowPlaying)
    if (result.ok) setEmbedPendingUrl("")
    return result
  }, [
    embedPendingUrl,
    embedNowPlaying,
    handleAddStreamingUrlToPlaylist,
    resolveEmbedActionUrl,
  ])

  const toggleLike = useCallback(async () => {
    const likesName = getLikesPlaylistName(settings.language)
    setPlaylistsState(prev => ensureLikesPlaylist(prev, likesName))

    if (display.isEmbed && embedNowPlaying?.title?.trim()) {
      const embedInfo = embedNowPlaying
      const existing = findStreamingTrackByEmbed(tracks, embedInfo)
      const currentlyLiked = existing
        ? isTrackInLikesPlaylist(playlistsState, existing.id)
        : false

      if (currentlyLiked && existing) {
        const url = await resolveEmbedActionUrl()
        if (url) void api.streamingUnlikeTrack(url)
        embedUnlikeRef.current?.()
        setPlaylistsState(prev => removeTrackFromPlaylist(prev, LIKES_PLAYLIST_ID, existing.id))
        return
      }

      embedLikeRef.current?.()

      const url = await resolveEmbedActionUrl()
      if (url) void api.streamingLikeTrack(url)

      const cleanUrl = url ? (sanitizeStreamingTrackUrl(url) ?? url) : ""
      const parsed = cleanUrl ? parseStreamingUrl(cleanUrl) : null
      const importResult = cleanUrl
        ? await api.streamingImportUrl(cleanUrl)
        : { ok: false, tracks: [] }

      const inputs = cleanUrl && parsed?.id
        ? collectStreamingTrackInputs({
            url: cleanUrl,
            parsed,
            importResult,
            embed: embedInfo,
          })
        : collectStreamingTrackInputsFromEmbedOnly(embedInfo).map(item =>
            cleanUrl ? mergePageUrlOnStreamingInput(item, cleanUrl) : item,
          )

      if (!inputs.length) return

      const next = upsertStreamingTracks(streamingLibrary.tracks, inputs)
      setStreamingLibrary({ tracks: next })
      const trackIds = inputs.map(
        item => next.find(t => t.externalId === item.externalId && t.source === item.source)!.id,
      )
      handleAddTracksToPlaylist(LIKES_PLAYLIST_ID, trackIds)
      return
    }

    if (currentTrack && isEmbedDelegatedTrack(currentTrack)) {
      const url = await resolveEmbedActionUrl()
      if (!url) return

      const parsed = parseStreamingUrl(url)
      if (!parsed?.provider || parsed.type !== "track" || !parsed.id) return

      const existing = findLikedTrackByPageUrl(tracks, url)
      const currentlyLiked = existing
        ? isTrackInLikesPlaylist(playlistsState, existing.id)
        : false

      if (currentlyLiked && existing) {
        await api.streamingUnlikeTrack(url)
        embedUnlikeRef.current?.()
        setPlaylistsState(prev => removeTrackFromPlaylist(prev, LIKES_PLAYLIST_ID, existing.id))
        return
      }

      void api.streamingLikeTrack(url)
      embedLikeRef.current?.()

      const importResult = await api.streamingImportUrl(sanitizeStreamingTrackUrl(url) ?? url)
      const inputs = collectStreamingTrackInputs({
        url: sanitizeStreamingTrackUrl(url) ?? url,
        parsed,
        importResult,
        embed: embedNowPlaying,
      })
      if (!inputs.length) return

      const next = upsertStreamingTracks(streamingLibrary.tracks, inputs)
      setStreamingLibrary({ tracks: next })
      const trackIds = inputs.map(
        item => next.find(t => t.externalId === item.externalId && t.source === item.source)!.id,
      )
      handleAddTracksToPlaylist(LIKES_PLAYLIST_ID, trackIds)
      return
    }

    const track = display.track
    if (!track || display.isEmbed) return

    if (isTrackInLikesPlaylist(playlistsState, track.id)) {
      setPlaylistsState(prev => removeTrackFromPlaylist(prev, LIKES_PLAYLIST_ID, track.id))
      return
    }

    setPlaylistsState(prev => {
      const withLikes = ensureLikesPlaylist(prev, likesName)
      const updated = addTrackToPlaylist(withLikes, LIKES_PLAYLIST_ID, track.id)
      return {
        playlists: updated.playlists.map(p =>
          p.id === LIKES_PLAYLIST_ID ? syncPlaylistCoverAfterAdd(p, tracks) : p,
        ),
      }
    })
  }, [
    api,
    currentTrack,
    display.isEmbed,
    display.track,
    embedNowPlaying,
    handleAddTracksToPlaylist,
    playlistsState,
    resolveEmbedActionUrl,
    settings.language,
    streamingLibrary.tracks,
    tracks,
  ])

  return {
    loaded,
    screen,
    setScreen,
    tracks,
    currentTrack,
    displayTrack: display.track,
    displayIsPlaying: display.isPlaying,
    displayProgress,
    displayIsEmbed: display.isEmbed,
    displayUseEmbedTransport: shouldRouteSkipToEmbed(display),
    displayRouteTransportToEmbed: shouldRouteTransportToEmbed(display),
    embedPlayLoading,
    embedControlProvider,
    embedBrowsingActive,
    embedPlaybackProvider: embedNowPlaying?.provider ?? null,
    keepEmbedWebviewsAlive,
    embedNowPlaying,
    embedPlaylistOpen,
    setEmbedPlaylistOpen,
    panelVisible,
    getEmbedPageUrl,
    openEmbedPlaylistDialog,
    handleEmbedPlaylistPick,
    playback,
    settings,
    isLiked,
    playlists: playlistsState.playlists,
    toggleLike,
    setProgress: (v: number) => setPlayback(prev => setPlaybackProgress(prev, v)),
    togglePlay: handleTogglePlay,
    pausePlayback,
    toggleShuffle: () => setPlayback(toggleShuffle(playback)),
    cycleRepeat: () => setPlayback(cycleRepeatMode(playback)),
    setVolume,
    handleAddTracks,
    handleScanFolders,
    handleAddStreamingTracks,
    handleImportStreamingUrl,
    handleAddTracksToPlaylist,
    handleAddStreamingUrlToPlaylist,
    handleRemoveTrackFromPlaylist,
    getEmbedStatus: () => api.streamingEmbedStatus(),
    clearEmbedSession: (provider: StreamingProvider) => api.streamingEmbedClear(provider),
    clearEmbedNowPlaying,
    setEmbedNowPlaying: updateEmbedNowPlaying,
    registerEmbedControls,
    notifyEmbedHostReady,
    seekEmbed,
    handleEmbedPrev,
    handleEmbedNext,
    handleDeleteTrack,
    handleSelectTrack,
    handlePrev,
    handleNext,
    handlePlaylistsChange,
    saveSettings,
    searchTracks: (q: string) => searchTracks(library, q),
    hidePanel: () => api.hidePanel(),
    togglePanel: () => api.togglePanel(),
  }
}

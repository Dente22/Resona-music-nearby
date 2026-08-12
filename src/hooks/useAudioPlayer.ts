import { useEffect, useRef, useCallback } from "react"
import type { Track } from "@/lib/types"
import { getPlaybackUri } from "@/lib/streaming/trackFactory"
import { localMediaVolumeWhenUsingSystemMixer } from "@/lib/streaming/windowsMixerVolume"

interface UseAudioPlayerOptions {
  volume: number
  /** When true, HTMLAudioElement stays at 100% — Windows Volume Mixer owns gain. */
  useSystemVolumeMixer?: boolean
  onProgress: (seconds: number) => void
  onEnded: () => void
  onDuration: (seconds: number) => void
  onPlayError?: (message: string) => void
}

function waitForCanPlay(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error(`Audio load failed: ${audio.error?.message ?? "unknown"}`))
    }
    const cleanup = () => {
      audio.removeEventListener("canplay", onReady)
      audio.removeEventListener("error", onError)
    }
    audio.addEventListener("canplay", onReady)
    audio.addEventListener("error", onError)
  })
}

function resolveElementVolume(percent: number, useSystemMixer: boolean): number {
  if (useSystemMixer) return localMediaVolumeWhenUsingSystemMixer()
  return Math.max(0, Math.min(1, percent / 100))
}

export function useAudioPlayer({
  volume,
  useSystemVolumeMixer = false,
  onProgress,
  onEnded,
  onDuration,
  onPlayError,
}: UseAudioPlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const loadedPathRef = useRef<string>("")
  const loadChainRef = useRef(Promise.resolve(true))
  const onProgressRef = useRef(onProgress)
  const onEndedRef = useRef(onEnded)
  const onDurationRef = useRef(onDuration)
  const onPlayErrorRef = useRef(onPlayError)

  onProgressRef.current = onProgress
  onEndedRef.current = onEnded
  onDurationRef.current = onDuration
  onPlayErrorRef.current = onPlayError

  const volumeRef = useRef(volume)
  volumeRef.current = volume
  const mixerRef = useRef(useSystemVolumeMixer)
  mixerRef.current = useSystemVolumeMixer

  useEffect(() => {
    audioRef.current = new Audio()
    const audio = audioRef.current
    audio.volume = resolveElementVolume(volumeRef.current, mixerRef.current)

    const onTimeUpdate = () => onProgressRef.current(Math.floor(audio.currentTime))
    const onMeta = () => onDurationRef.current(Math.floor(audio.duration || 0))
    const onEnd = () => onEndedRef.current()

    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("loadedmetadata", onMeta)
    audio.addEventListener("ended", onEnd)

    return () => {
      audio.pause()
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("loadedmetadata", onMeta)
      audio.removeEventListener("ended", onEnd)
      audioRef.current = null
      loadedPathRef.current = ""
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const level = resolveElementVolume(volume, useSystemVolumeMixer)
    audio.volume = level
    audio.muted = useSystemVolumeMixer ? false : level <= 0.001
  }, [volume, useSystemVolumeMixer])

  const loadTrack = useCallback(async (track: Track | null) => {
    const run = async (): Promise<boolean> => {
      const audio = audioRef.current
      if (!audio) return false

      if (!track) {
        audio.pause()
        loadedPathRef.current = ""
        return false
      }

      const playbackUri = getPlaybackUri(track)
      if (!playbackUri.trim()) {
        audio.pause()
        loadedPathRef.current = ""
        return false
      }

      if (loadedPathRef.current === playbackUri) return true

      const isHttp = /^https?:\/\//i.test(playbackUri)

      try {
        let src: string
        if (isHttp) {
          src = playbackUri
        } else {
          src = await window.musicPlayer.resolveAudioPath(playbackUri)
        }
        if (!src) throw new Error("Empty audio URL")

        audio.pause()
        audio.src = src
        audio.volume = resolveElementVolume(volumeRef.current, mixerRef.current)
        audio.load()
        await waitForCanPlay(audio)
        audio.volume = resolveElementVolume(volumeRef.current, mixerRef.current)
        loadedPathRef.current = playbackUri
        return true
      } catch (err) {
        loadedPathRef.current = ""
        const message = err instanceof Error ? err.message : "Playback load failed"
        console.error("[Resona] Load error:", message)
        onPlayErrorRef.current?.(message)
        return false
      }
    }

    const next = loadChainRef.current.then(run, run)
    loadChainRef.current = next
    return next
  }, [])

  const setPlaying = useCallback(async (shouldPlay: boolean) => {
    await loadChainRef.current
    const audio = audioRef.current
    if (!audio || !loadedPathRef.current) return false

    try {
      if (shouldPlay) {
        audio.volume = resolveElementVolume(volumeRef.current, mixerRef.current)
        await audio.play()
        return true
      }
      audio.pause()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Playback failed"
      console.error("[Resona] Play error:", message)
      onPlayErrorRef.current?.(message)
      audio.pause()
      return false
    }
  }, [])

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) audioRef.current.currentTime = seconds
  }, [])

  return { loadTrack, setPlaying, seek }
}

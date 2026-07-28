import { useState } from "react"
import {
  Heart, Shuffle, SkipBack, Play, Pause,
  SkipForward, Repeat, Repeat1, Volume1, Volume2, WifiOff, ListPlus, Loader2,
} from "lucide-react"
import * as Slider from "@radix-ui/react-slider"
import type { Track } from "@/lib/types"
import { resolvePlayButtonVisual } from "@/lib/playButtonVisual"
import { MoodBadge } from "./MoodBadge"
import { useI18n } from "@/context/I18nContext"
import { VW } from "@/lib/designTokens"

interface NowPlayingProps {
  track: Track
  isPlaying: boolean
  isLoading?: boolean
  isLiked: boolean
  progress: number
  volume: number
  isShuffled: boolean
  repeatMode: "off" | "all" | "one"
  isEmbed?: boolean
  canAddToPlaylist?: boolean
  onAddToPlaylist?: () => void
  onTogglePlay: () => void
  onPrev: () => void
  onNext: () => void
  onProgressChange: (v: number) => void
  onVolumeChange: (v: number) => void
  onToggleLike: () => void
  onToggleShuffle: () => void
  onToggleRepeat: () => void
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, "0")}`
}

export function NowPlaying({
  track, isPlaying, isLoading = false, isLiked, progress, volume,
  isShuffled, repeatMode, isEmbed, canAddToPlaylist, onAddToPlaylist,
  onTogglePlay, onPrev, onNext, onProgressChange,
  onVolumeChange, onToggleLike, onToggleShuffle, onToggleRepeat,
}: NowPlayingProps) {
  const { t } = useI18n()
  const [scrubProgress, setScrubProgress] = useState<number | null>(null)
  const shownProgress = scrubProgress ?? progress
  const playVisual = resolvePlayButtonVisual(isPlaying, isLoading)

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative vw-fade-up">
      <div className="relative flex flex-col items-center px-6 pt-14 pb-2">
        <p className="vw-display" style={{ color: VW.ink, fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
          {t.app.name}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span
            className="text-[11px] tracking-[0.14em] uppercase"
            style={{ color: VW.muted, fontWeight: 600 }}
          >
            Now Playing
          </span>
          {track.downloaded && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold"
              style={{
                color: VW.sea,
                background: VW.seaSoft,
                borderRadius: 8,
              }}
            >
              <WifiOff className="w-2.5 h-2.5" />
              {t.nowPlaying.offline}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex justify-center px-7 pt-3 pb-5">
        <div
          className={`relative w-full aspect-square overflow-hidden ${isPlaying ? "vw-art-playing" : ""}`}
          style={{
            borderRadius: 28,
            boxShadow: `0 18px 40px ${VW.shadow}`,
            border: `1px solid ${VW.borderStrong}`,
          }}
        >
          <img
            src={track.img}
            alt={`${track.title} album art`}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
            style={{ background: `linear-gradient(to top, var(--vw-art-fade), transparent)` }}
          />
        </div>
      </div>

      <div className="flex items-start justify-between px-7 mb-4">
        <div className="flex-1 min-w-0 mr-3">
          <h2
            className="vw-display truncate"
            style={{ color: VW.ink, fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15 }}
          >
            {track.title}
          </h2>
          <p className="truncate mt-1" style={{ color: VW.inkSoft, fontSize: 14 }}>
            {track.artist}{track.album ? ` · ${track.album}` : ""}
          </p>
          {track.mood && (
            <div className="mt-2">
              <MoodBadge mood={track.mood} />
            </div>
          )}
          {isEmbed && (
            <button
              onClick={onAddToPlaylist}
              disabled={!canAddToPlaylist}
              className="flex items-center gap-1.5 mt-3 px-3 py-1.5 text-[11px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-40"
              style={{
                background: canAddToPlaylist ? VW.accentSoft : "rgba(20,43,47,0.04)",
                color: canAddToPlaylist ? VW.accent : VW.muted,
                border: `1px solid ${canAddToPlaylist ? "rgba(255,92,58,0.28)" : VW.border}`,
                borderRadius: 12,
              }}
            >
              <ListPlus className="w-3.5 h-3.5" />
              {t.nowPlaying.addToPlaylist}
            </button>
          )}
        </div>
        <button
          onClick={onToggleLike}
          className="w-11 h-11 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
          style={{
            background: isLiked ? VW.accentSoft : VW.surface,
            border: `1px solid ${isLiked ? "rgba(255,92,58,0.28)" : VW.border}`,
            borderRadius: 14,
          }}
        >
          <Heart
            className="w-5 h-5"
            style={{
              color: isLiked ? VW.accent : VW.muted,
              fill: isLiked ? VW.accent : "none",
            }}
          />
        </button>
      </div>

      <div className="px-7 mb-5">
        <Slider.Root
          className="relative flex items-center w-full h-5 cursor-pointer touch-none"
          min={0}
          max={Math.max(track.duration, 1)}
          step={1}
          value={[shownProgress]}
          onValueChange={([v]) => {
            if (isEmbed) setScrubProgress(v)
            else onProgressChange(v)
          }}
          onValueCommit={([v]) => {
            if (isEmbed) {
              onProgressChange(v)
              setScrubProgress(null)
            }
          }}
        >
          <Slider.Track
            className="relative flex-1 h-1.5 overflow-hidden"
            style={{ background: VW.track, borderRadius: 999 }}
          >
            <Slider.Range
              className="absolute h-full"
              style={{
                background: `linear-gradient(90deg, ${VW.sea}, ${VW.accent})`,
                borderRadius: 999,
              }}
            />
          </Slider.Track>
          <Slider.Thumb
            className="block w-3.5 h-3.5 outline-none"
            style={{
              background: VW.surfaceSolid,
              border: `2px solid ${VW.accent}`,
              borderRadius: 999,
            }}
          />
        </Slider.Root>
        <div className="flex justify-between mt-1.5">
          <span style={{ color: VW.muted, fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{fmt(shownProgress)}</span>
          <span style={{ color: VW.muted, fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{fmt(track.duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-7 mb-5">
        <button
          onClick={onToggleShuffle}
          className="w-10 h-10 flex items-center justify-center active:scale-90 transition-transform"
          style={{ borderRadius: 12 }}
        >
          <Shuffle className="w-5 h-5" style={{ color: isShuffled ? VW.accent : VW.faint }} />
        </button>

        <button
          onClick={onPrev}
          className="w-12 h-12 flex items-center justify-center active:scale-90 transition-transform"
          style={{ borderRadius: 14 }}
        >
          <SkipBack className="w-6 h-6" style={{ color: VW.ink, fill: VW.ink }} />
        </button>

        <button
          onClick={onTogglePlay}
          disabled={isLoading}
          aria-busy={isLoading}
          aria-label={playVisual === "loading" ? t.app.loading : isPlaying ? "Pause" : "Play"}
          className="w-[68px] h-[68px] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-90"
          style={{
            background: VW.accent,
            color: VW.white,
            borderRadius: 22,
            boxShadow: "0 12px 28px var(--vw-accent-glow)",
          }}
        >
          {playVisual === "loading"
            ? <Loader2 className="w-7 h-7 animate-spin" style={{ color: VW.white }} />
            : playVisual === "pause"
              ? <Pause className="w-7 h-7" style={{ fill: VW.white }} />
              : <Play className="w-7 h-7 ml-0.5" style={{ fill: VW.white }} />
          }
        </button>

        <button
          onClick={onNext}
          className="w-12 h-12 flex items-center justify-center active:scale-90 transition-transform"
          style={{ borderRadius: 14 }}
        >
          <SkipForward className="w-6 h-6" style={{ color: VW.ink, fill: VW.ink }} />
        </button>

        <button
          onClick={onToggleRepeat}
          className="w-10 h-10 flex items-center justify-center active:scale-90 transition-transform"
          style={{ borderRadius: 12 }}
        >
          {repeatMode === "one"
            ? <Repeat1 className="w-5 h-5" style={{ color: VW.accent }} />
            : <Repeat className="w-5 h-5" style={{ color: repeatMode === "all" ? VW.accent : VW.faint }} />
          }
        </button>
      </div>

      <div className="flex items-center gap-3 px-7 pb-2">
        <Volume1 className="w-4 h-4 flex-shrink-0" style={{ color: VW.faint }} />
        <Slider.Root
          className="relative flex items-center flex-1 h-4 cursor-pointer touch-none"
          min={0}
          max={100}
          step={1}
          value={[volume]}
          onValueChange={([v]) => onVolumeChange(v)}
        >
          <Slider.Track
            className="relative flex-1 h-1 overflow-hidden"
            style={{ background: VW.track, borderRadius: 999 }}
          >
            <Slider.Range
              className="absolute h-full"
              style={{ background: VW.sea, borderRadius: 999 }}
            />
          </Slider.Track>
          <Slider.Thumb
            className="block w-3 h-3 outline-none"
            style={{ background: VW.ink, borderRadius: 999 }}
          />
        </Slider.Root>
        <Volume2 className="w-4 h-4 flex-shrink-0" style={{ color: VW.faint }} />
      </div>
    </div>
  )
}

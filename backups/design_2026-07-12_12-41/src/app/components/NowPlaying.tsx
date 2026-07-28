import { useState } from "react"
import {
  Heart, MoreHorizontal, Shuffle, SkipBack, Play, Pause,
  SkipForward, Repeat, Repeat1, Volume1, Volume2, WifiOff, ListPlus,
} from "lucide-react"
import * as Slider from "@radix-ui/react-slider"
import type { Track } from "@/lib/types"
import { MoodBadge } from "./MoodBadge"
import { useI18n } from "@/context/I18nContext"

interface NowPlayingProps {
  track: Track
  isPlaying: boolean
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

const ACCENT = "#8B5CF6"
const MUTED = "#4A4A68"
const TEXT = "#F0F0FA"
const SUBTEXT = "#7878A0"

export function NowPlaying({
  track, isPlaying, isLiked, progress, volume,
  isShuffled, repeatMode, isEmbed, canAddToPlaylist, onAddToPlaylist,
  onTogglePlay, onPrev, onNext, onProgressChange,
  onVolumeChange, onToggleLike, onToggleShuffle, onToggleRepeat,
}: NowPlayingProps) {
  const { t } = useI18n()
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [scrubProgress, setScrubProgress] = useState<number | null>(null)
  const shownProgress = scrubProgress ?? progress

  const progressPct = track.duration > 0 ? (shownProgress / track.duration) * 100 : 0

  return (
    <div
      className="flex flex-col flex-1 overflow-hidden"
      style={{ background: "#09090F" }}
    >
      {/* Ambient glow behind art */}
      <div
        className="absolute top-0 left-0 right-0 h-[55%] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.18) 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-6 pt-14 pb-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-full active:opacity-60 transition-opacity">
          <MoreHorizontal className="w-5 h-5 rotate-90" style={{ color: MUTED }} />
        </button>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] tracking-[0.18em] uppercase" style={{ color: MUTED }}>
            Now Playing
          </span>
          {track.downloaded && (
            <div className="flex items-center gap-1">
              <WifiOff className="w-2.5 h-2.5" style={{ color: "#34D399" }} />
              <span className="text-[9px] tracking-wide" style={{ color: "#34D399" }}>{t.nowPlaying.offline}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setOptionsOpen(!optionsOpen)}
          className="w-8 h-8 flex items-center justify-center rounded-full active:opacity-60 transition-opacity"
        >
          <MoreHorizontal className="w-5 h-5" style={{ color: MUTED }} />
        </button>
      </div>

      {/* Album Art */}
      <div className="relative flex justify-center px-8 pt-4 pb-6">
        <div
          className="relative w-full aspect-square rounded-3xl overflow-hidden"
          style={{
            boxShadow: `0 0 80px rgba(139,92,246,${isPlaying ? "0.35" : "0.15"}), 0 24px 48px rgba(0,0,0,0.6)`,
            transition: "box-shadow 0.8s ease",
            transform: isPlaying ? "scale(1.02)" : "scale(1)",
            transitionProperty: "transform, box-shadow",
            transitionDuration: "0.6s",
          }}
        >
          <img
            src={track.img}
            alt={`${track.title} album art`}
            className="w-full h-full object-cover"
          />
          {/* Subtle overlay gradient at bottom */}
          <div
            className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(9,9,15,0.4), transparent)" }}
          />
        </div>
      </div>

      {/* Track Info + Like */}
      <div className="flex items-center justify-between px-8 mb-5">
        <div className="flex-1 min-w-0 mr-4">
          <h2
            className="truncate"
            style={{ color: TEXT, fontSize: "20px", fontWeight: 700, lineHeight: 1.2 }}
          >
            {track.title}
          </h2>
          <p className="truncate mt-0.5" style={{ color: SUBTEXT, fontSize: "14px" }}>
            {track.artist} · {track.album}
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
              className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl text-[11px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-40"
              style={{
                background: canAddToPlaylist ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                color: canAddToPlaylist ? ACCENT : SUBTEXT,
                border: "1px solid rgba(139,92,246,0.25)",
              }}
            >
              <ListPlus className="w-3.5 h-3.5" />
              {t.nowPlaying.addToPlaylist}
            </button>
          )}
        </div>
        <button
          onClick={onToggleLike}
          className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 active:scale-90 transition-transform duration-150"
          style={{ background: isLiked ? "rgba(139,92,246,0.15)" : "transparent" }}
        >
          <Heart
            className="w-5 h-5"
            style={{
              color: isLiked ? ACCENT : MUTED,
              fill: isLiked ? ACCENT : "none",
              transition: "color 0.2s, fill 0.2s",
            }}
          />
        </button>
      </div>

      {/* Progress */}
      <div className="px-8 mb-5">
        <Slider.Root
          className="relative flex items-center w-full h-4 cursor-pointer touch-none"
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
            className="relative flex-1 h-1 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <Slider.Range
              className="absolute h-full rounded-full"
              style={{ background: ACCENT }}
            />
          </Slider.Track>
          <Slider.Thumb
            className="block w-3 h-3 rounded-full outline-none"
            style={{ background: "#FFFFFF", boxShadow: `0 0 8px rgba(139,92,246,0.6)` }}
          />
        </Slider.Root>
        <div className="flex justify-between mt-1.5">
          <span style={{ color: SUBTEXT, fontSize: "11px" }}>{fmt(shownProgress)}</span>
          <span style={{ color: SUBTEXT, fontSize: "11px" }}>{fmt(track.duration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-between px-8 mb-6">
        {/* Shuffle */}
        <button
          onClick={onToggleShuffle}
          className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-150"
        >
          <Shuffle
            className="w-5 h-5"
            style={{ color: isShuffled ? ACCENT : MUTED }}
          />
          {isShuffled && (
            <span
              className="absolute w-1 h-1 rounded-full mt-5"
              style={{ background: ACCENT }}
            />
          )}
        </button>

        {/* Prev */}
        <button
          onClick={onPrev}
          className="w-12 h-12 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-150"
        >
          <SkipBack className="w-6 h-6" style={{ color: TEXT, fill: TEXT }} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          className="w-16 h-16 rounded-full flex items-center justify-center active:scale-95 transition-transform duration-150"
          style={{
            background: `linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)`,
            boxShadow: `0 0 32px rgba(139,92,246,0.55), 0 8px 16px rgba(0,0,0,0.4)`,
          }}
        >
          {isPlaying
            ? <Pause className="w-7 h-7" style={{ color: "#FFFFFF", fill: "#FFFFFF" }} />
            : <Play className="w-7 h-7 ml-1" style={{ color: "#FFFFFF", fill: "#FFFFFF" }} />
          }
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          className="w-12 h-12 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-150"
        >
          <SkipForward className="w-6 h-6" style={{ color: TEXT, fill: TEXT }} />
        </button>

        {/* Repeat */}
        <button
          onClick={onToggleRepeat}
          className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-150"
        >
          {repeatMode === "one"
            ? <Repeat1 className="w-5 h-5" style={{ color: ACCENT }} />
            : <Repeat className="w-5 h-5" style={{ color: repeatMode === "all" ? ACCENT : MUTED }} />
          }
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3 px-8">
        <Volume1 className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />
        <Slider.Root
          className="relative flex items-center flex-1 h-4 cursor-pointer touch-none"
          min={0}
          max={100}
          step={1}
          value={[volume]}
          onValueChange={([v]) => onVolumeChange(v)}
        >
          <Slider.Track
            className="relative flex-1 h-1 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <Slider.Range
              className="absolute h-full rounded-full"
              style={{ background: "rgba(139,92,246,0.6)" }}
            />
          </Slider.Track>
          <Slider.Thumb
            className="block w-3 h-3 rounded-full outline-none"
            style={{ background: "#FFFFFF" }}
          />
        </Slider.Root>
        <Volume2 className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />
      </div>
    </div>
  )
}

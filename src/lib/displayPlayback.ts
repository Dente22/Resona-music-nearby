import type { Track } from "./types"
import type { EmbedNowPlaying } from "./streaming/embedNowPlaying"
import { embedNowPlayingToTrack } from "./streaming/embedNowPlaying"
import {
  isEmbedDelegatedTrack,
  mergeStreamingTrackWithEmbed,
} from "./streaming/embedDelegatedTrack"
import { embedMatchesQueuedLibraryTrack } from "./streaming/embedTrackMatch"
import type { PlaybackState } from "./types"

export interface DisplayPlayback {
  track: Track | null
  isPlaying: boolean
  progress: number
  isEmbed: boolean
  /** Use embed skip buttons instead of library queue navigation. */
  useEmbedTransport: boolean
}

/** Embed owns transport after library delegation or an active Internet-tab session. */
export function isEmbedControlActive(
  embedControlProvider: string | null,
  embedBrowsingActive: boolean,
): boolean {
  return embedControlProvider !== null || embedBrowsingActive
}

/** Follow live Spotify/Yandex playback instead of a paused local queue item. */
export function preferBrowserPlayback(
  embed: EmbedNowPlaying,
  playback: PlaybackState,
  currentTrack: Track | null,
  internetTabVisible: boolean,
  embedBrowsingActive: boolean,
  embedControlProvider: string | null = null,
  pinnedLibraryPlayback: boolean = false,
): boolean {
  if (
    pinnedLibraryPlayback
    && currentTrack
    && isEmbedDelegatedTrack(currentTrack)
    && playback.currentTrackId === currentTrack.id
  ) {
    if (!embedMatchesQueuedLibraryTrack(currentTrack, embed)) return false
    // Library drive owns the session: keep the card on this track even while Yandex
    // DOM still reports paused for a moment after play().
    return playback.isPlaying || embed.isPlaying
  }

  if (internetTabVisible) return true

  // Keep internet browsing session on screen even while paused, so play/skip still hit embed.
  if (embedBrowsingActive) return true

  if (!embed.isPlaying) return false

  // Actively playing local file wins over browser audio.
  if (playback.isPlaying && currentTrack && !isEmbedDelegatedTrack(currentTrack)) {
    return false
  }

  if (currentTrack && isEmbedDelegatedTrack(currentTrack)) {
    if (embedMatchesQueuedLibraryTrack(currentTrack, embed)) return true
    // Driving a specific library stream — ignore unrelated My Wave / radio audio.
    if (pinnedLibraryPlayback || embedControlProvider) return false
    // Otherwise the live browser queue is what the user hears.
    return true
  }

  // Live browser audio with paused/idle local selection — always show the browser track.
  return true
}

function resolveDelegatedDisplayPlaying(
  playback: PlaybackState,
  embed: EmbedNowPlaying,
  pinnedLibraryPlayback: boolean,
): boolean {
  if (pinnedLibraryPlayback) {
    return Boolean(playback.isPlaying || embed.isPlaying)
  }
  return embed.isPlaying
}

function resolveEmbedTransport(
  internetTabVisible: boolean,
  embedBrowsingActive: boolean,
  pinnedLibraryPlayback: boolean,
): boolean {
  return internetTabVisible || embedBrowsingActive || pinnedLibraryPlayback
}

export function pickDisplayPlayback(
  playback: PlaybackState,
  currentTrack: Track | null,
  embed: EmbedNowPlaying | null,
  placeholderImg: string,
  internetTabVisible = false,
  embedBrowsingActive = false,
  embedControlProvider: string | null = null,
  pinnedLibraryPlayback = false,
): DisplayPlayback {
  const embedHasTrack = Boolean(embed?.title?.trim())

  if (
    embedHasTrack
    && preferBrowserPlayback(
      embed!,
      playback,
      currentTrack,
      internetTabVisible,
      embedBrowsingActive,
      embedControlProvider,
      pinnedLibraryPlayback,
    )
  ) {
    const useLibraryMerge = Boolean(
      currentTrack
      && isEmbedDelegatedTrack(currentTrack)
      && embedMatchesQueuedLibraryTrack(currentTrack, embed!),
    )
    if (useLibraryMerge) {
      return {
        track: mergeStreamingTrackWithEmbed(currentTrack!, embed!),
        isPlaying: resolveDelegatedDisplayPlaying(playback, embed!, pinnedLibraryPlayback),
        progress: embed!.progress,
        isEmbed: true,
        // Library-driven play must keep embed transport (play/skip), not only Internet tab.
        useEmbedTransport: resolveEmbedTransport(
          internetTabVisible,
          embedBrowsingActive,
          pinnedLibraryPlayback,
        ),
      }
    }
    return {
      track: embedNowPlayingToTrack(embed!, placeholderImg) as Track,
      isPlaying: embed!.isPlaying,
      progress: embed!.progress,
      isEmbed: true,
      useEmbedTransport: true,
    }
  }

  const embedDelegated =
    Boolean(playback.currentTrackId && currentTrack && isEmbedDelegatedTrack(currentTrack))

  if (embedDelegated && currentTrack) {
    if (embedHasTrack && embedMatchesQueuedLibraryTrack(currentTrack, embed!)) {
      return {
        track: mergeStreamingTrackWithEmbed(currentTrack, embed!),
        isPlaying: resolveDelegatedDisplayPlaying(playback, embed!, pinnedLibraryPlayback),
        progress: embed!.progress,
        isEmbed: true,
        useEmbedTransport: resolveEmbedTransport(
          internetTabVisible,
          embedBrowsingActive,
          pinnedLibraryPlayback,
        ),
      }
    }
    if (embedHasTrack && embedBrowsingActive) {
      return {
        track: embedNowPlayingToTrack(embed!, placeholderImg) as Track,
        isPlaying: embed!.isPlaying,
        progress: embed!.progress,
        isEmbed: true,
        useEmbedTransport: true,
      }
    }
    return {
      track: currentTrack,
      isPlaying: playback.isPlaying,
      progress: 0,
      isEmbed: true,
      // On Internet / live browse / library drive, skip must still hit the browser.
      useEmbedTransport: resolveEmbedTransport(
        internetTabVisible,
        embedBrowsingActive,
        pinnedLibraryPlayback,
      ),
    }
  }

  /** Selected local track only when embed is not the live source. */
  if (playback.currentTrackId && currentTrack && !isEmbedDelegatedTrack(currentTrack)) {
    // Live browser audio must win over a paused library selection (Internet / My Wave).
    if (embedHasTrack && embed!.isPlaying && !playback.isPlaying) {
      return {
        track: embedNowPlayingToTrack(embed!, placeholderImg) as Track,
        isPlaying: true,
        progress: embed!.progress,
        isEmbed: true,
        useEmbedTransport: true,
      }
    }
    return {
      track: currentTrack,
      isPlaying: playback.isPlaying,
      progress: playback.progress,
      isEmbed: false,
      useEmbedTransport: false,
    }
  }

  const localPlaying = Boolean(playback.currentTrackId && playback.isPlaying && currentTrack)

  if (localPlaying && currentTrack) {
    return {
      track: currentTrack,
      isPlaying: true,
      progress: playback.progress,
      isEmbed: false,
      useEmbedTransport: false,
    }
  }

  if (embedHasTrack) {
    return {
      track: embedNowPlayingToTrack(embed!, placeholderImg) as Track,
      isPlaying: embed!.isPlaying,
      progress: embed!.progress,
      isEmbed: true,
      useEmbedTransport: true,
    }
  }

  if (playback.currentTrackId && currentTrack) {
    return {
      track: currentTrack,
      isPlaying: playback.isPlaying,
      progress: playback.progress,
      isEmbed: false,
      useEmbedTransport: false,
    }
  }

  return {
    track: currentTrack,
    isPlaying: false,
    progress: 0,
    isEmbed: false,
    useEmbedTransport: false,
  }
}

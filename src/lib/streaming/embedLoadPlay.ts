import { EMBED_CONTROLS_BOOTSTRAP } from "./embedPlayerControls.js"
import type { StreamingProvider } from "./types.js"

export const EMBED_READ_PROGRESS_SCRIPT = `${EMBED_CONTROLS_BOOTSTRAP}
(function() {
  if (window.__VW_EMBED__ && window.__VW_EMBED__.readProgress) {
    return window.__VW_EMBED__.readProgress();
  }
  var media = document.querySelector("audio,video");
  return media && isFinite(media.currentTime) ? Math.max(0, Math.floor(media.currentTime)) : 0;
})()`

export const EMBED_TRACK_PAGE_SETTLE_MS = 450
export const EMBED_YANDEX_TRACK_PAGE_SETTLE_MS = 900
export const EMBED_SEARCH_PAGE_SETTLE_MS = 700

export function getTrackPageSettleMs(provider: StreamingProvider): number {
  return provider === "yandex" ? EMBED_YANDEX_TRACK_PAGE_SETTLE_MS : EMBED_TRACK_PAGE_SETTLE_MS
}

/** Start playback on an already-open track page and confirm audio is playing. */
export const EMBED_START_TRACK_SCRIPT = `${EMBED_CONTROLS_BOOTSTRAP}
(function() {
  if (!window.__VW_EMBED__) return false;
  window.__VW_EMBED__.play();
  return window.__VW_EMBED__.isPlaying();
})()`

export const EMBED_IS_PLAYING_SCRIPT = `${EMBED_CONTROLS_BOOTSTRAP}
(function() {
  return window.__VW_EMBED__ ? window.__VW_EMBED__.isPlaying() : false;
})()`

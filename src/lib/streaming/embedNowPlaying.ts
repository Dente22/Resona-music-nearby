import type { StreamingProvider } from "./types.js"
import { upscaleEmbedCoverUrl } from "./embedCoverArt.js"
import {
  EMBED_PREV_SCRIPT,
  EMBED_NEXT_SCRIPT,
  buildEmbedSeekScript,
} from "./embedPlayerControls.js"

export interface EmbedNowPlaying {
  provider: StreamingProvider
  title: string
  artist: string
  album: string
  img: string
  isPlaying: boolean
  duration: number
  progress: number
  /** Track/album page URL from embed webview — used for playlist import */
  pageUrl?: string
}

export interface EmbedNowPlayingRaw {
  title?: string
  artist?: string
  album?: string
  img?: string
  isPlaying?: boolean
  duration?: number
  progress?: number
  pageUrl?: string
}

/** Mobile UA so Spotify/Yandex fill the narrow panel width. */
export const EMBED_MOBILE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"

/** Injected into Spotify / Yandex webview — Media Session + media elements + DOM times. */
export const EMBED_NOW_PLAYING_SCRIPT = `(function() {
  function parseClock(s) {
    if (!s) return 0;
    s = String(s).trim();
    var p = s.split(":").map(function(x) { return parseInt(x, 10) || 0; });
    if (p.length === 2) return p[0] * 60 + p[1];
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    return 0;
  }

  function pickMedia() {
    var list = [];
    document.querySelectorAll("audio,video").forEach(function(el) { list.push(el); });
    for (var i = 0; i < list.length; i++) {
      if (!list[i].paused && isFinite(list[i].duration) && list[i].duration > 0) return list[i];
    }
    for (var i = 0; i < list.length; i++) {
      if (isFinite(list[i].duration) && list[i].duration > 0) return list[i];
    }
    return list[0] || null;
  }

  function collectMetaLines(root) {
    var lines = [];
    var seen = {};
    root.querySelectorAll("span, div, a, p").forEach(function(el) {
      if (el.children.length > 4) return;
      var t = (el.textContent || "").trim();
      if (!t || t.length < 2 || t.length > 100) return;
      if (/^\\d{1,2}:\\d{2}$/.test(t)) return;
      if (/^(pause|play|пауз|воспро|смотреть|настроить|слушать|скачать|my wave|моя волна)$/i.test(t)) return;
      if (seen[t]) return;
      seen[t] = true;
      lines.push(t);
    });
    return lines;
  }

  function readYandexBarMeta() {
    var root = document.querySelector('section[class*="PlayerBarMobile_root"]')
      || document.querySelector('section[class*="PlayerBarDesktopWithBackgroundProgressBar_root"]')
      || document.querySelector('section[class*="PlayerBar_root"]')
      || document.querySelector('section[class*="VibePlayerBar_root"]')
      || document.querySelector('[class*="PlayerBarDesktop"]')
      || document.querySelector('[class*="PlayerBarMobile"]')
      || document.querySelector('[class*="CommonPlayerBar"]')
      || document.querySelector('[class*="PlayerBar"]');
    if (!root) {
      var playBtn = document.querySelector('button[aria-label*="Пауз"], button[aria-label*="Pause"], button[aria-label*="Воспро"], button[aria-label*="Playback"]');
      if (playBtn) root = playBtn.closest("section, footer, nav, div[class*='Player'], div[class*='player']") || playBtn.parentElement;
    }
    // Bottom mini-player: track title link near cover art (Yandex Music mobile web).
    if (!root) {
      var trackLink = document.querySelector('a[href*="/track/"]');
      if (trackLink) root = trackLink.closest("section, footer, nav, div[class*='Player'], div[class*='Bar'], div[class*='bar']") || trackLink.parentElement;
    }
    if (!root) return null;
    var title = "";
    var artist = "";
    var img = "";
    var titleEl = root.querySelector('a[href*="/track/"]')
      || root.querySelector('[class*="Meta_title"]')
      || root.querySelector('[class*="Track_title"]')
      || root.querySelector('[class*="meta__title"]')
      || root.querySelector('[class*="TrackName"]')
      || root.querySelector('[class*="SonataMeta"] a')
      || root.querySelector('[class*="Meta"] a')
      || root.querySelector('[class*="title"]');
    if (titleEl) title = (titleEl.textContent || "").trim();
    var artistEl = root.querySelector('[class*="Meta_artists"]')
      || root.querySelector('[class*="Track_artists"]')
      || root.querySelector('[class*="meta__artists"]')
      || root.querySelector('[class*="Meta"] [class*="artist"]')
      || root.querySelector('a[href*="/artist/"]');
    if (artistEl) artist = (artistEl.textContent || "").trim();
    if (!title) {
      var lines = collectMetaLines(root);
      for (var i = 0; i < lines.length; i++) {
        if (/^моя волна$/i.test(lines[i])) continue;
        title = lines[i];
        if (!artist && lines[i + 1]) artist = lines[i + 1];
        break;
      }
    }
    var imgEl = root.querySelector('img[src*="avatars"], img[class*="cover"], img');
    if (imgEl) img = imgEl.src || imgEl.getAttribute("src") || "";
    if (!title) return null;
    return { title: title, artist: artist, img: img };
  }

  function readSpotifyBarMeta() {
    var root = document.querySelector('[data-testid="now-playing-widget"]')
      || document.querySelector('[data-testid="player-controls"]')
      || document.querySelector('footer');
    if (!root) return null;
    var titleEl = root.querySelector('[data-testid="context-item-link"]')
      || root.querySelector('a[href*="/track/"]');
    var artistEl = root.querySelector('[data-testid="context-item-info-artist"]')
      || root.querySelector('a[href*="/artist/"]');
    var title = titleEl ? (titleEl.textContent || "").trim() : "";
    var artist = artistEl ? (artistEl.textContent || "").trim() : "";
    if (!title) return null;
    var imgEl = root.querySelector('img');
    return { title: title, artist: artist, img: imgEl ? (imgEl.src || "") : "" };
  }

  var meta = navigator.mediaSession && navigator.mediaSession.metadata;
  var domMeta = null;
  try {
    if (/music\\.yandex|yandex\\./i.test(location.hostname)) domMeta = readYandexBarMeta();
    else if (/spotify\\.com/i.test(location.hostname)) domMeta = readSpotifyBarMeta();
  } catch (e) {}

  var title = (domMeta && domMeta.title) || (meta && meta.title) || "";
  var artist = (domMeta && domMeta.artist) || (meta && meta.artist) || "";
  var album = (meta && meta.album) || "";
  if (domMeta && domMeta.title) {
    title = domMeta.title;
    artist = domMeta.artist || artist;
  }
  if (!title) return null;

  var isPlaying = false;
  var duration = 0;
  var progress = 0;
  var media = pickMedia();

  if (media) {
    isPlaying = !media.paused;
    if (isFinite(media.duration) && media.duration > 0) duration = media.duration;
    if (isFinite(media.currentTime)) progress = media.currentTime;
  }
  if ((!progress || progress < 1) && window.__VW_EMBED__ && window.__VW_EMBED__.readProgress) {
    try {
      var rp = window.__VW_EMBED__.readProgress();
      if (rp > progress) progress = rp;
    } catch (eRp) {}
  }

  var btn = document.querySelector('[data-testid="control-button-playpause"]')
    || document.querySelector('button[aria-label*="Pause"]')
    || document.querySelector('button[aria-label*="Пауз"]')
    || document.querySelector('button[aria-label*="Play"]')
    || document.querySelector('button[aria-label*="Воспро"]');
  if (btn) {
    var label = btn.getAttribute("aria-label") || "";
    if (/pause|пауз/i.test(label)) isPlaying = true;
    else if (/play|воспро/i.test(label)) isPlaying = false;
  } else {
    // Yandex mobile often uses icon-only buttons without aria-label.
    var pauseSvg = document.querySelector('button svg[class*="Pause"], button [class*="PauseIcon"], button use[href*="pause"]');
    if (pauseSvg) isPlaying = true;
  }

  if (!duration || !progress) {
    var clockRe = /^\\d{1,2}:\\d{2}$/;
    var combinedRe = /(\\d{1,2}:\\d{2})\\s*\\/\\s*(\\d{1,2}:\\d{2})/;
    var clocks = [];
    document.querySelectorAll("span,div,time,p").forEach(function(el) {
      var t = (el.textContent || "").trim();
      var combo = t.match(combinedRe);
      if (combo) {
        if (!progress) progress = parseClock(combo[1]);
        if (!duration) duration = parseClock(combo[2]);
        return;
      }
      if (clockRe.test(t)) clocks.push(parseClock(t));
    });
    if (clocks.length >= 2) {
      if (!progress) progress = clocks[0];
      if (!duration) duration = clocks[clocks.length - 1];
    } else if (clocks.length === 1 && !progress) {
      progress = clocks[0];
    }
  }

  var durEl = document.querySelector('[data-testid="playback-duration"]');
  var posEl = document.querySelector('[data-testid="playback-position"]');
  if (durEl && !duration) duration = parseClock(durEl.textContent);
  if (posEl && !progress) progress = parseClock(posEl.textContent);

  if (!progress) {
    var ymStart = document.querySelector('span[class*="Timecode_root_start"]')
      || document.querySelector(".progress__bar .progress__left");
    if (ymStart) progress = parseClock(ymStart.textContent);
  }
  if (!duration) {
    var ymEnd = document.querySelector('span[class*="Timecode_root_end"]')
      || document.querySelector(".progress__bar .progress__right");
    if (ymEnd) duration = parseClock(ymEnd.textContent);
  }

  if (!duration || !progress) {
    var ymSlider = document.querySelector('section[class*="PlayerBar"] input[class*="_slider__"]')
      || document.querySelector('input[class*="_slider__"]')
      || document.querySelector('input[class*="VibePlayerbarMeta_slider"]');
    if (ymSlider) {
      var ymMax = parseFloat(ymSlider.max || ymSlider.getAttribute("aria-valuemax") || "0");
      var ymVal = parseFloat(ymSlider.value || ymSlider.getAttribute("aria-valuenow") || "0");
      if (isFinite(ymMax) && ymMax > 0) {
        if (ymMax > 200) {
          if (!duration) duration = Math.floor(ymMax / 1000);
          if (!progress) progress = Math.floor(ymVal / 1000);
        } else {
          if (!duration) duration = Math.floor(ymMax);
          if (!progress) progress = Math.floor(ymVal);
        }
      }
    }
  }

  if (!duration || !progress) {
    document.querySelectorAll('input[type="range"]').forEach(function(slider) {
      var max = parseFloat(slider.max || slider.getAttribute("aria-valuemax") || "0");
      var val = parseFloat(slider.value || slider.getAttribute("aria-valuenow") || "0");
      if (!isFinite(max) || max <= 0) return;
      if (max > 200) {
        if (!duration) duration = Math.floor(max / 1000);
        if (!progress) progress = Math.floor(val / 1000);
      } else {
        if (!duration) duration = Math.floor(max);
        if (!progress) progress = Math.floor(val);
      }
    });
  }

  var art = (domMeta && domMeta.img) || "";
  if (meta && meta.artwork && meta.artwork.length) {
    var msArt = meta.artwork[meta.artwork.length - 1].src || meta.artwork[0].src || "";
    var domTiny = art && /size=\\d{1,2}\\b|[?&]w=(?:4[0-9]|[1-3]?\\d)\\b|\\/(?:3[0-9]|[1-2]?\\d)x(?:3[0-9]|[1-2]?\\d)\\b/i.test(art);
    if (msArt && (!art || domTiny)) art = msArt;
    else if (!art) art = msArt;
  }

  var pageUrl = "";
  try {
    function clean(href) {
      if (!href) return "";
      try { var u = new URL(href); return u.origin + u.pathname; } catch (e) { return String(href).split("?")[0].split("#")[0]; }
    }
    function isTrackUrl(href) {
      return /spotify\\.com\\/track\\/|\\/album\\/\\d+\\/track\\/|\\/track\\/\\d+/i.test(href);
    }
    var loc = clean(location.href);
    if (isTrackUrl(loc)) pageUrl = loc;
    if (!pageUrl) {
      var links = document.querySelectorAll('a[href*="/track/"]');
      for (var i = 0; i < links.length; i++) {
        var href = clean(links[i].href || links[i].getAttribute("href") || "");
        if (isTrackUrl(href)) { pageUrl = href; break; }
      }
    }
  } catch (e) {}

  return {
    title: title,
    artist: artist,
    album: album,
    img: art,
    isPlaying: isPlaying,
    duration: duration,
    progress: progress,
    pageUrl: pageUrl
  };
})()`

export const EMBED_PAUSE_SCRIPT = `(function() {
  var btn = document.querySelector('[data-testid="control-button-playpause"]');
  if (btn) {
    var label = btn.getAttribute("aria-label") || "";
    if (/pause|пауз/i.test(label)) { btn.click(); return true; }
  }
  btn = document.querySelector('button[aria-label*="Pause"], button[aria-label*="Пауз"]');
  if (btn) { btn.click(); return true; }
  var list = document.querySelectorAll("audio,video");
  for (var i = 0; i < list.length; i++) {
    if (!list[i].paused) { list[i].pause(); return true; }
  }
  return false;
})()`

export const EMBED_PLAY_SCRIPT = `(function() {
  var btn = document.querySelector('[data-testid="control-button-playpause"]');
  if (btn) {
    var label = btn.getAttribute("aria-label") || "";
    if (/play|воспро/i.test(label) && !/pause|пауз/i.test(label)) { btn.click(); return true; }
  }
  btn = document.querySelector('button[aria-label*="Play"], button[aria-label*="Воспро"]');
  if (btn) { btn.click(); return true; }
  var list = document.querySelectorAll("audio,video");
  for (var i = 0; i < list.length; i++) {
    if (list[i].paused) { list[i].play(); return true; }
  }
  return false;
})()`

/** @deprecated Prefer EMBED_PAUSE_SCRIPT / EMBED_PLAY_SCRIPT */
export const EMBED_TOGGLE_PLAY_SCRIPT = EMBED_PLAY_SCRIPT

export {
  EMBED_PREV_SCRIPT,
  EMBED_NEXT_SCRIPT,
  EMBED_EXPAND_YANDEX_PLAYER_SCRIPT,
  EMBED_YANDEX_TRANSPORT_READY_SCRIPT,
  buildEmbedSeekScript,
} from "./embedPlayerControls.js"

export function parseEmbedNowPlaying(
  raw: EmbedNowPlayingRaw | null | undefined,
  provider: StreamingProvider,
): EmbedNowPlaying | null {
  if (!raw?.title?.trim()) return null
  const duration = Number.isFinite(raw.duration) ? Math.max(0, Math.floor(raw.duration!)) : 0
  const progress = Number.isFinite(raw.progress) ? Math.max(0, Math.floor(raw.progress!)) : 0
  return {
    provider,
    title: raw.title.trim(),
    artist: (raw.artist ?? "").trim(),
    album: (raw.album ?? "").trim(),
    img: upscaleEmbedCoverUrl(raw.img?.trim() ?? ""),
    isPlaying: Boolean(raw.isPlaying),
    duration,
    progress: duration > 0 ? Math.min(progress, duration) : progress,
    pageUrl: raw.pageUrl?.trim() ?? "",
  }
}

export function embedNowPlayingToTrack(
  info: EmbedNowPlaying,
  placeholderImg: string,
): {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  downloaded: boolean
  img: string
  filePath: string
  addedAt: number
  source: StreamingProvider
} {
  return {
    id: `embed-${info.provider}`,
    title: info.title,
    artist: info.artist || "Unknown Artist",
    album: info.album,
    duration: info.duration,
    downloaded: false,
    img: upscaleEmbedCoverUrl(info.img || placeholderImg),
    filePath: "",
    addedAt: 0,
    source: info.provider,
  }
}

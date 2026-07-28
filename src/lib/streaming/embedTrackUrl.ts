import { sanitizeStreamingTrackUrl, acceptStreamingTrackUrl } from "./streamingTrackUrl.js"
import { resolveYandexTrackUrlFromText } from "./urlParser.js"
import { isEmbedDelegatedTrack } from "./embedDelegatedTrack.js"
import type { Track } from "../types.js"
import type { EmbedNowPlaying } from "./embedNowPlaying.js"

export function normalizeStreamingPageUrl(raw: string): string {
  return sanitizeStreamingTrackUrl(raw) ?? resolveYandexTrackUrlFromText(raw) ?? ""
}

export function isImportableTrackUrl(url: string): boolean {
  return sanitizeStreamingTrackUrl(url) !== null
}

export function pickBestEmbedImportUrl(storedPageUrl: string, livePageUrl: string): string | null {
  const candidates = [storedPageUrl, livePageUrl]

  for (const raw of candidates) {
    const clean = sanitizeStreamingTrackUrl(raw)
    if (clean) return clean
    const yandex = resolveYandexTrackUrlFromText(raw)
    if (yandex && isImportableTrackUrl(yandex)) return yandex
  }
  return null
}

export function resolveLikeTrackUrl(options: {
  currentTrack: Track | null
  embed: EmbedNowPlaying | null
  livePageUrl: string
}): string | null {
  if (options.currentTrack && isEmbedDelegatedTrack(options.currentTrack)) {
    const fromLibrary = normalizeStreamingPageUrl(options.currentTrack.pageUrl ?? "")
    if (fromLibrary && acceptStreamingTrackUrl(fromLibrary)) return fromLibrary
  }
  return pickBestEmbedImportUrl(options.embed?.pageUrl ?? "", options.livePageUrl)
}

export async function resolveLikeTrackUrlAsync(options: {
  currentTrack: Track | null
  embed: EmbedNowPlaying | null
  livePageUrl: string
  fetchFromEmbed: () => Promise<string>
}): Promise<string | null> {
  const direct = resolveLikeTrackUrl({
    currentTrack: options.currentTrack,
    embed: options.embed,
    livePageUrl: options.livePageUrl,
  })
  if (direct) return direct
  const fetched = (await options.fetchFromEmbed()).trim()
  if (!fetched) return null
  return pickBestEmbedImportUrl(fetched, "")
}

export async function resolveBrowserImportUrl(options: {
  typedUrl: string
  storedPageUrl: string
  livePageUrl: string
  fetchFromEmbed: () => Promise<string>
}): Promise<string | null> {
  const typed = normalizeStreamingPageUrl(options.typedUrl.trim())
  if (typed && acceptStreamingTrackUrl(typed)) return typed
  const fromEmbed = pickBestEmbedImportUrl(options.storedPageUrl, options.livePageUrl)
  if (fromEmbed) return fromEmbed
  const fetched = (await options.fetchFromEmbed()).trim()
  if (!fetched) return null
  return pickBestEmbedImportUrl(fetched, "")
}

export { parseStreamingUrl } from "./urlParser.js"

/** Extract track page URL from embed BrowserView DOM (injected). */
export const EMBED_TRACK_URL_SCRIPT = `(function() {
  function clean(href) {
    if (!href) return "";
    try {
      var u = new URL(href);
      return u.origin + u.pathname;
    } catch (e) {
      return String(href).split("?")[0].split("#")[0];
    }
  }
  function isTrackUrl(href) {
    return /spotify\\.com\\/track\\/|spotify\\.com\\/album\\/[^/]+\\/track\\/|music\\.yandex\\.[^/]+\\/track\\/\\d+|music\\.yandex\\.[^/]+\\/album\\/\\d+\\/track\\/\\d+/i.test(href);
  }
  function fromPathname(origin, pathname) {
    var albumTrack = pathname.match(/\\/album\\/\\d+\\/track\\/(\\d+)/);
    if (albumTrack) return origin + "/album/" + pathname.match(/\\/album\\/(\\d+)/)[1] + "/track/" + albumTrack[1];
    var track = pathname.match(/\\/track\\/(\\d+)/);
    if (track && /music\\.yandex\\./i.test(origin)) return origin + "/track/" + track[1];
    var spTrack = pathname.match(/\\/track\\/([a-zA-Z0-9]+)/);
    if (spTrack && /spotify\\.com/i.test(origin)) return origin + "/track/" + spTrack[1];
    return "";
  }
  function linkFromRoot(root) {
    if (!root || !root.querySelectorAll) return "";
    var links = root.querySelectorAll('a[href*="/track/"], a[href*="/album/"][href*="/track/"]');
    for (var i = 0; i < links.length; i++) {
      var href = clean(links[i].href || links[i].getAttribute("href") || "");
      if (isTrackUrl(href)) return href;
    }
    return "";
  }
  function yandexPlayerRoot() {
    return document.querySelector('section[class*="PlayerBarMobile_root"]')
      || document.querySelector('section[class*="PlayerBarDesktopWithBackgroundProgressBar_root"]')
      || document.querySelector('section[class*="PlayerBar_root"]')
      || document.querySelector('section[class*="VibePlayerBar_root"]')
      || document.querySelector('[class*="PlayerBar"]');
  }
  function searchScopes() {
    var scopes = [
      document.querySelector('[class*="SonataPlayer"]'),
      document.querySelector('[class*="FullscreenPlayer"]'),
      document.querySelector('div[class*="SonataControlsDesktop_sonataButtons"]')?.closest("section,div"),
      yandexPlayerRoot(),
      document.querySelector('[data-testid="now-playing-widget"]'),
      document.querySelector("footer"),
    ];
    var out = [];
    var seen = {};
    for (var i = 0; i < scopes.length; i++) {
      if (!scopes[i] || seen[scopes[i]]) continue;
      seen[scopes[i]] = true;
      out.push(scopes[i]);
    }
    out.push(document);
    return out;
  }
  try {
    var loc = clean(location.href);
    if (isTrackUrl(loc)) return loc;
    var built = fromPathname(location.origin, location.pathname);
    if (built) return built;
  } catch (e) {}
  var scopes = searchScopes();
  for (var s = 0; s < scopes.length; s++) {
    var found = linkFromRoot(scopes[s]);
    if (found) return found;
  }
  try {
    var meta = navigator.mediaSession && navigator.mediaSession.metadata;
    if (meta && meta.title) {
      var all = document.querySelectorAll('a[href*="music.yandex"], a[href*="spotify.com/track"]');
      for (var j = 0; j < all.length; j++) {
        var h = clean(all[j].href || "");
        if (isTrackUrl(h)) return h;
      }
    }
  } catch (e2) {}
  return "";
})()`

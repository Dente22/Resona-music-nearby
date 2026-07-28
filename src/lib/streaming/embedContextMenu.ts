import { acceptStreamingTrackUrl } from "./streamingTrackUrl.js"
import { normalizeStreamingPageUrl } from "./embedTrackUrl.js"

export const EMBED_CONTEXT_MENU_MARKER = "__VW_CTX_URL__:"

export const EMBED_CONTEXT_MENU_INJECT = `(function() {
  if (window.__VW_CTX_MENU__) return;
  window.__VW_CTX_MENU__ = true;
  document.addEventListener("contextmenu", function(ev) {
    var url = "";
    var node = ev.target;
    for (var depth = 0; depth < 14 && node; depth++) {
      if (node.href && /spotify.com|music.yandex|yandex.ru/i.test(String(node.href))) {
        url = node.href;
        break;
      }
      if (node.closest) {
        var link = node.closest(
          'a[href*="/track/"], a[href*="/album/"], a[href*="/playlist/"], a[href*="/playlists/"]'
        );
        if (link && link.href) { url = link.href; break; }
      }
      node = node.parentElement;
    }
    if (!url) {
      var loc = location.href;
      if (/\\/track\\/|\\/album\\/|playlist/i.test(loc)) url = loc;
    }
    if (url) console.log("${EMBED_CONTEXT_MENU_MARKER}" + url);
  }, true);
})();`

export function parseContextMenuConsoleMessage(message: string): string | null {
  if (!message.startsWith(EMBED_CONTEXT_MENU_MARKER)) return null
  const url = message.slice(EMBED_CONTEXT_MENU_MARKER.length).trim()
  return url || null
}

export function isAddableStreamingUrl(url: string): boolean {
  const normalized = normalizeStreamingPageUrl(url)
  return Boolean(normalized && acceptStreamingTrackUrl(normalized))
}

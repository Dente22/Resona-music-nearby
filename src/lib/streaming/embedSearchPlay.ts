import { EMBED_CONTROLS_BOOTSTRAP } from "./embedPlayerControls.js"

/**
 * Find a matching track page URL on a search results page.
 * Does not start playback — caller loads the track page and starts once.
 */
export function buildEmbedFindTrackUrlScript(title: string, artist: string): string {
  const titleJson = JSON.stringify(title.trim())
  const artistJson = JSON.stringify(artist.trim())
  return `${EMBED_CONTROLS_BOOTSTRAP}
(function() {
  var title = ${titleJson}.toLowerCase();
  var artist = ${artistJson}.toLowerCase();
  var artistToken = artist ? artist.split(",")[0].trim() : "";

  function norm(s) {
    return String(s || "").toLowerCase().replace(/\\s+/g, " ").trim();
  }
  function dismissPromo() {
    try {
      var nodes = document.querySelectorAll('button, a, [role="button"], span[role="button"]');
      for (var i = 0; i < nodes.length; i++) {
        var label = (nodes[i].getAttribute("aria-label") || nodes[i].title || nodes[i].textContent || "").trim().toLowerCase();
        if (/^(закрыть|close|продолж|continue|остаться|stay|не сейчас|not now|×|✕|✖)$/.test(label)) {
          try { nodes[i].click(); } catch (e) {}
        }
        if (/слушать в приложении|скачать в google|listen in (the )?app|get (it )?on google|open (in )?app/i.test(label)) {
          var host = nodes[i].closest('[class*="Banner"], [class*="Promo"], [class*="portal"], [class*="Overlay"], section, div') || nodes[i];
          try { host.style.setProperty("display", "none", "important"); } catch (eHide) {}
        }
      }
      var overlays = document.querySelectorAll('[class*="SmartBanner"], [class*="AppBanner"], [class*="MobileApp"], [class*="InstallBanner"]');
      for (var o = 0; o < overlays.length; o++) {
        try { overlays[o].style.setProperty("display", "none", "important"); } catch (e2) {}
      }
    } catch (e3) {}
  }
  function clean(href) {
    if (!href) return "";
    try {
      var u = new URL(href, location.origin);
      return u.origin + u.pathname;
    } catch (e) {
      return String(href).split("?")[0].split("#")[0];
    }
  }
  function isTrackHref(href) {
    return /\\/album\\/\\d+\\/track\\/\\d+|\\/track\\/\\d+|\\/track\\/[a-zA-Z0-9]+/i.test(href || "");
  }
  function collectHrefs(root) {
    var out = [];
    if (!root) return out;
    var nodes = root.querySelectorAll
      ? root.querySelectorAll('a[href], [href*="/track/"], [data-href*="/track/"]')
      : [];
    for (var i = 0; i < nodes.length; i++) {
      var raw = nodes[i].href
        || nodes[i].getAttribute("href")
        || nodes[i].getAttribute("data-href")
        || "";
      var href = clean(raw);
      if (isTrackHref(href)) out.push(href);
    }
    return out;
  }
  function scoreText(text) {
    var t = norm(text);
    if (!t || !title || t.indexOf(title) < 0) return 0;
    if (artistToken && t.indexOf(artistToken) >= 0) return 2;
    return 1;
  }
  function findScope(start) {
    var prefer = start.closest(
      'li, [class*="HorizontalCard"], [class*="SearchItem"], [class*="SearchSerp"], [class*="TrackCard"], [class*="trackCard"], [class*="EntityCard"], [class*="Snippet"], article, section'
    );
    if (prefer && scoreText(prefer.textContent || "") > 0) return prefer;
    var node = start;
    var best = start;
    var bestScore = scoreText(start.textContent || "");
    for (var depth = 0; depth < 10 && node; depth++) {
      var s = scoreText(node.textContent || "");
      if (s > bestScore) {
        best = node;
        bestScore = s;
        if (s >= 2) return best;
      }
      node = node.parentElement;
    }
    return best;
  }

  dismissPromo();

  var candidates = [];
  var links = document.querySelectorAll('a[href*="/track/"], a[href*="/album/"][href*="/track/"]');
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    var href = clean(link.href || link.getAttribute("href") || "");
    if (!isTrackHref(href)) continue;
    var scope = findScope(link);
    var score = scoreText(scope.textContent || link.textContent || "");
    if (score <= 0) continue;
    candidates.push({ href: href, score: score });
  }

  // Cards without direct <a> text match — scan card roots for track hrefs.
  if (!candidates.length) {
    var cards = document.querySelectorAll(
      '[class*="HorizontalCard"], [class*="SearchItem"], [class*="SearchSerp"], [class*="TrackCard"], [class*="EntityCard"], li'
    );
    for (var c = 0; c < cards.length; c++) {
      var card = cards[c];
      var cardScore = scoreText(card.textContent || "");
      if (cardScore <= 0) continue;
      var hrefs = collectHrefs(card);
      for (var h = 0; h < hrefs.length; h++) {
        candidates.push({ href: hrefs[h], score: cardScore });
      }
    }
  }

  candidates.sort(function(a, b) { return b.score - a.score; });
  if (candidates.length) return candidates[0].href;

  // Title-only: first track link whose own label matches the title.
  for (var j = 0; j < links.length; j++) {
    var only = links[j];
    var onlyHref = clean(only.href || only.getAttribute("href") || "");
    if (!isTrackHref(onlyHref)) continue;
    if (scoreText(only.textContent || "") >= 1) return onlyHref;
  }
  return "";
})()`
}

/**
 * Open the matching search result track page (title/card click).
 * Prefer navigating to the track page over pressing play (avoids My Wave radio).
 */
export function buildEmbedOpenSearchTrackScript(title: string, artist: string): string {
  const titleJson = JSON.stringify(title.trim())
  const artistJson = JSON.stringify(artist.trim())
  return `${EMBED_CONTROLS_BOOTSTRAP}
(function() {
  var title = ${titleJson}.toLowerCase();
  var artist = ${artistJson}.toLowerCase();
  var artistToken = artist ? artist.split(",")[0].trim() : "";
  function norm(s) {
    return String(s || "").toLowerCase().replace(/\\s+/g, " ").trim();
  }
  function scoreText(text) {
    var t = norm(text);
    if (!t || !title || t.indexOf(title) < 0) return 0;
    if (artistToken && t.indexOf(artistToken) >= 0) return 2;
    return 1;
  }
  function click(el) {
    if (!el) return false;
    try { el.click(); return true; } catch (e) { return false; }
  }
  function dismissPromo() {
    try {
      var nodes = document.querySelectorAll('button, a, [role="button"], span[role="button"]');
      for (var i = 0; i < nodes.length; i++) {
        var label = (nodes[i].getAttribute("aria-label") || nodes[i].title || nodes[i].textContent || "").trim().toLowerCase();
        if (/слушать в приложении|скачать в google|listen in (the )?app|get (it )?on google/i.test(label)) {
          var host = nodes[i].closest('[class*="Banner"], [class*="Promo"], [class*="portal"], [class*="Overlay"], section, div') || nodes[i];
          try { host.style.setProperty("display", "none", "important"); } catch (eHide) {}
        }
      }
    } catch (e2) {}
  }
  dismissPromo();
  var cards = document.querySelectorAll(
    '[class*="HorizontalCard"], [class*="SearchItem"], [class*="SearchSerp"], [class*="TrackCard"], [class*="EntityCard"], li, article'
  );
  var best = null;
  var bestScore = 0;
  for (var i = 0; i < cards.length; i++) {
    var s = scoreText(cards[i].textContent || "");
    if (s > bestScore) {
      best = cards[i];
      bestScore = s;
    }
  }
  if (!best || bestScore <= 0) return false;
  var trackLink = best.querySelector('a[href*="/track/"], a[href*="/album/"][href*="/track/"]');
  if (click(trackLink)) return true;
  var titleEl = best.querySelector('[class*="Title"], [class*="title"], a');
  if (click(titleEl)) return true;
  return click(best);
})()`
}
/** @deprecated Use buildEmbedFindTrackUrlScript — clicking search results starts radio/next tracks. */
export const buildEmbedSearchTrackScript = buildEmbedFindTrackUrlScript

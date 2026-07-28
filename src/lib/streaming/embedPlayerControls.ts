/** Shared runtime injected into Spotify/Yandex webview (dom-ready + before each control call). */
export const EMBED_CONTROLS_VERSION = 10

export const EMBED_CONTROLS_BOOTSTRAP = `(function() {
  if (window.__VW_EMBED__ && window.__VW_EMBED__.v === ${EMBED_CONTROLS_VERSION}) return;
  function pickMedia() {
    var list = [];
    document.querySelectorAll("audio,video").forEach(function(el) { list.push(el); });
    var best = null;
    for (var i = 0; i < list.length; i++) {
      if (isFinite(list[i].duration) && list[i].duration > 0) best = list[i];
      if (!list[i].paused && isFinite(list[i].duration) && list[i].duration > 0) return list[i];
    }
    return best || list[0] || null;
  }
  function click(el) {
    if (!el) return false;
    try { el.click(); return true; } catch (e) { return false; }
  }
  function clickSelector(sel) {
    return click(document.querySelector(sel));
  }
  function clickByAria(re) {
    var buttons = document.querySelectorAll("button,[role=button]");
    for (var i = 0; i < buttons.length; i++) {
      var label = buttons[i].getAttribute("aria-label") || buttons[i].title || "";
      if (re.test(label)) return click(buttons[i]);
    }
    return false;
  }
  function mediaKey(key) {
    var opts = { key: key, code: key, bubbles: true, cancelable: true };
    document.dispatchEvent(new KeyboardEvent("keydown", opts));
    document.dispatchEvent(new KeyboardEvent("keyup", opts));
    return true;
  }
  function clickBarButton(kind) {
    var roots = document.querySelectorAll(
      '[class*="PlayerBar"], [class*="player-bar"], [class*="player-controls"], [class*="PlayerControls"], footer'
    );
    for (var r = 0; r < roots.length; r++) {
      var btns = roots[r].querySelectorAll("button:not([disabled])");
      if (btns.length < 3) continue;
      if (kind === "prev" && btns.length >= 2) return click(btns[1]);
      if (kind === "next" && btns.length >= 4) return click(btns[3]);
      if (kind === "next" && btns.length === 3) return click(btns[2]);
    }
    return false;
  }
  function isYandexHost() {
    try { return /music\\.yandex|yandex\\.ru/i.test(location.hostname); } catch (e) { return false; }
  }
  function yandexPlayerRoot() {
    return document.querySelector('section[class*="PlayerBarMobile_root"]')
      || document.querySelector('section[class*="PlayerBarDesktopWithBackgroundProgressBar_root"]')
      || document.querySelector('section[class*="PlayerBar_root"]')
      || document.querySelector('section[class*="VibePlayerBar_root"]')
      || document.querySelector('[class*="PlayerBar"]');
  }
  function findYandexPlayButton() {
    return document.querySelector('.player-controls__btn_play')
      || document.querySelector('div[class*="SonataControlsDesktop_sonataButtons"] button[aria-label="Воспроизведение"]')
      || document.querySelector('div[class*="SonataControlsDesktop_sonataButtons"] button[aria-label="Playback"]')
      || document.querySelector('div[class*="SonataControlsDesktop_sonataButtons"] button[aria-label="Пауза"]')
      || document.querySelector('div[class*="SonataControlsDesktop_sonataButtons"] button[aria-label="Pause"]')
      || document.querySelector('button[aria-label*="Пауз"]')
      || document.querySelector('button[aria-label*="Pause"]')
      || document.querySelector('button[aria-label*="Воспро"]')
      || document.querySelector('button[aria-label*="Playback"]');
  }
  function yandexSonataControls() {
    return document.querySelector('div[class*="SonataControlsDesktop_sonataButtons"]')
      || document.querySelector('div[class*="SonataControlsMobile"]')
      || document.querySelector('div[class*="SonataControls"]');
  }
  function yandexTransportReady() {
    if (!isYandexHost()) return true;
    var sonata = yandexSonataControls();
    if (sonata) {
      var sonataBtns = sonata.querySelectorAll("button:not([disabled])");
      if (sonataBtns.length >= 3) return true;
    }
    var root = yandexPlayerRoot();
    if (!root) return false;
    var barBtns = root.querySelectorAll("button:not([disabled])");
    for (var i = 0; i < barBtns.length; i++) {
      var barLabel = (barBtns[i].getAttribute("aria-label") || "").toLowerCase();
      if (/следующ|next|предыдущ|previous|prev/.test(barLabel)) return true;
    }
    return false;
  }
  function expandYandexPlayer() {
    if (!isYandexHost()) return false;
    if (yandexTransportReady()) return true;
    var root = yandexPlayerRoot();
    if (!root) return false;
    var expandTarget = root.querySelector('a[href*="/track/"]')
      || root.querySelector('[class*="Meta_title"]')
      || root.querySelector('[class*="Track_title"]')
      || root.querySelector('[class*="SonataMeta"]')
      || root.querySelector('img[src*="avatars"], img[class*="cover"], img');
    if (expandTarget && click(expandTarget)) return true;
    return click(root);
  }
  function clickYandexByAria(re) {
    var scopes = [
      document.querySelector('div[class*="SonataControlsDesktop_sonataButtons"]'),
      yandexPlayerRoot(),
      document,
    ];
    for (var s = 0; s < scopes.length; s++) {
      var scope = scopes[s];
      if (!scope || !scope.querySelectorAll) continue;
      var buttons = scope.querySelectorAll("button:not([disabled]),[role=button]:not([disabled])");
      for (var i = 0; i < buttons.length; i++) {
        var label = buttons[i].getAttribute("aria-label") || buttons[i].title || "";
        if (re.test(label)) return click(buttons[i]);
      }
    }
    return false;
  }
  function dismissYandexMobilePromo() {
    if (!isYandexHost()) return false;
    var nodes = document.querySelectorAll('button, a, [role="button"], span[role="button"]');
    for (var i = 0; i < nodes.length; i++) {
      var label = (nodes[i].getAttribute("aria-label") || nodes[i].title || nodes[i].textContent || "").trim().toLowerCase();
      if (/^(закрыть|close|продолж|continue|остаться|stay|не сейчас|not now|×|✕|✖)$/.test(label)) {
        if (click(nodes[i])) return true;
      }
    }
    var banners = document.querySelectorAll('[class*="SmartBanner"], [class*="AppBanner"], [class*="MobileApp"], [class*="InstallBanner"]');
    for (var b = 0; b < banners.length; b++) {
      var closeBtn = banners[b].querySelector('button, [role="button"], a');
      if (closeBtn && click(closeBtn)) return true;
    }
    return false;
  }
  function clickYandexTrackPageListen() {
    if (!isYandexHost()) return false;
    var selectors = [
      'button[class*="PlayButton"]',
      'a[class*="PlayButton"]',
      '[class*="TrackPage"] button',
      '[class*="track-page"] button',
      '[data-testid*="play"]',
    ];
    for (var s = 0; s < selectors.length; s++) {
      if (click(document.querySelector(selectors[s]))) return true;
    }
    var nodes = document.querySelectorAll('button, a, [role="button"], span[role="button"]');
    for (var i = 0; i < nodes.length; i++) {
      var label = (nodes[i].getAttribute("aria-label") || nodes[i].title || nodes[i].textContent || "").trim().toLowerCase();
      if (/^(слушать|listen|play|воспроизвести)$/.test(label) || /^слушать|^listen|^play|^воспро/i.test(label)) {
        if (click(nodes[i])) return true;
      }
    }
    return false;
  }
  function isPlaying() {
    var media = pickMedia();
    if (media && !media.paused) return true;
    var yandexPlay = findYandexPlayButton();
    if (yandexPlay) {
      var yLabel = (yandexPlay.getAttribute("aria-label") || "").toLowerCase();
      if (/pause|пауз/i.test(yLabel)) return true;
    }
    var spotify = document.querySelector('[data-testid="control-button-playpause"]');
    if (spotify) {
      var sLabel = (spotify.getAttribute("aria-label") || "").toLowerCase();
      if (/pause|пауз/i.test(sLabel)) return true;
    }
    var list = document.querySelectorAll("audio,video");
    for (var i = 0; i < list.length; i++) {
      if (!list[i].paused) return true;
    }
    return false;
  }
  function play() {
    if (isPlaying()) return true;
    if (isYandexHost()) dismissYandexMobilePromo();
    if (clickSelector('[data-testid="control-button-playpause"]')) {
      return isPlaying();
    }
    if (isYandexHost()) {
      if (clickYandexTrackPageListen()) return isPlaying();
      var yBtn = findYandexPlayButton();
      if (yBtn) {
        var yLabel = (yBtn.getAttribute("aria-label") || "").toLowerCase();
        if (/pause|пауз/i.test(yLabel)) return true;
        if (click(yBtn)) return isPlaying();
      }
      if (clickYandexByAria(/воспро|playback|^play|слуш/i)) return isPlaying();
      if (expandYandexPlayer()) {
        yBtn = findYandexPlayButton();
        if (yBtn && click(yBtn)) return isPlaying();
      }
      if (clickYandexTrackPageListen()) return isPlaying();
    }
    if (clickByAria(/play|воспро|слуш/i)) return isPlaying();
    if (clickSelector('.player-controls__btn_play, [data-testid="play-button"]')) return isPlaying();
    var media = pickMedia();
    if (media && media.paused) {
      try { void media.play(); if (isPlaying()) return true; } catch (e) {}
    }
    document.querySelectorAll("audio,video").forEach(function(m) {
      if (m.paused) {
        try { void m.play(); } catch (e2) {}
      }
    });
    return isPlaying();
  }
  function clickYandexTransport(kind) {
    var re = kind === "prev" ? /Предыдущ|Previous|^Prev/i : /Следующ|Next|^Next/i;
    var sonata = yandexSonataControls();
    if (sonata) {
      if (kind === "prev") {
        if (click(sonata.querySelector(".d-icon_track-prev"))) return true;
        if (click(sonata.querySelector(".player-controls__btn_prev"))) return true;
      } else {
        if (click(sonata.querySelector(".d-icon_track-next"))) return true;
        if (click(sonata.querySelector(".player-controls__btn_next"))) return true;
      }
      var sonataBtns = sonata.querySelectorAll("button:not([disabled])");
      var playIdx = -1;
      for (var i = 0; i < sonataBtns.length; i++) {
        var sonataLabel = (sonataBtns[i].getAttribute("aria-label") || "").toLowerCase();
        if (/пауз|pause|воспро|playback|^play/.test(sonataLabel)) { playIdx = i; break; }
      }
      if (playIdx < 0) playIdx = Math.floor(sonataBtns.length / 2);
      if (kind === "prev" && playIdx > 0) return click(sonataBtns[playIdx - 1]);
      if (kind === "next" && playIdx >= 0 && playIdx < sonataBtns.length - 1) return click(sonataBtns[playIdx + 1]);
      for (var s = 0; s < sonataBtns.length; s++) {
        var label = sonataBtns[s].getAttribute("aria-label") || "";
        if (re.test(label)) return click(sonataBtns[s]);
      }
    }
    var root = yandexPlayerRoot();
    if (root) {
      if (kind === "prev") {
        if (click(root.querySelector(".d-icon_track-prev"))) return true;
        if (click(root.querySelector(".player-controls__btn_prev"))) return true;
      } else {
        if (click(root.querySelector(".d-icon_track-next"))) return true;
        if (click(root.querySelector(".player-controls__btn_next"))) return true;
      }
      var rootBtns = root.querySelectorAll("button:not([disabled])");
      for (var r = 0; r < rootBtns.length; r++) {
        var rootLabel = rootBtns[r].getAttribute("aria-label") || "";
        if (re.test(rootLabel)) return click(rootBtns[r]);
      }
      if (rootBtns.length >= 3) {
        var barPlayIdx = -1;
        for (var b = 0; b < rootBtns.length; b++) {
          var barLabel = (rootBtns[b].getAttribute("aria-label") || "").toLowerCase();
          if (/пауз|pause|воспро|playback|^play/.test(barLabel)) { barPlayIdx = b; break; }
        }
        if (barPlayIdx < 0) barPlayIdx = Math.floor(rootBtns.length / 2);
        if (kind === "prev" && barPlayIdx > 0) return click(rootBtns[barPlayIdx - 1]);
        if (kind === "next" && barPlayIdx >= 0 && barPlayIdx < rootBtns.length - 1) return click(rootBtns[barPlayIdx + 1]);
      }
    }
    return false;
  }
  function parseClockText(s) {
    if (!s) return 0;
    s = String(s).trim();
    var p = s.split(":").map(function(x) { return parseInt(x, 10) || 0; });
    if (p.length === 2) return p[0] * 60 + p[1];
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    return 0;
  }
  function yandexDurationSeconds() {
    var end = document.querySelector(".progress__bar .progress__right")
      || document.querySelector('span[class*="Timecode_root_end"]');
    if (end) return parseClockText(end.textContent);
    var root = yandexPlayerRoot();
    var slider = root ? root.querySelector('input[class*="_slider__"], input[type="range"]') : null;
    if (!slider) slider = document.querySelector('input[class*="_slider__"], input[class*="VibePlayerbarMeta_slider"]');
    if (slider) {
      var max = parseFloat(slider.max || slider.getAttribute("aria-valuemax") || "0");
      if (max > 200) return Math.floor(max / 1000);
      if (max > 0) return Math.floor(max);
    }
    return 0;
  }
  function dispatchBarSeek(el, pct) {
    var rect = el.getBoundingClientRect();
    if (rect.width < 8) return false;
    var x = rect.left + rect.width * Math.min(1, Math.max(0, pct));
    var y = rect.top + rect.height / 2;
    var base = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window };
    try {
      var ptr = Object.assign({ pointerId: 1, pointerType: "mouse", isPrimary: true }, base);
      el.dispatchEvent(new PointerEvent("pointerdown", ptr));
      el.dispatchEvent(new PointerEvent("pointermove", ptr));
      el.dispatchEvent(new PointerEvent("pointerup", ptr));
    } catch (e) {
      ["mousedown", "mouseup", "click"].forEach(function(type) {
        el.dispatchEvent(new MouseEvent(type, base));
      });
    }
    return true;
  }
  function setRangeValue(slider, val) {
    if (!slider) return false;
    try {
      var num = Math.max(0, val);
      var desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
      if (desc && desc.set) desc.set.call(slider, String(num));
      else slider.value = String(num);
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      slider.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    } catch (e) { return false; }
  }
  function readDomDuration() {
    var dur = yandexDurationSeconds();
    if (dur > 0) return dur;
    var durEl = document.querySelector('[data-testid="playback-duration"]');
    if (durEl) dur = parseClockText(durEl.textContent);
    if (!dur) {
      var ymEnd = document.querySelector('span[class*="Timecode_root_end"]')
        || document.querySelector(".progress__bar .progress__right");
      if (ymEnd) dur = parseClockText(ymEnd.textContent);
    }
    if (!dur) {
      var media = pickMedia();
      if (media && isFinite(media.duration) && media.duration > 0) dur = media.duration;
    }
    if (!dur) {
      var text = document.body.innerText || "";
      var m = text.match(/(\\d{1,2}:\\d{2})\\s*\\/\\s*(\\d{1,2}:\\d{2})/);
      if (m) dur = parseClockText(m[2]);
    }
    return dur > 0 ? dur : 0;
  }
  function sliderValueForTarget(slider, target, dur) {
    var max = parseFloat(slider.max || slider.getAttribute("aria-valuemax") || "0");
    if (!isFinite(max) || max <= 0) return target;
    if (max > 200) return Math.min(target * 1000, max);
    if (max <= 100 && dur > 0) return Math.min(max, (target / dur) * max);
    if (dur > 0) return Math.min(max, target);
    return Math.min(max, target);
  }
  function seekViaRangeSlider(target, dur) {
    var selectors = [
      '[data-testid="playback-slider"] input[type="range"]',
      '[data-testid="progress-bar"] input[type="range"]',
      '[data-testid="progress-bar"] [role="slider"]',
      'div[data-testid="progress-bar"]',
      '.progress__slider input[type="range"]',
      'input[class*="_slider__"]',
      'input[class*="VibePlayerbarMeta_slider"]',
      'input[type="range"][aria-valuemax]',
      'input[type="range"]',
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (!el) continue;
      if (el.tagName === "INPUT" && el.type === "range") {
        if (setRangeValue(el, sliderValueForTarget(el, target, dur))) return true;
        continue;
      }
      if (el.getAttribute && el.getAttribute("role") === "slider") {
        var smax = parseFloat(el.getAttribute("aria-valuemax") || "100");
        var sval = dur > 0 && smax <= 100 ? (target / dur) * smax : target;
        el.setAttribute("aria-valuenow", String(Math.round(sval)));
        if (dur > 0 && dispatchBarSeek(el, target / dur)) return true;
        continue;
      }
      if (dur > 0 && dispatchBarSeek(el, target / dur)) return true;
    }
    return false;
  }
  function seekYandex(target) {
    var dur = readDomDuration();
    var pct = dur > 0 ? target / dur : 0;
    var bars = [
      document.querySelector(".progress__progress"),
      document.querySelector(".progress__bar"),
      document.querySelector('[class*="ProgressBarWithTooltip"]'),
      document.querySelector('[class*="SliderProgress"]'),
      document.querySelector('[class*="ProgressBar"][class*="progress"]'),
    ];
    for (var b = 0; b < bars.length; b++) {
      if (bars[b] && dispatchBarSeek(bars[b], pct)) return true;
    }
    var root = yandexPlayerRoot();
    var slider = root ? root.querySelector('input[class*="_slider__"], input[type="range"]') : null;
    if (!slider) slider = document.querySelector('input[class*="_slider__"], input[class*="VibePlayerbarMeta_slider"], input[type="range"]');
    if (slider && setRangeValue(slider, sliderValueForTarget(slider, target, dur))) return true;
    return false;
  }
  function clickSpotifyLike(wantLiked) {
    var btn = document.querySelector('[data-testid="add-button"]')
      || document.querySelector('button[data-testid="favorite-button"]')
      || document.querySelector('button[aria-label*="Add to Liked"]')
      || document.querySelector('button[aria-label*="Save to Your Library"]')
      || document.querySelector('button[aria-label*="Добавить в Любимые"]')
      || document.querySelector('button[aria-label*="Remove from Liked"]')
      || document.querySelector('button[aria-label*="Удалить из Любимых"]');
    if (!btn) return false;
    var label = (btn.getAttribute("aria-label") || "").toLowerCase();
    var isLiked = /remove|удал|saved|сохран|liked|любим/i.test(label);
    if (wantLiked === isLiked) return true;
    return click(btn);
  }
  function clickYandexLike(wantLiked) {
    var btn = document.querySelector("button.player-controls__btn_like")
      || document.querySelector('button[aria-label*="Нравится"]')
      || document.querySelector('button[aria-label*="Like"]')
      || document.querySelector(".d-icon_like")?.closest("button");
    if (!btn) return false;
    var pressed = btn.getAttribute("aria-pressed") === "true"
      || btn.classList.contains("player-controls__btn_like_active")
      || /active|liked|selected/i.test(btn.className || "");
    if (wantLiked === pressed) return true;
    return click(btn);
  }
  function setLike(wantLiked) {
    if (isYandexHost()) return clickYandexLike(wantLiked);
    return clickSpotifyLike(wantLiked);
  }
  function seekSpotify(target, dur) {
    if (!dur) dur = readDomDuration();
    var pct = dur > 0 ? target / dur : 0;
    var barWrap = document.querySelector('[data-testid="progress-bar"]')
      || document.querySelector('[data-testid="playback-progressbar"]');
    if (barWrap) {
      var inner = barWrap.querySelector('[class*="progress"], [class*="Progress"], [role="slider"]') || barWrap;
      if (pct > 0 && dispatchBarSeek(inner, pct)) return true;
      if (dispatchBarSeek(barWrap, pct)) return true;
    }
    return seekViaRangeSlider(target, dur);
  }
  function readProgress() {
    var media = pickMedia();
    if (media && isFinite(media.currentTime) && media.currentTime > 0) {
      return Math.max(0, Math.floor(media.currentTime));
    }
    var ymStart = document.querySelector('span[class*="Timecode_root_start"]')
      || document.querySelector(".progress__bar .progress__left");
    if (ymStart) {
      var clock = (ymStart.textContent || "").trim().split(":");
      if (clock.length >= 2) {
        return (parseInt(clock[0], 10) || 0) * 60 + (parseInt(clock[1], 10) || 0);
      }
    }
    var slider = document.querySelector('section[class*="PlayerBar"] input[type="range"], input[class*="_slider__"], input[class*="VibePlayerbarMeta_slider"]');
    if (slider) {
      var max = parseFloat(slider.max || slider.getAttribute("aria-valuemax") || "0");
      var val = parseFloat(slider.value || slider.getAttribute("aria-valuenow") || "0");
      if (isFinite(max) && max > 0 && isFinite(val)) {
        if (max > 200) return Math.max(0, Math.floor(val / 1000));
        return Math.max(0, Math.floor(val));
      }
    }
    if (media && isFinite(media.currentTime)) {
      return Math.max(0, Math.floor(media.currentTime));
    }
    return 0;
  }
  window.__VW_EMBED__ = {
    v: ${EMBED_CONTROLS_VERSION},
    pickMedia: pickMedia,
    yandexTransportReady: yandexTransportReady,
    expandYandexPlayer: expandYandexPlayer,
    isPlaying: isPlaying,
    readProgress: readProgress,
    play: play,
    prev: function() {
      if (isYandexHost()) {
        dismissYandexMobilePromo();
        if (!yandexTransportReady()) expandYandexPlayer();
      }
      if (clickSelector('[data-testid="control-button-skip-back"]')) return true;
      if (isYandexHost()) {
        if (clickYandexTransport("prev")) return true;
        if (clickYandexByAria(/предыдущ|previous|^prev/i)) return true;
        mediaKey("MediaTrackPrevious");
        return false;
      }
      if (clickByAria(/previous|пред|назад|предыд/i)) return true;
      if (clickSelector('.player-controls__btn_prev, .d-icon_track-prev, [class*="btn_prev"]')) return true;
      if (clickBarButton("prev")) return true;
      mediaKey("MediaTrackPrevious");
      return false;
    },
    next: function() {
      if (isYandexHost()) {
        dismissYandexMobilePromo();
        if (!yandexTransportReady()) expandYandexPlayer();
      }
      if (clickSelector('[data-testid="control-button-skip-forward"]')) return true;
      if (isYandexHost()) {
        if (clickYandexTransport("next")) return true;
        if (clickYandexByAria(/следующ|next|^next/i)) return true;
        mediaKey("MediaTrackNext");
        return false;
      }
      if (clickByAria(/next|след|далее/i)) return true;
      if (clickSelector('.player-controls__btn_next, .d-icon_track-next, [class*="btn_next"]')) return true;
      if (clickBarButton("next")) return true;
      mediaKey("MediaTrackNext");
      return false;
    },
    seek: function(target) {
      target = Math.max(0, Math.floor(target));
      var dur = readDomDuration();
      var media = pickMedia();
      if (media && isFinite(media.duration) && media.duration > 0) {
        try {
          media.currentTime = Math.min(target, media.duration);
          return true;
        } catch (e) {}
      }
      if (isYandexHost() && seekYandex(target)) return true;
      if (!isYandexHost() && seekSpotify(target, dur)) return true;
      if (seekViaRangeSlider(target, dur)) return true;
      var ok = false;
      document.querySelectorAll("audio,video").forEach(function(m) {
        try {
          if (isFinite(m.duration) && m.duration > 0) {
            m.currentTime = Math.min(target, m.duration);
            ok = true;
          }
        } catch (e2) {}
      });
      if (ok) return true;
      if (dur > 0) {
        var bars = document.querySelectorAll(
          '[data-testid="progress-bar"], [class*="progress"], [class*="Progress"], [class*="timeline"], [class*="scrubber"]'
        );
        var pct = Math.min(1, Math.max(0, target / dur));
        for (var i = 0; i < bars.length; i++) {
          var bar = bars[i];
          var rect = bar.getBoundingClientRect();
          if (rect.width < 40) continue;
          if (dispatchBarSeek(bar, pct)) return true;
        }
      }
      return false;
    },
    like: function() { return setLike(true); },
    unlike: function() { return setLike(false); }
  };
})();`

function withEmbedBootstrap(action: string): string {
  return `${EMBED_CONTROLS_BOOTSTRAP}\n${action}`
}

export const EMBED_YANDEX_TRANSPORT_READY_SCRIPT = withEmbedBootstrap(`(function() {
  return window.__VW_EMBED__ ? window.__VW_EMBED__.yandexTransportReady() : false;
})()`)

export const EMBED_EXPAND_YANDEX_PLAYER_SCRIPT = withEmbedBootstrap(`(function() {
  return window.__VW_EMBED__ ? window.__VW_EMBED__.expandYandexPlayer() : false;
})()`)

export const EMBED_PREV_SCRIPT = withEmbedBootstrap(`(function() {
  return window.__VW_EMBED__ ? window.__VW_EMBED__.prev() : false;
})()`)

export const EMBED_NEXT_SCRIPT = withEmbedBootstrap(`(function() {
  return window.__VW_EMBED__ ? window.__VW_EMBED__.next() : false;
})()`)

export function buildEmbedSeekScript(seconds: number): string {
  const target = Math.max(0, Math.floor(seconds))
  return withEmbedBootstrap(`(function() {
    return window.__VW_EMBED__ ? window.__VW_EMBED__.seek(${target}) : false;
  })()`)
}

export const EMBED_LIKE_SCRIPT = withEmbedBootstrap(`(function() {
  return window.__VW_EMBED__ ? window.__VW_EMBED__.like() : false;
})()`)

export const EMBED_UNLIKE_SCRIPT = withEmbedBootstrap(`(function() {
  return window.__VW_EMBED__ ? window.__VW_EMBED__.unlike() : false;
})()`)

import { BrowserView, BrowserWindow, type WebContents } from "electron"
import { EMBED_PROVIDERS } from "../src/lib/streaming/embedConfig.js"
import {
  EMBED_CONTROLS_BOOTSTRAP,
  buildEmbedGainOnlyVolumeScript,
} from "../src/lib/streaming/embedPlayerControls.js"
import { EMBED_CONTEXT_MENU_INJECT } from "../src/lib/streaming/embedContextMenu.js"
import { EMBED_MOBILE_USER_AGENT } from "../src/lib/streaming/embedNowPlaying.js"
import { extractConsoleMessage } from "../src/lib/streaming/embedConsoleMessage.js"
import { isValidEmbedHostBounds } from "../src/lib/streaming/embedPanelLayout.js"
import { shouldMuteEmbedAudio } from "../src/lib/streaming/volumePercent.js"

export type StreamingProvider = "spotify" | "yandex"

export interface EmbedBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface EmbedLayoutRequest {
  visible: boolean
  provider?: StreamingProvider
  bounds?: EmbedBounds
}

class EmbedBrowserViewManager {
  private window: BrowserWindow | null = null
  private views = new Map<StreamingProvider, BrowserView>()
  private attached: StreamingProvider | null = null
  private onConsoleMessage: ((provider: StreamingProvider, message: string) => void) | null = null
  private lastVolumePercent = 72
  /** When true, Windows mixer owns gain — new views only get Chromium mute. */
  private mixerOwnsGain = false

  setWindow(win: BrowserWindow | null) {
    this.window = win
    if (!win) this.hide()
  }

  setConsoleHandler(handler: (provider: StreamingProvider, message: string) => void) {
    this.onConsoleMessage = handler
  }

  private ensureView(provider: StreamingProvider): BrowserView {
    const existing = this.views.get(provider)
    if (existing) return existing

    const cfg = EMBED_PROVIDERS[provider]
    const view = new BrowserView({
      webPreferences: {
        partition: cfg.partition,
        contextIsolation: true,
        nodeIntegration: false,
      },
    })

    view.webContents.setUserAgent(EMBED_MOBILE_USER_AGENT)
    view.webContents.setWindowOpenHandler(({ url }) => {
      void view.webContents.loadURL(url)
      return { action: "deny" }
    })

    view.webContents.on("did-finish-load", () => {
      void this.injectBootstrap(view.webContents)
      void this.applyVolumeToView(view, this.lastVolumePercent)
    })

    view.webContents.on("console-message", (...args: unknown[]) => {
      const message = extractConsoleMessage(args)
      if (message) this.onConsoleMessage?.(provider, message)
    })

    void view.webContents.loadURL(cfg.url)
    this.views.set(provider, view)
    if (this.mixerOwnsGain) {
      this.syncMuteOnly(this.lastVolumePercent)
    } else {
      void this.applyVolumeToView(view, this.lastVolumePercent)
    }
    return view
  }

  private async applyVolumeToView(view: BrowserView, percent: number) {
    if (view.webContents.isDestroyed()) return
    await this.applyVolumeToWebContents(view.webContents, percent)
  }

  private async applyVolumeToWebContents(wc: WebContents, percent: number) {
    if (wc.isDestroyed()) return
    const pct = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)))
    const muted = shouldMuteEmbedAudio(pct)
    const level = pct / 100
    try {
      wc.setAudioMuted(muted)
      wc.audioMuted = muted
    } catch {
      // continue with page script
    }
    const script = `(function(){
      try {
        window.__VW_EMBED_DESIRED_VOLUME__ = ${level};
        if (window.__VW_VOL_WATCHDOG__) {
          clearInterval(window.__VW_VOL_WATCHDOG__);
          window.__VW_VOL_WATCHDOG__ = null;
        }
        function forceLevel() {
          document.querySelectorAll("audio,video").forEach(function(m){
            try {
              m.volume = ${level};
              m.muted = ${muted};
            } catch (e) {}
          });
          var gains = window.__VW_MASTER_GAINS__ || [];
          for (var i = 0; i < gains.length; i++) {
            try { if (gains[i] && gains[i].gain) gains[i].gain.value = ${level}; } catch (e2) {}
          }
        }
        if (window.__VW_EMBED__ && window.__VW_EMBED__.setVolume) {
          window.__VW_EMBED__.setVolume(${pct});
        } else {
          forceLevel();
        }
        if (${muted}) {
          forceLevel();
          window.__VW_VOL_WATCHDOG__ = setInterval(forceLevel, 200);
        }
        return true;
      } catch (err) { return false; }
    })()`
    try {
      await wc.executeJavaScript(EMBED_CONTROLS_BOOTSTRAP)
      await wc.executeJavaScript(script, true)
    } catch {
      // page not ready — Chromium mute already applied
    }
  }

  /**
   * When Windows mixer owns gain, only sync Chromium mute on embed views.
   * Do NOT inject page setVolume / setVolumeUi — that breaks Spotify/Yandex now-playing DOM.
   */
  syncMuteOnly(percent: number): { ok: boolean; muted: boolean; targets: number } {
    const pct = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)))
    this.lastVolumePercent = pct
    this.mixerOwnsGain = true
    const muted = shouldMuteEmbedAudio(pct)
    let targets = 0

    for (const view of this.views.values()) {
      if (view.webContents.isDestroyed()) continue
      try {
        view.webContents.setAudioMuted(muted)
        view.webContents.audioMuted = muted
        targets += 1
      } catch {
        // ignore
      }
    }

    // Do not inject page scripts here — slider ticks / watchdog were re-entering
    // Yandex DOM and made volume + now-playing feel broken. Mixer owns gain.
    return { ok: targets > 0 || this.views.size > 0, muted, targets }
  }

  /**
   * Temporary gain while WASAPI has no session yet (right after play).
   * Uses media/AudioContext only — never setVolumeUi — so now-playing stays intact.
   */
  async syncGainOnly(percent: number): Promise<{ ok: boolean; muted: boolean; targets: number }> {
    const pct = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)))
    this.lastVolumePercent = pct
    // Still prefer mixer when sessions appear; this is a soft interim path.
    this.mixerOwnsGain = true
    const muted = shouldMuteEmbedAudio(pct)
    let targets = 0
    const script = buildEmbedGainOnlyVolumeScript(pct)

    for (const view of this.views.values()) {
      if (view.webContents.isDestroyed()) continue
      try {
        view.webContents.setAudioMuted(muted)
        view.webContents.audioMuted = muted
        targets += 1
      } catch {
        // ignore
      }
      try {
        await view.webContents.executeJavaScript(EMBED_CONTROLS_BOOTSTRAP)
        await view.webContents.executeJavaScript(script, true)
      } catch {
        // page not ready
      }
    }

    return { ok: targets > 0 || this.views.size > 0, muted, targets }
  }

  /** Clear interim page gain so mixer-only attenuation does not stack. */
  async resetPageGainToFull(): Promise<void> {
    const script = buildEmbedGainOnlyVolumeScript(100)
    for (const view of this.views.values()) {
      if (view.webContents.isDestroyed()) continue
      try {
        await view.webContents.executeJavaScript(EMBED_CONTROLS_BOOTSTRAP)
        await view.webContents.executeJavaScript(script, true)
      } catch {
        // ignore
      }
    }
  }

  async setVolume(percent: number): Promise<{ ok: boolean; muted: boolean; targets: number }> {
    const pct = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)))
    this.lastVolumePercent = pct
    this.mixerOwnsGain = false
    const muted = shouldMuteEmbedAudio(pct)
    let targets = 0

    // Mute only embed BrowserViews — never the main UI webContents.
    for (const view of this.views.values()) {
      if (view.webContents.isDestroyed()) continue
      try {
        view.webContents.setAudioMuted(muted)
        view.webContents.audioMuted = muted
        targets += 1
      } catch {
        // ignore
      }
    }

    // Page-level gain / watchdog only inside embed BrowserViews (fallback without OS mixer).
    for (const view of this.views.values()) {
      if (view.webContents.isDestroyed()) continue
      await this.applyVolumeToView(view, pct)
    }

    return { ok: targets > 0 || this.views.size > 0, muted, targets }
  }

  private async injectBootstrap(webContents: WebContents) {
    try {
      await webContents.executeJavaScript(EMBED_CONTROLS_BOOTSTRAP)
      await webContents.executeJavaScript(EMBED_CONTEXT_MENU_INJECT)
    } catch {
      // page not ready
    }
  }

  applyLayout(request: EmbedLayoutRequest) {
    if (
      !this.window
      || !request.visible
      || !request.provider
      || !request.bounds
      || request.bounds.width < 2
      || request.bounds.height < 2
    ) {
      this.hide()
      return
    }

    this.hide()

    const [contentWidth, contentHeight] = this.window.getContentSize()
    const bounds = request.bounds
    if (
      !isValidEmbedHostBounds(bounds, { width: contentWidth, height: contentHeight })
    ) {
      return
    }

    const view = this.ensureView(request.provider)
    this.window.setBrowserView(view)
    this.attached = request.provider

    view.setBackgroundColor("#0C1416")
    view.setBounds({
      x: Math.round(request.bounds.x),
      y: Math.round(request.bounds.y),
      width: Math.round(request.bounds.width),
      height: Math.round(request.bounds.height),
    })
  }

  hide() {
    this.window?.setBrowserView(null)
    this.attached = null
  }

  async execute(provider: StreamingProvider, script: string): Promise<unknown> {
    const view = this.views.get(provider) ?? this.ensureView(provider)
    try {
      await view.webContents.executeJavaScript(EMBED_CONTROLS_BOOTSTRAP)
      return await view.webContents.executeJavaScript(script, true)
    } catch {
      return null
    }
  }

  getUrl(provider: StreamingProvider): string {
    return this.views.get(provider)?.webContents.getURL() ?? ""
  }

  reload(provider: StreamingProvider) {
    const view = this.views.get(provider)
    if (view) {
      view.webContents.reload()
      return
    }
    this.ensureView(provider)
  }

  async loadUrl(provider: StreamingProvider, url: string): Promise<boolean> {
    const view = this.ensureView(provider)
    const wc = view.webContents
    const target = url.trim()
    if (!target) return false

    const normalize = (href: string) => {
      try {
        const parsed = new URL(href)
        return `${parsed.origin}${parsed.pathname}`
      } catch {
        return href.split("?")[0].split("#")[0]
      }
    }

    if (normalize(wc.getURL()) === normalize(target)) {
      await this.injectBootstrap(wc)
      return true
    }

    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        wc.removeListener("did-finish-load", onLoad)
        resolve(false)
      }, 25_000)

      const onLoad = async () => {
        clearTimeout(timeout)
        wc.removeListener("did-finish-load", onLoad)
        await this.injectBootstrap(wc)
        resolve(true)
      }

      wc.once("did-finish-load", onLoad)
      void wc.loadURL(target)
    })
  }

  resetProvider(provider: StreamingProvider) {
    if (this.attached === provider) {
      this.window?.setBrowserView(null)
      this.attached = null
    }
    const view = this.views.get(provider)
    if (!view) return
    this.views.delete(provider)
    if (!view.webContents.isDestroyed()) {
      view.webContents.close()
    }
  }
}

export const embedViews = new EmbedBrowserViewManager()

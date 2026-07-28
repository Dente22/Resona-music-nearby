import { BrowserView, BrowserWindow, type WebContents } from "electron"
import { EMBED_PROVIDERS } from "../src/lib/streaming/embedConfig.js"
import { EMBED_CONTROLS_BOOTSTRAP } from "../src/lib/streaming/embedPlayerControls.js"
import { EMBED_CONTEXT_MENU_INJECT } from "../src/lib/streaming/embedContextMenu.js"
import { EMBED_MOBILE_USER_AGENT } from "../src/lib/streaming/embedNowPlaying.js"
import { extractConsoleMessage } from "../src/lib/streaming/embedConsoleMessage.js"
import { isValidEmbedHostBounds } from "../src/lib/streaming/embedPanelLayout.js"

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
    })

    view.webContents.on("console-message", (...args: unknown[]) => {
      const message = extractConsoleMessage(args)
      if (message) this.onConsoleMessage?.(provider, message)
    })

    void view.webContents.loadURL(cfg.url)
    this.views.set(provider, view)
    return view
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

    view.setBackgroundColor("#09090F")
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

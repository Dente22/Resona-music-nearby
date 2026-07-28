/** Delay before first webview mount after opening Internet tab. */
export const EMBED_MOUNT_DELAY_MS = 50

/** Let renderer detach embed layout before BrowserWindow.hide() to tray. */
export const PANEL_HIDE_WEBVIEW_MS = 80

export const PANEL_SHOW_WEBVIEW_MS = 100

/** Off-screen dock — webviews stay alive without covering the panel (Windows). */
export const EMBED_OFFSCREEN_DOCK = {
  width: 390,
  height: 720,
  left: -10_000,
} as const

/** Pin webviews after first Internet visit; never unmount on tab switch. */
export function shouldPinWebviews(internetTabVisible: boolean, alreadyPinned: boolean): boolean {
  return alreadyPinned || internetTabVisible
}

/** Keep webviews in DOM once pinned. */
export function shouldMountEmbedWebviews(webviewsPinned: boolean): boolean {
  return webviewsPinned
}

/** Show webview pixels only on Internet tab. */
export function shouldPaintEmbedWebview(
  internetTabVisible: boolean,
  webviewsPinned: boolean,
  activeProvider: string,
  provider: string,
): boolean {
  return internetTabVisible && webviewsPinned && activeProvider === provider
}

/** Keep webviews scriptable when shown in UI or driving embed playback (Now tab). */
export function shouldKeepWebviewScriptable(
  webviewsPinned: boolean,
  activeProvider: string,
  provider: string,
  controlProvider?: string | null,
): boolean {
  if (!webviewsPinned) return false
  if (provider === activeProvider) return true
  if (controlProvider && provider === controlProvider) return true
  return false
}

export function shouldShowEmbedWebview(
  internetTabVisible: boolean,
  webviewsPinned: boolean,
  activeProvider: string,
  provider: string,
): boolean {
  return shouldPaintEmbedWebview(internetTabVisible, webviewsPinned, activeProvider, provider)
}

export function getInternetHostVisible(internetTabVisible: boolean): boolean {
  return internetTabVisible
}

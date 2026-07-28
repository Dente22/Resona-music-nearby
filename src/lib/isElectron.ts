export function isElectronRenderer(userAgent: string): boolean {
  return userAgent.includes("Electron")
}

export function shouldInstallBrowserFallback(options: {
  hasBridge: boolean
  userAgent: string
}): boolean {
  if (options.hasBridge) return false
  if (isElectronRenderer(options.userAgent)) return false
  return true
}

export function detectElectronBridge(): boolean {
  if (typeof window === "undefined") return false
  return Boolean(window.musicPlayer?.hidePanel)
}

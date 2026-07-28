export const ALLOWED_DOWNLOAD_HOSTS = ["jamendo.com", "archive.org"] as const

export function isAllowedDownloadUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false
    const host = parsed.hostname.toLowerCase()
    return ALLOWED_DOWNLOAD_HOSTS.some(
      allowed => host === allowed || host.endsWith(`.${allowed}`),
    )
  } catch {
    return false
  }
}

/** Where Resona's catalogs live on the home server. Audio files are a later slice. */

export type CatalogName = "library" | "playlists" | "streaming"

export type HubSyncState = "local" | "syncing" | "saved" | "offline"

export interface HubSyncStatus {
  state: HubSyncState
  /** load = catalogs never arrived; save = the panel has them but the last write failed */
  phase?: "load" | "save"
}

export interface CatalogBundle {
  library: { tracks: unknown[] }
  playlists: { playlists: unknown[] }
  streaming: { tracks: unknown[] }
  sync: HubSyncStatus
}

const NAMES: CatalogName[] = ["library", "playlists", "streaming"]

export function emptyCatalog(name: CatalogName): { tracks: unknown[] } | { playlists: unknown[] } {
  if (name === "playlists") return { playlists: [] }
  return { tracks: [] }
}

export function catalogHasEntries(name: CatalogName, data: unknown): boolean {
  if (!data || typeof data !== "object") return false
  const key = name === "playlists" ? "playlists" : "tracks"
  const list = (data as Record<string, unknown>)[key]
  return Array.isArray(list) && list.length > 0
}

/** Tailscale HTTPS goes through the portal (`/api/resona`). Port 8767 talks to Jarvis directly. */
export function catalogEndpoint(hubUrl: string, name: CatalogName): string | null {
  const trimmed = hubUrl.trim()
  if (!trimmed) return null
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null
  if (!NAMES.includes(name)) return null
  const direct = url.port === "8767"
  const prefix = direct ? "/v1/resona" : "/api/resona"
  return `${url.origin}${prefix}/catalog/${name}`
}

export function hubHeaders(token: string, write: boolean): Record<string, string> {
  const headers: Record<string, string> = {}
  const secret = token.trim()
  if (secret) headers.Authorization = `Bearer ${secret}`
  if (write) {
    headers["Content-Type"] = "application/json"
    headers["X-Hub-Request"] = "1"
  }
  return headers
}

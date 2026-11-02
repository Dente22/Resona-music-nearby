import {
  catalogEndpoint,
  catalogHasEntries,
  emptyCatalog,
  hubHeaders,
  type CatalogName,
  type HubSyncStatus,
} from "../src/lib/resonaHub.js"

export interface HubLink {
  url: string
  token: string
}

export function isHubUrl(url: string): boolean {
  return catalogEndpoint(url, "library") !== null
}

export async function pullCatalog(
  link: HubLink,
  name: CatalogName,
): Promise<{ exists: boolean; data: unknown }> {
  const endpoint = catalogEndpoint(link.url, name)
  if (!endpoint) throw new Error("bad hub url")
  const response = await fetch(endpoint, {
    headers: hubHeaders(link.token, false),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const body = (await response.json()) as { exists?: unknown; data?: unknown }
  if (!body || typeof body.data !== "object" || body.data === null || Array.isArray(body.data)) {
    throw new Error("bad catalog")
  }
  return { exists: body.exists === true, data: body.data }
}

export async function pushCatalog(link: HubLink, name: CatalogName, data: unknown): Promise<void> {
  const endpoint = catalogEndpoint(link.url, name)
  if (!endpoint) throw new Error("bad hub url")
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: hubHeaders(link.token, true),
    body: JSON.stringify({ data }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export function offline(phase: NonNullable<HubSyncStatus["phase"]>): HubSyncStatus {
  return { state: "offline", phase }
}

export function shouldSeed(name: CatalogName, exists: boolean, local: unknown): boolean {
  return !exists && catalogHasEntries(name, local)
}

export { emptyCatalog }

import { shell } from "electron"
import { OAUTH_REDIRECT_URI, YANDEX_CLIENT_ID, YANDEX_SCOPES } from "./config.js"
import { waitForOAuthCallback } from "./oauthServer.js"
import { readStreamingAuth, writeStreamingAuth } from "./authStore.js"

interface YandexTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

interface YandexAccountStatus {
  account: { uid: number; login: string; displayName?: string }
}

export function isYandexConfigured(): boolean {
  return Boolean(YANDEX_CLIENT_ID.trim())
}

export async function connectYandex(userData: string): Promise<{ ok: boolean; error?: string }> {
  if (!isYandexConfigured()) {
    return { ok: false, error: "Яндекс не настроен (YANDEX_CLIENT_ID)" }
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: YANDEX_CLIENT_ID,
    redirect_uri: OAUTH_REDIRECT_URI,
    scope: YANDEX_SCOPES,
  })

  void shell.openExternal(`https://oauth.yandex.ru/authorize?${params}`)
  const { code, error } = await waitForOAuthCallback()
  if (error || !code) return { ok: false, error: error ?? "Авторизация отменена" }

  const tokenRes = await fetch("https://oauth.yandex.ru/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: YANDEX_CLIENT_ID,
    }),
  })

  if (!tokenRes.ok) return { ok: false, error: `Yandex token error: ${tokenRes.status}` }
  const tokens = (await tokenRes.json()) as YandexTokenResponse

  const status = await yandexGet<YandexAccountStatus>(tokens.access_token, "/account/status")
  const state = readStreamingAuth(userData)
  state.yandex = {
    accessToken: tokens.access_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    displayName: status.account.displayName ?? status.account.login,
    userId: String(status.account.uid),
  }
  writeStreamingAuth(userData, state)
  return { ok: true }
}

async function getAccessToken(userData: string): Promise<string | null> {
  const auth = readStreamingAuth(userData).yandex
  if (!auth) return null
  if (Date.now() < auth.expiresAt - 60_000) return auth.accessToken
  return null
}

async function yandexGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`https://api.music.yandex.net${path}`, {
    headers: { Authorization: `OAuth ${token}` },
  })
  if (!res.ok) throw new Error(`Yandex Music ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export async function getYandexAccount(userData: string) {
  const auth = readStreamingAuth(userData).yandex
  if (!auth) return null
  return {
    provider: "yandex" as const,
    displayName: auth.displayName,
    userId: auth.userId,
    connectedAt: 0,
  }
}

export async function getYandexPlaylists(userData: string) {
  const token = await getAccessToken(userData)
  if (!token) return []

  type Playlist = { kind: number; title: string; trackCount: number; cover?: { uri?: string } }
  type Resp = { result: Playlist[] }

  const auth = readStreamingAuth(userData).yandex!
  const data = await yandexGet<Resp>(token, `/users/${auth.userId}/playlists/list`)
  return data.result.map(p => ({
    id: String(p.kind),
    provider: "yandex" as const,
    name: p.title,
    trackCount: p.trackCount,
    img: p.cover?.uri ? `https://${p.cover.uri.replace("%%", "200x200")}` : "",
  }))
}

export async function getYandexPlaylistTracks(userData: string, playlistKind: string) {
  const token = await getAccessToken(userData)
  if (!token) return []

  type Track = {
    id: string
    title: string
    durationMs: number
    albums?: Array<{ title: string; coverUri?: string }>
    artists?: Array<{ name: string }>
  }
  type Resp = { result: { tracks: Track[] } }

  const auth = readStreamingAuth(userData).yandex!
  const data = await yandexGet<Resp>(token, `/users/${auth.userId}/playlists/${playlistKind}`)
  const tracks = data.result.tracks ?? []

  const out = []
  for (const t of tracks) {
    const streamUrl = await resolveYandexStreamUrl(token, t.id)
    out.push({
      source: "yandex" as const,
      externalId: t.id,
      title: t.title,
      artist: t.artists?.map(a => a.name).join(", ") ?? "Unknown",
      album: t.albums?.[0]?.title ?? "",
      duration: Math.round((t.durationMs ?? 0) / 1000),
      img: t.albums?.[0]?.coverUri ? `https://${t.albums[0].coverUri.replace("%%", "200x200")}` : "",
      streamUrl,
    })
  }
  return out
}

async function resolveYandexStreamUrl(token: string, trackId: string): Promise<string> {
  type DownloadInfo = { downloadInfo: Array<{ codec: string; direct: boolean; downloadInfoUrl: string }> }
  try {
    const info = await yandexGet<DownloadInfo>(token, `/tracks/${trackId}/download-info`)
    const mp3 = info.downloadInfo?.find(d => d.codec === "mp3") ?? info.downloadInfo?.[0]
    if (!mp3) return ""

    const xmlRes = await fetch(mp3.downloadInfoUrl)
    const xml = await xmlRes.text()
    const host = xml.match(/<host>([^<]+)<\/host>/)?.[1]
    const path = xml.match(/<path>([^<]+)<\/path>/)?.[1]
    const ts = xml.match(/<ts>([^<]+)<\/ts>/)?.[1]
    const s = xml.match(/<s>([^<]+)<\/s>/)?.[1]
    if (!host || !path || !ts || !s) return ""
    return `https://${host}/get-mp3/${s}/${ts}${path}`
  } catch {
    return ""
  }
}

export function parseYandexPlaylistKind(url: string): string | null {
  try {
    const parsed = new URL(url.trim())
    if (!parsed.hostname.includes("music.yandex")) return null
    const m = parsed.pathname.match(/\/playlists\/(\d+)/)
    return m?.[1] ?? null
  } catch {
    return null
  }
}

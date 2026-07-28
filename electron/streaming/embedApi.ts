import { session } from "electron"
import { getEmbedConfig } from "../../src/lib/streaming/embedConfig.js"
import { buildYandexFormBody } from "../../src/lib/streaming/yandexFormBody.js"
import type { StreamingProvider } from "../../src/lib/streaming/types.js"

export async function getSpotifyAccessToken(): Promise<string | null> {
  const cfg = getEmbedConfig("spotify")
  const ses = session.fromPartition(cfg.partition)
  const res = await ses.fetch(
    "https://open.spotify.com/api/token?reason=transport&productType=web_player",
  )
  if (!res.ok) return null
  const data = (await res.json()) as { accessToken?: string }
  return data.accessToken ?? null
}

export async function getYandexAccessToken(): Promise<string | null> {
  const cfg = getEmbedConfig("yandex")
  const ses = session.fromPartition(cfg.partition)
  const res = await ses.fetch("https://oauth.yandex.ru/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=music%3Asession",
  })
  if (!res.ok) return null
  const data = (await res.json()) as { access_token?: string }
  return data.access_token ?? null
}

export async function spotifyApiFetch(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const cfg = getEmbedConfig("spotify")
  const ses = session.fromPartition(cfg.partition)
  return ses.fetch(`https://api.spotify.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
}

export async function yandexApiFetch(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const cfg = getEmbedConfig("yandex")
  const ses = session.fromPartition(cfg.partition)
  return ses.fetch(`https://api.music.yandex.net${path}`, {
    ...init,
    headers: {
      Authorization: `OAuth ${token}`,
      ...(init?.headers ?? {}),
    },
  })
}

export type YandexTrackMeta = {
  id: string
  title: string
  durationMs: number
  albums?: Array<{ title: string; coverUri?: string }>
  artists?: Array<{ name: string }>
}

export async function fetchYandexTracksByIds(
  token: string,
  trackIds: string[],
): Promise<YandexTrackMeta[]> {
  if (!trackIds.length) return []
  const res = await yandexApiFetch(token, "/tracks/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: buildYandexFormBody({ "track-ids": trackIds }),
  })
  if (!res.ok) return []
  const data = (await res.json()) as { result?: YandexTrackMeta[] }
  return data.result ?? []
}

export async function setYandexTracksLiked(
  token: string,
  uid: number,
  trackIds: string[],
  liked: boolean,
): Promise<boolean> {
  if (!trackIds.length) return false
  const path = liked
    ? `/users/${uid}/likes/tracks/add-multiple`
    : `/users/${uid}/likes/tracks/remove`
  const res = await yandexApiFetch(token, path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: buildYandexFormBody({ "track-ids": trackIds }),
  })
  return res.ok
}

export async function getYandexUid(token: string): Promise<number | null> {
  type Status = { result: { account: { uid: number } } }
  const res = await yandexApiFetch(token, "/account/status")
  if (!res.ok) return null
  const data = (await res.json()) as Status
  return data.result?.account?.uid ?? null
}

export async function getEmbedSessionForProvider(provider: StreamingProvider) {
  const { getEmbedSessionStatus } = await import("./embedSession.js")
  return getEmbedSessionStatus(provider)
}

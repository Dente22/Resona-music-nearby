import { session } from "electron"
import { getEmbedConfig } from "../../src/lib/streaming/embedConfig.js"
import { parseStreamingUrl, type ParsedStreamingUrl } from "../../src/lib/streaming/urlParser.js"
import { sanitizeStreamingTrackUrl } from "../../src/lib/streaming/streamingTrackUrl.js"
import { buildYandexTrackInput } from "../../src/lib/streaming/yandexTrackImport.js"
import { fetchYandexTrackPageMeta } from "./yandexPageFetch.js"
import type { StreamingTrackInput } from "../../src/lib/streaming/types.js"
import { getEmbedSessionStatus } from "./embedSession.js"
import {
  fetchYandexTracksByIds,
  getSpotifyAccessToken,
  getYandexAccessToken,
  getYandexUid,
  spotifyApiFetch,
  yandexApiFetch,
} from "./embedApi.js"

export interface StreamingImportResult {
  ok: boolean
  tracks: StreamingTrackInput[]
  error?: string
}

async function spotifyApiGet<T>(token: string, path: string): Promise<T | null> {
  const res = await spotifyApiFetch(token, path)
  if (!res.ok) return null
  return res.json() as Promise<T>
}

async function yandexApiGet<T>(token: string, path: string): Promise<T | null> {
  const res = await yandexApiFetch(token, path)
  if (!res.ok) return null
  return res.json() as Promise<T>
}

function mapSpotifyTrack(track: {
  id: string
  name: string
  duration_ms: number
  preview_url: string | null
  album: { name: string; images: Array<{ url: string }> }
  artists: Array<{ name: string }>
}): StreamingTrackInput {
  return {
    source: "spotify",
    externalId: track.id,
    title: track.name,
    artist: track.artists.map(a => a.name).join(", "),
    album: track.album.name,
    duration: Math.round(track.duration_ms / 1000),
    img: track.album.images[0]?.url ?? "",
    streamUrl: track.preview_url ?? "",
    pageUrl: `https://open.spotify.com/track/${track.id}`,
  }
}

async function resolveYandexStreamUrl(token: string, trackId: string): Promise<string> {
  type DownloadInfo = { downloadInfo: Array<{ codec: string; downloadInfoUrl: string }> }
  const cfg = getEmbedConfig("yandex")
  const ses = session.fromPartition(cfg.partition)
  const infoRes = await yandexApiFetch(token, `/tracks/${trackId}/download-info`)
  if (!infoRes.ok) return ""
  const info = (await infoRes.json()) as DownloadInfo
  const mp3 = info?.downloadInfo?.find(d => d.codec === "mp3") ?? info?.downloadInfo?.[0]
  if (!mp3) return ""

  const xmlRes = await ses.fetch(mp3.downloadInfoUrl)
  if (!xmlRes.ok) return ""
  const xml = await xmlRes.text()
  const host = xml.match(/<host>([^<]+)<\/host>/)?.[1]
  const path = xml.match(/<path>([^<]+)<\/path>/)?.[1]
  const ts = xml.match(/<ts>([^<]+)<\/ts>/)?.[1]
  const s = xml.match(/<s>([^<]+)<\/s>/)?.[1]
  if (!host || !path || !ts || !s) return ""
  return `https://${host}/get-mp3/${s}/${ts}${path}`
}

async function importSpotifyUrl(parsed: ParsedStreamingUrl): Promise<StreamingTrackInput[]> {
  const token = await getSpotifyAccessToken()
  if (!token) return []

  if (parsed.type === "track" && parsed.id) {
    type TrackResp = Parameters<typeof mapSpotifyTrack>[0]
    const track = await spotifyApiGet<TrackResp>(token, `/v1/tracks/${parsed.id}`)
    return track ? [mapSpotifyTrack(track)] : []
  }

  if (parsed.type === "playlist" && parsed.id) {
    type Item = { track: Parameters<typeof mapSpotifyTrack>[0] | null }
    type Resp = { items: Item[] }
    const data = await spotifyApiGet<Resp>(token, `/v1/playlists/${parsed.id}/tracks?limit=100`)
    return (data?.items ?? [])
      .filter((i): i is Item & { track: NonNullable<Item["track"]> } => Boolean(i.track?.id))
      .map(i => mapSpotifyTrack(i.track))
  }

  return []
}

async function importYandexUrl(parsed: ParsedStreamingUrl): Promise<StreamingTrackInput[]> {
  if (parsed.type === "track" && parsed.id) {
    const pageUrl = parsed.url || `https://music.yandex.ru/track/${parsed.id}`
    const token = await getYandexAccessToken()

    if (!token) {
      const pageMeta = await fetchYandexTrackPageMeta(pageUrl)
      if (pageMeta) {
        const input = buildYandexTrackInput(parsed, {
          id: parsed.id,
          title: pageMeta.title,
          durationMs: pageMeta.durationSec * 1000,
          artists: pageMeta.artist ? [{ name: pageMeta.artist }] : [],
          albums: pageMeta.album || pageMeta.img
            ? [{ title: pageMeta.album, coverUri: pageMeta.img }]
            : undefined,
        })
        return input ? [input] : []
      }
      const fallback = buildYandexTrackInput(parsed, null)
      return fallback ? [fallback] : []
    }

    const apiTracks = await fetchYandexTracksByIds(token, [parsed.id])
    if (apiTracks.length) {
      const streamUrl = await resolveYandexStreamUrl(token, apiTracks[0].id)
      const input = buildYandexTrackInput(parsed, apiTracks[0], streamUrl)
      return input ? [input] : []
    }

    const pageMeta = await fetchYandexTrackPageMeta(pageUrl)
    if (pageMeta) {
      const input = buildYandexTrackInput(parsed, {
        id: parsed.id,
        title: pageMeta.title,
        durationMs: pageMeta.durationSec * 1000,
        artists: pageMeta.artist ? [{ name: pageMeta.artist }] : [],
        albums: pageMeta.album || pageMeta.img
          ? [{ title: pageMeta.album, coverUri: pageMeta.img }]
          : undefined,
      })
      return input ? [input] : []
    }

    const fallback = buildYandexTrackInput(parsed, null)
    return fallback ? [fallback] : []
  }

  const token = await getYandexAccessToken()
  if (!token) return []

  if (parsed.type === "playlist" && parsed.id) {
    type Track = {
      id: string
      title: string
      durationMs: number
      albums?: Array<{ title: string; coverUri?: string }>
      artists?: Array<{ name: string }>
    }
    type Resp = { result: { tracks: Track[] } }
    type Status = { result: { account: { uid: number } } }
    const status = await yandexApiGet<Status>(token, "/account/status")
    const uid = status?.result?.account?.uid
    if (!uid) return []

    const data = await yandexApiGet<Resp>(token, `/users/${uid}/playlists/${parsed.id}`)
    const tracks = data?.result?.tracks ?? []
    const out: StreamingTrackInput[] = []
    for (const t of tracks) {
      const streamUrl = await resolveYandexStreamUrl(token, t.id)
      const trackParsed: ParsedStreamingUrl = {
        provider: "yandex",
        type: "track",
        id: t.id,
        url: `https://music.yandex.ru/track/${t.id}`,
      }
      const input = buildYandexTrackInput(trackParsed, t, streamUrl)
      if (input) out.push(input)
    }
    return out
  }

  return []
}

export async function importStreamingUrl(url: string): Promise<StreamingImportResult> {
  const cleanTrackUrl = sanitizeStreamingTrackUrl(url)
  const importUrl = cleanTrackUrl ?? url.trim()
  const parsed = parseStreamingUrl(importUrl)

  if (!parsed.provider || parsed.type === "unknown" || !parsed.id) {
    return { ok: false, tracks: [], error: "unsupported_url" }
  }

  const status = await getEmbedSessionStatus(parsed.provider)
  if (!status.loggedIn) {
    return { ok: false, tracks: [], error: "not_logged_in" }
  }

  const tracks =
    parsed.provider === "spotify"
      ? await importSpotifyUrl(parsed)
      : await importYandexUrl(parsed)

  const usable = tracks.filter(t => t.pageUrl?.trim() || t.streamUrl?.trim())
  if (!usable.length) {
    return { ok: false, tracks: [], error: "no_tracks" }
  }

  return { ok: true, tracks: usable }
}

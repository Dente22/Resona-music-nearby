import { parseStreamingUrl } from "../../src/lib/streaming/urlParser.js"
import type { StreamingProvider } from "../../src/lib/streaming/types.js"
import {
  getSpotifyAccessToken,
  getYandexAccessToken,
  getYandexUid,
  getEmbedSessionForProvider,
  setYandexTracksLiked,
  spotifyApiFetch,
} from "./embedApi.js"

export interface StreamingLikeResult {
  ok: boolean
  error?: string
}

async function likeSpotifyTrack(trackId: string, liked: boolean): Promise<StreamingLikeResult> {
  const token = await getSpotifyAccessToken()
  if (!token) return { ok: false, error: "not_logged_in" }

  const method = liked ? "PUT" : "DELETE"
  const res = await spotifyApiFetch(token, `/v1/me/tracks?ids=${encodeURIComponent(trackId)}`, {
    method,
  })
  if (res.ok || res.status === 200) return { ok: true }
  return { ok: false, error: "api_failed" }
}

async function likeYandexTrack(trackId: string, liked: boolean): Promise<StreamingLikeResult> {
  const token = await getYandexAccessToken()
  if (!token) return { ok: false, error: "not_logged_in" }

  const uid = await getYandexUid(token)
  if (!uid) return { ok: false, error: "not_logged_in" }

  const ok = await setYandexTracksLiked(token, uid, [trackId], liked)
  return ok ? { ok: true } : { ok: false, error: "api_failed" }
}

export async function setStreamingTrackLiked(
  url: string,
  liked: boolean,
): Promise<StreamingLikeResult> {
  const parsed = parseStreamingUrl(url)
  if (!parsed.provider || parsed.type !== "track" || !parsed.id) {
    return { ok: false, error: "unsupported_url" }
  }

  const status = await getEmbedSessionForProvider(parsed.provider)
  if (!status.loggedIn) return { ok: false, error: "not_logged_in" }

  if (parsed.provider === "spotify") {
    return likeSpotifyTrack(parsed.id, liked)
  }
  return likeYandexTrack(parsed.id, liked)
}

export async function likeStreamingTrack(url: string): Promise<StreamingLikeResult> {
  return setStreamingTrackLiked(url, true)
}

export async function unlikeStreamingTrack(url: string): Promise<StreamingLikeResult> {
  return setStreamingTrackLiked(url, false)
}

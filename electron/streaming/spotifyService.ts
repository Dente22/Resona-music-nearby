import {
  OAUTH_REDIRECT_URI,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_SCOPES,
} from "./config.js"
import { shell } from "electron"
import { generatePkce, waitForOAuthCallback } from "./oauthServer.js"
import { readStreamingAuth, writeStreamingAuth } from "./authStore.js"

interface SpotifyTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

interface SpotifyProfile {
  id: string
  display_name: string
}

export function isSpotifyConfigured(): boolean {
  return Boolean(SPOTIFY_CLIENT_ID.trim())
}

export async function connectSpotify(userData: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSpotifyConfigured()) {
    return { ok: false, error: "Spotify не настроен (SPOTIFY_CLIENT_ID)" }
  }

  const { verifier, challenge } = generatePkce()
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: OAUTH_REDIRECT_URI,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  })

  const authUrl = `https://accounts.spotify.com/authorize?${params}`
  void shell.openExternal(authUrl)

  const { code, error } = await waitForOAuthCallback()
  if (error || !code) return { ok: false, error: error ?? "Авторизация отменена" }

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: OAUTH_REDIRECT_URI,
      code_verifier: verifier,
    }),
  })

  if (!tokenRes.ok) {
    return { ok: false, error: `Spotify token error: ${tokenRes.status}` }
  }

  const tokens = (await tokenRes.json()) as SpotifyTokenResponse
  const profile = await spotifyGet<SpotifyProfile>(tokens.access_token, "/v1/me")
  const state = readStreamingAuth(userData)
  state.spotify = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    displayName: profile.display_name || profile.id,
    userId: profile.id,
  }
  writeStreamingAuth(userData, state)
  return { ok: true }
}

async function getAccessToken(userData: string): Promise<string | null> {
  const state = readStreamingAuth(userData)
  const auth = state.spotify
  if (!auth) return null

  if (Date.now() < auth.expiresAt - 60_000) return auth.accessToken

  if (!SPOTIFY_CLIENT_ID || !auth.refreshToken) return null

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: auth.refreshToken,
    }),
  })

  if (!tokenRes.ok) return null
  const tokens = (await tokenRes.json()) as SpotifyTokenResponse
  auth.accessToken = tokens.access_token
  auth.expiresAt = Date.now() + tokens.expires_in * 1000
  if (tokens.refresh_token) auth.refreshToken = tokens.refresh_token
  writeStreamingAuth(userData, state)
  return auth.accessToken
}

async function spotifyGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`https://api.spotify.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Spotify API ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export async function getSpotifyAccount(userData: string) {
  const auth = readStreamingAuth(userData).spotify
  if (!auth) return null
  return {
    provider: "spotify" as const,
    displayName: auth.displayName,
    userId: auth.userId,
    connectedAt: 0,
  }
}

export async function getSpotifyPlaylists(userData: string) {
  const token = await getAccessToken(userData)
  if (!token) return []

  type Item = { id: string; name: string; tracks: { total: number }; images: Array<{ url: string }> }
  type Resp = { items: Item[] }

  const data = await spotifyGet<Resp>(token, "/v1/me/playlists?limit=50")
  return data.items.map(p => ({
    id: p.id,
    provider: "spotify" as const,
    name: p.name,
    trackCount: p.tracks.total,
    img: p.images[0]?.url ?? "",
  }))
}

export async function getSpotifyPlaylistTracks(userData: string, playlistId: string) {
  const token = await getAccessToken(userData)
  if (!token) return []

  type TrackItem = {
    track: {
      id: string
      name: string
      duration_ms: number
      preview_url: string | null
      album: { name: string; images: Array<{ url: string }> }
      artists: Array<{ name: string }>
    } | null
  }
  type Resp = { items: TrackItem[] }

  const data = await spotifyGet<Resp>(token, `/v1/playlists/${playlistId}/tracks?limit=100`)
  return data.items
    .filter((i): i is TrackItem & { track: NonNullable<TrackItem["track"]> } => Boolean(i.track?.id))
    .map(i => ({
      source: "spotify" as const,
      externalId: i.track.id,
      title: i.track.name,
      artist: i.track.artists.map(a => a.name).join(", "),
      album: i.track.album.name,
      duration: Math.round(i.track.duration_ms / 1000),
      img: i.track.album.images[0]?.url ?? "",
      streamUrl: i.track.preview_url ?? "",
    }))
}

export async function getSpotifySavedTracks(userData: string) {
  const token = await getAccessToken(userData)
  if (!token) return []

  type Item = { track: { id: string; name: string; duration_ms: number; preview_url: string | null; album: { name: string; images: Array<{ url: string }> }; artists: Array<{ name: string }> } }
  type Resp = { items: Item[] }

  const data = await spotifyGet<Resp>(token, "/v1/me/tracks?limit=50")
  return data.items.map(i => ({
    source: "spotify" as const,
    externalId: i.track.id,
    title: i.track.name,
    artist: i.track.artists.map(a => a.name).join(", "),
    album: i.track.album.name,
    duration: Math.round(i.track.duration_ms / 1000),
    img: i.track.album.images[0]?.url ?? "",
    streamUrl: i.track.preview_url ?? "",
  }))
}

export function parseSpotifyPlaylistId(url: string): string | null {
  try {
    const parsed = new URL(url.trim())
    const m = parsed.pathname.match(/\/playlist\/([a-zA-Z0-9]+)/)
    return m?.[1] ?? null
  } catch {
    return null
  }
}

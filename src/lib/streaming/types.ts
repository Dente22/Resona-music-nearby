export type StreamingProvider = "spotify" | "yandex"

export type TrackSource = "local" | StreamingProvider

export interface StreamingAccount {
  provider: StreamingProvider
  displayName: string
  userId: string
  connectedAt: number
}

export interface StreamingPlaylist {
  id: string
  provider: StreamingProvider
  name: string
  trackCount: number
  img: string
}

export interface StreamingTrackInput {
  source: TrackSource
  externalId: string
  title: string
  artist: string
  album: string
  duration: number
  img: string
  streamUrl?: string
  filePath?: string
  pageUrl?: string
}

export interface StreamingAuthState {
  spotify?: { accessToken: string; refreshToken: string; expiresAt: number; displayName: string; userId: string }
  yandex?: { accessToken: string; expiresAt: number; displayName: string; userId: string }
}

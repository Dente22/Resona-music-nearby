export const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? ""
export const YANDEX_CLIENT_ID = process.env.YANDEX_CLIENT_ID ?? ""
export const OAUTH_REDIRECT_PORT = 47391
export const OAUTH_REDIRECT_URI = `http://127.0.0.1:${OAUTH_REDIRECT_PORT}/callback`

export const SPOTIFY_SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "user-library-read",
].join(" ")

export const YANDEX_SCOPES = "music:read"

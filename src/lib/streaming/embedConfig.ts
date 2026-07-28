import type { StreamingProvider } from "./types.js"

export interface EmbedProviderConfig {
  url: string
  partition: string
  loginCookieNames: string[]
  cookieDomains: string[]
}

export const EMBED_PROVIDERS: Record<StreamingProvider, EmbedProviderConfig> = {
  spotify: {
    url: "https://open.spotify.com",
    partition: "persist:violetwave-spotify",
    loginCookieNames: ["sp_dc", "sp_key"],
    cookieDomains: [".spotify.com"],
  },
  yandex: {
    url: "https://music.yandex.ru",
    partition: "persist:violetwave-yandex",
    loginCookieNames: ["Session_id", "sessionid2"],
    cookieDomains: [
      ".yandex.ru",
      ".yandex.by",
      ".yandex.kz",
      ".yandex.com",
      ".music.yandex.ru",
      ".music.yandex.kz",
      ".music.yandex.by",
    ],
  },
}

export function getEmbedConfig(provider: StreamingProvider): EmbedProviderConfig {
  return EMBED_PROVIDERS[provider]
}

export function isLoginCookie(name: string, provider: StreamingProvider): boolean {
  return EMBED_PROVIDERS[provider].loginCookieNames.includes(name)
}

export function hasLoginCookies(
  cookies: Array<{ name: string; domain: string }>,
  provider: StreamingProvider,
): boolean {
  const cfg = EMBED_PROVIDERS[provider]
  return cookies.some(
    c =>
      cfg.loginCookieNames.includes(c.name) &&
      cfg.cookieDomains.some(d => c.domain === d || c.domain.endsWith(d.replace(/^\./, ""))),
  )
}

import { EMBED_IS_PLAYING_SCRIPT, EMBED_START_TRACK_SCRIPT, getTrackPageSettleMs } from "./embedLoadPlay.js"
import {
  buildEmbedFindTrackUrlScript,
  buildEmbedOpenSearchTrackScript,
} from "./embedSearchPlay.js"
import { EMBED_TRACK_URL_SCRIPT } from "./embedTrackUrl.js"
import { parseStreamingUrl } from "./urlParser.js"
import type { DelegatedPlaybackTarget } from "./resolveDelegatedTrackPlaybackTarget.js"
import type { StreamingProvider } from "./types.js"

export const EMBED_TRACK_PAGE_SETTLE_MS = 450
export const EMBED_SEARCH_PAGE_SETTLE_MS = 700
export const EMBED_SEARCH_FIND_RETRY_MS = 400
export const EMBED_SEARCH_FIND_MAX_ATTEMPTS = 3
export const EMBED_START_RETRY_MS = 350
export const EMBED_START_VERIFY_MS = 180
export const EMBED_START_MAX_ATTEMPTS = 5

export interface EmbedDelegatedPlaybackApi {
  embedLoadUrl: (provider: StreamingProvider, url: string) => Promise<boolean>
  embedExecute: (provider: StreamingProvider, script: string) => Promise<unknown>
  embedGetUrl?: (provider: StreamingProvider) => Promise<string>
}

async function startTrackOnce(
  provider: StreamingProvider,
  api: EmbedDelegatedPlaybackApi,
): Promise<boolean> {
  for (let attempt = 0; attempt < EMBED_START_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, EMBED_START_RETRY_MS))
    }
    await api.embedExecute(provider, EMBED_START_TRACK_SCRIPT)
    await new Promise(resolve => setTimeout(resolve, EMBED_START_VERIFY_MS))
    const playing = await api.embedExecute(provider, EMBED_IS_PLAYING_SCRIPT)
    if (playing) return true
  }
  // Final settle — Yandex often starts audio before the pause button appears.
  await new Promise(resolve => setTimeout(resolve, EMBED_START_RETRY_MS * 2))
  const playing = await api.embedExecute(provider, EMBED_IS_PLAYING_SCRIPT)
  return Boolean(playing)
}

function asHref(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export function trackPath(url: string): string {
  try {
    return new URL(url).pathname.replace(/\/+$/, "")
  } catch {
    return url.split("?")[0].split("#")[0].replace(/\/+$/, "")
  }
}

export function urlsReferToSameTrack(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  if (trackPath(a) === trackPath(b)) return true
  const pa = parseStreamingUrl(a)
  const pb = parseStreamingUrl(b)
  return Boolean(
    pa.provider
    && pb.provider
    && pa.provider === pb.provider
    && pa.id
    && pb.id
    && pa.id === pb.id,
  )
}

async function currentEmbedTrackUrl(
  provider: StreamingProvider,
  api: EmbedDelegatedPlaybackApi,
): Promise<string> {
  const fromPage = asHref(await api.embedExecute(provider, EMBED_TRACK_URL_SCRIPT))
  if (fromPage) return fromPage
  if (api.embedGetUrl) {
    return asHref(await api.embedGetUrl(provider))
  }
  return ""
}

async function resolveSearchTrackUrl(
  provider: StreamingProvider,
  title: string,
  artist: string,
  api: EmbedDelegatedPlaybackApi,
): Promise<string> {
  for (let attempt = 0; attempt < EMBED_SEARCH_FIND_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, EMBED_SEARCH_FIND_RETRY_MS))
    }
    const found = asHref(
      await api.embedExecute(provider, buildEmbedFindTrackUrlScript(title, artist)),
    )
    if (found) return found
  }

  // Last resort: open the matching result (title/card), then read the track URL.
  await api.embedExecute(provider, buildEmbedOpenSearchTrackScript(title, artist))
  await new Promise(resolve => setTimeout(resolve, EMBED_SEARCH_FIND_RETRY_MS))
  const fromPage = asHref(await api.embedExecute(provider, EMBED_TRACK_URL_SCRIPT))
  if (fromPage) return fromPage
  return asHref(await api.embedExecute(provider, buildEmbedFindTrackUrlScript(title, artist)))
}

/**
 * Load exactly one track page and start it.
 * Avoids full Yandex/Spotify reloads when the embed is already on that track.
 * Returns the track page URL that was started, or null on failure.
 */
export async function playDelegatedTrackInEmbed(
  provider: StreamingProvider,
  target: DelegatedPlaybackTarget,
  api: EmbedDelegatedPlaybackApi,
): Promise<string | null> {
  const pageUrl = target.url.trim()
  if (!pageUrl) return null

  if (target.mode === "track") {
    const already = await currentEmbedTrackUrl(provider, api)
    if (already && urlsReferToSameTrack(already, pageUrl)) {
      const started = await startTrackOnce(provider, api)
      return started ? already : null
    }

    const loaded = await api.embedLoadUrl(provider, pageUrl)
    if (!loaded) return null
    await new Promise(resolve => setTimeout(resolve, getTrackPageSettleMs(provider)))
    const started = await startTrackOnce(provider, api)
    return started ? pageUrl : null
  }

  // Search mode: try current page first — do NOT bounce through /search if avoidable.
  let href = asHref(
    await api.embedExecute(
      provider,
      buildEmbedFindTrackUrlScript(target.title, target.artist),
    ),
  )
  if (!href) {
    const already = await currentEmbedTrackUrl(provider, api)
    // If we are already on some track page, try one more find pass after a short wait
    // (SPA may still be hydrating) before forcing a full search navigation.
    if (already && /\/track\//i.test(already)) {
      await new Promise(resolve => setTimeout(resolve, EMBED_SEARCH_FIND_RETRY_MS))
      href = asHref(
        await api.embedExecute(
          provider,
          buildEmbedFindTrackUrlScript(target.title, target.artist),
        ),
      )
    }
  }

  if (!href) {
    const loaded = await api.embedLoadUrl(provider, pageUrl)
    if (!loaded) return null
    await new Promise(resolve => setTimeout(resolve, EMBED_SEARCH_PAGE_SETTLE_MS))
    href = await resolveSearchTrackUrl(provider, target.title, target.artist, api)
    if (!href) return null
  }

  const alreadyOnTrack = await currentEmbedTrackUrl(provider, api)
  let trackUrl = href
  if (alreadyOnTrack && urlsReferToSameTrack(alreadyOnTrack, href)) {
    trackUrl = alreadyOnTrack
  } else {
    const trackLoaded = await api.embedLoadUrl(provider, href)
    if (!trackLoaded) return null
    trackUrl = href
  }

  await new Promise(resolve => setTimeout(resolve, getTrackPageSettleMs(provider)))
  const started = await startTrackOnce(provider, api)
  return started ? trackUrl : null
}

import type { EmbedNowPlaying } from "./embedNowPlaying.js"
import type { ParsedStreamingUrl } from "./urlParser.js"
import { buildYandexTrackPageUrl } from "./urlParser.js"
import { pickBestEmbedImportUrl } from "./embedTrackUrl.js"
import { sanitizeStreamingTrackUrl } from "./streamingTrackUrl.js"
import type { StreamingTrackInput } from "./types.js"

export function buildLikedStreamingInput(
  embed: EmbedNowPlaying,
  pageUrl: string,
  parsed: ParsedStreamingUrl,
  imported?: StreamingTrackInput,
): StreamingTrackInput | null {
  if (!parsed.provider || parsed.type !== "track" || !parsed.id) return null

  if (imported) {
    return {
      ...imported,
      pageUrl: pageUrl || imported.pageUrl || parsed.url,
    }
  }

  return {
    source: parsed.provider,
    externalId: parsed.id,
    title: embed.title,
    artist: embed.artist,
    album: embed.album,
    duration: embed.duration,
    img: embed.img,
    streamUrl: "",
    pageUrl: pageUrl || parsed.url || buildYandexTrackPageUrl(parsed.id),
  }
}

export function mergePageUrlOnStreamingInput(
  item: StreamingTrackInput,
  pageUrl: string,
): StreamingTrackInput {
  const clean = sanitizeStreamingTrackUrl(pageUrl)
  return { ...item, pageUrl: clean ?? (pageUrl || item.pageUrl) }
}

export async function resolveEmbedTrackPageUrl(options: {
  embed: EmbedNowPlaying
  storedUrl: string
  liveUrl: string
  fetchFromEmbed?: () => Promise<string>
}): Promise<string | null> {
  const candidates = [options.storedUrl, options.liveUrl]

  if (options.fetchFromEmbed) {
    try {
      const fetched = (await options.fetchFromEmbed()).trim()
      if (fetched) candidates.push(fetched)
    } catch {
      // ignore
    }
  }

  for (const raw of candidates) {
    const best = pickBestEmbedImportUrl(raw, "")
    if (best) return best
  }
  return null
}

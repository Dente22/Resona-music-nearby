import type { EmbedNowPlaying } from "./embedNowPlaying.js"
import { upscaleEmbedCoverUrl } from "./embedCoverArt.js"
import { buildBrowsableStreamingInput } from "./embedBrowsableTrack.js"
import { buildLikedStreamingInput, mergePageUrlOnStreamingInput } from "./saveLikedTrack.js"
import type { ParsedStreamingUrl } from "./urlParser.js"
import type { StreamingTrackInput } from "./types.js"

const GENERIC_TITLES = /^yandex music$/i

export function enrichStreamingInput(
  item: StreamingTrackInput,
  embed: EmbedNowPlaying | null,
): StreamingTrackInput {
  if (!embed) return item
  return {
    ...item,
    title: item.title && !GENERIC_TITLES.test(item.title) ? item.title : embed.title || item.title,
    artist: item.artist?.trim() ? item.artist : embed.artist,
    album: item.album?.trim() ? item.album : embed.album,
    img: upscaleEmbedCoverUrl(item.img?.trim() ? item.img : embed.img),
    duration: item.duration > 0 ? item.duration : embed.duration,
  }
}

export function collectStreamingTrackInputsFromEmbedOnly(
  embed: EmbedNowPlaying | null,
): StreamingTrackInput[] {
  if (!embed?.title?.trim()) return []
  return [enrichStreamingInput(buildBrowsableStreamingInput(embed), embed)]
}

export function collectStreamingTrackInputs(options: {
  url: string
  parsed: ParsedStreamingUrl | null
  importResult: { ok: boolean; tracks: StreamingTrackInput[] }
  embed: EmbedNowPlaying | null
}): StreamingTrackInput[] {
  const { url, parsed, importResult, embed } = options
  if (!parsed?.provider || parsed.type !== "track" || !parsed.id) {
    return collectStreamingTrackInputsFromEmbedOnly(embed)
  }

  if (importResult.ok && importResult.tracks.length) {
    return importResult.tracks
      .map(t => enrichStreamingInput(mergePageUrlOnStreamingInput(t, url), embed))
      .filter(t => t.streamUrl?.trim() || t.pageUrl?.trim())
  }

  if (!embed) return []
  const fallback = buildLikedStreamingInput(embed, url, parsed)
  return fallback ? [enrichStreamingInput(fallback, embed)] : []
}

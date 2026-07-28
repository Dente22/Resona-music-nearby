import type { ParsedStreamingUrl } from "./urlParser.js"
import { buildYandexTrackPageUrl } from "./urlParser.js"
import type { StreamingTrackInput } from "./types.js"

function yandexCoverUrl(coverUri?: string): string {
  if (!coverUri) return ""
  if (/^https?:\/\//i.test(coverUri)) return coverUri.replace("%%", "200x200")
  return `https://${coverUri.replace("%%", "200x200")}`
}

export type YandexApiTrack = {
  id: string
  title: string
  durationMs: number
  albums?: Array<{ title: string; coverUri?: string }>
  artists?: Array<{ name: string }>
}

function yandexPageUrl(parsed: ParsedStreamingUrl): string {
  return parsed.url || buildYandexTrackPageUrl(parsed.id!)
}

export function buildYandexTrackInput(
  parsed: ParsedStreamingUrl,
  apiTrack: YandexApiTrack | null,
  streamUrl = "",
): StreamingTrackInput | null {
  if (parsed.provider !== "yandex" || parsed.type !== "track" || !parsed.id) return null

  if (!apiTrack) {
    return {
      source: "yandex",
      externalId: parsed.id,
      title: "Yandex Music",
      artist: "",
      album: "",
      duration: 0,
      img: "",
      streamUrl,
      pageUrl: yandexPageUrl(parsed),
    }
  }

  return {
    source: "yandex",
    externalId: apiTrack.id,
    title: apiTrack.title,
    artist: apiTrack.artists?.map(a => a.name).join(", ") ?? "Unknown",
    album: apiTrack.albums?.[0]?.title ?? "",
    duration: Math.round((apiTrack.durationMs ?? 0) / 1000),
    img: yandexCoverUrl(apiTrack.albums?.[0]?.coverUri),
    streamUrl,
    pageUrl: yandexPageUrl(parsed),
  }
}

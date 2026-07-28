import type { Track } from "../types.js"
import { buildYandexTrackPageUrl, parseStreamingUrl } from "./urlParser.js"
import { normalizeStreamingPageUrl } from "./embedTrackUrl.js"

/** Best track page URL for loading a delegated library item in the embed. */
export function resolveDelegatedTrackPageUrl(track: Track): string {
  const pageUrl = normalizeStreamingPageUrl(track.pageUrl ?? "")
  if (pageUrl) {
    const parsed = parseStreamingUrl(pageUrl)
    if (parsed.type === "track" && parsed.id) return pageUrl
  }

  const externalId = track.externalId?.trim() ?? ""
  if (!externalId || externalId.startsWith("browse-")) return ""

  if (track.source === "yandex" && /^\d+$/.test(externalId)) {
    return buildYandexTrackPageUrl(externalId)
  }

  if (track.source === "spotify") {
    return `https://open.spotify.com/track/${externalId}`
  }

  return ""
}

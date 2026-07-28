export interface YandexPageTrackMeta {
  title: string
  artist: string
  album: string
  img: string
  durationSec: number
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function metaContent(html: string, property: string): string {
  const re = new RegExp(
    `<meta[^>]+property="${property}"[^>]+content="([^"]+)"|<meta[^>]+content="([^"]+)"[^>]+property="${property}"`,
    "i",
  )
  const match = html.match(re)
  return decodeHtml((match?.[1] ?? match?.[2] ?? "").trim())
}

function parseIsoDuration(value: string): number {
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i)
  if (!match) return 0
  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2] ?? 0)
  const seconds = Number(match[3] ?? 0)
  return hours * 3600 + minutes * 60 + seconds
}

function parseTitleArtist(ogTitle: string, ogDescription: string): { title: string; artist: string } {
  const cleaned = ogTitle
    .replace(/\s*[—–-]\s*слушать.*$/i, "")
    .replace(/\s*·\s*Yandex Music.*$/i, "")
    .replace(/\s*[—–-]\s*Yandex Music.*$/i, "")
    .trim()

  const dashSplit = cleaned.split(/\s*[—–-]\s*/)
  if (dashSplit.length >= 2) {
    return { title: dashSplit[0].trim(), artist: dashSplit.slice(1).join(" — ").trim() }
  }

  const artist = ogDescription
    .replace(/^исполнитель[:\s]*/i, "")
    .replace(/\s*·.*$/i, "")
    .trim()

  return { title: cleaned, artist }
}

/** Parse track metadata from a Yandex Music track/album HTML page. */
export function parseYandexTrackPageMeta(html: string): YandexPageTrackMeta | null {
  const ogTitle = metaContent(html, "og:title")
  if (!ogTitle) return null

  const ogDescription = metaContent(html, "og:description")
  const ogImage = metaContent(html, "og:image")
  const { title, artist } = parseTitleArtist(ogTitle, ogDescription)

  let durationSec = 0
  const jsonLdMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]) as { duration?: string; name?: string }
      if (data.duration) durationSec = parseIsoDuration(data.duration)
    } catch {
      // ignore malformed JSON-LD
    }
  }

  const albumMatch = html.match(/"album"\s*:\s*\{[^}]*"title"\s*:\s*"([^"]+)"/i)
  const album = albumMatch?.[1] ? decodeHtml(albumMatch[1]) : ""

  if (!title) return null

  return {
    title,
    artist,
    album,
    img: ogImage,
    durationSec,
  }
}

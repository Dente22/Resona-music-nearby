const DEFAULT_COVER_PX = 600

/** Upscale tiny Spotify/Yandex thumbnails for full-screen Now Playing art. */
export function upscaleEmbedCoverUrl(url: string, targetPx = DEFAULT_COVER_PX): string {
  const trimmed = url?.trim() ?? ""
  if (!trimmed) return ""

  let out = trimmed

  if (out.includes("%%")) {
    out = out.replace(/%%/g, `${targetPx}x${targetPx}`)
  }

  out = out.replace(/\/(\d{2,4})x(\d{2,4})(?=\/|$|[?#])/g, `/${targetPx}x${targetPx}`)

  if (/[?&]size=\d+/i.test(out)) {
    out = out.replace(/([?&])size=\d+/gi, `$1size=${targetPx}`)
  }

  if (/[?&]w=\d+/i.test(out)) {
    out = out.replace(/([?&])w=\d+/gi, `$1w=${targetPx}`)
  }
  if (/[?&]h=\d+/i.test(out)) {
    out = out.replace(/([?&])h=\d+/gi, `$1h=${targetPx}`)
  }

  return out
}

export function pickEmbedCoverUrl(
  domImg: string | undefined,
  sessionArtworks: Array<{ src?: string }> | undefined,
  targetPx = DEFAULT_COVER_PX,
): string {
  const dom = domImg?.trim() ?? ""
  const artworks = sessionArtworks ?? []
  const largestSession = artworks.length
    ? (artworks[artworks.length - 1]?.src ?? artworks[0]?.src ?? "").trim()
    : ""

  const domLooksTiny =
  /size=\d{1,2}\b|[?&]w=(?:4[0-9]|[1-3]?\d)\b|\/(?:3[0-9]|[1-2]?\d)x(?:3[0-9]|[1-2]?\d)\b/i.test(dom)

  const raw = domLooksTiny && largestSession ? largestSession : (dom || largestSession)
  return upscaleEmbedCoverUrl(raw, targetPx)
}

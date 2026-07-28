export function toVioletwaveMediaUrl(filePath: string): string {
  return `violetwave-media://local?path=${encodeURIComponent(filePath)}`
}

export function parseVioletwaveMediaUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "violetwave-media:") return null
    const path = parsed.searchParams.get("path")
    return path ? decodeURIComponent(path) : null
  } catch {
    return null
  }
}

/** @deprecated use toVioletwaveMediaUrl in Electron */
export function toFileAudioUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/")
  if (normalized.startsWith("file://")) return normalized
  const encoded = normalized
    .split("/")
    .map((part, i) => (i === 0 && /^[A-Za-z]:$/.test(part) ? part : encodeURIComponent(part)))
    .join("/")
  return `file:///${encoded}`
}

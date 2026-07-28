export interface ParsedFilenameMeta {
  artist: string
  title: string
  rawTitle: string
}

export function stripTrailingNumericId(name: string): string {
  return name
    .replace(/[_-]\d{5,}$/, "")
    .replace(/\s+\d{5,}$/, "")
    .trim()
}

export function humanizeFilenameSegment(text: string): string {
  return text.replace(/_/g, " ").replace(/\s+/g, " ").trim()
}

export function parseArtistTitleFromBaseName(baseName: string): ParsedFilenameMeta {
  const cleaned = stripTrailingNumericId(baseName)

  const underscoreDash = cleaned.match(/^(.+?)_-_(.+)$/)
  if (underscoreDash) {
    const rawTitle = humanizeFilenameSegment(underscoreDash[2])
    return {
      artist: humanizeFilenameSegment(underscoreDash[1]),
      title: maybeCyrillicTitle(rawTitle),
      rawTitle,
    }
  }

  const spacedDash = cleaned.match(/^(.+?)\s[-–—]\s(.+)$/)
  if (spacedDash) {
    const rawTitle = spacedDash[2].trim()
    return {
      artist: spacedDash[1].trim(),
      title: maybeCyrillicTitle(rawTitle),
      rawTitle,
    }
  }

  if (cleaned.includes("_")) {
    const rawTitle = humanizeFilenameSegment(cleaned)
    return {
      artist: "Unknown Artist",
      title: maybeCyrillicTitle(rawTitle),
      rawTitle,
    }
  }

  return {
    artist: "Unknown Artist",
    title: cleaned,
    rawTitle: cleaned,
  }
}

export function looksLikeLatinTranslit(text: string): boolean {
  if (/[а-яёА-ЯЁ]/.test(text)) return false
  if (!/[a-zA-Z]/.test(text)) return false
  return /(?:ch|sh|kh|zh|ya|yu|yo|ts|iy|yy|chto|chtoby)/i.test(text)
}

const DIGRAPHS: [string, string][] = [
  ["shch", "щ"],
  ["sch", "щ"],
  ["yo", "ё"],
  ["yu", "ю"],
  ["ya", "я"],
  ["ye", "е"],
  ["zh", "ж"],
  ["kh", "х"],
  ["ch", "ч"],
  ["sh", "ш"],
  ["ts", "ц"],
  ["iy", "ий"],
  ["yy", "ый"],
  ["ey", "ей"],
  ["ay", "ай"],
  ["oy", "ой"],
  ["uy", "уй"],
]

const CHAR_MAP: Record<string, string> = {
  a: "а",
  b: "б",
  c: "к",
  d: "д",
  e: "е",
  f: "ф",
  g: "г",
  h: "х",
  i: "и",
  j: "ж",
  k: "к",
  l: "л",
  m: "м",
  n: "н",
  o: "о",
  p: "п",
  q: "к",
  r: "р",
  s: "с",
  t: "т",
  u: "у",
  v: "в",
  w: "в",
  x: "кс",
  y: "ы",
  z: "з",
}

export function latinTranslitToCyrillic(text: string): string {
  let result = ""
  let i = 0
  const lower = text.toLowerCase()

  while (i < lower.length) {
    if (!/[a-z]/.test(lower[i])) {
      result += text[i]
      i++
      continue
    }

    let matched = false
    for (const [latin, cyr] of DIGRAPHS) {
      if (lower.startsWith(latin, i)) {
        result += cyr
        i += latin.length
        matched = true
        break
      }
    }
    if (matched) continue

    const ch = lower[i]
    result += CHAR_MAP[ch] ?? text[i]
    i++
  }

  return result.replace(/\s+/g, " ").trim()
}

function postProcessTranslitWords(text: string): string {
  let result = text
    .replace(/думат(?=\s|$)/g, "думать")
    .replace(/ходит(?=\s|$)/g, "ходить")
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1)
  }
  return result
}

function maybeCyrillicTitle(rawTitle: string): string {
  if (!looksLikeLatinTranslit(rawTitle)) return rawTitle
  const cyr = latinTranslitToCyrillic(rawTitle)
  return cyr ? postProcessTranslitWords(cyr) : rawTitle
}

export function parseFilenameToTrackMeta(filePath: string): ParsedFilenameMeta {
  const fileName = filePath.split(/[/\\]/).pop() ?? "Unknown"
  const baseName = fileName.replace(/\.[^.]+$/, "")
  return parseArtistTitleFromBaseName(baseName)
}

import fs from "fs"
import path from "path"
import { parseFile } from "music-metadata"
import {
  buildRecordingSearchUrl,
  parseRecordingSearchResponse,
  pickBestRecordingMatch,
} from "../src/lib/musicBrainzClient.js"
import {
  buildJamendoSearchUrl,
  parseJamendoSearchResponse,
  rankFreeTracks,
} from "../src/lib/freeMusicSearch.js"
import { analyzeTrackIdentity, type RawTrackTags } from "../src/lib/trackAnalyzer.js"
import { buildDiscoveryPlan, mergeDiscoveryResults } from "../src/lib/trackDiscovery.js"
import { isAllowedDownloadUrl } from "../src/lib/downloadSafety.js"

const USER_AGENT = "Violetwave/1.0.0 (https://github.com/violetwave)"

export async function readTrackTags(filePath: string): Promise<RawTrackTags> {
  try {
    const meta = await parseFile(filePath, { duration: true })
    const mood = meta.common.mood
    const genre = Array.isArray(meta.common.genre)
      ? meta.common.genre.join(", ")
      : meta.common.genre
    return {
      title: meta.common.title,
      artist: meta.common.artist,
      album: meta.common.album,
      duration: meta.format.duration ? Math.round(meta.format.duration) : undefined,
      mood: typeof mood === "string" ? mood : undefined,
      genre: typeof genre === "string" ? genre : undefined,
    }
  } catch {
    return {}
  }
}

export async function analyzeTrackFile(filePath: string) {
  const tags = await readTrackTags(filePath)
  return analyzeTrackIdentity({ filePath, tags })
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export async function discoverTrackOnline(
  filePath: string | null,
  manual: { artist: string; title: string } | null,
  jamendoClientId: string,
) {
  let identity
  if (filePath && fs.existsSync(filePath)) {
    identity = await analyzeTrackFile(filePath)
  } else if (manual?.title || manual?.artist) {
    identity = analyzeTrackIdentity({
      filePath: `${manual.artist} - ${manual.title}.mp3`,
      tags: { title: manual.title, artist: manual.artist },
    })
  } else {
    throw new Error("No track to analyze")
  }

  const plan = buildDiscoveryPlan(identity)

  let metadata = null
  try {
    const mbUrl = buildRecordingSearchUrl(identity.artist, identity.title)
    const mbData = await fetchJson<{ recordings?: unknown[] }>(mbUrl)
    const matches = parseRecordingSearchResponse(mbData as Parameters<typeof parseRecordingSearchResponse>[0])
    metadata = pickBestRecordingMatch(matches, identity.artist, identity.title)
  } catch {
    // MusicBrainz optional
  }

  let freeDownloads: ReturnType<typeof parseJamendoSearchResponse> = []
  if (jamendoClientId.trim()) {
    try {
      const jamendoUrl = buildJamendoSearchUrl(plan.jamendoQuery, jamendoClientId.trim())
      const jamendoData = await fetchJson<{ results?: unknown[] }>(jamendoUrl)
      const parsed = parseJamendoSearchResponse(
        jamendoData as Parameters<typeof parseJamendoSearchResponse>[0],
      )
      freeDownloads = rankFreeTracks(parsed, identity.artist, identity.title)
    } catch {
      // Jamendo optional
    }
  }

  return mergeDiscoveryResults(metadata, freeDownloads, identity)
}

export async function downloadFreeTrack(
  downloadUrl: string,
  musicDir: string,
  fileName: string,
): Promise<string> {
  if (!isAllowedDownloadUrl(downloadUrl)) {
    throw new Error("Download blocked: source not allowed")
  }

  fs.mkdirSync(musicDir, { recursive: true })
  const safeName = fileName.replace(/[<>:"/\\|?*]/g, "_")
  const dest = path.join(musicDir, safeName)

  const res = await fetch(downloadUrl, {
    headers: { "User-Agent": USER_AGENT },
  })
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(dest, buffer)
  return dest
}

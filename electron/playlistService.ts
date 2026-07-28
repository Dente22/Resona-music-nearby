import {
  parsePlaylistUrl,
  parseM3uContent,
  filterAllowedPlaylistUrls,
  type ParsedPlaylistLink,
} from "../src/lib/playlistParser.js"
import {
  buildJamendoAlbumTracksUrl,
  buildJamendoPlaylistTracksUrl,
  parseJamendoPlaylistTracksResponse,
  playlistItemsFromDirectUrls,
  type PlaylistTrackItem,
} from "../src/lib/playlistImport.js"
import { downloadFreeTrack } from "./discoveryService.js"

const USER_AGENT = "Violetwave/1.0.0 (https://github.com/violetwave)"

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export async function resolvePlaylistTracks(
  playlistInput: string,
  jamendoClientId: string,
): Promise<{ parsed: ParsedPlaylistLink; tracks: PlaylistTrackItem[] }> {
  const parsed = parsePlaylistUrl(playlistInput)

  if (parsed.type === "blocked") {
    throw new Error(parsed.reason ?? "Playlist source blocked")
  }

  if (parsed.type === "unsupported") {
    throw new Error("Неподдерживаемая ссылка. Используйте Jamendo или .m3u")
  }

  if (parsed.type === "jamendo-album" || parsed.type === "jamendo-playlist") {
    if (!jamendoClientId.trim()) {
      throw new Error("Укажите Jamendo Client ID в Settings")
    }
    const apiUrl =
      parsed.type === "jamendo-album"
        ? buildJamendoAlbumTracksUrl(parsed.id!, jamendoClientId.trim())
        : buildJamendoPlaylistTracksUrl(parsed.id!, jamendoClientId.trim())
    const data = await fetchJson<{ results?: unknown[] }>(apiUrl)
    const tracks = parseJamendoPlaylistTracksResponse(
      data as Parameters<typeof parseJamendoPlaylistTracksResponse>[0],
    )
    return { parsed, tracks }
  }

  // m3u-url
  const content = playlistInput.includes("#EXTM3U")
    ? playlistInput
    : await fetchText(parsed.url)
  const urls = filterAllowedPlaylistUrls(parseM3uContent(content))
  const tracks = playlistItemsFromDirectUrls(urls)
  return { parsed, tracks }
}

export interface DownloadedPlaylistTrack {
  filePath: string
  title: string
  artist: string
  album: string
  duration: number
  img: string
}

export async function downloadPlaylistToLibrary(
  tracks: PlaylistTrackItem[],
  musicDir: string,
  onProgress?: (done: number, total: number) => void,
): Promise<DownloadedPlaylistTrack[]> {
  const imported: DownloadedPlaylistTrack[] = []

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i]
    const safeBase = `${track.artist} - ${track.title}`.replace(/[<>:"/\\|?*]/g, "_")
    const fileName = `${Date.now()}-${i}-${safeBase}.mp3`
    try {
      const dest = await downloadFreeTrack(track.downloadUrl, musicDir, fileName)
      imported.push({
        filePath: dest,
        title: track.title,
        artist: track.artist,
        album: track.album || "Playlist",
        duration: track.durationSec,
        img: track.imageUrl,
      })
    } catch {
      // skip failed track
    }
    onProgress?.(i + 1, tracks.length)
  }

  return imported
}

import { isAllowedDownloadUrl } from "./downloadSafety.js"

export interface PlaylistTrackItem {
  title: string
  artist: string
  album: string
  durationSec: number
  downloadUrl: string
  imageUrl: string
  licenseUrl: string
}

export function buildJamendoAlbumTracksUrl(albumId: string, clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    id: albumId,
    format: "json",
    limit: "200",
  })
  return `https://api.jamendo.com/v3.0/albums/tracks/?${params.toString()}`
}

export function buildJamendoPlaylistTracksUrl(playlistId: string, clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    id: playlistId,
    format: "json",
    limit: "200",
  })
  return `https://api.jamendo.com/v3.0/playlists/tracks/?${params.toString()}`
}

interface JamendoTrackRow {
  id?: number | string
  name?: string
  artist_name?: string
  album_name?: string
  duration?: number
  audio?: string
  image?: string
  license_ccurl?: string
}

export function parseJamendoPlaylistTracksResponse(data: {
  results?: JamendoTrackRow[]
}): PlaylistTrackItem[] {
  return (data.results ?? [])
    .filter(t => t.name && t.audio && isAllowedDownloadUrl(t.audio))
    .map(t => ({
      title: t.name!,
      artist: t.artist_name ?? "Unknown Artist",
      album: t.album_name ?? "",
      durationSec: t.duration ?? 0,
      downloadUrl: t.audio!,
      imageUrl: t.image ?? "",
      licenseUrl: t.license_ccurl ?? "",
    }))
}

export function playlistItemsFromDirectUrls(urls: string[]): PlaylistTrackItem[] {
  return urls.filter(isAllowedDownloadUrl).map((url, index) => {
    const fileName = decodeURIComponent(url.split("/").pop()?.split("?")[0] ?? `track-${index + 1}`)
    const baseName = fileName.replace(/\.[^.]+$/, "")
    const dash = baseName.match(/^(.+?)\s[-–—]\s(.+)$/)
    return {
      title: dash?.[2]?.trim() ?? baseName,
      artist: dash?.[1]?.trim() ?? "Unknown Artist",
      album: "",
      durationSec: 0,
      downloadUrl: url,
      imageUrl: "",
      licenseUrl: "",
    }
  })
}

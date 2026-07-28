import { parseTrackMetaFromPath } from "./libraryScanner.js"

export interface RawTrackTags {
  title?: string
  artist?: string
  album?: string
  duration?: number
  mood?: string
  genre?: string
}

export interface TrackIdentity {
  title: string
  artist: string
  album: string
  duration: number
  searchQuery: string
  source: "tags" | "filename"
}

export function normalizeSearchText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase()
}

export function buildTrackSearchQuery(artist: string, title: string): string {
  const parts = [artist.trim(), title.trim()].filter(Boolean)
  return parts.join(" ")
}

export function analyzeTrackIdentity(input: {
  filePath: string
  tags?: RawTrackTags
}): TrackIdentity {
  const fromFile = parseTrackMetaFromPath(input.filePath)
  const tags = input.tags

  const hasTags = Boolean(tags?.title?.trim() || tags?.artist?.trim())
  const title = tags?.title?.trim() || fromFile.title
  const artist = tags?.artist?.trim() || fromFile.artist
  const album = tags?.album?.trim() || fromFile.album
  const duration = tags?.duration ?? fromFile.duration

  return {
    title,
    artist,
    album,
    duration,
    searchQuery: buildTrackSearchQuery(artist, title),
    source: hasTags ? "tags" : "filename",
  }
}

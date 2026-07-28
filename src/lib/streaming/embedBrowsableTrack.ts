import type { Track } from "../types.js"
import type { EmbedNowPlaying } from "./embedNowPlaying.js"
import { upscaleEmbedCoverUrl } from "./embedCoverArt.js"
import { findLikedTrackByPageUrl } from "../likesPlaylist.js"
import type { StreamingTrackInput } from "./types.js"

export function stableBrowsableExternalId(
  embed: Pick<EmbedNowPlaying, "provider" | "title" | "artist">,
): string {
  const key = `${embed.provider}|${embed.title.trim().toLowerCase()}|${embed.artist.trim().toLowerCase()}`
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (Math.imul(31, hash) + key.charCodeAt(i)) | 0
  }
  return `browse-${Math.abs(hash)}`
}

export function buildBrowsableStreamingInput(embed: EmbedNowPlaying): StreamingTrackInput {
  return {
    source: embed.provider,
    externalId: stableBrowsableExternalId(embed),
    title: embed.title,
    artist: embed.artist || "Unknown Artist",
    album: embed.album,
    duration: embed.duration,
    img: upscaleEmbedCoverUrl(embed.img),
    streamUrl: "",
    pageUrl: embed.pageUrl?.trim() ?? "",
  }
}

export function findStreamingTrackByEmbed(
  allTracks: Track[],
  embed: EmbedNowPlaying,
): Track | undefined {
  const browseId = stableBrowsableExternalId(embed)
  const byBrowse = allTracks.find(
    t => t.source === embed.provider && t.externalId === browseId,
  )
  if (byBrowse) return byBrowse

  if (embed.pageUrl?.trim()) {
    const byUrl = findLikedTrackByPageUrl(allTracks, embed.pageUrl)
    if (byUrl) return byUrl
  }

  const title = embed.title.trim().toLowerCase()
  const artist = embed.artist.trim().toLowerCase()
  if (!title) return undefined

  return allTracks.find(
    t =>
      t.source === embed.provider
      && t.title.trim().toLowerCase() === title
      && t.artist.trim().toLowerCase() === artist,
  )
}

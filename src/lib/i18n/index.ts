import { en } from "./locales/en.js"
import { ru } from "./locales/ru.js"
import type { AppLocale, MoodId, Translations } from "./types"

export type { AppLocale, MoodId, Translations }

const LOCALES: Record<AppLocale, Translations> = { en, ru }

export function isAppLocale(value: string): value is AppLocale {
  return value === "en" || value === "ru"
}

export function getTranslations(locale: AppLocale): Translations {
  return LOCALES[locale]
}

export function getMoodLabel(mood: MoodId, locale: AppLocale): string {
  return getTranslations(locale).moods[mood]
}

function ruPluralTracks(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return "трек"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "трека"
  return "треков"
}

function ruPluralPlaylists(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return "плейлист"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "плейлиста"
  return "плейлистов"
}

export function formatTracksCount(count: number, locale: AppLocale): string {
  const t = getTranslations(locale)
  const word = count === 1 ? t.playlists.trackOne : t.playlists.trackMany
  if (locale === "ru") return `${count} ${ruPluralTracks(count)}`
  return `${count} ${word}`
}

export function formatPlaylistsCount(count: number, locale: AppLocale): string {
  const t = getTranslations(locale)
  const word = count === 1 ? t.playlists.playlistOne : t.playlists.playlistMany
  if (locale === "ru") return `${count} ${ruPluralPlaylists(count)}`
  return `${count} ${word}`
}

export function formatPlaylistTracksCount(count: number, locale: AppLocale): string {
  return formatTracksCount(count, locale)
}

import { DEFAULT_SETTINGS, type AppSettings } from "./types"
import { normalizeAppTheme } from "./designTokens"

export function loadSettings(raw: string | null): AppSettings {
  if (!raw) return { ...DEFAULT_SETTINGS }
  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      theme: normalizeAppTheme(parsed.theme ?? DEFAULT_SETTINGS.theme),
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): string {
  return JSON.stringify(settings)
}

export function updateSettings(current: AppSettings, patch: Partial<AppSettings>): AppSettings {
  const next = { ...current, ...patch }
  if (patch.theme !== undefined) {
    return { ...next, theme: normalizeAppTheme(patch.theme) }
  }
  return next
}

export function validateHotkey(hotkey: string): boolean {
  const trimmed = hotkey.trim()
  if (!trimmed) return false
  if (trimmed.includes(" ")) return false

  const parts = trimmed.split("+").map(p => p.trim())
  if (parts.length === 1) {
    return /^F([1-9]|1[0-2])$/i.test(parts[0])
  }
  const validModifiers = new Set([
    "CommandOrControl",
    "Control",
    "Alt",
    "Shift",
    "Super",
    "Meta",
  ])
  const hasModifier = parts.slice(0, -1).every(p => validModifiers.has(p))
  const hasKey = parts[parts.length - 1].length >= 1
  return hasModifier && hasKey
}

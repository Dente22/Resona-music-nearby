/** Resona design tokens — CSS variables swap with light/dark theme */
export type AppTheme = "light" | "dark"

export const VW = {
  bg: "var(--vw-bg)",
  bgDeep: "var(--vw-bg-deep)",
  surface: "var(--vw-surface)",
  surfaceSolid: "var(--vw-surface-solid)",
  surfaceStrong: "var(--vw-surface-strong)",
  ink: "var(--vw-ink)",
  inkSoft: "var(--vw-ink-soft)",
  muted: "var(--vw-muted)",
  faint: "var(--vw-faint)",
  border: "var(--vw-border)",
  borderStrong: "var(--vw-border-strong)",
  accent: "var(--vw-accent)",
  accentSoft: "var(--vw-accent-soft)",
  accentStrong: "var(--vw-accent-strong)",
  sea: "var(--vw-sea)",
  seaSoft: "var(--vw-sea-soft)",
  success: "var(--vw-sea)",
  danger: "var(--vw-danger)",
  online: "var(--vw-online)",
  onlineSoft: "var(--vw-online-soft)",
  white: "var(--vw-on-accent)",
  shadow: "var(--vw-shadow)",
  overlay: "var(--vw-overlay)",
  track: "var(--vw-track)",
  navFade: "var(--vw-nav-fade)",
} as const

export function normalizeAppTheme(value: unknown): AppTheme {
  return value === "dark" ? "dark" : "light"
}

export const PLACEHOLDER_COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23D8E8E4'/%3E%3Cstop offset='1' stop-color='%23BFD8D2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='400' height='400'/%3E%3Ctext x='50%25' y='52%25' fill='%232A9D8F' font-size='56' text-anchor='middle' font-family='Syne,sans-serif'%3E♪%3C/text%3E%3C/svg%3E"

export const PLACEHOLDER_COVER_DARK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23152024'/%3E%3Cstop offset='1' stop-color='%230E181B'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='400' height='400'/%3E%3Ctext x='50%25' y='52%25' fill='%233DB8A8' font-size='56' text-anchor='middle' font-family='Syne,sans-serif'%3E♪%3C/text%3E%3C/svg%3E"

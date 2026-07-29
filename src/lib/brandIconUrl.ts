/**
 * Brand mark URL for UI <img> tags.
 * Must stay relative (./…) so Electron file:// loads resolve next to dist/index.html.
 * Absolute /icon.png breaks after install (resolves to file:///icon.png).
 */
export const BRAND_ICON_SRC = "./icon.png"

export function isPackagingSafePublicAssetPath(src: string): boolean {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return true
  if (src.startsWith("http://") || src.startsWith("https://")) return true
  // Absolute root paths break under Electron loadFile / file://
  if (src.startsWith("/") && !src.startsWith("//")) return false
  return true
}

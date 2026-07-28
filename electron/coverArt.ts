import fs from "fs"
import path from "path"
import crypto from "crypto"
import { parseFile } from "music-metadata"
import { toVioletwaveMediaUrl } from "../src/lib/audioUrl.js"

function coverFileName(filePath: string, format: string): string {
  const hash = crypto.createHash("md5").update(filePath).digest("hex").slice(0, 16)
  const ext = format.includes("png") ? "png" : "jpg"
  return `${hash}.${ext}`
}

export async function extractCoverArtUrl(filePath: string, coversDir: string): Promise<string> {
  try {
    const meta = await parseFile(filePath)
    const pic = meta.common.picture?.[0]
    if (!pic?.data?.length) return ""

    fs.mkdirSync(coversDir, { recursive: true })
    const name = coverFileName(filePath, pic.format)
    const coverPath = path.join(coversDir, name)

    if (!fs.existsSync(coverPath)) {
      fs.writeFileSync(coverPath, pic.data)
    }

    return toVioletwaveMediaUrl(coverPath)
  } catch {
    return ""
  }
}

export async function refreshCoversForPaths(
  filePaths: string[],
  coversDir: string,
): Promise<Array<{ filePath: string; img: string }>> {
  const out: Array<{ filePath: string; img: string }> = []
  for (const filePath of filePaths) {
    const img = await extractCoverArtUrl(filePath, coversDir)
    if (img) out.push({ filePath, img })
  }
  return out
}

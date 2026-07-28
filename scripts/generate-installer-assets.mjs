/**
 * Generate NSIS installer bitmaps from the Resona icon (electron-builder).
 * - installerSidebar.bmp: 164×314
 * - installerHeader.bmp: 150×57
 */
import fs from "fs"
import path from "path"
import sharp from "sharp"

const root = process.cwd()
const buildDir = path.join(root, "build")
const sources = [
  path.join(root, "assets", "resona-icon-512.png"),
  path.join(buildDir, "icon.png"),
]
const source = sources.find(p => fs.existsSync(p))
if (!source) {
  console.error("No icon source for installer bitmaps")
  process.exit(1)
}

fs.mkdirSync(buildDir, { recursive: true })

const bg = { r: 12, g: 20, b: 22, alpha: 1 }

/** Write 24-bit uncompressed BMP (BGR, bottom-up rows). */
function writeBmp(filePath, width, height, rgba) {
  const rowStride = Math.ceil((width * 3) / 4) * 4
  const pixelSize = rowStride * height
  const fileSize = 54 + pixelSize
  const buf = Buffer.alloc(fileSize)

  buf.write("BM", 0)
  buf.writeUInt32LE(fileSize, 2)
  buf.writeUInt32LE(0, 6)
  buf.writeUInt32LE(54, 10)
  buf.writeUInt32LE(40, 14)
  buf.writeInt32LE(width, 18)
  buf.writeInt32LE(height, 22)
  buf.writeUInt16LE(1, 26)
  buf.writeUInt16LE(24, 28)
  buf.writeUInt32LE(0, 30)
  buf.writeUInt32LE(pixelSize, 34)
  buf.writeInt32LE(2835, 38)
  buf.writeInt32LE(2835, 42)
  buf.writeUInt32LE(0, 46)
  buf.writeUInt32LE(0, 50)

  for (let y = 0; y < height; y++) {
    const srcY = height - 1 - y
    const destRow = 54 + y * rowStride
    for (let x = 0; x < width; x++) {
      const i = (srcY * width + x) * 4
      const o = destRow + x * 3
      buf[o] = rgba[i + 2]
      buf[o + 1] = rgba[i + 1]
      buf[o + 2] = rgba[i]
    }
  }

  fs.writeFileSync(filePath, buf)
}

async function makeSidebar() {
  const icon = await sharp(source).resize(110, 110, { fit: "contain", background: bg }).png().toBuffer()
  const { data, info } = await sharp({
    create: { width: 164, height: 314, channels: 4, background: bg },
  })
    .composite([{ input: icon, top: 72, left: 27 }])
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  writeBmp(path.join(buildDir, "installerSidebar.bmp"), info.width, info.height, data)
}

async function makeHeader() {
  const icon = await sharp(source).resize(40, 40, { fit: "contain", background: bg }).png().toBuffer()
  const { data, info } = await sharp({
    create: { width: 150, height: 57, channels: 4, background: bg },
  })
    .composite([{ input: icon, top: 8, left: 12 }])
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  writeBmp(path.join(buildDir, "installerHeader.bmp"), info.width, info.height, data)
}

await makeSidebar()
await makeHeader()
console.log("Generated build/installerSidebar.bmp and build/installerHeader.bmp")

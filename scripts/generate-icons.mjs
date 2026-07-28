import fs from "fs"
import path from "path"
import sharp from "sharp"

const root = process.cwd()
const buildDir = path.join(root, "build")
const publicDir = path.join(root, "public")
const size = 512

const sources = [
  path.join(root, "assets", "resona-icon-512.png"),
  path.join(root, "uploads", "resona-icon-512.png"),
  path.join(root, "assets", "violetwave-icon-512.png"),
  path.join(buildDir, "icon.png"),
]

fs.mkdirSync(buildDir, { recursive: true })
fs.mkdirSync(publicDir, { recursive: true })

const source = sources.find(p => fs.existsSync(p))
if (!source) {
  console.error("No icon source found. Place assets/resona-icon-512.png in the project.")
  process.exit(1)
}

const squarePng = await sharp(source)
  .resize(size, size, { fit: "cover", position: "centre" })
  .png()
  .toBuffer()

const pngOut = path.join(buildDir, "icon.png")
const publicOut = path.join(publicDir, "icon.png")
fs.writeFileSync(pngOut, squarePng)
fs.writeFileSync(publicOut, squarePng)

const pngToIco = (await import("png-to-ico")).default
const icoSizes = [16, 32, 48, 64, 128, 256]
const pngBuffers = await Promise.all(
  icoSizes.map(s =>
    sharp(squarePng)
      .resize(s, s)
      .png()
      .toBuffer(),
  ),
)

const icoBuffer = await pngToIco(pngBuffers)
fs.writeFileSync(path.join(buildDir, "icon.ico"), icoBuffer)

console.log(`Icons ready from ${source} (${size}x${size})`)
console.log("Generated build/icon.png, build/icon.ico, public/icon.png")

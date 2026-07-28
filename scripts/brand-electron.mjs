/**
 * Brand the local Electron binary so Windows Task Manager / Explorer show Resona
 * (not "Electron") during `npm run electron:dev`.
 *
 * Packaged installs are branded separately by electron-builder (signAndEditExecutable).
 */
import fs from "fs"
import path from "path"
import { createRequire } from "module"
import { pathToFileURL } from "url"
import {
  BRANDED_EXE_NAME,
  STOCK_EXE_NAME,
  BRAND_STAMP_NAME,
  buildElectronBrandOptions,
  makeBrandStamp,
  needsRebrand,
} from "./brandElectronLib.mjs"

const require = createRequire(import.meta.url)
const root = process.cwd()

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"))
}

function resolveElectronDist() {
  const electronPkg = path.dirname(require.resolve("electron/package.json"))
  return path.join(electronPkg, "dist")
}

async function main() {
  if (process.platform !== "win32") {
    console.log("brand-electron: skip (not Windows)")
    return
  }

  const pkg = readJson(path.join(root, "package.json"))
  const builder = readJson(path.join(root, "electron-builder.json"))
  const brand = buildElectronBrandOptions(pkg, builder)
  const iconPath = path.join(root, "build", brand.iconFileName)

  if (!fs.existsSync(iconPath)) {
    console.error(`brand-electron: missing ${iconPath} — run npm run icons first`)
    process.exit(1)
  }

  const dist = resolveElectronDist()
  const stockExe = path.join(dist, STOCK_EXE_NAME)
  const brandedExe = path.join(dist, BRANDED_EXE_NAME)
  const stampPath = path.join(dist, BRAND_STAMP_NAME)
  const pathTxt = path.join(path.dirname(dist), "path.txt")

  if (!fs.existsSync(stockExe)) {
    console.error(`brand-electron: missing ${stockExe}`)
    process.exit(1)
  }

  const stamp = makeBrandStamp({
    productName: brand.options["version-string"].ProductName,
    version: brand.options["file-version"],
    iconMtimeMs: fs.statSync(iconPath).mtimeMs,
  })

  const previous = fs.existsSync(stampPath) ? fs.readFileSync(stampPath, "utf8") : null
  const pathOk =
    fs.existsSync(pathTxt) &&
    fs.readFileSync(pathTxt, "utf8") === BRANDED_EXE_NAME &&
    fs.existsSync(brandedExe)

  if (!needsRebrand(previous, stamp) && pathOk) {
    console.log(`brand-electron: already branded (${BRANDED_EXE_NAME})`)
    return
  }

  try {
    fs.copyFileSync(stockExe, brandedExe)
  } catch (err) {
    console.error(
      `brand-electron: cannot copy exe (is Resona/Electron running?). Close the app and retry.\n${err}`,
    )
    process.exit(1)
  }

  const { rcedit } = await import("rcedit")
  await rcedit(brandedExe, {
    ...brand.options,
    icon: iconPath,
  })

  // electron's path.txt is joined as-is — no trailing newline or ENOENT on spawn
  fs.writeFileSync(pathTxt, BRANDED_EXE_NAME)
  fs.writeFileSync(stampPath, stamp)
  console.log(`brand-electron: ${brandedExe}`)
  console.log(`brand-electron: Task Manager should show "${brand.options["version-string"].FileDescription}"`)
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) {
  main().catch(err => {
    console.error(err)
    process.exit(1)
  })
}

export { main }

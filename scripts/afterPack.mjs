/**
 * Stamp Resona.ico onto the Windows exe without electron-builder winCodeSign
 * (winCodeSign extraction needs symlink privileges / Developer Mode on Windows).
 */
import fs from "fs"
import path from "path"
import { createRequire } from "module"

const require = createRequire(import.meta.url)

export default async function afterPack(context) {
  if (context.electronPlatformName !== "win32") return

  const exeName = `${context.packager.appInfo.productFilename}.exe`
  const exePath = path.join(context.appOutDir, exeName)
  const iconPath = path.join(context.packager.projectDir, "build", "icon.ico")

  if (!fs.existsSync(exePath)) {
    console.warn(`afterPack: missing exe ${exePath}`)
    return
  }
  if (!fs.existsSync(iconPath)) {
    console.warn(`afterPack: missing icon ${iconPath}`)
    return
  }

  const { rcedit } = require("rcedit")
  await rcedit(exePath, { icon: iconPath })
  console.log(`afterPack: set icon on ${exeName}`)
}

import { describe, it, expect } from "vitest"
import {
  BRANDED_EXE_NAME,
  buildElectronBrandOptions,
  makeBrandStamp,
  needsRebrand,
} from "../../scripts/brandElectronLib.mjs"

describe("brandElectronLib", () => {
  it("sets FileDescription to Resona for Task Manager", () => {
    const brand = buildElectronBrandOptions(
      {
        name: "resona",
        version: "1.0.0",
        author: "Resona",
        description: "Resona — music nearby",
      },
      { productName: "Resona", copyright: "Copyright © 2026 Resona" },
    )

    expect(brand.exeName).toBe(BRANDED_EXE_NAME)
    expect(brand.options["version-string"].FileDescription).toBe("Resona")
    expect(brand.options["version-string"].ProductName).toBe("Resona")
    expect(brand.options["version-string"].OriginalFilename).toBe("Resona.exe")
    expect(brand.options["file-version"]).toBe("1.0.0")
  })

  it("rebuilds when icon or version stamp changes", () => {
    const a = makeBrandStamp({ productName: "Resona", version: "1.0.0", iconMtimeMs: 1 })
    const b = makeBrandStamp({ productName: "Resona", version: "1.0.0", iconMtimeMs: 2 })
    expect(needsRebrand(a, a)).toBe(false)
    expect(needsRebrand(a, b)).toBe(true)
    expect(needsRebrand(null, a)).toBe(true)
  })
})

describe("package scripts brand electron for Windows", () => {
  it("runs brand-electron after icons and before electron:dev", async () => {
    const fs = await import("fs")
    const path = await import("path")
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"))
    expect(pkg.scripts.icons).toMatch(/brand-electron/)
    // electron:dev runs `npm run icons`, which brands the binary before launch
    expect(pkg.scripts["electron:dev"]).toMatch(/npm run icons/)
    expect(pkg.scripts.postinstall).toMatch(/brand-electron/)
    expect(pkg.devDependencies.rcedit).toBeTruthy()
  })
})

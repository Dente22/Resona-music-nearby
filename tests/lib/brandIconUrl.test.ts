import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"
import { BRAND_ICON_SRC, isPackagingSafePublicAssetPath } from "../../src/lib/brandIconUrl"

describe("brandIconUrl", () => {
  it("uses a relative icon path safe for Electron file://", () => {
    expect(BRAND_ICON_SRC.startsWith("./")).toBe(true)
    expect(BRAND_ICON_SRC).not.toMatch(/^\/[^/]/)
    expect(isPackagingSafePublicAssetPath(BRAND_ICON_SRC)).toBe(true)
  })

  it("rejects absolute public paths that break after install", () => {
    expect(isPackagingSafePublicAssetPath("/icon.png")).toBe(false)
    expect(isPackagingSafePublicAssetPath("/favicon.ico")).toBe(false)
  })

  it("ships icon.png next to the built index.html", () => {
    const distIcon = path.join(process.cwd(), "dist", "icon.png")
    const publicIcon = path.join(process.cwd(), "public", "icon.png")
    expect(fs.existsSync(publicIcon) || fs.existsSync(distIcon)).toBe(true)
  })
})

describe("UI brand icon usage", () => {
  it("Library and Discover do not hardcode /icon.png", () => {
    const files = [
      path.join(process.cwd(), "src/app/components/Library.tsx"),
      path.join(process.cwd(), "src/app/components/Discover.tsx"),
    ]
    for (const file of files) {
      const src = fs.readFileSync(file, "utf8")
      expect(src).not.toMatch(/src=["']\/icon\.png["']/)
      expect(src).toMatch(/BRAND_ICON_SRC|["']\.\/icon\.png["']/)
    }
  })

  it("index.html uses relative favicon/icon hrefs", () => {
    const html = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8")
    expect(html).not.toMatch(/href=["']\/(favicon\.ico|icon\.png)["']/)
    expect(html).toMatch(/href=["']\.\/favicon\.ico["']/)
    expect(html).toMatch(/href=["']\.\/icon\.png["']/)
  })
})

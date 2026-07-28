/** Pure helpers for branding the local Electron binary (Windows Task Manager / Explorer). */

export const BRANDED_EXE_NAME = "Resona.exe"
export const STOCK_EXE_NAME = "electron.exe"
export const BRAND_STAMP_NAME = ".resona-brand"

/**
 * @param {{ name?: string, version?: string, author?: string, description?: string }} pkg
 * @param {{ productName?: string, copyright?: string }} [builder]
 */
export function buildElectronBrandOptions(pkg, builder = {}) {
  const productName = builder.productName ?? "Resona"
  const version = pkg.version ?? "1.0.0"
  const copyright = builder.copyright ?? `Copyright © ${new Date().getFullYear()} ${productName}`
  return {
    iconFileName: "icon.ico",
    exeName: BRANDED_EXE_NAME,
    options: {
      icon: null, // filled by runner with absolute path
      "file-version": version,
      "product-version": version,
      "version-string": {
        CompanyName: typeof pkg.author === "string" ? pkg.author : productName,
        FileDescription: productName,
        ProductName: productName,
        LegalCopyright: copyright,
        InternalFilename: productName,
        OriginalFilename: BRANDED_EXE_NAME,
        Comments: pkg.description ?? productName,
      },
    },
  }
}

/**
 * @param {string | null | undefined} previousStamp
 * @param {string} nextStamp
 */
export function needsRebrand(previousStamp, nextStamp) {
  return previousStamp !== nextStamp
}

/**
 * @param {{ iconMtimeMs: number, version: string, productName: string }} input
 */
export function makeBrandStamp(input) {
  return `${input.productName}|${input.version}|${input.iconMtimeMs}`
}

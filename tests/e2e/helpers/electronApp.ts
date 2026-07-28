import path from "node:path"
import { fileURLToPath } from "node:url"
import { _electron as electron } from "@playwright/test"
import type { ElectronApplication, Page } from "@playwright/test"
import electronPath from "electron"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")

export async function launchVioletwave(): Promise<{ app: ElectronApplication; window: Page }> {
  const app = await electron.launch({
    args: [root],
    executablePath: electronPath as unknown as string,
    env: {
      ...process.env,
      VIOLETWAVE_E2E: "1",
      ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
    },
  })

  const window = await app.firstWindow({ timeout: 60_000 })
  await window.waitForLoadState("domcontentloaded")
  await window.waitForSelector('[data-testid="nav-library"]', { timeout: 45_000 })
  return { app, window }
}

export const NAV_TABS = ["nowplaying", "library", "playlists", "internet", "settings"] as const

export async function expectNavVisible(page: Page) {
  for (const tab of NAV_TABS) {
    await page.locator(`[data-testid="nav-${tab}"]`).waitFor({ state: "visible", timeout: 10_000 })
  }
}

/** Bottom nav must stay visible — black-screen bug covers the whole window. */
export async function expectNoBlackScreenOverlay(page: Page) {
  const nav = page.locator('[data-testid="nav-library"]')
  await expectNavVisible(page)
  const box = await nav.boundingBox()
  if (!box || box.width < 8 || box.height < 8) {
    throw new Error("Bottom nav has zero size — UI may be covered by black overlay")
  }
  await page.screenshot({ path: "test-results/last-ui-state.png", fullPage: true })
}

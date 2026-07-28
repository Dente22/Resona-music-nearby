import { test, expect } from "@playwright/test"

const TABS = ["nowplaying", "library", "playlists", "internet", "settings"] as const

test.describe("Violetwave web UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector('[data-testid="nav-library"]', { timeout: 30_000 })
  })

  test("loads library tab with bottom navigation", async ({ page }) => {
    await expect(page.locator('[data-testid="nav-library"]')).toBeVisible()
    await expect(page.locator('[data-testid="scan-folders"]')).toBeVisible()
  })

  test("navigates across all tabs without crash", async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", err => errors.push(err.message))

    for (const tab of TABS) {
      await page.locator(`[data-testid="nav-${tab}"]`).click()
      await expect(page.locator(`[data-testid="nav-${tab}"]`)).toBeVisible()
    }

    expect(errors).toEqual([])
  })

  test("internet tab shows embed host placeholder", async ({ page }) => {
    await page.locator('[data-testid="nav-internet"]').click()
    await expect(page.locator('[data-testid="embed-host"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-internet"]')).toBeVisible()
  })

  test("settings tab opens and closes", async ({ page }) => {
    await page.locator('[data-testid="nav-settings"]').click()
    await expect(page.locator('[data-testid="settings-hotkey"]')).toBeVisible()
    await page.locator('[data-testid="settings-close"]').click()
    await expect(page.locator('[data-testid="nav-library"]')).toBeVisible()
  })

  test("panel hide button is present in browser fallback", async ({ page }) => {
    await expect(page.locator('[data-testid="panel-hide"]')).toBeVisible()
  })
})

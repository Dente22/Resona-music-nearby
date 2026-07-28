import { test, expect } from "@playwright/test"
import {
  expectNoBlackScreenOverlay,
  launchVioletwave,
  NAV_TABS,
} from "../helpers/electronApp"

test.describe("Violetwave Electron — panel & Internet embed", () => {
  test("starts on library with visible navigation", async () => {
    const { app, window } = await launchVioletwave()
    try {
      await expectNoBlackScreenOverlay(window)
      await expect(window.locator('[data-testid="scan-folders"]')).toBeVisible()
    } finally {
      await app.close()
    }
  })

  test("internet tab keeps UI visible (no black overlay)", async () => {
    const { app, window } = await launchVioletwave()
    try {
      await window.locator('[data-testid="nav-internet"]').click()
      await expect(window.locator('[data-testid="embed-host"]')).toBeVisible({ timeout: 15_000 })
      await window.waitForTimeout(1500)
      await expectNoBlackScreenOverlay(window)
      await expect(window.locator('[data-testid="panel-hide"]')).toBeVisible()
    } finally {
      await app.close()
    }
  })

  test("tab switching does not black out the window", async () => {
    const { app, window } = await launchVioletwave()
    try {
      for (const tab of NAV_TABS) {
        await window.locator(`[data-testid="nav-${tab}"]`).click()
        await window.waitForTimeout(400)
        await expectNoBlackScreenOverlay(window)
      }
    } finally {
      await app.close()
    }
  })

  test("returns from internet to library without overlay", async () => {
    const { app, window } = await launchVioletwave()
    try {
      await window.locator('[data-testid="nav-internet"]').click()
      await expect(window.locator('[data-testid="embed-host"]')).toBeVisible()
      await window.waitForTimeout(1000)

      await window.locator('[data-testid="nav-library"]').click()
      await expect(window.locator('[data-testid="scan-folders"]')).toBeVisible()
      await expectNoBlackScreenOverlay(window)
    } finally {
      await app.close()
    }
  })

  test("spotify/yandex provider switch keeps navigation visible", async () => {
    const { app, window } = await launchVioletwave()
    try {
      await window.locator('[data-testid="nav-internet"]').click()
      await expect(window.locator('[data-testid="embed-host"]')).toBeVisible()

      const yandexBtn = window.getByRole("button", { name: /yandex|яндекс/i })
      if (await yandexBtn.count()) {
        await yandexBtn.first().click()
        await window.waitForTimeout(800)
        await expectNoBlackScreenOverlay(window)
      }
    } finally {
      await app.close()
    }
  })
})

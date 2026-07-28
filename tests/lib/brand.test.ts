import { describe, it, expect } from "vitest"
import { BRAND_APP_ID, BRAND_NAME, BRAND_TAGLINE_RU } from "@/lib/brand"

describe("brand", () => {
  it("ships Resona as the product name", () => {
    expect(BRAND_NAME).toBe("Resona")
    expect(BRAND_APP_ID).toBe("com.resona.player")
    expect(BRAND_TAGLINE_RU.length).toBeGreaterThan(0)
  })
})

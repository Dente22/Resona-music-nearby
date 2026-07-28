import { describe, it, expect } from "vitest"
import { extractConsoleMessage } from "@/lib/streaming/embedConsoleMessage"

describe("extractConsoleMessage", () => {
  it("reads deprecated string message argument", () => {
    expect(extractConsoleMessage([{}, 1, "__VW_CTX_URL__:https://example.com/track/1"])).toBe(
      "__VW_CTX_URL__:https://example.com/track/1",
    )
  })

  it("reads message from event object", () => {
    expect(
      extractConsoleMessage([{ message: "__VW_CTX_URL__:https://music.yandex.ru/track/2" }]),
    ).toBe("__VW_CTX_URL__:https://music.yandex.ru/track/2")
  })
})

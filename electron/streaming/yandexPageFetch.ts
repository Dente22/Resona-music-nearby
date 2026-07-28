import { session } from "electron"
import { getEmbedConfig } from "../../src/lib/streaming/embedConfig.js"
import {
  parseYandexTrackPageMeta,
  type YandexPageTrackMeta,
} from "../../src/lib/streaming/yandexPageMeta.js"

export async function fetchYandexTrackPageMeta(pageUrl: string): Promise<YandexPageTrackMeta | null> {
  const cfg = getEmbedConfig("yandex")
  const ses = session.fromPartition(cfg.partition)
  try {
    const res = await ses.fetch(pageUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
    })
    if (!res.ok) return null
    const html = await res.text()
    return parseYandexTrackPageMeta(html)
  } catch {
    return null
  }
}

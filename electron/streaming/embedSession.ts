import { session } from "electron"
import { getEmbedConfig, hasLoginCookies } from "../../src/lib/streaming/embedConfig.js"
import type { StreamingProvider } from "../../src/lib/streaming/types.js"

export async function getEmbedSessionStatus(provider: StreamingProvider) {
  const cfg = getEmbedConfig(provider)
  const ses = session.fromPartition(cfg.partition)
  const all = await ses.cookies.get({})
  const cookies = all.map(c => ({
    name: c.name,
    domain: c.domain ?? "",
  }))
  return {
    provider,
    loggedIn: hasLoginCookies(cookies, provider),
    url: cfg.url,
    partition: cfg.partition,
  }
}

export async function clearEmbedSession(provider: StreamingProvider) {
  const cfg = getEmbedConfig(provider)
  const ses = session.fromPartition(cfg.partition)
  await ses.clearStorageData()
  await ses.clearCache()
  return true
}

export async function getAllEmbedStatuses() {
  const spotify = await getEmbedSessionStatus("spotify")
  const yandex = await getEmbedSessionStatus("yandex")
  return { spotify, yandex }
}

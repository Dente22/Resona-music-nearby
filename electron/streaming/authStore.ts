import fs from "fs"
import path from "path"
import type { StreamingAuthState } from "../../src/lib/streaming/types.js"
import { getAppDataFile } from "../../src/lib/appDataPaths.js"

/** `appDataRoot` is the resolved Violetwave data root (project userdata/ or Electron userData). */
export function getAuthFile(appDataRoot: string) {
  return getAppDataFile(appDataRoot, "streaming-auth.json")
}

export function readStreamingAuth(appDataRoot: string): StreamingAuthState {
  const file = getAuthFile(appDataRoot)
  try {
    if (!fs.existsSync(file)) return {}
    return JSON.parse(fs.readFileSync(file, "utf-8")) as StreamingAuthState
  } catch {
    return {}
  }
}

export function writeStreamingAuth(appDataRoot: string, state: StreamingAuthState) {
  const file = getAuthFile(appDataRoot)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(state, null, 2), "utf-8")
}

export function clearProviderAuth(appDataRoot: string, provider: "spotify" | "yandex") {
  const state = readStreamingAuth(appDataRoot)
  delete state[provider]
  writeStreamingAuth(appDataRoot, state)
}

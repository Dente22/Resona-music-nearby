import { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage, ipcMain, dialog, screen, Notification, protocol, net, session } from "electron"
import path from "path"
import fs from "fs"
import { fileURLToPath, pathToFileURL } from "url"
import { getVisibleBounds, findDisplayAtPoint, resolvePanelShowDisplayId, shouldShowPanelOnStartup, type PanelEdge } from "./slidePanel.js"
import { scanMusicFolders, getHomeAndPlatform } from "./musicScan.js"
import { discoverTrackOnline, downloadFreeTrack } from "./discoveryService.js"
import { resolvePlaylistTracks, downloadPlaylistToLibrary } from "./playlistService.js"
import { analyzeTrackForImport } from "./trackMetadata.js"
import { refreshCoversForPaths } from "./coverArt.js"
import { copyTrackIntoLibrary, ensureTrackStoredInLibrary } from "./trackImport.js"
import { collectKnownSourcePaths } from "../src/lib/trackImport.js"
import { toVioletwaveMediaUrl } from "../src/lib/audioUrl.js"
import {
  resolveAppDataRoot,
  getAppDataFile,
  getAppDataJsonDir,
  getAppDataCoversDir,
  getAppDataLogFile,
  resolveMusicLibraryPath,
} from "../src/lib/appDataPaths.js"
import { BRAND_APP_ID, BRAND_NAME } from "../src/lib/brand.js"
import {
  createResonaFallbackIconSvg,
  resolveAppIconPath,
} from "./appIcon.js"
import { getTranslations, isAppLocale, type AppLocale } from "../src/lib/i18n/index.js"
import { clearEmbedSession, getAllEmbedStatuses, getEmbedSessionStatus } from "./streaming/embedSession.js"
import {
  PANEL_HIDE_WEBVIEW_MS,
} from "../src/lib/streaming/embedPanelLifecycle.js"
import { importStreamingUrl } from "./streaming/embedImport.js"
import { likeStreamingTrack, unlikeStreamingTrack } from "./streaming/embedLike.js"
import {
  embedViews,
  type EmbedLayoutRequest,
  type StreamingProvider,
} from "./embedBrowserView.js"
import {
  setWindowsAppVolume,
  startWindowsAppVolumeWatchdog,
  stopWindowsAppVolumeWatchdog,
  isWindowsAppVolumeSupported,
  resolveWinAppVolumeExe,
} from "./windowsAppVolume.js"
import {
  parseStoredEmbedPlayback,
  serializeEmbedPlayback,
} from "../src/lib/streaming/embedPlaybackStore.js"
import type { EmbedNowPlaying } from "../src/lib/streaming/embedNowPlaying.js"

protocol.registerSchemesAsPrivileged([
  {
    scheme: "violetwave-media",
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
])

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = !app.isPackaged
const APP_NAME = BRAND_NAME
const APP_ID = BRAND_APP_ID

const HOTKEY_CANDIDATES = [
  "F9",
  "CommandOrControl+Shift+Space",
  "F8",
  "CommandOrControl+Alt+M",
]

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isPanelVisible = false
let isAppQuitting = false
let panelEdge: PanelEdge = "right"
let panelWidth = 390
let activeHotkey = HOTKEY_CANDIDATES[0]
let anchorDisplayId: number | null = null
let hideToTrayTimer: ReturnType<typeof setTimeout> | null = null

function appDataRoot() {
  return resolveAppDataRoot({
    isPackaged: app.isPackaged,
    projectRoot: process.cwd(),
    electronUserData: app.getPath("userData"),
  })
}

const DATA_DIR = () => getAppDataJsonDir(appDataRoot())
const LIBRARY_FILE = () => getAppDataFile(appDataRoot(), "library.json")
const PLAYLISTS_FILE = () => getAppDataFile(appDataRoot(), "playlists.json")
const STREAMING_LIBRARY_FILE = () => getAppDataFile(appDataRoot(), "streaming-library.json")
const SETTINGS_FILE = () => getAppDataFile(appDataRoot(), "settings.json")
const EMBED_PLAYBACK_FILE = () => getAppDataFile(appDataRoot(), "embed-playback.json")
const LOG_FILE = () => getAppDataLogFile(appDataRoot())

function getDisplayAtCursor() {
  const point = screen.getCursorScreenPoint()
  const displays = screen.getAllDisplays().map(d => ({
    id: d.id,
    x: d.workArea.x,
    y: d.workArea.y,
    width: d.workArea.width,
    height: d.workArea.height,
  }))
  return findDisplayAtPoint(displays, point)
}

app.setName(APP_NAME)
if (process.platform === "win32") {
  app.setAppUserModelId(APP_ID)
}

const SETTINGS_DEFAULTS = {
  hotkey: HOTKEY_CANDIDATES[0],
  panelEdge: "right" as PanelEdge,
  panelWidth: 390,
  volume: 72,
  startMinimized: false,
  autoScanFolders: true,
  language: "ru" as AppLocale,
  musicLibraryPath: "",
}

function loadStoredSettings() {
  const stored = readJson(SETTINGS_FILE(), SETTINGS_DEFAULTS)
  const language = isAppLocale(stored.language) ? stored.language : SETTINGS_DEFAULTS.language
  return { ...SETTINGS_DEFAULTS, ...stored, language, hotkey: activeHotkey }
}

function COVERS_DIR() {
  const dir = getAppDataCoversDir(appDataRoot())
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function MUSIC_DIR() {
  const settings = readJson(SETTINGS_FILE(), SETTINGS_DEFAULTS)
  const dir = resolveMusicLibraryPath(settings.musicLibraryPath, appDataRoot())
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`
  try {
    fs.appendFileSync(LOG_FILE(), line, "utf-8")
  } catch {
    // ignore
  }
  console.log(message)
}

function ensureDirs() {
  const root = appDataRoot()
  fs.mkdirSync(root, { recursive: true })
  fs.mkdirSync(DATA_DIR(), { recursive: true })
  fs.mkdirSync(MUSIC_DIR(), { recursive: true })
  fs.mkdirSync(COVERS_DIR(), { recursive: true })
  log(`App data root: ${root}`)
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T
  } catch {
    return fallback
  }
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
}

function getIndexHtmlPath() {
  return isDev
    ? path.join(process.cwd(), "index.html")
    : path.join(app.getAppPath(), "dist", "index.html")
}

function getPreloadPath() {
  const cjs = isDev
    ? path.join(process.cwd(), "electron", "preload.cjs")
    : path.join(app.getAppPath(), "electron", "preload.cjs")
  if (fs.existsSync(cjs)) return cjs
  return isDev
    ? path.join(process.cwd(), "dist-electron", "preload.js")
    : path.join(app.getAppPath(), "dist-electron", "preload.js")
}

function getIconPath() {
  return (
    resolveAppIconPath({
      platform: process.platform,
      appPath: app.getAppPath(),
      resourcesPath: process.resourcesPath,
      cwd: process.cwd(),
    }) ?? path.join(process.cwd(), "build", process.platform === "win32" ? "icon.ico" : "icon.png")
  )
}

function loadAppIcon() {
  const iconPath = getIconPath()
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath)
  }
  return nativeImage.createFromBuffer(Buffer.from(createResonaFallbackIconSvg()))
}

function loadTrayIcon() {
  const iconPath = getIconPath()
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : nativeImage.createFromBuffer(Buffer.from(createResonaFallbackIconSvg()))
  // Multi-size .ico already contains 16/32px — resizing a full ICO blurs the tray glyph.
  if (iconPath.toLowerCase().endsWith(".ico") && !icon.isEmpty()) {
    return icon
  }
  return icon.resize({ width: 16, height: 16 })
}

function getDisplayById(id: number | null) {
  const displays = screen.getAllDisplays()
  if (id !== null) {
    const found = displays.find(d => d.id === id)
    if (found) return found
  }
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
}

function getAnchorDisplay() {
  if (mainWindow && isPanelVisible) {
    return screen.getDisplayMatching(mainWindow.getBounds())
  }
  if (anchorDisplayId !== null) {
    return getDisplayById(anchorDisplayId)
  }
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
}

function applyBounds(bounds: { x: number; y: number; width: number; height: number }) {
  mainWindow?.setBounds(bounds)
}

function createWindow() {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  anchorDisplayId = display.id
  panelWidth = readJson(SETTINGS_FILE(), { panelWidth: 390 }).panelWidth ?? 390
  panelEdge = (readJson(SETTINGS_FILE(), { panelEdge: "right" as PanelEdge }).panelEdge ?? "right") as PanelEdge

  const visible = getVisibleBounds(display.workArea, panelEdge, panelWidth)
  const appIcon = loadAppIcon()

  mainWindow = new BrowserWindow({
    width: panelWidth,
    height: visible.height,
    x: visible.x,
    y: visible.y,
    frame: false,
    transparent: false,
    backgroundColor: "#0C1416",
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    title: APP_NAME,
    icon: appIcon,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173")
  } else {
    mainWindow.loadFile(getIndexHtmlPath())
  }

  mainWindow.webContents.on("did-fail-load", (_e, code, desc, url) => {
    log(`Failed to load ${url}: ${code} ${desc}`)
  })

  mainWindow.webContents.on("did-finish-load", async () => {
    const hasBridge = await mainWindow?.webContents.executeJavaScript(
      "Boolean(window.musicPlayer && window.__VIOLETWAVE_ELECTRON__)",
    )
    log(`Preload bridge ready: ${hasBridge}`)
    if (!hasBridge) {
      log("ERROR: preload not loaded — hide/show will not work")
    }
    // Sync tray visibility after reload so React keeps the last screen/browser state.
    mainWindow?.webContents.send("panel:visibility", isPanelVisible)
  })

  mainWindow.webContents.on("before-input-event", (_event, input) => {
    if (input.type === "keyDown" && input.key === "Escape" && isPanelVisible) {
      hidePanel("escape")
    }
  })

  mainWindow.on("close", event => {
    if (isAppQuitting) return
    event.preventDefault()
    hidePanel("close")
  })

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  embedViews.setWindow(mainWindow)
  embedViews.setConsoleHandler((provider, message) => {
    mainWindow?.webContents.send("embed:console", { provider, message })
  })
}

function showPanel(source = "unknown") {
  if (!mainWindow) return

  if (hideToTrayTimer) {
    clearTimeout(hideToTrayTimer)
    hideToTrayTimer = null
  }

  const cursorDisplay = getDisplayAtCursor()
  const availableIds = screen.getAllDisplays().map(d => d.id)
  const targetId = resolvePanelShowDisplayId(anchorDisplayId, availableIds, cursorDisplay.id)
  const display = getDisplayById(targetId)
  anchorDisplayId = display.id
  const visible = getVisibleBounds(display.workArea, panelEdge, panelWidth)
  log(`Show panel (${source}) display=${display.id} x=${visible.x}`)

  applyBounds({ ...visible, height: display.workArea.height })
  mainWindow.setOpacity(1)
  if (!mainWindow.isVisible()) mainWindow.show()
  mainWindow.focus()
  isPanelVisible = true
  mainWindow.webContents.send("panel:visibility", true)
}

function hidePanel(source = "unknown") {
  if (!mainWindow || !isPanelVisible) return

  // Remember the monitor the panel is actually on (not the cursor).
  anchorDisplayId = screen.getDisplayMatching(mainWindow.getBounds()).id
  log(`Hide panel to tray (${source}) display=${anchorDisplayId}`)

  isPanelVisible = false
  // Detach BrowserView — keep webviews alive with their last page/session.
  embedViews.hide()
  mainWindow.webContents.send("panel:visibility", false)

  if (hideToTrayTimer) clearTimeout(hideToTrayTimer)
  hideToTrayTimer = setTimeout(() => {
    hideToTrayTimer = null
    if (!mainWindow || isPanelVisible) return
    // True tray hide — never slide off-screen onto another monitor.
    mainWindow.hide()
  }, PANEL_HIDE_WEBVIEW_MS)
}

function togglePanel(source = "unknown") {
  log(`Toggle panel (${source}), visible=${isPanelVisible}`)
  if (isPanelVisible) hidePanel(source)
  else showPanel(source)
}

function registerHotkey(preferred?: string): boolean {
  globalShortcut.unregisterAll()
  const candidates = preferred
    ? [preferred, ...HOTKEY_CANDIDATES.filter(h => h !== preferred)]
    : HOTKEY_CANDIDATES

  for (const hotkey of candidates) {
    if (globalShortcut.register(hotkey, () => togglePanel("hotkey"))) {
      activeHotkey = hotkey
      log(`Hotkey registered: ${hotkey}`)
      return true
    }
    log(`Hotkey failed: ${hotkey}`)
  }
  return false
}

function showStartupNotification(hotkey: string) {
  if (!Notification.isSupported()) return
  new Notification({
    title: APP_NAME,
    icon: getIconPath(),
    body: `Открыть/скрыть: ${hotkey}. Иконка в трее.`,
  }).show()
}

function createTray() {
  tray = new Tray(loadTrayIcon())
  tray.setToolTip(`${APP_NAME} (${activeHotkey})`)
  rebuildTrayMenu()
  tray.on("click", () => togglePanel("tray"))
}

function rebuildTrayMenu() {
  if (!tray) return
  const settings = loadStoredSettings()
  const t = getTranslations(settings.language)
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: t.tray.toggle, click: () => togglePanel("menu") },
      { label: t.tray.hotkey(activeHotkey), enabled: false },
      { type: "separator" },
      { label: t.tray.quit, click: () => {
        isAppQuitting = true
        app.quit()
      } },
    ]),
  )
}

function setupIpc() {
  ipcMain.handle("library:load", () => {
    const musicDir = MUSIC_DIR()
    const lib = readJson<{ tracks: Array<Record<string, unknown>> }>(LIBRARY_FILE(), { tracks: [] })
    let changed = false

    const tracks = (lib.tracks ?? []).map(track => {
      const filePath = String(track.filePath ?? "")
      const originalPath = track.originalPath ? String(track.originalPath) : undefined
      if (!filePath) return track

      try {
        const stored = ensureTrackStoredInLibrary(filePath, musicDir, originalPath)
        if (stored.filePath !== filePath || stored.originalPath !== originalPath) {
          changed = true
          return { ...track, filePath: stored.filePath, originalPath: stored.originalPath }
        }
      } catch (err) {
        log(`Library migrate failed: ${filePath} ${err}`)
      }
      return track
    })

    if (changed) {
      writeJson(LIBRARY_FILE(), { tracks })
      log("Library tracks migrated into app music folder")
    }

    return { tracks }
  })

  ipcMain.handle("library:save", (_e, data) => {
    writeJson(LIBRARY_FILE(), data)
    return true
  })

  ipcMain.handle("playlists:load", () => readJson(PLAYLISTS_FILE(), { playlists: [] }))

  ipcMain.handle("playlists:save", (_e, data) => {
    writeJson(PLAYLISTS_FILE(), data)
    return true
  })

  ipcMain.handle("settings:load", () => loadStoredSettings())

  ipcMain.handle("settings:save", (_e, settings) => {
    writeJson(SETTINGS_FILE(), settings)
    panelEdge = settings.panelEdge ?? panelEdge
    panelWidth = settings.panelWidth ?? panelWidth
    registerHotkey(settings.hotkey)
    MUSIC_DIR()
    rebuildTrayMenu()
    if (isPanelVisible && mainWindow) {
      const display = getAnchorDisplay()
      const visible = getVisibleBounds(display.workArea, panelEdge, panelWidth)
      applyBounds({ ...visible, height: display.workArea.height })
    }
    return true
  })

  ipcMain.handle("settings:get-hotkey", () => activeHotkey)

  ipcMain.handle("library:music-dir", () => MUSIC_DIR())

  ipcMain.handle("library:choose-dir", async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openDirectory", "createDirectory"],
    })
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })

  ipcMain.handle("library:scan", async () => {
    const musicDir = MUSIC_DIR()
    const lib = readJson<{ tracks: Array<{ filePath: string; originalPath?: string }> }>(
      LIBRARY_FILE(),
      { tracks: [] },
    )
    const knownPaths = collectKnownSourcePaths(lib.tracks ?? [])
    const { homeDir, platform } = getHomeAndPlatform()
    const found = scanMusicFolders(homeDir, platform, knownPaths)

    const imported: Array<{
      filePath: string
      originalPath: string
      title: string
      artist: string
      album: string
      duration: number
      img: string
      mood: string
    }> = []

    for (const meta of found) {
      try {
        const dest = copyTrackIntoLibrary(meta.filePath, musicDir)
        const analyzed = await analyzeTrackForImport(dest, COVERS_DIR())
        imported.push({
          ...analyzed,
          filePath: dest,
          originalPath: meta.filePath,
        })
      } catch (err) {
        log(`Scan copy failed: ${meta.filePath} ${err}`)
      }
    }
    log(`Scan complete: ${imported.length} new tracks copied to library folder`)
    return imported
  })

  ipcMain.handle("tracks:pick", async () => {
    const musicDir = MUSIC_DIR()
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Audio", extensions: ["mp3", "wav", "ogg", "flac", "m4a", "aac"] }],
    })
    if (result.canceled) return []

    const imported = []
    for (const src of result.filePaths) {
      const dest = copyTrackIntoLibrary(src, musicDir)
      const analyzed = await analyzeTrackForImport(dest, COVERS_DIR())
      imported.push({ ...analyzed, filePath: dest, originalPath: src })
      log(`Copied track to library: ${dest}`)
    }
    return imported
  })

  ipcMain.handle("tracks:delete-file", (_e, filePath: string) => {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle("panel:hide", () => {
    hidePanel("ipc-hide")
    return true
  })

  ipcMain.handle("panel:toggle", () => {
    togglePanel("ipc-toggle")
    return isPanelVisible
  })

  ipcMain.handle("audio:resolve-path", (_e, filePath: string) => {
    if (/^https?:\/\//i.test(filePath)) return filePath
    if (!filePath || !fs.existsSync(filePath)) {
      log(`Audio path missing: ${filePath}`)
      return ""
    }
    return toVioletwaveMediaUrl(filePath)
  })

  ipcMain.handle("streaming:embed-status", async () => getAllEmbedStatuses())

  ipcMain.handle("streaming:embed-status-one", async (_e, provider: "spotify" | "yandex") =>
    getEmbedSessionStatus(provider),
  )

  ipcMain.handle("streaming:embed-clear", async (_e, provider: "spotify" | "yandex") =>
    clearEmbedSession(provider),
  )

  ipcMain.handle("streaming:library:load", () =>
    readJson(STREAMING_LIBRARY_FILE(), { tracks: [] }),
  )

  ipcMain.handle("streaming:library:save", (_e, data) => {
    writeJson(STREAMING_LIBRARY_FILE(), data)
    return true
  })

  ipcMain.handle("embed:playback:load", () => {
    const raw = readJson<unknown>(EMBED_PLAYBACK_FILE(), null)
    if (!raw) return null
    return parseStoredEmbedPlayback(JSON.stringify(raw))
  })

  ipcMain.handle("embed:playback:save", (_e, info: EmbedNowPlaying | null) => {
    if (info?.title?.trim()) {
      writeJson(EMBED_PLAYBACK_FILE(), JSON.parse(serializeEmbedPlayback(info)))
    } else if (fs.existsSync(EMBED_PLAYBACK_FILE())) {
      fs.unlinkSync(EMBED_PLAYBACK_FILE())
    }
    return true
  })

  ipcMain.handle("streaming:import-url", async (_e, url: string) => importStreamingUrl(url))

  ipcMain.handle("streaming:like-track", async (_e, url: string) => likeStreamingTrack(url))

  ipcMain.handle("streaming:unlike-track", async (_e, url: string) => unlikeStreamingTrack(url))

  ipcMain.handle("embed:layout", (_e, request: EmbedLayoutRequest) => {
    embedViews.applyLayout(request)
    return true
  })

  ipcMain.handle("embed:execute", (_e, provider: StreamingProvider, script: string) =>
    embedViews.execute(provider, script),
  )

  ipcMain.handle("embed:set-volume", async (_e, percent: number) => {
    const system = await setWindowsAppVolume(percent)
    const result = await embedViews.setVolume(percent)
    log(
      `Volume ${percent}% → mixer=${system.ok ? "ok" : system.error ?? "n/a"} muted=${result.muted} targets=${result.targets}`,
    )
    return { ...result, system }
  })

  ipcMain.handle("volume:set-system", async (_e, percent: number) => setWindowsAppVolume(percent))

  ipcMain.handle("volume:system-supported", () => ({
    supported: isWindowsAppVolumeSupported() && Boolean(resolveWinAppVolumeExe()),
  }))

  ipcMain.handle("embed:get-url", (_e, provider: StreamingProvider) =>
    embedViews.getUrl(provider),
  )

  ipcMain.handle("embed:reload", (_e, provider: StreamingProvider) => {
    embedViews.reload(provider)
    return true
  })

  ipcMain.handle("embed:load-url", async (_e, provider: StreamingProvider, url: string) =>
    embedViews.loadUrl(provider, url),
  )

  ipcMain.handle("embed:reset", (_e, provider: StreamingProvider) => {
    embedViews.resetProvider(provider)
    return true
  })

  ipcMain.handle("tracks:refresh-covers", async (_e, filePaths: string[]) => {
    return refreshCoversForPaths(filePaths, COVERS_DIR())
  })

  ipcMain.handle(
    "discovery:search",
    async (
      _e,
      payload: { filePath?: string | null; artist?: string; title?: string },
    ) => {
      const settings = readJson(SETTINGS_FILE(), { jamendoClientId: "" })
      return discoverTrackOnline(
        payload.filePath ?? null,
        payload.artist || payload.title
          ? { artist: payload.artist ?? "", title: payload.title ?? "" }
          : null,
        settings.jamendoClientId ?? "",
      )
    },
  )

  ipcMain.handle(
    "discovery:download",
    async (
      _e,
      payload: { downloadUrl: string; title: string; artist: string },
    ) => {
      const ext = ".mp3"
      const safeBase = `${payload.artist} - ${payload.title}`.replace(/[<>:"/\\|?*]/g, "_")
      const fileName = `${Date.now()}-${safeBase}${ext}`
      const dest = await downloadFreeTrack(payload.downloadUrl, MUSIC_DIR(), fileName)
      return {
        filePath: dest,
        title: payload.title,
        artist: payload.artist,
        album: "Jamendo",
        duration: 0,
        img: "",
      }
    },
  )

  ipcMain.handle("playlist:resolve", async (_e, playlistUrl: string) => {
    const settings = readJson(SETTINGS_FILE(), { jamendoClientId: "" })
    const { parsed, tracks } = await resolvePlaylistTracks(
      playlistUrl,
      settings.jamendoClientId ?? "",
    )
    return { parsed, tracks }
  })

  ipcMain.handle("playlist:download", async (_e, tracks: Array<{
    title: string
    artist: string
    album: string
    durationSec: number
    downloadUrl: string
    imageUrl: string
    licenseUrl: string
  }>) => {
    return downloadPlaylistToLibrary(tracks, MUSIC_DIR())
  })
}

const isE2E = process.env.VIOLETWAVE_E2E === "1"

const gotLock = isE2E ? true : app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else if (!isE2E) {
  app.on("second-instance", () => {
    showPanel("second-instance")
  })
}

function registerMediaProtocol() {
  protocol.handle("violetwave-media", async request => {
    try {
      const url = new URL(request.url)
      const filePath = decodeURIComponent(url.searchParams.get("path") ?? "")
      if (!filePath || !fs.existsSync(filePath)) {
        log(`Media not found: ${filePath}`)
        return new Response("Not found", { status: 404 })
      }
      return net.fetch(pathToFileURL(filePath).href)
    } catch (err) {
      log(`Media protocol error: ${err}`)
      return new Response("Error", { status: 500 })
    }
  })
}

app.whenReady().then(async () => {
  registerMediaProtocol()
  // Dev loads Vite modules from localhost without content hashes — Chromium cache
  // can keep the old VioletWave purple UI after source changes.
  if (isDev) {
    try {
      await session.defaultSession.clearCache()
      log("Cleared Chromium HTTP cache (dev)")
    } catch (err) {
      log(`Cache clear failed: ${err}`)
    }
  }
  log(`${APP_NAME} starting`)
  ensureDirs()
  createWindow()
  createTray()
  setupIpc()

  const settings = readJson(SETTINGS_FILE(), {
    hotkey: HOTKEY_CANDIDATES[0],
    startMinimized: false,
    volume: 72,
  })

  const initialVolume = typeof settings.volume === "number" ? settings.volume : 72
  void setWindowsAppVolume(initialVolume)
  startWindowsAppVolumeWatchdog()

  const hotkeyOk = registerHotkey(settings.hotkey)
  if (!hotkeyOk) {
    log("All hotkeys failed to register")
    showStartupNotification("F9 — используйте иконку в трее")
  } else {
    showStartupNotification(activeHotkey)
  }

  rebuildTrayMenu()

  if (shouldShowPanelOnStartup({ startMinimized: Boolean(settings.startMinimized), isDev })) {
    showPanel("startup")
  } else {
    isPanelVisible = false
    log("Started minimized in system tray — press hotkey or click the tray icon")
    showStartupNotification(`${activeHotkey} или иконка в трее`)
  }
})

app.on("before-quit", () => {
  isAppQuitting = true
})

app.on("will-quit", () => {
  stopWindowsAppVolumeWatchdog()
  globalShortcut.unregisterAll()
})

app.on("window-all-closed", () => {
  // Keep running in system tray
})

export type AppLocale = "en" | "ru"

export type MoodId =
  | "sad"
  | "happy"
  | "energetic"
  | "calm"
  | "aggressive"
  | "romantic"
  | "unknown"

export interface Translations {
  app: {
    name: string
    loading: string
    hidePanel: string
    noTracksTitle: string
    noTracksArtist: string
  }
  nav: {
    now: string
    library: string
    playlists: string
    internet: string
    settings: string
  }
  library: {
    title: string
    offline: string
    online: string
    onlineBadge: string
    searchPlaceholder: string
    filterAll: string
    filterDownloaded: string
    filterRecent: string
    filterLikes: string
    noResults: string
    scanFolders: string
    addTracks: string
  }
  playlists: {
    title: string
    new: string
    newPlaylist: string
    namePlaceholder: string
    create: string
    empty: string
    emptyHint: string
    trackOne: string
    trackMany: string
    playlistOne: string
    playlistMany: string
    back: string
    addTracks: string
    addFromUrl: string
    urlPlaceholder: string
    import: string
    importErrorNotLoggedIn: string
    importErrorUnsupported: string
    importErrorNoTracks: string
    importErrorNoStream: string
    removeFromPlaylist: string
    addToPlaylist: string
    selectPlaylist: string
    mixedHint: string
    likesPlaylist: string
    noTracksInPlaylist: string
    pickTracks: string
  }
  internet: {
    title: string
    subtitle: string
    spotify: string
    yandex: string
    disconnect: string
    loggedIn: string
    loginHint: string
    reload: string
    addToPlaylist: string
    urlPlaceholder: string
    importSuccess: string
    contextHint: string
    noPlaylistsForContext: string
  }
  settings: {
    title: string
    language: string
    languageEn: string
    languageRu: string
    theme: string
    themeLight: string
    themeDark: string
    hotkey: string
    hotkeyHint: string
    panelSide: string
    panelLeft: string
    panelRight: string
    defaultVolume: (pct: number) => string
    autoScan: string
    autoScanHint: string
    libraryFolder: string
    libraryFolderLoading: string
    libraryFolderHint: string
    libraryChoose: string
    libraryReset: string
    startMinimized: string
    startMinimizedHint: string
  }
  nowPlaying: {
    offline: string
    shuffle: string
    repeat: string
    repeatOne: string
    addToPlaylist: string
  }
  moods: Record<MoodId, string>
  tray: {
    toggle: string
    hotkey: (key: string) => string
    quit: string
  }
}

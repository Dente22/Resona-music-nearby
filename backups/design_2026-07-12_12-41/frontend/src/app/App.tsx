import { useState } from "react"
import { NowPlaying } from "./components/NowPlaying"
import { Library } from "./components/Library"
import { Playlists } from "./components/Playlists"
import { BottomNav } from "./components/BottomNav"
import { MiniPlayer } from "./components/MiniPlayer"
import type { Screen } from "./components/BottomNav"
import type { Track } from "./components/MiniPlayer"
import type { Playlist } from "./components/Playlists"

const TRACKS: Track[] = [
  {
    id: "1",
    title: "Midnight Protocol",
    artist: "Synthwave Dreams",
    album: "Neon Horizons",
    duration: 247,
    downloaded: true,
    img: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=400&fit=crop&auto=format",
  },
  {
    id: "2",
    title: "Void Walker",
    artist: "Echoes of Tomorrow",
    album: "Dark Matter",
    duration: 198,
    downloaded: true,
    img: "https://images.unsplash.com/photo-1690321607729-bce901c77324?w=400&h=400&fit=crop&auto=format",
  },
  {
    id: "3",
    title: "Ultraviolet",
    artist: "Luna Collective",
    album: "Frequencies",
    duration: 312,
    downloaded: true,
    img: "https://images.unsplash.com/photo-1613327986042-63d4425a1a5d?w=400&h=400&fit=crop&auto=format",
  },
  {
    id: "4",
    title: "Ghost Signal",
    artist: "Parallax",
    album: "Ghost Signal",
    duration: 224,
    downloaded: false,
    img: "https://images.unsplash.com/photo-1567400358510-f027b3196d5b?w=400&h=400&fit=crop&auto=format",
  },
  {
    id: "5",
    title: "Neon Rain",
    artist: "Synthwave Dreams",
    album: "Neon Horizons",
    duration: 186,
    downloaded: true,
    img: "https://images.unsplash.com/photo-1634270874854-3c7492905b74?w=400&h=400&fit=crop&auto=format",
  },
  {
    id: "6",
    title: "Binary Sunset",
    artist: "Orbital Drift",
    album: "Perihelion",
    duration: 278,
    downloaded: false,
    img: "https://images.unsplash.com/photo-1706466615917-e44750d177d7?w=400&h=400&fit=crop&auto=format",
  },
  {
    id: "7",
    title: "Deep Current",
    artist: "Luna Collective",
    album: "Frequencies",
    duration: 341,
    downloaded: true,
    img: "https://images.unsplash.com/photo-1771012788591-a1c7e6763e5e?w=400&h=400&fit=crop&auto=format",
  },
  {
    id: "8",
    title: "Static Bloom",
    artist: "Parallax",
    album: "Ghost Signal",
    duration: 213,
    downloaded: true,
    img: "https://images.unsplash.com/photo-1767481626772-b5da73fd2584?w=400&h=400&fit=crop&auto=format",
  },
]

const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: "p1",
    name: "Chill Vibes",
    trackIds: ["1", "5", "7"],
    img: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=400&fit=crop&auto=format",
  },
  {
    id: "p2",
    name: "Workout Mode",
    trackIds: ["2", "3", "6", "8"],
    img: "https://images.unsplash.com/photo-1771012788591-a1c7e6763e5e?w=400&h=400&fit=crop&auto=format",
  },
  {
    id: "p3",
    name: "Late Night",
    trackIds: ["4", "7", "1"],
    img: "https://images.unsplash.com/photo-1690321607729-bce901c77324?w=400&h=400&fit=crop&auto=format",
  },
  {
    id: "p4",
    name: "Focus Flow",
    trackIds: ["3", "5"],
    img: "https://images.unsplash.com/photo-1634270874854-3c7492905b74?w=400&h=400&fit=crop&auto=format",
  },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>("nowplaying")
  const [currentTrackId, setCurrentTrackId] = useState("1")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [progress, setProgress] = useState(83)
  const [volume, setVolume] = useState(72)
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off")
  const [playlists, setPlaylists] = useState<Playlist[]>(INITIAL_PLAYLISTS)

  const currentIndex = TRACKS.findIndex(t => t.id === currentTrackId)
  const currentTrack = TRACKS[currentIndex] ?? TRACKS[0]

  const handlePrev = () => {
    const idx = (currentIndex - 1 + TRACKS.length) % TRACKS.length
    setCurrentTrackId(TRACKS[idx].id)
    setProgress(0)
  }

  const handleNext = () => {
    const idx = isShuffled
      ? Math.floor(Math.random() * TRACKS.length)
      : (currentIndex + 1) % TRACKS.length
    setCurrentTrackId(TRACKS[idx].id)
    setProgress(0)
  }

  const handleSelectTrack = (id: string) => {
    setCurrentTrackId(id)
    setIsPlaying(true)
    setProgress(0)
    setScreen("nowplaying")
  }

  const handleToggleRepeat = () => {
    setRepeatMode(r => (r === "off" ? "all" : r === "all" ? "one" : "off"))
  }

  return (
    <div
      className="flex items-center justify-center w-full min-h-screen"
      style={{
        background: "#04040A",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Mobile phone frame */}
      <div
        className="relative w-full overflow-hidden flex flex-col"
        style={{
          maxWidth: "390px",
          height: "100svh",
          maxHeight: "844px",
          background: "#09090F",
        }}
      >
        {/* Screen content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {screen === "nowplaying" && (
            <NowPlaying
              track={currentTrack}
              isPlaying={isPlaying}
              isLiked={isLiked}
              progress={progress}
              volume={volume}
              isShuffled={isShuffled}
              repeatMode={repeatMode}
              onTogglePlay={() => setIsPlaying(p => !p)}
              onPrev={handlePrev}
              onNext={handleNext}
              onProgressChange={setProgress}
              onVolumeChange={setVolume}
              onToggleLike={() => setIsLiked(l => !l)}
              onToggleShuffle={() => setIsShuffled(s => !s)}
              onToggleRepeat={handleToggleRepeat}
            />
          )}

          {screen === "library" && (
            <Library
              tracks={TRACKS}
              currentTrackId={currentTrackId}
              onSelectTrack={handleSelectTrack}
              isPlaying={isPlaying}
            />
          )}

          {screen === "playlists" && (
            <Playlists
              tracks={TRACKS}
              playlists={playlists}
              onPlaylistsChange={setPlaylists}
              onSelectTrack={handleSelectTrack}
            />
          )}
        </div>

        {/* Mini player (shown when not on Now Playing) */}
        {screen !== "nowplaying" && (
          <MiniPlayer
            track={currentTrack}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(p => !p)}
            onNext={handleNext}
            onClick={() => setScreen("nowplaying")}
          />
        )}

        {/* Bottom navigation */}
        <BottomNav current={screen} onChange={setScreen} />
      </div>
    </div>
  )
}

import { Music2, Library, ListMusic } from "lucide-react"

export type Screen = "nowplaying" | "library" | "playlists"

interface BottomNavProps {
  current: Screen
  onChange: (s: Screen) => void
}

const tabs: { id: Screen; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: "nowplaying", label: "Now Playing", Icon: Music2 },
  { id: "library", label: "Library", Icon: Library },
  { id: "playlists", label: "Playlists", Icon: ListMusic },
]

export function BottomNav({ current, onChange }: BottomNavProps) {
  return (
    <nav
      className="flex items-end justify-around px-2 pb-safe"
      style={{
        height: "72px",
        background: "linear-gradient(to top, #09090F 70%, transparent)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {tabs.map(({ id, label, Icon }) => {
        const active = current === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex flex-col items-center gap-1 pb-2 px-4 transition-all duration-200"
          >
            <div
              className="flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200"
              style={{
                background: active ? "rgba(139, 92, 246, 0.15)" : "transparent",
              }}
            >
              <Icon
                className="w-5 h-5 transition-colors duration-200"
                style={{ color: active ? "#8B5CF6" : "#4A4A68" }}
              />
            </div>
            <span
              className="text-[10px] tracking-wide transition-colors duration-200"
              style={{
                color: active ? "#8B5CF6" : "#4A4A68",
                fontWeight: active ? 600 : 400,
              }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

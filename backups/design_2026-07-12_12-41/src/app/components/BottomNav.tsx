import { Music2, Library, ListMusic, Globe, Settings as SettingsIcon } from "lucide-react"
import { useI18n } from "@/context/I18nContext"

export type Screen = "nowplaying" | "library" | "playlists" | "internet" | "settings"

interface BottomNavProps {
  current: Screen
  onChange: (s: Screen) => void
}

const tabs: { id: Screen; Icon: React.FC<{ className?: string }> }[] = [
  { id: "nowplaying", Icon: Music2 },
  { id: "library", Icon: Library },
  { id: "playlists", Icon: ListMusic },
  { id: "internet", Icon: Globe },
  { id: "settings", Icon: SettingsIcon },
]

export function BottomNav({ current, onChange }: BottomNavProps) {
  const { t } = useI18n()

  const labels: Record<Screen, string> = {
    nowplaying: t.nav.now,
    library: t.nav.library,
    playlists: t.nav.playlists,
    internet: t.nav.internet,
    settings: t.nav.settings,
  }

  return (
    <nav
      className="flex items-end justify-around px-2 pb-safe"
      style={{
        height: "72px",
        background: "linear-gradient(to top, #09090F 70%, transparent)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {tabs.map(({ id, Icon }) => {
        const active = current === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            data-testid={`nav-${id}`}
            className="flex flex-col items-center gap-1 pb-2 px-2 transition-all duration-200"
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
              {labels[id]}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

import { useEffect, useState } from "react"
import { Keyboard, PanelLeft, PanelRight, Volume2, X, FolderOpen, Languages, Sun, Moon } from "lucide-react"
import type { AppSettings } from "@/lib/types"
import type { AppLocale } from "@/lib/i18n"
import type { AppTheme } from "@/lib/designTokens"
import { validateHotkey } from "@/lib/settingsStore"
import { useI18n } from "@/context/I18nContext"
import { VW } from "@/lib/designTokens"

interface SettingsProps {
  settings: AppSettings
  onChange: (patch: Partial<AppSettings>) => void
  onClose: () => void
}

const ACCENT = VW.accent
const TEXT = VW.ink
const SUBTEXT = VW.muted
const BORDER = VW.border

export function Settings({ settings, onChange, onClose }: SettingsProps) {
  const { t } = useI18n()
  const hotkeyValid = validateHotkey(settings.hotkey)
  const [musicDir, setMusicDir] = useState("")

  useEffect(() => {
    void window.musicPlayer?.getMusicLibraryDir?.().then(dir => setMusicDir(dir ?? ""))
  }, [settings.musicLibraryPath])

  async function handleChooseLibraryDir() {
    const chosen = await window.musicPlayer?.chooseMusicLibraryDir?.()
    if (chosen) onChange({ musicLibraryPath: chosen })
  }

  function handleResetLibraryDir() {
    onChange({ musicLibraryPath: "" })
  }

  function setLanguage(language: AppLocale) {
    onChange({ language })
  }

  function setTheme(theme: AppTheme) {
    onChange({ theme })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "transparent" }}>
      <div className="px-6 pt-14 pb-4 flex items-center justify-between">
        <div>
          <p className="vw-display mb-1" style={{ color: VW.sea, fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            {t.app.name}
          </p>
          <h1 className="vw-display" style={{ color: TEXT, fontSize: "28px", fontWeight: 800, letterSpacing: "-0.04em" }}>{t.settings.title}</h1>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center"
          style={{ background: VW.surface, borderRadius: 12, border: `1px solid ${BORDER}` }}
          data-testid="settings-close"
        >
          <X className="w-4 h-4" style={{ color: SUBTEXT }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
        <section
          className="rounded-2xl p-4"
          style={{ background: VW.surface, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4" style={{ color: ACCENT }} />
            <span style={{ color: TEXT, fontSize: "14px", fontWeight: 600 }}>{t.settings.theme}</span>
          </div>
          <div className="flex gap-2">
            {([
              { id: "light" as const, label: t.settings.themeLight, Icon: Sun },
              { id: "dark" as const, label: t.settings.themeDark, Icon: Moon },
            ]).map(({ id, label, Icon }) => {
              const active = (settings.theme ?? "light") === id
              return (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className="flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  style={{
                    background: active ? VW.accentSoft : VW.bgDeep,
                    border: active ? `1px solid rgba(255,92,58,0.4)` : `1px solid ${BORDER}`,
                    color: active ? ACCENT : SUBTEXT,
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                  data-testid={`settings-theme-${id}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        <section
          className="rounded-2xl p-4"
          style={{ background: VW.surface, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Languages className="w-4 h-4" style={{ color: ACCENT }} />
            <span style={{ color: TEXT, fontSize: "14px", fontWeight: 600 }}>{t.settings.language}</span>
          </div>
          <div className="flex gap-2">
            {(["en", "ru"] as const).map(locale => (
              <button
                key={locale}
                onClick={() => setLanguage(locale)}
                className="flex-1 py-3 rounded-xl transition-all"
                style={{
                  background: settings.language === locale ? VW.accentSoft : VW.bgDeep,
                  border: settings.language === locale ? `1px solid rgba(255,92,58,0.4)` : `1px solid ${BORDER}`,
                  color: settings.language === locale ? ACCENT : SUBTEXT,
                  fontSize: "13px",
                  fontWeight: 600,
                }}
                data-testid={`settings-lang-${locale}`}
              >
                {locale === "en" ? t.settings.languageEn : t.settings.languageRu}
              </button>
            ))}
          </div>
        </section>

        <section
          className="rounded-2xl p-4"
          style={{ background: VW.surface, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Keyboard className="w-4 h-4" style={{ color: ACCENT }} />
            <span style={{ color: TEXT, fontSize: "14px", fontWeight: 600 }}>{t.settings.hotkey}</span>
          </div>
          <input
            value={settings.hotkey}
            onChange={e => onChange({ hotkey: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-transparent outline-none"
            style={{
              color: TEXT,
              border: `1px solid ${hotkeyValid ? BORDER : "rgba(239,68,68,0.5)"}`,
              fontSize: "14px",
            }}
            data-testid="settings-hotkey"
          />
          <p className="mt-2" style={{ color: SUBTEXT, fontSize: "12px" }}>
            {t.settings.hotkeyHint}
          </p>
        </section>

        <section
          className="rounded-2xl p-4"
          style={{ background: VW.surface, border: `1px solid ${BORDER}` }}
        >
          <span style={{ color: TEXT, fontSize: "14px", fontWeight: 600 }}>{t.settings.panelSide}</span>
          <div className="flex gap-2 mt-3">
            {(["left", "right"] as const).map(edge => (
              <button
                key={edge}
                onClick={() => onChange({ panelEdge: edge })}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
                style={{
                  background: settings.panelEdge === edge ? VW.accentSoft : VW.bgDeep,
                  border: settings.panelEdge === edge ? `1px solid rgba(255,92,58,0.4)` : `1px solid ${BORDER}`,
                  color: settings.panelEdge === edge ? ACCENT : SUBTEXT,
                }}
                data-testid={`settings-edge-${edge}`}
              >
                {edge === "left" ? <PanelLeft className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
                <span className="text-sm">
                  {edge === "left" ? t.settings.panelLeft : t.settings.panelRight}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section
          className="rounded-2xl p-4"
          style={{ background: VW.surface, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="w-4 h-4" style={{ color: ACCENT }} />
            <span style={{ color: TEXT, fontSize: "14px", fontWeight: 600 }}>
              {t.settings.defaultVolume(settings.volume)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.volume}
            onChange={e => onChange({ volume: Number(e.target.value) })}
            className="w-full"
            style={{ accentColor: ACCENT }}
            data-testid="settings-volume"
          />
        </section>

        <section
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{ background: VW.surface, border: `1px solid ${BORDER}` }}
        >
          <div>
            <p style={{ color: TEXT, fontSize: "14px", fontWeight: 600 }}>{t.settings.autoScan}</p>
            <p style={{ color: SUBTEXT, fontSize: "12px" }}>{t.settings.autoScanHint}</p>
          </div>
          <button
            onClick={() => onChange({ autoScanFolders: !settings.autoScanFolders })}
            className="w-12 h-7 rounded-full relative transition-colors"
            style={{
              background: settings.autoScanFolders ? ACCENT : "rgba(20,43,47,0.1)",
            }}
            data-testid="settings-auto-scan"
          >
            <span
              className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all"
              style={{ left: settings.autoScanFolders ? "26px" : "4px" }}
            />
          </button>
        </section>

        <section
          className="rounded-2xl p-4"
          style={{ background: VW.surface, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="w-4 h-4" style={{ color: ACCENT }} />
            <span style={{ color: TEXT, fontSize: "14px", fontWeight: 600 }}>{t.settings.libraryFolder}</span>
          </div>
          <p
            style={{ color: SUBTEXT, fontSize: "11px", lineHeight: 1.5, wordBreak: "break-all" }}
            data-testid="settings-library-path"
          >
            {musicDir || t.settings.libraryFolderLoading}
          </p>
          <p className="mt-2" style={{ color: SUBTEXT, fontSize: "12px" }}>
            {t.settings.libraryFolderHint}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => void handleChooseLibraryDir()}
              className="flex-1 py-2.5 rounded-xl"
              style={{ background: VW.accentSoft, color: ACCENT, fontSize: "12px", fontWeight: 600 }}
              data-testid="settings-library-choose"
            >
              {t.settings.libraryChoose}
            </button>
            <button
              onClick={handleResetLibraryDir}
              className="flex-1 py-2.5 rounded-xl"
              style={{ background: VW.surface, color: SUBTEXT, fontSize: "12px", fontWeight: 600 }}
              data-testid="settings-library-reset"
            >
              {t.settings.libraryReset}
            </button>
          </div>
        </section>

        <section
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{ background: VW.surface, border: `1px solid ${BORDER}` }}
        >
          <div>
            <p style={{ color: TEXT, fontSize: "14px", fontWeight: 600 }}>{t.settings.startMinimized}</p>
            <p style={{ color: SUBTEXT, fontSize: "12px" }}>{t.settings.startMinimizedHint}</p>
          </div>
          <button
            onClick={() => onChange({ startMinimized: !settings.startMinimized })}
            className="w-12 h-7 rounded-full relative transition-colors"
            style={{
              background: settings.startMinimized ? ACCENT : "rgba(20,43,47,0.1)",
            }}
            data-testid="settings-start-minimized"
          >
            <span
              className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all"
              style={{ left: settings.startMinimized ? "26px" : "4px" }}
            />
          </button>
        </section>
      </div>
    </div>
  )
}

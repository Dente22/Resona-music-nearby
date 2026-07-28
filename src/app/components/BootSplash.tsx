import { ResonaMark } from "./ResonaMark"
import { BRAND_NAME } from "@/lib/brand"
import { VW } from "@/lib/designTokens"

interface BootSplashProps {
  loadingLabel: string
  tagline?: string
  theme?: "light" | "dark"
}

/** Launch splash: brand-first mark + name + soft motion. */
export function BootSplash({ loadingLabel, tagline, theme = "light" }: BootSplashProps) {
  return (
    <div
      className="vw-shell resona-splash relative flex flex-col items-center justify-center w-full h-full overflow-hidden"
      data-theme={theme === "dark" ? "dark" : "light"}
      data-testid="boot-splash"
    >
      <div className="vw-wave" aria-hidden />
      <div className="resona-splash-glow" aria-hidden />

      <div className="resona-splash-mark relative z-10 flex items-center justify-center w-[88px] h-[88px] vw-glass" style={{ borderRadius: 28 }}>
        <ResonaMark size={52} animated />
      </div>

      <h1
        className="vw-display resona-splash-title relative z-10 mt-5"
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: VW.ink,
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        {BRAND_NAME}
      </h1>

      {tagline ? (
        <p className="resona-splash-tag relative z-10 mt-2" style={{ fontSize: 13, color: VW.muted }}>
          {tagline}
        </p>
      ) : null}

      <div className="resona-splash-bars relative z-10 mt-6 flex items-end gap-1.5" aria-hidden>
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <p className="resona-splash-load relative z-10 mt-4" style={{ fontSize: 12, color: VW.faint }}>
        {loadingLabel}
      </p>
    </div>
  )
}

import { VW } from "@/lib/designTokens"

interface ResonaMarkProps {
  size?: number
  className?: string
  animated?: boolean
}

/** Resonance mark: play wedge + expanding arcs (coral → teal). */
export function ResonaMark({ size = 64, className, animated = false }: ResonaMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="resonaArc" x1="18" y1="12" x2="56" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor={VW.accent} />
          <stop offset="1" stopColor={VW.sea} />
        </linearGradient>
      </defs>
      <path
        className={animated ? "resona-arc resona-arc-1" : undefined}
        d="M34 16c8.5 4.2 14 12.4 14 16s-5.5 11.8-14 16"
        stroke="url(#resonaArc)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        className={animated ? "resona-arc resona-arc-2" : undefined}
        d="M40 10c11.2 5.6 18.5 15.8 18.5 22S51.2 48.4 40 54"
        stroke="url(#resonaArc)"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        className={animated ? "resona-arc resona-arc-3" : undefined}
        d="M46 5c13.5 6.8 22.5 18.5 22.5 27S59.5 52.2 46 59"
        stroke="url(#resonaArc)"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        className={animated ? "resona-play" : undefined}
        d="M14 18.5v27L36 32 14 18.5Z"
        fill={VW.accent}
      />
    </svg>
  )
}

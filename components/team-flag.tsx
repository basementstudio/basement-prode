import { FlagStripes } from '@/components/flag-stripes'
import { getTeamFlagUrl } from '@/lib/wc2026/flag-codes'

interface TeamFlagProps {
  code: string
  /** Colores de franjas como respaldo si no hay bandera en el CDN */
  fallbackColors: string
  className?: string
}

export function TeamFlag({ code, fallbackColors, className = '' }: TeamFlagProps) {
  const src = getTeamFlagUrl(code)

  if (!src) {
    return <FlagStripes colors={fallbackColors} className={className} />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={28}
      height={20}
      className={`team-flag ${className}`.trim()}
      loading="lazy"
      decoding="async"
    />
  )
}

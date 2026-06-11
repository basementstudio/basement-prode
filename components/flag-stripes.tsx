interface FlagStripesProps {
  colors: string // 'color1,color2,color3'
  className?: string
}

export function FlagStripes({ colors, className = '' }: FlagStripesProps) {
  const stripes = colors.split(',').map(c => c.trim()).filter(Boolean)
  return (
    <div className={`flag-stripes ${className}`} aria-hidden="true">
      {stripes.map((color, i) => (
        <div key={i} className="flag-stripe" style={{ background: color }} />
      ))}
    </div>
  )
}

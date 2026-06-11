interface FlagStripesProps {
  colors: string // 'color1,color2,color3'
  className?: string
}

export function FlagStripes({ colors, className = '' }: FlagStripesProps) {
  const stripes = colors.split(',').map(c => c.trim()).filter(Boolean)
  return (
    <div
      className={`flag-stripes ${className}`}
      aria-hidden="true"
      style={{ display: 'flex', flexDirection: 'column', width: '28px', height: '20px', overflow: 'hidden', flexShrink: 0 }}
    >
      {stripes.map((color, i) => (
        <div
          key={i}
          style={{ flex: 1, background: color }}
        />
      ))}
    </div>
  )
}

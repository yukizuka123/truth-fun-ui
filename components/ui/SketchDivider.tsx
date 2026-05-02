'use client'

interface SketchDividerProps {
  inverted?: boolean
  className?: string
}

export function SketchDivider({ inverted = false, className = '' }: SketchDividerProps) {
  return (
    <svg
      className={`sketch-border-heavy w-full h-12 ${className}`}
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      style={{ transform: inverted ? 'scaleY(-1)' : 'scaleY(1)' }}
    >
      <path d="M0,30 Q360,10 720,30 T1440,30" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      <path d="M0,35 Q360,50 720,35 T1440,35" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" strokeDasharray="5,5" />
    </svg>
  )
}

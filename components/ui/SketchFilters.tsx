export function SketchFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute', visibility: 'hidden' }}>
      <defs>
        {/* Optimized sketchy filter - reduced complexity for better performance */}
        <filter id="sketchy">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves="2"
            result="noise"
            seed="2"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Stronger sketchy for hover states */}
        <filter id="sketchy-heavy">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.025"
            numOctaves="2"
            result="noise"
            seed="5"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Pencil sketch effect - minimal */}
        <filter id="pencil">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.3"
            numOctaves="1"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

import { useMemo } from 'react'

// SVG Avatar Component - Minimalist but with strong identity
// Theme: Protest, Activism, Solidarity

const ProtestAvatar = ({ config, size = 60 }) => {
  const {
    base = 'face',
    eyes = 'determined',
    mouth = 'shouting',
    accessory = 'none',
    bgColor = '#3B82F6',
    skinTone = 'tone3'
  } = config || {}

  const skinTones = {
    tone1: '#FFDAB9',
    tone2: '#E8B98A',
    tone3: '#C68642',
    tone4: '#8D5524',
    tone5: '#5C4033'
  }

  const skinColor = skinTones[skinTone] || skinTones.tone3

  // Eyes library
  const eyesPath = useMemo(() => {
    const eyeLibrary = {
      determined: (
        <>
          <ellipse cx="35" cy="42" rx="4" ry="5" fill="#1a1a1a" />
          <ellipse cx="65" cy="42" rx="4" ry="5" fill="#1a1a1a" />
          <path d="M 28 36 L 42 36" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 58 36 L 72 36" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ),
      hopeful: (
        <>
          <circle cx="35" cy="42" r="5" fill="#1a1a1a" />
          <circle cx="65" cy="42" r="5" fill="#1a1a1a" />
          <circle cx="37" cy="40" r="2" fill="#ffffff" />
          <circle cx="67" cy="40" r="2" fill="#ffffff" />
        </>
      ),
      angry: (
        <>
          <ellipse cx="35" cy="44" rx="4" ry="4" fill="#1a1a1a" />
          <ellipse cx="65" cy="44" rx="4" ry="4" fill="#1a1a1a" />
          <path d="M 42 38 L 30 42" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 58 38 L 70 42" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ),
      compassionate: (
        <>
          <path d="M 30 42 Q 35 38 40 42" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 60 42 Q 65 38 70 42" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="35" cy="43" r="3" fill="#1a1a1a" />
          <circle cx="65" cy="43" r="3" fill="#1a1a1a" />
        </>
      ),
      closed: (
        <>
          <path d="M 28 42 L 42 42" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 58 42 L 72 42" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ),
      starry: (
        <>
          <path d="M 35 36 L 37 42 L 33 42 Z M 35 42 L 31 45 L 39 45 Z" fill="#1a1a1a" />
          <path d="M 65 36 L 67 42 L 63 42 Z M 65 42 L 61 45 L 69 45 Z" fill="#1a1a1a" />
        </>
      )
    }
    return eyeLibrary[eyes] || eyeLibrary.determined
  }, [eyes])

  // Mouth library
  const mouthPath = useMemo(() => {
    const mouthLibrary = {
      shouting: (
        <>
          <ellipse cx="50" cy="68" rx="12" ry="15" fill="#1a1a1a" />
          <path d="M 42 62 Q 50 58 58 62" stroke="#1a1a1a" strokeWidth="2" fill="none" />
        </>
      ),
      smile: (
        <path d="M 38 62 Q 50 70 62 62" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
      ),
      serious: (
        <line x1="38" y1="65" x2="62" y2="65" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
      ),
      whistling: (
        <>
          <circle cx="50" cy="65" r="5" fill="none" stroke="#1a1a1a" strokeWidth="2.5" />
          <path d="M 56 60 Q 62 58 66 60" stroke="#1a1a1a" strokeWidth="1.5" fill="none" />
        </>
      ),
      singing: (
        <>
          <ellipse cx="50" cy="65" rx="8" ry="10" fill="#1a1a1a" />
          <path d="M 65 55 L 65 62 M 68 52 L 68 59" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
        </>
      ),
      silent: (
        <path d="M 40 64 L 60 64" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
      )
    }
    return mouthLibrary[mouth] || mouthLibrary.shouting
  }, [mouth])

  // Accessory library
  const accessoryPath = useMemo(() => {
    const accessoryLibrary = {
      none: null,
      bandana: (
        <>
          <path d="M 15 25 Q 50 10 85 25 L 85 35 Q 50 20 15 35 Z" fill="#DC2626" />
          <circle cx="25" cy="28" r="2" fill="#ffffff" />
          <circle cx="35" cy="24" r="2" fill="#ffffff" />
          <circle cx="65" cy="24" r="2" fill="#ffffff" />
          <circle cx="75" cy="28" r="2" fill="#ffffff" />
        </>
      ),
      cap: (
        <>
          <ellipse cx="50" cy="20" rx="38" ry="8" fill="#1a1a1a" />
          <path d="M 12 20 Q 50 5 88 20 L 85 28 Q 50 15 15 28 Z" fill="#1a1a1a" />
          <ellipse cx="70" cy="22" rx="12" ry="4" fill="none" stroke={bgColor} strokeWidth="1.5" />
        </>
      ),
      flowers: (
        <>
          <circle cx="20" cy="22" r="5" fill="#EC4899" />
          <circle cx="28" cy="18" r="4" fill="#F59E0B" />
          <circle cx="72" cy="18" r="4" fill="#F59E0B" />
          <circle cx="80" cy="22" r="5" fill="#EC4899" />
          <circle cx="22" cy="20" r="2" fill="#FEF08A" />
          <circle cx="78" cy="20" r="2" fill="#FEF08A" />
        </>
      ),
      megaphone: (
        <>
          <g transform="translate(75, 45)">
            <path d="M 0 0 L 15 -8 L 15 8 Z" fill="#EF4444" />
            <rect x="15" y="-6" width="8" height="12" fill="#DC2626" />
            <path d="M 0 0 L -5 -2 L -5 2 Z" fill="#1a1a1a" />
          </g>
        </>
      ),
      sign: (
        <>
          <g transform="translate(70, 35)">
            <rect x="0" y="0" width="20" height="15" fill="#ffffff" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="3" y1="4" x2="17" y2="4" stroke={bgColor} strokeWidth="2" />
            <line x1="3" y1="8" x2="17" y2="8" stroke={bgColor} strokeWidth="2" />
            <line x1="3" y1="12" x2="14" y2="12" stroke={bgColor} strokeWidth="2" />
            <line x1="10" y1="15" x2="10" y2="30" stroke="#8B4513" strokeWidth="2" />
          </g>
        </>
      )
    }
    return accessoryLibrary[accessory]
  }, [accessory, bgColor])

  // Render FACE base
  if (base === 'face') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ display: 'block' }}
      >
        {/* Background circle */}
        <circle cx="50" cy="50" r="48" fill={bgColor} />

        {/* Face base */}
        <circle cx="50" cy="50" r="35" fill={skinColor} />

        {/* Eyes */}
        <g>{eyesPath}</g>

        {/* Mouth */}
        <g>{mouthPath}</g>

        {/* Accessory (on top) */}
        {accessoryPath && <g>{accessoryPath}</g>}
      </svg>
    )
  }

  // Render FIST base
  if (base === 'fist') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ display: 'block' }}
      >
        {/* Background circle */}
        <circle cx="50" cy="50" r="48" fill={bgColor} />

        {/* Fist */}
        <g transform="translate(50, 50)">
          {/* Palm */}
          <ellipse cx="0" cy="5" rx="18" ry="22" fill={skinColor} />

          {/* Thumb */}
          <ellipse cx="-16" cy="8" rx="6" ry="12" fill={skinColor} transform="rotate(-25, -16, 8)" />

          {/* Fingers */}
          <rect x="-12" y="-18" width="7" height="20" rx="3" fill={skinColor} />
          <rect x="-4" y="-22" width="7" height="24" rx="3" fill={skinColor} />
          <rect x="4" y="-20" width="7" height="22" rx="3" fill={skinColor} />
          <rect x="12" y="-16" width="6" height="18" rx="3" fill={skinColor} />

          {/* Wrist */}
          <rect x="-14" y="24" width="28" height="8" fill={skinColor} />

          {/* Knuckle details */}
          <line x1="-9" y1="-2" x2="-9" y2="2" stroke="#00000022" strokeWidth="1" />
          <line x1="-1" y1="-4" x2="-1" y2="0" stroke="#00000022" strokeWidth="1" />
          <line x1="7" y1="-3" x2="7" y2="1" stroke="#00000022" strokeWidth="1" />
        </g>

        {/* Accessory (e.g., bracelet for fist) */}
        {accessory === 'bandana' && (
          <rect x="32" y="74" width="36" height="6" fill="#DC2626" rx="3" />
        )}
      </svg>
    )
  }

  return null
}

export default ProtestAvatar

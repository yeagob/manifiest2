import { useMemo } from 'react'

// SVG Avatar Component - Renders customizable protest avatars
function AvatarSVG({ config = {}, size = 120 }) {
  const {
    base = 'face',
    eyes = 'determined',
    mouth = 'shouting',
    accessory = 'none',
    bgColor = '#3B82F6',
    skinTone = 'tone3'
  } = config

  // Skin tone colors
  const skinTones = {
    tone1: '#FFE0BD',
    tone2: '#FFCD94',
    tone3: '#E0AC69',
    tone4: '#C68642',
    tone5: '#8D5524'
  }

  const skinColor = skinTones[skinTone] || skinTones.tone3

  // Eye components
  const eyeComponents = {
    determined: (
      <g>
        <ellipse cx="35" cy="45" rx="6" ry="8" fill="#1F2937" />
        <ellipse cx="65" cy="45" rx="6" ry="8" fill="#1F2937" />
        <line x1="30" y1="38" x2="40" y2="40" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
        <line x1="60" y1="40" x2="70" y2="38" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    hopeful: (
      <g>
        <circle cx="35" cy="45" r="7" fill="#1F2937" />
        <circle cx="65" cy="45" r="7" fill="#1F2937" />
        <circle cx="37" cy="43" r="2" fill="#FFFFFF" />
        <circle cx="67" cy="43" r="2" fill="#FFFFFF" />
      </g>
    ),
    angry: (
      <g>
        <ellipse cx="35" cy="48" rx="5" ry="7" fill="#1F2937" />
        <ellipse cx="65" cy="48" rx="5" ry="7" fill="#1F2937" />
        <line x1="28" y1="40" x2="42" y2="44" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
        <line x1="72" y1="40" x2="58" y2="44" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
      </g>
    ),
    compassionate: (
      <g>
        <path d="M 30 48 Q 35 42 40 48" stroke="#1F2937" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M 60 48 Q 65 42 70 48" stroke="#1F2937" fill="none" strokeWidth="2" strokeLinecap="round" />
        <circle cx="35" cy="46" r="2" fill="#1F2937" />
        <circle cx="65" cy="46" r="2" fill="#1F2937" />
      </g>
    ),
    closed: (
      <g>
        <line x1="28" y1="45" x2="42" y2="45" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
        <line x1="58" y1="45" x2="72" y2="45" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
      </g>
    ),
    star: (
      <g>
        <path d="M 35 40 L 37 46 L 43 46 L 38 50 L 40 56 L 35 52 L 30 56 L 32 50 L 27 46 L 33 46 Z" fill="#F59E0B" />
        <path d="M 65 40 L 67 46 L 73 46 L 68 50 L 70 56 L 65 52 L 60 56 L 62 50 L 57 46 L 63 46 Z" fill="#F59E0B" />
      </g>
    )
  }

  // Mouth components
  const mouthComponents = {
    shouting: (
      <g>
        <ellipse cx="50" cy="70" rx="12" ry="15" fill="#1F2937" />
        <ellipse cx="50" cy="68" rx="8" ry="10" fill="#DC2626" />
      </g>
    ),
    smile: (
      <path d="M 35 65 Q 50 78 65 65" stroke="#1F2937" fill="none" strokeWidth="3" strokeLinecap="round" />
    ),
    serious: (
      <line x1="38" y1="70" x2="62" y2="70" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
    ),
    whistle: (
      <g>
        <circle cx="45" cy="68" r="4" fill="#1F2937" />
        <path d="M 49 68 Q 55 65 60 68" stroke="#1F2937" fill="none" strokeWidth="2" />
        <path d="M 49 68 Q 55 71 60 68" stroke="#1F2937" fill="none" strokeWidth="2" />
      </g>
    ),
    singing: (
      <g>
        <ellipse cx="50" cy="70" rx="10" ry="8" fill="#1F2937" />
        <path d="M 42 68 Q 50 72 58 68" stroke="#FFFFFF" fill="none" strokeWidth="2" />
        <circle cx="65" cy="60" r="3" fill="#F59E0B" />
        <circle cx="70" cy="55" r="4" fill="#F59E0B" />
      </g>
    ),
    silent: (
      <rect x="42" y="67" width="16" height="4" rx="2" fill="#1F2937" />
    )
  }

  // Accessory components
  const accessoryComponents = {
    none: null,
    bandana: (
      <g>
        <path d="M 15 25 Q 50 15 85 25 L 85 35 Q 50 25 15 35 Z" fill="#DC2626" />
        <circle cx="25" cy="28" r="2" fill="#FFFFFF" />
        <circle cx="35" cy="26" r="2" fill="#FFFFFF" />
        <circle cx="45" cy="25" r="2" fill="#FFFFFF" />
        <circle cx="55" cy="25" r="2" fill="#FFFFFF" />
        <circle cx="65" cy="26" r="2" fill="#FFFFFF" />
        <circle cx="75" cy="28" r="2" fill="#FFFFFF" />
      </g>
    ),
    cap: (
      <g>
        <ellipse cx="50" cy="20" rx="35" ry="8" fill="#1F2937" />
        <path d="M 20 20 Q 50 10 80 20 L 75 28 Q 50 18 25 28 Z" fill="#1F2937" />
        <circle cx="50" cy="15" r="3" fill={bgColor} />
      </g>
    ),
    flowers: (
      <g>
        <circle cx="20" cy="25" r="5" fill="#EC4899" />
        <circle cx="28" cy="22" r="4" fill="#F59E0B" />
        <circle cx="72" cy="22" r="4" fill="#8B5CF6" />
        <circle cx="80" cy="25" r="5" fill="#10B981" />
        <circle cx="22" cy="24" r="2" fill="#FDE047" />
        <circle cx="78" cy="24" r="2" fill="#FDE047" />
      </g>
    ),
    megaphone: (
      <g>
        <path d="M 85 45 L 100 35 L 100 55 Z" fill="#DC2626" />
        <rect x="80" y="42" width="8" height="6" fill="#1F2937" />
        <path d="M 100 35 Q 105 40 105 45 Q 105 50 100 55" stroke="#DC2626" strokeWidth="1" fill="none" />
      </g>
    ),
    sign: (
      <g>
        <rect x="75" y="15" width="20" height="15" rx="2" fill="#FFFFFF" stroke="#1F2937" strokeWidth="2" />
        <line x1="85" y1="30" x2="85" y2="50" stroke="#8B5524" strokeWidth="3" />
        <text x="85" y="25" fontSize="10" fill="#DC2626" textAnchor="middle" fontWeight="bold">✊</text>
      </g>
    )
  }

  // Render face or fist base
  const renderBase = useMemo(() => {
    if (base === 'fist') {
      return (
        <g>
          {/* Fist/Hand base */}
          <ellipse cx="50" cy="65" rx="28" ry="35" fill={skinColor} />
          {/* Thumb */}
          <ellipse cx="25" cy="60" rx="10" ry="15" fill={skinColor} transform="rotate(-30 25 60)" />
          {/* Knuckles */}
          <line x1="35" y1="45" x2="35" y2="55" stroke="#00000020" strokeWidth="2" />
          <line x1="45" y1="42" x2="45" y2="52" stroke="#00000020" strokeWidth="2" />
          <line x1="55" y1="42" x2="55" y2="52" stroke="#00000020" strokeWidth="2" />
          <line x1="65" y1="45" x2="65" y2="55" stroke="#00000020" strokeWidth="2" />
          {/* Power lines */}
          <path d="M 20 70 Q 15 75 20 80" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M 25 75 Q 20 80 25 85" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.6" />
        </g>
      )
    }

    return (
      <g>
        {/* Face base */}
        <circle cx="50" cy="50" r="40" fill={skinColor} />
        {/* Eyes */}
        {eyeComponents[eyes] || eyeComponents.determined}
        {/* Mouth */}
        {mouthComponents[mouth] || mouthComponents.shouting}
      </g>
    )
  }, [base, eyes, mouth, skinColor])

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ overflow: 'visible' }}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill={bgColor} />

      {/* Base (face or fist) */}
      {renderBase}

      {/* Accessory overlay */}
      {accessoryComponents[accessory]}
    </svg>
  )
}

export default AvatarSVG

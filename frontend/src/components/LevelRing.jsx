// Anillo de progreso de nivel (XP). SVG puro, animado con CSS.
function LevelRing({ progreso, nivel, icono, size = 120 }) {
  const r = (size - 14) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.max(0, Math.min(1, progreso)))
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--m2-linea)" strokeWidth="10" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#gradNivel)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)' }}
        />
        <defs>
          <linearGradient id="gradNivel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--m2-amarillo)" />
            <stop offset="100%" stopColor="var(--m2-rojo)" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0,
      }}>
        <span style={{ fontSize: size * 0.28 }}>{icono}</span>
        <span className="m2-nivel-num">NV {nivel}</span>
      </div>
    </div>
  )
}

export default LevelRing

import { useId } from 'react'
import { PALETTE_OVERRIDES, RISO_INKS, hashString } from '@manifiest/shared'

const INK = RISO_INKS.ink
const PAPER = RISO_INKS.paper
const KRAFT = '#C9A26B'
const SLOGANS = ['¡YA!', 'NO', '¡BASTA!', 'SÍ SE PUEDE', 'AQUÍ', 'JUNTAS', 'AHORA', '¡FUERA!']

const BODIES = {
  round: 'M34 138 Q30 96 60 82 Q90 96 86 138 Z',
  tall: 'M40 138 L42 92 Q60 80 78 92 L80 138 Z',
  square: 'M36 138 L36 92 Q36 84 44 84 L76 84 Q84 84 84 92 L84 138 Z',
  pear: 'M32 138 Q34 110 46 90 Q60 80 74 90 Q86 110 88 138 Z'
}

function Pattern({ kind, primary, secondary, id }) {
  switch (kind) {
    case 'dots':
      return <g fill={secondary} opacity=".55">{Array.from({ length: 30 }, (_, i) => <circle key={i} cx={32 + (i % 6) * 11 + (Math.floor(i / 6) % 2) * 5} cy={88 + Math.floor(i / 6) * 11} r="2.4" />)}</g>
    case 'stripes':
      return <g stroke={secondary} strokeWidth="4" opacity=".5">{Array.from({ length: 7 }, (_, i) => <line key={i} x1="28" x2="92" y1={90 + i * 8} y2={90 + i * 8} />)}</g>
    case 'halftone':
      return <g fill={secondary} opacity=".6">{Array.from({ length: 42 }, (_, i) => <circle key={i} cx={30 + (i % 7) * 10} cy={86 + Math.floor(i / 7) * 9} r={0.6 + Math.floor(i / 7) * 0.55} />)}</g>
    case 'checks':
      return <g fill={secondary} opacity=".35">{Array.from({ length: 36 }, (_, i) => ((i + Math.floor(i / 6)) % 2 ? <rect key={i} x={30 + (i % 6) * 10} y={84 + Math.floor(i / 6) * 10} width="10" height="10" /> : null))}</g>
    case 'holo':
      return <rect x="20" y="78" width="80" height="64" fill={`url(#${id}-holo)`} opacity=".75" />
    case 'stars':
      return <g fill={RISO_INKS.yellow} stroke={INK} strokeWidth=".8">{[[44, 98], [70, 94], [56, 116], [78, 122], [40, 126]].map(([x, y], i) => <path key={i} d={star(x, y, 5, 2.2)} />)}</g>
    case 'flames':
      return <path d="M28 138 Q34 118 40 130 Q44 112 52 128 Q58 108 64 128 Q70 112 76 130 Q82 116 92 138 Z" fill={RISO_INKS.orange} opacity=".85" />
    case 'waves':
      return <g fill="none" stroke={secondary} strokeWidth="3" opacity=".6">{[96, 108, 120, 132].map(y => <path key={y} d={`M26 ${y} q8 -6 16 0 t16 0 t16 0 t16 0 t16 0`} />)}</g>
    default:
      return null
  }
}

function star(cx, cy, outer, inner) {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer
    const a = (Math.PI / 5) * i - Math.PI / 2
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)} `
  }
  return `${d}Z`
}

function HairBack({ hair, color }) {
  switch (hair) {
    case 'long': return <path d="M34 50 Q32 92 42 96 L78 96 Q88 92 86 50 Z" fill={color} />
    case 'afro': return <circle cx="60" cy="46" r="34" fill={color} />
    case 'bob': return <path d="M34 52 Q32 78 42 78 L78 78 Q88 78 86 52 Z" fill={color} />
    case 'ponytail': return <path d="M80 44 Q104 50 96 86 Q90 70 82 58 Z" fill={color} />
    case 'braids': return <g fill={color}>{[0, 1, 2, 3].map(i => <g key={i}><circle cx="36" cy={66 + i * 9} r="5" /><circle cx="84" cy={66 + i * 9} r="5" /></g>)}</g>
    default: return null
  }
}

function HairFront({ hair, color }) {
  const cap = 'M36 50 Q38 26 60 26 Q82 26 84 50 Q74 38 60 38 Q46 38 36 50Z'
  switch (hair) {
    case 'short': case 'long': case 'ponytail': case 'braids': return <path d={cap} fill={color} />
    case 'curly': return <g fill={color}>{[[40, 40], [48, 32], [58, 28], [68, 30], [77, 36], [82, 45], [38, 49]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="8" />)}</g>
    case 'bun': return <g fill={color}><circle cx="60" cy="22" r="10" /><path d={cap} /></g>
    case 'mohawk': return <path d="M52 44 L54 12 Q60 6 66 12 L68 44 Z" fill={color} />
    case 'afro': return <path d="M34 50 Q40 30 60 30 Q80 30 86 50 Q74 40 60 40 Q46 40 34 50Z" fill={color} />
    case 'bob': return <path d="M34 54 Q34 26 60 26 Q86 26 86 54 Q80 40 70 42 Q60 36 50 42 Q40 40 34 54Z" fill={color} />
    case 'buzz': return <path d={cap} fill={color} opacity=".55" />
    case 'waves': return <path d="M36 50 Q38 26 60 26 Q82 26 84 50 Q78 42 72 46 Q66 38 60 44 Q54 38 48 46 Q42 42 36 50Z" fill={color} />
    case 'bald': return <ellipse cx="52" cy="38" rx="6" ry="3" fill="#fff" opacity=".45" />
    default: return null
  }
}

function Face({ expression }) {
  const dots = <g fill={INK}><circle cx="51" cy="56" r="2.6" /><circle cx="69" cy="56" r="2.6" /></g>
  const closed = <g fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round"><path d="M47 57 q4 -4 8 0" /><path d="M65 57 q4 -4 8 0" /></g>
  const cheeks = <g fill={RISO_INKS.fluoPink} opacity=".45"><circle cx="45" cy="64" r="4" /><circle cx="75" cy="64" r="4" /></g>
  const brows = <g stroke={INK} strokeWidth="2.4" strokeLinecap="round"><line x1="46" y1="49" x2="55" y2="52" /><line x1="74" y1="49" x2="65" y2="52" /></g>
  switch (expression) {
    case 'determined': return <g>{brows}{dots}<line x1="54" y1="67" x2="66" y2="67" stroke={INK} strokeWidth="2.4" strokeLinecap="round" /></g>
    case 'singing': return <g>{closed}{cheeks}<ellipse cx="60" cy="67" rx="4" ry="5" fill={INK} /><path d="M92 34 v-10 l8 -2 v10" stroke={INK} strokeWidth="2" fill="none" /><circle cx="90" cy="34" r="2.6" fill={INK} /><circle cx="98" cy="32" r="2.6" fill={INK} /></g>
    case 'smile': return <g>{dots}{cheeks}<path d="M52 64 q8 8 16 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" /></g>
    case 'shout': return <g>{brows}{dots}<path d="M52 63 h16 q0 11 -8 11 q-8 0 -8 -11z" fill={INK} /><path d="M55 69 q5 4 10 0" fill={RISO_INKS.red} /></g>
    case 'calm': return <g>{closed}{cheeks}<path d="M55 66 q5 4 10 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" /></g>
    case 'wink': return <g><circle cx="51" cy="56" r="2.6" fill={INK} /><path d="M65 57 q4 -4 8 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />{cheeks}<path d="M52 64 q8 7 16 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" /></g>
    default: return dots
  }
}

function Headwear({ kind, primary, secondary }) {
  switch (kind) {
    case 'cap': return <g><path d="M36 44 Q38 24 60 24 Q82 24 84 44 Z" fill={primary} stroke={INK} strokeWidth="1.5" /><path d="M80 42 Q98 42 100 48 L82 48 Z" fill={secondary} stroke={INK} strokeWidth="1.5" /></g>
    case 'beanie': return <g><path d="M35 46 Q36 20 60 20 Q84 20 85 46 Z" fill={secondary} /><rect x="33" y="40" width="54" height="9" rx="4" fill={primary} /><circle cx="60" cy="18" r="6" fill={primary} /></g>
    case 'headband': return <rect x="34" y="38" width="52" height="7" rx="3" fill={secondary} stroke={INK} strokeWidth="1.2" />
    case 'flowerCrown': return <g>{[38, 47, 56, 65, 74, 82].map((x, i) => <g key={x}><circle cx={x} cy={36 - Math.sin((i / 5) * Math.PI) * 6} r="5" fill={[RISO_INKS.fluoPink, RISO_INKS.yellow, RISO_INKS.mint][i % 3]} /><circle cx={x} cy={36 - Math.sin((i / 5) * Math.PI) * 6} r="1.8" fill={RISO_INKS.orange} /></g>)}</g>
    case 'helmet': return <g><path d="M34 48 Q34 18 60 18 Q86 18 86 48 Z" fill={secondary} stroke={INK} strokeWidth="1.5" /><path d="M44 24 L48 44 M60 20 V44 M76 24 L72 44" stroke={INK} strokeWidth="1.2" opacity=".6" /></g>
    case 'bucket': return <g><path d="M40 42 L44 22 Q60 16 76 22 L80 42 Z" fill={primary} /><ellipse cx="60" cy="43" rx="30" ry="5" fill={secondary} /></g>
    default: return null
  }
}

function FaceAccessory({ kind, primary, secondary }) {
  switch (kind) {
    case 'glasses': return <g fill="none" stroke={INK} strokeWidth="2"><rect x="43" y="51" width="14" height="10" rx="2" /><rect x="63" y="51" width="14" height="10" rx="2" /><line x1="57" y1="55" x2="63" y2="55" /></g>
    case 'roundGlasses': return <g fill="rgba(255,255,255,.25)" stroke={INK} strokeWidth="2"><circle cx="51" cy="56" r="7" /><circle cx="69" cy="56" r="7" /><line x1="58" y1="56" x2="62" y2="56" /></g>
    case 'bandana': return <path d="M38 60 Q60 66 82 60 L76 72 Q60 86 44 72 Z" fill={secondary} stroke={INK} strokeWidth="1.2" />
    case 'paint': return <g><path d="M42 60 l8 0 M42 64 l8 0" stroke={primary} strokeWidth="2.6" /><path d="M70 60 l8 0 M70 64 l8 0" stroke={secondary} strokeWidth="2.6" /></g>
    case 'heart': return <path d="M74 64 c0 -3 4 -3 4 0 c0 -3 4 -3 4 0 c0 3 -4 5 -4 7 c0 -2 -4 -4 -4 -7z" fill={RISO_INKS.red} />
    default: return null
  }
}

const BEHIND = new Set(['tree', 'house'])

function RankBadge({ rank, primary }) {
  if (!rank || rank === 'novata') return null
  if (rank === 'curtida') return <path d={star(72, 104, 6, 2.6)} fill={RISO_INKS.yellow} stroke={INK} strokeWidth="1.2" />
  if (rank === 'veterana') return <g><path d="M66 108 l-3 12 l5 -3 l3 5 l1 -12z M78 108 l3 12 l-5 -3 l-3 5 l-1 -12z" fill={primary} stroke={INK} strokeWidth="1" /><circle cx="72" cy="104" r="6.5" fill={RISO_INKS.sunflower} stroke={INK} strokeWidth="1.4" /><circle cx="72" cy="104" r="3.2" fill={PAPER} stroke={INK} strokeWidth=".8" /></g>
  return <g><path d="M60 110 q-4 -10 4 -16 M84 110 q4 -10 -4 -16" stroke={RISO_INKS.green} strokeWidth="2.4" fill="none" /><circle cx="72" cy="103" r="8" fill={RISO_INKS.sunflower} stroke={INK} strokeWidth="1.6" /><path d={star(72, 103, 5, 2.2)} fill={PAPER} stroke={INK} strokeWidth=".8" /><path d="M66 90 l3 4 l3 -5 l3 5 l3 -4 l-1 6 h-10z" fill={RISO_INKS.sunflower} stroke={INK} strokeWidth="1" /></g>
}

function Held({ item, primary, secondary, skin, text }) {
  const hand = <circle cx="96" cy="66" r="5.5" fill={skin} stroke={INK} strokeWidth="1.2" />
  switch (item) {
    case 'sign': return <g><line x1="96" y1="96" x2="96" y2="38" stroke="#8B5A2B" strokeWidth="3.5" /><rect x="72" y="10" width="46" height="30" rx="2" fill={PAPER} stroke={INK} strokeWidth="2" transform="rotate(-4 95 25)" /><text x="95" y="31" textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize="12" fill={primary} transform="rotate(-4 95 25)">{text || '¡YA!'}</text>{hand}</g>
    case 'flag': return <g><line x1="96" y1="96" x2="96" y2="18" stroke={INK} strokeWidth="2.5" /><path d="M96 20 Q108 14 118 22 Q108 30 96 26 Z" fill={secondary} stroke={INK} strokeWidth="1.2" />{hand}</g>
    case 'bigflag': return <g><line x1="96" y1="110" x2="96" y2="2" stroke={INK} strokeWidth="3" /><path d="M96 4 Q112 -2 124 8 L124 40 Q110 32 96 38 Z" fill={secondary} stroke={INK} strokeWidth="1.5" /><path d="M96 18 Q112 12 124 22" stroke={primary} strokeWidth="5" fill="none" />{hand}</g>
    case 'flower': return <g><path d="M96 66 Q98 52 100 40" stroke={RISO_INKS.green} strokeWidth="2.5" fill="none" />{[0, 72, 144, 216, 288].map(a => <circle key={a} cx={100 + 6 * Math.cos((a * Math.PI) / 180)} cy={36 + 6 * Math.sin((a * Math.PI) / 180)} r="4.5" fill={RISO_INKS.fluoPink} />)}<circle cx="100" cy="36" r="3.5" fill={RISO_INKS.yellow} />{hand}</g>
    case 'fist': return <g><rect x="88" y="48" width="16" height="17" rx="5" fill={skin} stroke={INK} strokeWidth="1.5" /><path d="M91 53 h10 M91 58 h10" stroke={INK} strokeWidth="1" /></g>
    case 'drum': return <g><ellipse cx="60" cy="112" rx="22" ry="6" fill={PAPER} stroke={INK} strokeWidth="1.5" /><path d="M38 112 v18 q22 10 44 0 v-18" fill={secondary} stroke={INK} strokeWidth="1.5" /><path d="M42 116 l8 12 l8 -12 l8 12 l8 -12" stroke={PAPER} strokeWidth="1.5" fill="none" /><line x1="92" y1="70" x2="72" y2="104" stroke={INK} strokeWidth="2.5" /><line x1="28" y1="72" x2="46" y2="104" stroke={INK} strokeWidth="2.5" /></g>
    case 'megaphone': return <g><path d="M78 60 L104 46 L104 78 Z" fill={secondary} stroke={INK} strokeWidth="1.8" /><rect x="72" y="58" width="8" height="8" fill={primary} stroke={INK} strokeWidth="1.5" /><path d="M108 52 q6 10 0 20 M112 46 q10 16 0 32" stroke={INK} strokeWidth="1.6" fill="none" opacity=".6" />{hand}</g>
    case 'smoke': return <g><line x1="96" y1="72" x2="98" y2="48" stroke={INK} strokeWidth="3" /><g opacity=".8">{[[100, 40, 9], [108, 28, 11], [98, 18, 10], [112, 12, 8]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={[primary, secondary, RISO_INKS.fluoPink, RISO_INKS.yellow][i]} />)}</g>{hand}</g>
    case 'banner': return <g><line x1="8" y1="118" x2="8" y2="70" stroke="#8B5A2B" strokeWidth="3" /><line x1="112" y1="118" x2="112" y2="70" stroke="#8B5A2B" strokeWidth="3" /><path d="M8 74 Q60 80 112 74 L112 100 Q60 106 8 100 Z" fill={PAPER} stroke={INK} strokeWidth="2" /><text x="60" y="94" textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize="15" fill={primary}>{text || 'NI UN PASO ATRÁS'}</text></g>
    case 'puppet': return <g><path d="M24 138 Q30 92 60 86 Q90 92 96 138 Z" fill={secondary} opacity=".85" /><line x1="44" y1="138" x2="40" y2="156" stroke="#8B5A2B" strokeWidth="3" /><line x1="76" y1="138" x2="80" y2="156" stroke="#8B5A2B" strokeWidth="3" /></g>
    case 'float': return <g><rect x="6" y="134" width="108" height="18" rx="4" fill={primary} stroke={INK} strokeWidth="2" /><path d="M6 134 q9 -8 18 0 t18 0 t18 0 t18 0 t18 0 t18 0" fill={secondary} stroke={INK} strokeWidth="1.5" /><circle cx="26" cy="154" r="5" fill={INK} /><circle cx="94" cy="154" r="5" fill={INK} /></g>
    case 'songbook': return <g><path d="M40 104 L60 100 L80 104 L80 122 L60 118 L40 122 Z" fill={PAPER} stroke={INK} strokeWidth="1.8" /><line x1="60" y1="100" x2="60" y2="118" stroke={INK} strokeWidth="1.2" /><path d="M44 108 h12 M44 112 h12 M64 108 h12 M64 112 h12" stroke={secondary} strokeWidth="1.4" /><path d="M88 30 v-10 l8 -2 v10" stroke={INK} strokeWidth="2" fill="none" /><circle cx="86" cy="30" r="2.6" fill={INK} /><circle cx="94" cy="28" r="2.6" fill={INK} /></g>
    case 'bike': return <g><circle cx="30" cy="140" r="14" fill="none" stroke={INK} strokeWidth="3" /><circle cx="90" cy="140" r="14" fill="none" stroke={INK} strokeWidth="3" /><path d="M30 140 L52 118 L78 118 L90 140 M52 118 L60 140 L78 118 M60 140 L30 140" stroke={secondary} strokeWidth="3.5" fill="none" strokeLinejoin="round" /><path d="M76 112 h10" stroke={INK} strokeWidth="3" strokeLinecap="round" /><circle cx="86" cy="108" r="3" fill={RISO_INKS.yellow} stroke={INK} strokeWidth="1" /></g>
    case 'trumpet': return <g><path d="M72 66 L100 60 L100 58 L112 50 L112 76 L100 68 L100 66 Z" fill={RISO_INKS.sunflower} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" /><circle cx="88" cy="63" r="2" fill={INK} />{hand}</g>
    case 'lantern': return <g><line x1="96" y1="96" x2="96" y2="22" stroke="#8B5A2B" strokeWidth="3" /><path d="M96 22 q14 0 14 -12" stroke={INK} strokeWidth="1.5" fill="none" /><ellipse cx="110" cy="0" rx="11" ry="13" fill={RISO_INKS.red} stroke={INK} strokeWidth="1.6" /><path d="M103 -11 q7 11 0 22 M117 -11 q-7 11 0 22 M110 -13 v26" stroke={RISO_INKS.sunflower} strokeWidth="1.2" fill="none" /><rect x="105" y="12" width="10" height="3" fill={INK} />{hand}</g>
    case 'pole': return <g><line x1="96" y1="100" x2="96" y2="-6" stroke="#8B5A2B" strokeWidth="3.5" strokeLinecap="round" />{hand}</g>
    case 'card': return <g><rect x="74" y="16" width="40" height="34" rx="2" fill={primary} stroke={INK} strokeWidth="2" />{hand}</g>
    case 'dove': return <g><path d="M92 50 q10 -16 26 -14 q-8 4 -10 10 q12 -2 16 6 q-14 2 -22 4 q-8 2 -10 -6z" fill={PAPER} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" /><circle cx="112" cy="40" r="1.4" fill={INK} /><path d="M118 40 l5 1 l-5 2z" fill={RISO_INKS.orange} />{hand}</g>
    case 'tree': return <g><path d="M8 60 q-8 -30 20 -38 q6 -22 32 -18 q24 -6 34 16 q26 6 20 34 q10 22 -14 30 q-20 14 -40 4 q-26 10 -40 -8 q-20 -6 -12 -20z" fill={RISO_INKS.green} stroke={INK} strokeWidth="2" opacity=".95" /><g fill="#00873F"><circle cx="28" cy="40" r="7" /><circle cx="90" cy="30" r="8" /><circle cx="100" cy="66" r="7" /><circle cx="20" cy="70" r="6" /></g><path d="M100 22 q4 -4 8 0 q-4 1 -8 0z" fill={INK} /><path d="M14 30 q4 -4 8 0 q-4 1 -8 0z" fill={INK} /><path d="M50 100 v36 M60 98 v40 M70 100 v36" stroke="#6A4028" strokeWidth="3" opacity=".6" /></g>
    case 'house': return <g><rect x="22" y="58" width="76" height="46" fill={KRAFT} stroke={INK} strokeWidth="2" /><path d="M14 60 L60 22 L106 60 Z" fill={RISO_INKS.red} stroke={INK} strokeWidth="2" strokeLinejoin="round" /><rect x="30" y="66" width="14" height="12" fill={RISO_INKS.yellow} stroke={INK} strokeWidth="1.5" /><rect x="76" y="66" width="14" height="12" fill={RISO_INKS.yellow} stroke={INK} strokeWidth="1.5" /><path d="M84 30 v-12 h8 v18" fill={KRAFT} stroke={INK} strokeWidth="1.5" /></g>
    default: return null
  }
}

function Aura({ kind, primary, id }) {
  if (kind === 'sparkles') return <g fill={RISO_INKS.yellow} stroke={INK} strokeWidth=".8">{[[16, 30], [104, 96], [14, 104], [100, 12]].map(([x, y], i) => <path key={i} d={star(x, y, 6, 2)} />)}</g>
  if (kind === 'halo') return <g><ellipse cx="60" cy="14" rx="20" ry="5" fill="none" stroke={RISO_INKS.sunflower} strokeWidth="4" /><circle cx="60" cy="80" r="62" fill={`url(#${id}-glow)`} /></g>
  if (kind === 'glow') return <circle cx="60" cy="84" r="58" fill={primary} opacity=".12" />
  return null
}

export default function UnitSVG({ genome, loadout = {}, size = 120, text, title, rank, cut = true, grain = true, idPrefix }) {
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const id = idPrefix ?? `u${reactId}`
  const slogan = text ?? SLOGANS[hashString(`slogan:${genome.seed}`) % SLOGANS.length]
  const override = loadout.palette ? PALETTE_OVERRIDES[loadout.palette] : null
  const primary = override?.[0] ?? genome.primary
  const secondary = override?.[1] ?? genome.secondary
  const isPuppet = genome.heldItem === 'puppet'
  const armDown = ['none', 'drum', 'banner', 'puppet', 'float', 'songbook', 'bike', 'tree', 'house'].includes(genome.heldItem)
  const height = genome.height ?? 1

  return (
    <svg viewBox="-6 -8 132 172" width={size} height={size * 1.3} role="img" aria-label={title ?? genome.name}>
      <defs>
        <linearGradient id={`${id}-holo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF48B0" /><stop offset=".33" stopColor="#FFE800" /><stop offset=".66" stopColor="#82D8D5" /><stop offset="1" stopColor="#765BA7" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}><stop offset="0" stopColor="#FFB511" stopOpacity=".35" /><stop offset="1" stopColor="#FFB511" stopOpacity="0" /></radialGradient>
        <clipPath id={`${id}-body`}><path d={BODIES[genome.body] ?? BODIES.round} /></clipPath>
        <filter id={`${id}-cut`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius="3.4" result="thick" />
          <feOffset in="thick" dx="2.5" dy="3" result="off" />
          <feFlood floodColor="#1D1B2F" floodOpacity=".3" />
          <feComposite in2="off" operator="in" result="shadow" />
          <feFlood floodColor="#FFFDF6" />
          <feComposite in2="thick" operator="in" result="paper" />
          {grain && <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" result="noise" />}
          {grain && <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0" result="grain" />}
          {grain && <feComposite in="grain" in2="thick" operator="in" result="grainIn" />}
          <feMerge><feMergeNode in="shadow" /><feMergeNode in="paper" /><feMergeNode in="SourceGraphic" />{grain && <feMergeNode in="grainIn" />}</feMerge>
        </filter>
      </defs>
      <Aura kind={genome.aura} primary={primary} id={id} />
      <ellipse cx="60" cy="154" rx="32" ry="5" fill={INK} opacity=".18" />
      <g filter={cut ? `url(#${id}-cut)` : undefined}>
      <g transform={`rotate(${genome.tilt ?? 0} 60 150) translate(60 150) scale(${height}) translate(-60 -150)`}>
        {BEHIND.has(genome.heldItem) && <Held item={genome.heldItem} primary={primary} secondary={secondary} skin={genome.skin} text={slogan} />}
        <g transform="translate(3 2)" opacity=".3" style={{ mixBlendMode: 'multiply' }} fill={secondary}>
          <path d={BODIES[genome.body] ?? BODIES.round} />
          <circle cx="60" cy="54" r={isPuppet ? 32 : 24} />
        </g>
        <rect x="45" y="128" width="11" height="20" rx="4" fill={secondary} />
        <rect x="64" y="128" width="11" height="20" rx="4" fill={secondary} />
        <ellipse cx="50" cy="149" rx="8" ry="4" fill={INK} />
        <ellipse cx="70" cy="149" rx="8" ry="4" fill={INK} />
        {genome.top === 'hoodie' && <path d="M38 88 Q60 66 82 88 Q60 80 38 88Z" fill={primary} />}
        <HairBack hair={genome.hair} color={genome.hairColor} />
        <path d={BODIES[genome.body] ?? BODIES.round} fill={primary} stroke={INK} strokeWidth="2" />
        <g clipPath={`url(#${id}-body)`}>
          <Pattern kind={genome.pattern} primary={primary} secondary={secondary} id={id} />
          {genome.top === 'overalls' && <g fill={secondary}><rect x="46" y="100" width="28" height="40" rx="3" /><rect x="46" y="84" width="5" height="20" /><rect x="69" y="84" width="5" height="20" /></g>}
          {genome.top === 'vest' && <g fill={secondary}><path d="M30 138 L40 88 L54 92 L54 138Z" /><path d="M90 138 L80 88 L66 92 L66 138Z" /></g>}
          {genome.top === 'sweater' && <g stroke={secondary} strokeWidth="2">{[40, 46, 52, 58, 64, 70, 76, 82].map(x => <line key={x} x1={x} y1="130" x2={x} y2="138" />)}</g>}
          {genome.top === 'poncho' && <path d="M24 120 L60 84 L96 120 Z" fill={secondary} opacity=".9" />}
        </g>
        {genome.top === 'hoodie' && <g stroke={PAPER} strokeWidth="2"><line x1="55" y1="86" x2="54" y2="100" /><line x1="65" y1="86" x2="66" y2="100" /></g>}
        {genome.top === 'jacket' && <g stroke={INK} strokeWidth="1.6"><line x1="60" y1="84" x2="60" y2="138" /><path d="M60 84 L50 100 M60 84 L70 100" fill="none" /></g>}
        {genome.top === 'raincoat' && <g fill={INK}><circle cx="60" cy="100" r="2" /><circle cx="60" cy="112" r="2" /><circle cx="60" cy="124" r="2" /></g>}
        <path d="M36 92 Q24 104 26 118" stroke={primary} strokeWidth="10" strokeLinecap="round" fill="none" />
        <circle cx="26" cy="120" r="5.5" fill={genome.skin} stroke={INK} strokeWidth="1.2" />
        {armDown
          ? <><path d="M84 92 Q96 104 94 118" stroke={primary} strokeWidth="10" strokeLinecap="round" fill="none" /><circle cx="94" cy="120" r="5.5" fill={genome.skin} stroke={INK} strokeWidth="1.2" /></>
          : <path d="M82 90 Q94 80 96 66" stroke={primary} strokeWidth="10" strokeLinecap="round" fill="none" />}
        <g transform={isPuppet ? 'translate(60 60) scale(1.35) translate(-60 -60)' : undefined}>
          <circle cx="36" cy="58" r="5" fill={genome.skin} stroke={INK} strokeWidth="1.2" />
          <circle cx="84" cy="58" r="5" fill={genome.skin} stroke={INK} strokeWidth="1.2" />
          <circle cx="60" cy="54" r="24" fill={genome.skin} stroke={INK} strokeWidth="2" />
          <Face expression={genome.expression} />
          <FaceAccessory kind={genome.face} primary={primary} secondary={secondary} />
          <HairFront hair={genome.hair} color={genome.hairColor} />
          <Headwear kind={genome.headwear} primary={primary} secondary={secondary} />
        </g>
        <RankBadge rank={rank} primary={primary} />
        {!BEHIND.has(genome.heldItem) && <Held item={genome.heldItem} primary={primary} secondary={secondary} skin={genome.skin} text={slogan} />}
      </g>
      </g>
    </svg>
  )
}

import { useEffect, useState } from 'react'
import { generateGenome } from '@manifiest/shared'
import UnitSVG from '../UnitSVG.jsx'

const KEY = 'manifiest.lastLevel'

export default function LevelUpModal({ state }) {
  const [shown, setShown] = useState(null)
  useEffect(() => {
    const level = state.progress.level
    let last = null
    try { last = Number(localStorage.getItem(KEY)) || null } catch {}
    if (last && level > last) {
      const unlocks = state.track.filter(t => t.level > last && t.level <= level).flatMap(t => t.unlocks)
      setShown({ level, unlocks })
    }
    try { localStorage.setItem(KEY, String(level)) } catch {}
  }, [state.progress.level, state.track])
  if (!shown) return null
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Nivel ${shown.level}`} onClick={() => setShown(null)}>
      <div className="card levelup taped" onClick={e => e.stopPropagation()}>
        <span className="onomatopeya">¡NIVEL {shown.level}!</span>
        <p className="muted">Tu constancia abre nuevas calles:</p>
        <div className="levelup-grid">
          {shown.unlocks.map(u => (
            <div key={`${u.kind}-${u.id}`} className="levelup-item">
              {u.kind === 'unit' ? <UnitSVG genome={generateGenome(`muestra:${u.id}`, { role: u.id, rarity: 'rare' })} size={70} /> : <span style={{ fontSize: '2rem' }}>{u.kind === 'upgrade' ? '🛠️' : u.kind === 'feature' ? '✨' : '🎨'}</span>}
              <b>{u.label}</b>
              <small className="muted">{u.description}</small>
            </div>
          ))}
        </div>
        <button className="btn pink" onClick={() => setShown(null)}>¡A la calle!</button>
      </div>
    </div>
  )
}

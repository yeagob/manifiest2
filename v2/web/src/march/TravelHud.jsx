import { UNIT_ROLES, RARITY_LABELS } from '@manifiest/shared'
import UnitSVG from '../components/UnitSVG.jsx'

const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export default function TravelHud({ march, focus, progress, rig, ui, setUi, onPhoto, onJumpMine, hasMine, levelOk }) {
  const total = march.length / 1.7 / ui.speed
  const remaining = total * (1 - progress)
  const counts = focus ? Object.entries(focus.counts).filter(([r]) => r !== 'citizen') : []
  return (
    <div className="travel-hud">
      {focus && (
        <div className="scene-panel travel-card">
          {focus.rarest && <div className="travel-art"><UnitSVG genome={focus.rarest.genome} loadout={focus.rarest.loadout} rank={focus.rarest.rank} size={84} /></div>}
          <div className="travel-info">
            <span className="travel-kicker">Bloque {focus.index + 1} de {march.blocks.length}{focus.owner ? ` · nivel ${focus.owner.level}` : ''}</span>
            <h3>{focus.title}</h3>
            {focus.placard && <p className="travel-placard">«{focus.placard.text}»</p>}
            <div className="travel-chips">
              {focus.type === 'citizens'
                ? <span className="chip">{focus.people} personas caminando</span>
                : counts.map(([r, n]) => <span key={r} className="chip">{UNIT_ROLES[r]?.label} ×{n}</span>)}
              {focus.rarest && focus.rarest.rarity !== 'common' && <span className={`chip rarity-tag rarity-${focus.rarest.rarity}`}>{RARITY_LABELS[focus.rarest.rarity]}: {focus.rarest.name}</span>}
            </div>
          </div>
        </div>
      )}
      <div className="scene-panel travel-controls">
        <div className="travel-progress" aria-label="Progreso del recorrido">
          <div className="travel-track">
            {march.blocks.filter(b => b.epic).map(b => <i key={b.key} className="travel-tick" style={{ left: `${(b.center / march.length) * 100}%` }} />)}
            <b style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="mono">{fmtTime(total - remaining)} / {fmtTime(total)}</span>
        </div>
        <div className="row" style={{ gap: '.35rem' }}>
          <button className="btn small" onClick={() => setUi(u => ({ ...u, paused: !u.paused }))} aria-label={ui.paused ? 'Reanudar' : 'Pausar'}>{ui.paused ? '▶' : '❚❚'}</button>
          {[0.5, 1, 2, 4].map(v => <button key={v} className={`btn small ${ui.speed === v ? 'pink' : 'ghost'}`} onClick={() => setUi(u => ({ ...u, speed: v }))}>×{String(v).replace('.', ',')}</button>)}
          <span className="hud-sep" />
          {[['traveling', '🎬 Traveling'], ['dron', '🚁 Dron'], ['libre', '🖐 Libre']].map(([m, l]) => (
            <button key={m} className={`btn small ${ui.mode === m ? 'blue' : 'ghost'}`} onClick={() => setUi(u => ({ ...u, mode: m }))}>{l}</button>
          ))}
          <span className="hud-sep" />
          {[['day', '☀️'], ['dusk', '🌇'], ['night', '🏮']].map(([t, l]) => (
            <button key={t} className={`btn small ${ui.timeOfDay === t ? 'kraft' : 'ghost'}`} disabled={t === 'night' && !levelOk.night} title={t === 'night' && !levelOk.night ? 'Nivel 8' : ''} onClick={() => setUi(u => ({ ...u, timeOfDay: t }))}>{l}</button>
          ))}
          <span className="hud-sep" />
          <button className={`btn small ${ui.sound ? 'pink' : ''}`} onClick={() => setUi(u => ({ ...u, sound: !u.sound }))}>{ui.sound ? '🔊 Sonido' : '🔈 Activar sonido'}</button>
          {ui.sound && <input type="range" min="0" max="1" step="0.05" value={ui.volume} onChange={e => setUi(u => ({ ...u, volume: Number(e.target.value) }))} aria-label="Volumen" style={{ width: 90 }} />}
          {ui.sound && 'speechSynthesis' in window && <button className={`btn small ${ui.voice ? 'kraft' : 'ghost'}`} onClick={() => setUi(u => ({ ...u, voice: !u.voice }))} title="Lee en voz alta la pancarta de cada bloque">🗣 Voces</button>}
          <button className={`btn small ${ui.faithful ? 'blue' : 'ghost'}`} onClick={() => setUi(u => ({ ...u, faithful: !u.faithful }))} title="Una figura por persona real, sin unidades extra">⚖️ Vista fiel</button>
          <span className="spacer" />
          {hasMine && <button className="btn small ghost" onClick={onJumpMine}>⭐ Mi bloque</button>}
          <button className="btn small pink" onClick={onPhoto}>📷 Modo foto</button>
        </div>
      </div>
    </div>
  )
}

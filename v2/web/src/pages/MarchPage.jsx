import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AvenueScene } from '../components/ProtestCanvas.jsx'
import { api } from '../lib/api.js'
import { useSession } from '../lib/store.js'
import { num, km } from '../lib/format.js'

export default function MarchPage() {
  const { causeId } = useParams()
  const profile = useSession(s => s.profile)
  const [scene, setScene] = useState(null)
  const [error, setError] = useState(null)
  const [faithful, setFaithful] = useState(false)
  const [preset, setPreset] = useState('dron')
  const [live, setLive] = useState(0)
  const [text, setText] = useState('')
  const pulse = useRef(0)

  const load = () => api.scene(causeId).then(setScene).catch(setError)
  useEffect(() => { load() }, [causeId])

  useEffect(() => {
    const source = new EventSource(api.liveUrl(causeId))
    source.addEventListener('steps', e => {
      const { steps } = JSON.parse(e.data)
      pulse.current = performance.now()
      setLive(n => n + steps)
      setScene(s => s && { ...s, stats: { ...s.stats, totalSteps: s.stats.totalSteps + steps } })
    })
    return () => source.close()
  }, [causeId])

  async function submitPlacard(e) {
    e.preventDefault()
    try {
      await api.createPlacard({ causeId, text })
      setText('')
      await load()
    } catch (err) { setError(err) }
  }

  if (error && !scene) return <div className="main"><div className="alert error">{error.message}</div></div>
  if (!scene) return <p className="muted" style={{ padding: '2rem' }}>Llegando a la avenida…</p>
  const { cause, stats } = scene

  return (
    <div className="scene-shell">
      <AvenueScene scene={scene} faithful={faithful} preset={preset} pulse={pulse} />
      <div className="scene-hud">
        <div className="scene-panel" style={{ maxWidth: 520 }}>
          <div className="row" style={{ gap: '.5rem' }}>
            <span style={{ fontSize: '1.6rem' }}>{cause.icon}</span>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{cause.title}</h2>
          </div>
          <p style={{ margin: '.25rem 0 0' }}><b>Exigimos:</b> {cause.demand} <span className="muted">→ {cause.target}</span></p>
        </div>
        <div className="scene-panel row" style={{ gap: '1.25rem' }} aria-live="polite">
          <div className="stat"><b>{num(stats.uniquePeople)}</b><span>personas reales</span></div>
          <div className="stat"><b>{num(stats.totalSteps)}</b><span>pasos · {km(stats.totalSteps)}</span></div>
          <div className="stat"><b>{num(faithful ? stats.uniquePeople : stats.figures)}</b><span>{faithful ? 'figuras (1 = 1)' : 'figuras en la calle'}</span></div>
          {live > 0 && <div className="stat"><b><span className="live-dot" /> +{num(live)}</b><span>en directo</span></div>}
        </div>
      </div>

      {scene.placards.length > 0 && (
        <div className="scene-placards stack">
          {scene.placards.slice(0, 8).map(p => (
            <div key={p.id} className={`placard ${p.style}`}>
              {p.text}
              <div className="row" style={{ fontFamily: 'var(--font-ui)', textTransform: 'none', fontSize: '.8rem', marginTop: '.3rem' }}>
                <span>— {p.author}</span><span className="spacer" />
                {profile && <button className="btn small ghost" onClick={async () => { await api.votePlacard(p.id); load() }}>✊ {p.votes}</button>}
                {profile && <button className="btn small ghost" title="Denunciar" onClick={() => api.reportPlacard(p.id)}>⚑</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="scene-bottom">
        <div className="scene-panel row" style={{ gap: '.4rem' }}>
          {[['dron', '🚁 Dron'], ['calle', '🚶 A pie de calle'], ['cabecera', '🪧 Cabecera']].map(([k, l]) => (
            <button key={k} className={`btn small${preset === k ? ' pink' : ' ghost'}`} onClick={() => setPreset(k)}>{l}</button>
          ))}
          <label className="row" style={{ display: 'flex', gap: '.4rem', fontWeight: 600 }}>
            <input type="checkbox" checked={faithful} onChange={e => setFaithful(e.target.checked)} style={{ width: 'auto' }} />
            Vista fiel (1 persona = 1 figura)
          </label>
        </div>
        <span className="spacer" />
        {profile && cause.status === 'active' && (
          <form className="scene-panel row" onSubmit={submitPlacard} style={{ gap: '.4rem' }}>
            <input value={text} onChange={e => setText(e.target.value)} maxLength={80} placeholder="Escribe tu pancarta" style={{ width: 220 }} aria-label="Texto de la pancarta" />
            <button className="btn small pink" disabled={text.trim().length < 2}>Alzar</button>
          </form>
        )}
        {!profile && <Link className="btn pink" to="/registro">Únete a esta marcha</Link>}
      </div>
      {error && <div className="alert error" style={{ position: 'absolute', bottom: '5rem', left: '1rem' }}>{error.message}</div>}
    </div>
  )
}

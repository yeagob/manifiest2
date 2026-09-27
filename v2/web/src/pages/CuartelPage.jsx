import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { featureUnlocked } from '@manifiest/shared'
import { api } from '../lib/api.js'
import { useSession } from '../lib/store.js'
import ResourceBar from '../components/game/ResourceBar.jsx'
import FrontsBoard from '../components/game/FrontsBoard.jsx'
import Workshop from '../components/game/Workshop.jsx'
import Recruitment from '../components/game/Recruitment.jsx'
import ProgressTrack from '../components/game/ProgressTrack.jsx'
import PatternEditor from '../components/game/PatternEditor.jsx'
import LevelUpModal from '../components/game/LevelUpModal.jsx'

const TABS = [
  ['frentes', 'Frentes'],
  ['reclutar', 'Reclutar y colección'],
  ['taller', 'Taller'],
  ['progreso', 'Progresión'],
  ['pasos', 'Reparto de pasos']
]

export default function CuartelPage() {
  const { profile, setProfile, reload } = useSession()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'frentes'
  const [state, setState] = useState(null)
  const [units, setUnits] = useState([])
  const [causes, setCauses] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [fresh, setFresh] = useState(null)

  const refresh = useCallback(async () => {
    const [s, u, c] = await Promise.all([api.gameState(), api.units(), api.causes()])
    setState(s)
    setUnits(u.units)
    setCauses(c.filter(x => x.status === 'active'))
  }, [])

  useEffect(() => { refresh().catch(setError) }, [refresh])
  useEffect(() => {
    const id = setInterval(() => api.gameState().then(setState).catch(() => {}), 60000)
    return () => clearInterval(id)
  }, [])

  async function act(fn) {
    setBusy(true)
    setError(null)
    try {
      const next = await fn()
      if (next?.eco) setState(next)
      await Promise.all([refresh(), reload()])
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  if (!state) return error ? <div className="alert error">{error.message}</div> : <p className="muted">Abriendo el cuartel…</p>
  const level = state.progress.level
  const reserveCount = Object.values(state.reserve).reduce((s, n) => s + n, 0)

  return (
    <div className="stack cuartel" style={{ gap: '1.4rem' }}>
      <LevelUpModal state={state} />
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <h1 style={{ margin: 0 }}>Cuartel</h1>
        <p className="muted" style={{ margin: '0 0 .4rem' }}>Organiza tus unidades entre las manis, mejora tu taller y haz crecer tu movimiento.</p>
      </div>
      <ResourceBar state={state} profile={profile} busy={busy} onCollect={() => act(async () => (await api.collect()).state)} />
      {error && <div className="alert error" role="alert">{error.message}</div>}
      <div>
        <div className="tabs" role="tablist">
          {TABS.map(([id, label]) => {
            const locked = id === 'taller' && !featureUnlocked('workshop', level)
            return (
              <button key={id} role="tab" className="tab" aria-selected={tab === id} disabled={locked} onClick={() => setParams({ tab: id })}>
                {locked ? '🔒 ' : ''}{label}
                {id === 'frentes' && reserveCount > 0 && <span className="count">{reserveCount} en reserva</span>}
              </button>
            )
          })}
        </div>
        <div className="card tab-panel" role="tabpanel">
          {tab === 'frentes' && (
            <FrontsBoard state={state} busy={busy}
              onSend={(causeId, role, count) => act(() => api.sendUnits(causeId, role, count))}
              onRecall={(causeId, role, count) => act(() => api.recallUnits(causeId, role, count))}
              onAutoDeploy={() => act(() => api.autoDeploy())} />
          )}
          {tab === 'reclutar' && (
            <Recruitment state={state} units={units} causes={causes} busy={busy} fresh={fresh}
              onMint={role => act(async () => { setFresh(await api.mint(role)) })}
              onDeploy={(ids, causeId) => act(() => api.deploy(ids, causeId))}
              onRetire={ids => act(async () => { for (const id of ids) await api.retire(id) })} />
          )}
          {tab === 'taller' && <Workshop state={state} busy={busy} onBuy={id => act(() => api.buyUpgrade(id))} />}
          {tab === 'progreso' && <ProgressTrack state={state} />}
          {tab === 'pasos' && (
            <div className="stack">
              {profile.unallocatedSteps > 0 && (
                <button className="btn" onClick={() => act(async () => setProfile((await api.allocateReserve()).profile))}>Repartir {profile.unallocatedSteps.toLocaleString('es-ES')} pasos de la reserva</button>
              )}
              {causes.length
                ? <PatternEditor key={profile.pattern.join()} causes={causes} profile={profile} onSaved={setProfile} />
                : <p>Aún no hay causas activas.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

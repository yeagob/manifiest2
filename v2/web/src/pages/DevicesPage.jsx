import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useSession } from '../lib/store.js'
import { ago } from '../lib/format.js'

const PROVIDER_INFO = {
  fitbit: 'Fitbit y Google Pixel Watch. Sincronización automática cuando tu reloj sube datos.',
  withings: 'Relojes híbridos ScanWatch, Steel HR y Move.',
  garmin: 'Forerunner, Fenix, Venu, Vivoactive… Garmin nos avisa en cuanto sincronizas.'
}
const ERRORS = { already_linked: 'Esa cuenta de reloj ya está vinculada a otro usuario.', link_failed: 'No se pudo completar la vinculación. Inténtalo de nuevo.' }

export default function DevicesPage() {
  const reload = useSession(s => s.reload)
  const [params] = useSearchParams()
  const [providers, setProviders] = useState([])
  const [devices, setDevices] = useState([])
  const [pairing, setPairing] = useState(null)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(params.get('error') ? { message: ERRORS[params.get('error')] ?? ERRORS.link_failed } : null)

  const load = () => Promise.all([api.connections(), api.devices()]).then(([p, d]) => { setProviders(p); setDevices(d) }).catch(setError)
  useEffect(() => { load() }, [])
  useEffect(() => { if (params.get('connected')) setMessage('¡Reloj conectado! Estamos importando tus últimos 7 días.') }, [params])

  async function run(fn) {
    setError(null)
    try { await fn(); await load(); await reload() } catch (err) { setError(err) }
  }

  return (
    <div className="stack" style={{ gap: '1.5rem' }}>
      <div>
        <h1>Tus relojes</h1>
        <p className="muted">Solo leemos el total de pasos diario. Nunca ubicación, ritmo cardiaco ni rutas. Si conectas varias fuentes, contamos el máximo del día, nunca la suma.</p>
      </div>
      {params.get('bienvenida') && <div className="alert">¡Bienvenida/o! Conecta tu reloj para que cada paso cuente desde hoy.</div>}
      {message && <div className="alert">{message}</div>}
      {error && <div className="alert error">{error.message}</div>}

      <section className="grid two">
        <div className="card stack">
          <h2>Apple Watch · Wear OS · Samsung</h2>
          <p style={{ margin: 0 }}>Apple Health y Health Connect solo son accesibles desde el móvil. Instala la app compañera, pulsa <b>Emparejar</b> e introduce este código:</p>
          {pairing
            ? <div className="mono" style={{ fontSize: '2.4rem', letterSpacing: '.2em', textAlign: 'center', padding: '.5rem', border: '2px dashed var(--line)', borderRadius: 12 }}>{pairing.code}</div>
            : <button className="btn blue" onClick={() => run(async () => setPairing(await api.pairingCode()))}>Generar código de emparejamiento</button>}
          {pairing && <p className="muted" style={{ margin: 0 }}>Caduca en 10 minutos y solo sirve una vez.</p>}
          {devices.map(d => (
            <div key={d.id} className="row card flat" style={{ padding: '.6rem .8rem' }}>
              <span>{d.platform === 'ios' ? '' : '🤖'} <b>{d.name}</b></span>
              <span className="muted">· {ago(d.lastSeenAt)}</span>
              <span className="spacer" />
              <button className="btn ghost small" onClick={() => run(() => api.revokeDevice(d.id))}>Desvincular</button>
            </div>
          ))}
        </div>

        {providers.map(p => (
          <div key={p.id} className="card stack">
            <div className="row">
              <h2 style={{ margin: 0 }}>{p.label}</h2>
              <span className="spacer" />
              {p.connected && <span className="chip" style={{ background: p.status === 'active' ? 'var(--green)' : 'var(--red)', color: '#fff' }}>{p.status === 'active' ? 'Conectado' : p.status === 'reauth_required' ? 'Reconecta' : 'Error'}</span>}
            </div>
            <p className="muted" style={{ margin: 0 }}>{PROVIDER_INFO[p.id]}</p>
            {p.connected && <p className="mono" style={{ margin: 0, fontSize: '.85rem' }}>Última sincronización: {ago(p.lastSyncAt)}</p>}
            <div className="row">
              {!p.available && <span className="muted">No disponible en este servidor.</span>}
              {p.available && (!p.connected || p.status === 'reauth_required') && (
                <button className="btn pink" onClick={() => run(async () => { window.location.assign((await api.startConnection(p.id)).authorizeUrl) })}>Conectar</button>
              )}
              {p.connected && p.status !== 'reauth_required' && <button className="btn small" onClick={() => run(async () => { const r = await api.syncConnection(p.id); setMessage(`Sincronizados ${r.days} días (+${r.credited} pasos nuevos).`) })}>Sincronizar ahora</button>}
              {p.connected && <button className="btn ghost small" onClick={() => run(() => api.disconnect(p.id))}>Desconectar</button>}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

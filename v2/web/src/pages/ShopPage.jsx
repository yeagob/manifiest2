import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'

const KIND_LABELS = { placardStyle: 'Estilos de pancarta', effect: 'Efectos', palette: 'Paletas para tus unidades', frame: 'Marcos de colección', avenueTheme: 'Temas de avenida para tus causas' }
const eur = cents => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100)

export default function ShopPage() {
  const [params] = useSearchParams()
  const [shop, setShop] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => { api.shop().then(setShop).catch(setError) }, [])

  async function buy(id) {
    try { window.location.assign((await api.checkout(id)).url) } catch (err) { setError(err) }
  }

  if (!shop) return <p className="muted">Cargando…</p>
  const groups = Object.keys(KIND_LABELS).map(kind => [kind, shop.items.filter(i => i.kind === kind)])

  return (
    <div className="stack" style={{ gap: '1.5rem' }}>
      <div>
        <h1>Tienda solidaria</h1>
        <p>Todo lo que se vende aquí es <b>solo estético</b>: nunca da más pasos, más votos ni más unidades. Cada compra ayuda a pagar los servidores de un proyecto de código abierto.</p>
      </div>
      {params.get('ok') && <div className="alert">¡Gracias! Tu compra aparecerá en unos segundos.</div>}
      {error && <div className="alert error">{error.message}</div>}
      {!shop.paymentsEnabled && <div className="alert">Los pagos no están activados en este servidor. Todo lo desbloqueable por nivel sigue disponible.</div>}
      {groups.map(([kind, items]) => (
        <section key={kind} className="stack">
          <h2>{KIND_LABELS[kind]}</h2>
          <div className="grid three">
            {items.map(item => (
              <div key={item.id} className="card stack">
                {kind === 'placardStyle' && <div className={`placard ${item.id}`}>¡Aquí estamos!</div>}
                <b>{item.name}</b>
                {item.owned
                  ? <span className="chip" style={{ background: 'var(--green)', color: '#fff' }}>Tuyo</span>
                  : item.priceCents !== null
                    ? <button className="btn pink small" disabled={!shop.paymentsEnabled} onClick={() => buy(item.id)}>{eur(item.priceCents)}</button>
                    : <span className="chip">🔒 Nivel {item.unlockLevel}</span>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

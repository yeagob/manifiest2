import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { generateGenome } from '@manifiest/shared'
import UnitSVG from '../components/UnitSVG.jsx'
import { api } from '../lib/api.js'
import { useSession } from '../lib/store.js'
import { num, km } from '../lib/format.js'

const HERO = [
  ['hero-1', 'rare', 'flag_bearer'], ['hero-2', 'common', 'marcher'], ['hero-3', 'legendary', 'megaphone'],
  ['hero-4', 'epic', 'marcher'], ['hero-5', 'common', 'drummer']
]

export default function HomePage() {
  const profile = useSession(s => s.profile)
  const [causes, setCauses] = useState([])
  useEffect(() => { api.causes().then(setCauses).catch(() => {}) }, [])
  const totalPeople = causes.reduce((s, c) => s + c.uniquePeople, 0)
  const totalSteps = causes.reduce((s, c) => s + c.totalSteps, 0)

  return (
    <>
      <section className="hero">
        <div>
          <h1>Tus pasos son <span>protesta</span></h1>
          <p style={{ fontSize: '1.2rem' }}>
            Conecta tu reloj, camina y reparte cada paso entre las causas en las que crees. Tu multitud crece contigo,
            pero las cifras que llegan a los gobiernos son siempre reales: <b>una persona, una voz</b>.
          </p>
          <div className="row">
            {profile
              ? <Link to="/movimiento" className="btn pink">Mi movimiento</Link>
              : <Link to="/registro" className="btn pink">Únete a la marcha</Link>}
            <Link to="/mundo" className="btn ghost">Ver el mundo en marcha</Link>
          </div>
        </div>
        <div className="hero-crowd" aria-hidden>
          {HERO.map(([seed, rarity, role]) => <UnitSVG key={seed} genome={generateGenome(seed, { rarity, role })} size={120} />)}
        </div>
      </section>

      <section className="grid three" style={{ marginBottom: '2rem' }}>
        <div className="card stat"><b>{num(totalPeople)}</b><span>personas verificadas marchando</span></div>
        <div className="card stat"><b>{num(totalSteps)}</b><span>pasos repartidos · {km(totalSteps)}</span></div>
        <div className="card stat"><b>{causes.length}</b><span>causas en la calle</span></div>
      </section>

      <section className="grid three">
        <div className="card"><h3>1 · Conecta tu reloj</h3><p>Apple Watch, Wear OS, Garmin, Fitbit o Withings. Solo leemos tus pasos diarios, nunca tu ubicación.</p></div>
        <div className="card"><h3>2 · Reparte tus pasos</h3><p>De cada cinco pasos, uno para los animales, otro para el clima y tres contra la guerra. Tú decides el patrón.</p></div>
        <div className="card"><h3>3 · Llena la avenida</h3><p>Sube de nivel caminando cada día, acuña unidades únicas y despliégalas donde más falta hagan.</p></div>
      </section>
    </>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCausesStore, useStepsStore, useAuthStore } from '../context/store'
import { Heart, Users, Plus, Footprints, Trophy } from 'lucide-react'
import api from '../services/api'
import { nivelDesdeXp, calcularRacha, evaluarLogros, logrosNuevos, nivelSubido } from '../lib/gamification'
import LevelRing from '../components/LevelRing'
import Confetti from '../components/Confetti'

function DashboardPage() {
  const { user } = useAuthStore()
  const { causes, fetchCauses } = useCausesStore()
  const { stats, fetchStats } = useStepsStore()
  const [loading, setLoading] = useState(true)
  const [historia, setHistoria] = useState([])
  const [celebracion, setCelebracion] = useState(null) // {icono, nombre, desc} | {nivel}
  const [verLogros, setVerLogros] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const [, , hist] = await Promise.all([
        fetchCauses(),
        fetchStats(),
        api.getStepHistory().catch(() => []),
      ])
      setHistoria(Array.isArray(hist) ? hist : hist?.history || [])
      setLoading(false)
    }
    loadData()
  }, [fetchCauses, fetchStats])

  const nivel = nivelDesdeXp(stats?.totalSteps || 0)
  const racha = calcularRacha(historia)
  const misCausas = causes.filter(c => c.supporters?.includes(user?.id))
  const causasCreadas = causes.filter(c => c.creatorId === user?.id || c.createdBy === user?.id)
  const logros = evaluarLogros({ stats, misCausas, causasCreadas, racha, historia })
  const conseguidos = logros.filter(l => l.conseguido)

  // Celebrar lo nuevo (logros o subida de nivel) una sola vez
  useEffect(() => {
    if (loading) return
    const nuevos = logrosNuevos(logros)
    if (nuevos.length > 0) {
      setCelebracion(nuevos[0])
    } else if (nivelSubido(nivel.nivel)) {
      setCelebracion({ icono: nivel.icono, nombre: `¡Nivel ${nivel.nivel}!`, desc: `Ya eres ${nivel.titulo}` })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  useEffect(() => {
    if (!celebracion) return
    const t = setTimeout(() => setCelebracion(null), 5000)
    return () => clearTimeout(t)
  }, [celebracion])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  const topCauses = causes.slice(0, 6)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Confetti activo={!!celebracion} />
      {celebracion && (
        <div className="m2-toast" onClick={() => setCelebracion(null)}>
          <span className="icono">{celebracion.icono}</span>
          <div>
            <b>¡Logro desbloqueado!</b>
            <span>{celebracion.nombre} — {celebracion.desc}</span>
          </div>
        </div>
      )}

      {/* Héroe: quién eres en el movimiento */}
      <section className="m2-hero">
        <LevelRing progreso={nivel.progreso} nivel={nivel.nivel} icono={nivel.icono} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="m2-xp-texto">HOLA, {user?.name?.split(' ')[0]?.toUpperCase() || 'ACTIVISTA'} — ERES</div>
          <div className="m2-titulo-activista">{nivel.titulo.toUpperCase()}</div>
          <div className="m2-xp-texto" style={{ marginTop: 4 }}>
            {nivel.xpEnNivel.toLocaleString()} / {nivel.xpParaSubir.toLocaleString()} XP para el nivel {nivel.nivel + 1} — cada paso es 1 XP: ¡a la calle!
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
            <Link to="/tracker" className="btn btn-primary"><Footprints size={18} /> Marchar ahora</Link>
            <Link to="/causes" className="btn btn-secondary"><Heart size={18} /> Ver causas</Link>
          </div>
        </div>
      </section>

      {/* Stats + racha */}
      <section className="m2-statgrid">
        <div className="m2-stat">
          <b>{(stats?.totalSteps || 0).toLocaleString()}</b>
          <span>Pasos totales</span>
        </div>
        <div className="m2-stat" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="m2-racha-fuego">{racha.actual > 0 ? '🔥' : '🕯️'}</span>
          <div>
            <b>{racha.actual} {racha.actual === 1 ? 'día' : 'días'}</b>
            <span>{racha.hoyHecho ? 'Racha viva' : racha.actual > 0 ? '¡Marcha hoy o la pierdes!' : 'Sin racha — empieza hoy'}</span>
          </div>
        </div>
        <div className="m2-stat">
          <b>{misCausas.length}</b>
          <span>Causas que apoyas</span>
        </div>
        <div className="m2-stat">
          <b>{conseguidos.length}/{logros.length}</b>
          <span>Logros</span>
        </div>
      </section>

      {/* Logros */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Trophy size={22} /> Logros</h2>
          <button className="btn btn-sm btn-secondary" onClick={() => setVerLogros(!verLogros)}>
            {verLogros ? 'Ver menos' : `Ver todos (${logros.length})`}
          </button>
        </div>
        <div className="m2-logros">
          {(verLogros ? logros : [...conseguidos, ...logros.filter(l => !l.conseguido)].slice(0, 6)).map(l => (
            <div key={l.id} className={`m2-logro${l.conseguido ? '' : ' bloqueado'}`} title={l.desc}>
              <span className="icono">{l.icono}</span>
              <span className="nombre">{l.nombre}</span>
              <span className="desc">{l.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Mis marchas (causas apoyadas) */}
      {misCausas.length > 0 && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <h2>Mis marchas</h2>
            <Link to="/tracker" className="btn btn-primary btn-sm"><Footprints size={16} /> Sumar pasos</Link>
          </div>
          <div className="grid grid-2">
            {misCausas.map(cause => {
              const mySteps = stats?.causeStats?.find(cs => cs.cause.id === cause.id)?.steps || 0
              const pct = cause.totalSteps > 0 ? Math.min(100, Math.round((mySteps / cause.totalSteps) * 100)) : 0
              return (
                <Link key={cause.id} to={`/causes/${cause.id}/live`} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div className="m2-marcha-head" style={{ marginBottom: '0.8rem' }}>
                    <div className="m2-marcha-icono">{cause.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{cause.title}</h3>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 700 }}>
                        Tus {mySteps.toLocaleString()} pasos son el {pct}% de la marcha
                      </div>
                    </div>
                    <div className="m2-manifestantes">
                      {Array.from({ length: Math.min(5, cause.supporterCount || 1) }).map((_, i) => <span key={i}>✊</span>)}
                    </div>
                  </div>
                  <div className="m2-barra"><div style={{ width: `${Math.max(4, pct)}%` }} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 700, opacity: 0.65 }}>
                    <span><Footprints size={12} style={{ verticalAlign: -2 }} /> {(cause.totalSteps || 0).toLocaleString()} pasos totales</span>
                    <span><Users size={12} style={{ verticalAlign: -2 }} /> {cause.supporterCount} manifestantes</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Causas calientes */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', gap: '0.5rem', flexWrap: 'wrap' }}>
          <h2>La calle está que arde</h2>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <Link to="/causes/new" className="btn btn-primary btn-sm"><Plus size={16} /> Nueva causa</Link>
            <Link to="/causes" className="btn btn-secondary btn-sm">Ver todas</Link>
          </div>
        </div>

        {topCauses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📢</div>
            <h3>Aún no hay causas</h3>
            <p style={{ opacity: 0.65, marginBottom: '1.5rem' }}>Sé quien encienda la primera mecha.</p>
            <Link to="/causes/new" className="btn btn-primary"><Plus size={20} /> Crear la primera causa</Link>
          </div>
        ) : (
          <div className="grid grid-3">
            {topCauses.map(cause => (
              <Link key={cause.id} to={`/causes/${cause.id}/live`} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div className="m2-marcha-head" style={{ marginBottom: '0.7rem' }}>
                  <div className="m2-marcha-icono" style={{ width: 44, height: 44, fontSize: '1.3rem' }}>{cause.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cause.title}</h4>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700, opacity: 0.55 }}>{cause.category}</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', opacity: 0.7, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '2.6em', marginBottom: '0.7rem' }}>
                  {cause.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, borderTop: '2px solid var(--m2-linea)', paddingTop: '0.6rem' }}>
                  <span><Footprints size={13} style={{ verticalAlign: -2 }} /> {(cause.totalSteps || 0).toLocaleString()}</span>
                  <span><Users size={13} style={{ verticalAlign: -2 }} /> {cause.supporterCount}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default DashboardPage

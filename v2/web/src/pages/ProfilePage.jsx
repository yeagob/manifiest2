import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useSession } from '../lib/store.js'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { profile, setProfile, logout } = useSession()
  const [notice, setNotice] = useState(null)
  const [error, setError] = useState(null)

  async function run(fn, ok) {
    setError(null)
    try { await fn(); if (ok) setNotice(ok) } catch (err) { setError(err) }
  }

  async function download() {
    const data = await api.exportData()
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'manifiest-datos.json' })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="stack" style={{ gap: '1.5rem', maxWidth: 720 }}>
      <h1>Perfil</h1>
      {notice && <div className="alert">{notice}</div>}
      {error && <div className="alert error">{error.message}</div>}
      <form className="card stack" onSubmit={e => { e.preventDefault(); run(async () => setProfile(await api.updateMe({ displayName: new FormData(e.currentTarget).get('displayName') })), 'Nombre actualizado') }}>
        <label>Nombre público<input name="displayName" defaultValue={profile.displayName} minLength={2} maxLength={40} required /></label>
        <p className="muted" style={{ margin: 0 }}>Email privado: {profile.email}</p>
        <button className="btn small">Guardar</button>
      </form>
      <section className="card stack">
        <h2>Privacidad y seguridad</h2>
        <div className="row">
          <button className="btn small" onClick={() => run(download)}>Descargar mis datos</button>
          <button className="btn small ghost" onClick={() => run(async () => { await logout(); navigate('/') })}>Cerrar sesión</button>
        </div>
      </section>
      <form className="card stack" style={{ borderColor: 'var(--red)' }} onSubmit={e => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        run(async () => { await api.deleteMe({ password: f.get('password') || undefined, confirm: f.get('confirm') }); await logout(); navigate('/') })
      }}>
        <h2>Borrar mi cuenta</h2>
        <p className="muted" style={{ margin: 0 }}>Se eliminan tus pasos, unidades, pancartas, relojes y sesiones. Las causas que creaste se mantienen, pero sin tu nombre.</p>
        {profile.hasPassword && <label>Contraseña<input name="password" type="password" required /></label>}
        <label>Escribe BORRAR para confirmar<input name="confirm" pattern="BORRAR" required /></label>
        <button className="btn small" style={{ background: 'var(--red)', color: '#fff' }}>Borrar definitivamente</button>
      </form>
    </div>
  )
}

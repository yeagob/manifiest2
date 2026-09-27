import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useSession } from '../lib/store.js'

function useSubmit() {
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const run = fn => async e => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try { await fn(new FormData(e.currentTarget)) } catch (err) { setError(err) } finally { setBusy(false) }
  }
  return { error, busy, run }
}

function AuthCard({ title, children, footer }) {
  return (
    <div style={{ maxWidth: 440, margin: '2rem auto' }}>
      <div className="card stack">
        <h2>{title}</h2>
        {children}
      </div>
      {footer && <p className="muted" style={{ textAlign: 'center', marginTop: '1rem' }}>{footer}</p>}
    </div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const reload = useSession(s => s.reload)
  const { error, busy, run } = useSubmit()
  const submit = run(async form => {
    const email = form.get('email')
    try {
      await api.login({ email, password: form.get('password') })
    } catch (err) {
      if (err.code === 'email_unverified') return navigate(`/verificar?email=${encodeURIComponent(email)}`)
      throw err
    }
    await reload()
    navigate(location.state?.from ?? '/cuartel')
  })
  return (
    <AuthCard title="Vuelve a la calle" footer={<>¿Primera vez? <Link to="/registro">Únete</Link> · <Link to="/recuperar">He olvidado mi contraseña</Link></>}>
      <form className="stack" onSubmit={submit}>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
        {error && <div className="alert error" role="alert">{error.message}</div>}
        <button className="btn pink" disabled={busy}>Entrar</button>
      </form>
    </AuthCard>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { error, busy, run } = useSubmit()
  const submit = run(async form => {
    if (form.get('password') !== form.get('confirm')) throw new Error('Las contraseñas no coinciden')
    const email = form.get('email').trim().toLowerCase()
    await api.register({ email, password: form.get('password'), displayName: form.get('displayName') })
    navigate(`/verificar?email=${encodeURIComponent(email)}`)
  })
  return (
    <AuthCard title="Únete a la marcha" footer={<>¿Ya tienes cuenta? <Link to="/entrar">Entra</Link></>}>
      <p className="muted">Tu nombre público es lo único que verán los demás. Nunca mostramos tu email ni tu ubicación.</p>
      <form className="stack" onSubmit={submit}>
        <label>Nombre público<input name="displayName" minLength={2} maxLength={40} autoComplete="nickname" required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Contraseña (mínimo 10 caracteres)<input name="password" type="password" minLength={10} maxLength={128} autoComplete="new-password" required /></label>
        <label>Repite la contraseña<input name="confirm" type="password" minLength={10} maxLength={128} autoComplete="new-password" required /></label>
        {error && <div className="alert error" role="alert">{error.message}</div>}
        <button className="btn pink" disabled={busy}>Crear cuenta</button>
      </form>
    </AuthCard>
  )
}

export function VerifyPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const reload = useSession(s => s.reload)
  const email = params.get('email') ?? ''
  const [notice, setNotice] = useState(null)
  const { error, busy, run } = useSubmit()
  const submit = run(async form => {
    await api.verifyEmail({ email: form.get('email'), code: form.get('code') })
    await reload()
    navigate('/dispositivos?bienvenida=1')
  })
  return (
    <AuthCard title="Revisa tu correo">
      <p className="muted">Te hemos enviado un código de 6 dígitos. Caduca en 15 minutos.</p>
      <form className="stack" onSubmit={submit}>
        <label>Email<input name="email" type="email" defaultValue={email} required /></label>
        <label>Código<input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" className="mono" style={{ fontSize: '1.6rem', letterSpacing: '.4em' }} required /></label>
        {error && <div className="alert error" role="alert">{error.message}</div>}
        {notice && <div className="alert">{notice}</div>}
        <button className="btn pink" disabled={busy}>Verificar</button>
        <button type="button" className="btn ghost small" onClick={async () => { await api.resendCode(email); setNotice('Si había una verificación pendiente, te hemos enviado otro código.') }}>Reenviar código</button>
      </form>
    </AuthCard>
  )
}

export function RecoverPage() {
  const navigate = useNavigate()
  const [sentTo, setSentTo] = useState(null)
  const { error, busy, run } = useSubmit()
  const request = run(async form => {
    const email = form.get('email').trim().toLowerCase()
    await api.forgot(email)
    setSentTo(email)
  })
  const reset = run(async form => {
    await api.reset({ email: sentTo, code: form.get('code'), password: form.get('password') })
    navigate('/entrar')
  })
  return (
    <AuthCard title="Recupera tu acceso">
      {!sentTo ? (
        <form className="stack" onSubmit={request}>
          <label>Email<input name="email" type="email" required /></label>
          {error && <div className="alert error">{error.message}</div>}
          <button className="btn" disabled={busy}>Enviar código</button>
        </form>
      ) : (
        <form className="stack" onSubmit={reset}>
          <p className="muted">Si la cuenta existe, habrás recibido un código en {sentTo}. Al cambiar la contraseña se cerrarán todas tus sesiones.</p>
          <label>Código<input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} className="mono" required /></label>
          <label>Nueva contraseña<input name="password" type="password" minLength={10} maxLength={128} autoComplete="new-password" required /></label>
          {error && <div className="alert error">{error.message}</div>}
          <button className="btn pink" disabled={busy}>Cambiar contraseña</button>
        </form>
      )}
    </AuthCard>
  )
}

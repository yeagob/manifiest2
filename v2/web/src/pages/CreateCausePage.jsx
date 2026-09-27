import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RISO_INKS } from '@manifiest/shared'
import { api } from '../lib/api.js'

const CATEGORIES = { 'medio-ambiente': 'Medio ambiente', animales: 'Animales', paz: 'Paz', 'derechos-humanos': 'Derechos humanos', vivienda: 'Vivienda', sanidad: 'Sanidad', educacion: 'Educación', igualdad: 'Igualdad', trabajo: 'Trabajo', otra: 'Otra' }
const ICONS = ['✊', '🌱', '🐾', '🕊️', '🏠', '🏥', '📚', '⚖️', '🌍', '💧', '🔥', '🌈']
const COLORS = ['fluoPink', 'blue', 'green', 'orange', 'purple', 'teal', 'red', 'sunflower'].map(k => RISO_INKS[k])

export default function CreateCausePage() {
  const navigate = useNavigate()
  const [icon, setIcon] = useState('✊')
  const [color, setColor] = useState(COLORS[0])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      const cause = await api.createCause({
        title: f.get('title'), description: f.get('description'), demand: f.get('demand'), target: f.get('target'),
        category: f.get('category'), icon, color,
        ...(f.get('goalPeople') ? { goalPeople: Number(f.get('goalPeople')) } : {}),
        ...(f.get('deadline') ? { deadline: f.get('deadline') } : {})
      })
      await api.joinCause(cause.id)
      navigate(`/marcha/${cause.id}`)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1>Nueva causa</h1>
      <p className="muted">Una causa fuerte pide algo concreto a alguien concreto. Eso es lo que convierte pasos en presión.</p>
      <form className="card stack" onSubmit={submit}>
        <label>Título<input name="title" minLength={5} maxLength={80} required /></label>
        <label>Qué exigimos (demanda concreta y medible)<input name="demand" minLength={10} maxLength={280} required placeholder="Ej.: Cerrar la incineradora antes de 2028" /></label>
        <label>A quién (destinatario)<input name="target" minLength={3} maxLength={120} required placeholder="Ej.: Ayuntamiento de Valencia" /></label>
        <label>Descripción<textarea name="description" minLength={20} maxLength={1000} required /></label>
        <div className="grid two">
          <label>Categoría<select name="category">{Object.entries(CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label>Objetivo de personas (opcional)<input name="goalPeople" type="number" min={10} /></label>
          <label>Fecha límite (opcional)<input name="deadline" type="date" /></label>
        </div>
        <div className="stack">
          <b>Icono</b>
          <div className="pattern">{ICONS.map(i => <button type="button" key={i} className="slot" style={{ outline: i === icon ? '3px solid var(--pink)' : 'none' }} onClick={() => setIcon(i)}>{i}</button>)}</div>
          <b>Color</b>
          <div className="pattern">{COLORS.map(c => <button type="button" key={c} aria-label={c} className="slot" style={{ background: c, outline: c === color ? '3px solid var(--ink)' : 'none', outlineOffset: 2 }} onClick={() => setColor(c)} />)}</div>
        </div>
        {error && <div className="alert error">{error.message}</div>}
        <button className="btn pink" disabled={busy}>Lanzar causa</button>
      </form>
    </div>
  )
}

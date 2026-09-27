import { useEffect, useRef, useState } from 'react'
import { composePoster, sharePoster, FORMATS, FILTERS, TEMPLATES, DEFAULT_SHOW } from './photo.js'

const PRESETS = [
  ['actual', 'Plano actual'], ['rio', 'Río de gente'], ['cabecera', 'Cabecera'], ['bloque', 'Retrato de bloque'],
  ['pancarta', 'Pancarta'], ['contrapicado', 'Contrapicado'], ['libre', 'Libre']
]
const SHOW_LABELS = { cause: 'Causa', date: 'Fecha', people: 'Personas que la apoyan', demand: 'Exigencia', steps: 'Pasos y figuras' }

export default function PhotoMode({ capture, cause, stats, focus, level, timeOfDay, setTimeOfDay, preset, setPreset, onClose }) {
  const [format, setFormat] = useState('story')
  const [filter, setFilter] = useState('papel')
  const [template, setTemplate] = useState('epica')
  const [show, setShow] = useState(DEFAULT_SHOW)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [notice, setNotice] = useState(null)
  const previewRef = useRef(null)

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function shoot() {
    setBusy(true)
    try {
      const image = capture()
      const poster = await composePoster({ image, format, filter, template, cause, stats, block: focus, show })
      previewRef.current = poster
      setResult(poster.toDataURL('image/jpeg', 0.9))
    } finally {
      setBusy(false)
    }
  }

  async function share() {
    const outcome = await sharePoster(previewRef.current, {
      title: `${cause.title} · Manifiest`,
      text: `${stats.uniquePeople.toLocaleString('es-ES')} personas ya caminan por «${cause.title}». Exigimos: ${cause.demand}`
    })
    setNotice(outcome === 'shared' ? '¡Compartida!' : 'Imagen descargada')
  }

  return (
    <>
      <div className="photo-frame" data-format={format} aria-hidden />
      <aside className="scene-panel photo-panel" aria-label="Modo foto">
        <div className="row"><h3 style={{ margin: 0 }}>📷 Modo foto</h3><span className="spacer" /><button className="btn small ghost" onClick={onClose}>Salir</button></div>
        <fieldset><legend>Encuadre</legend>
          <div className="photo-options">{PRESETS.map(([k, l]) => <button key={k} className={`btn small ${preset === k ? 'blue' : 'ghost'}`} onClick={() => setPreset(k)}>{l}</button>)}</div>
        </fieldset>
        <fieldset><legend>Hora</legend>
          <div className="photo-options">{[['day', 'Día'], ['dusk', 'Atardecer'], ['night', 'Noche']].map(([k, l]) => <button key={k} className={`btn small ${timeOfDay === k ? 'kraft' : 'ghost'}`} disabled={k === 'night' && level < 8} onClick={() => setTimeOfDay(k)}>{l}</button>)}</div>
        </fieldset>
        <fieldset><legend>Filtro</legend>
          <div className="photo-options">{Object.entries(FILTERS).map(([k, f]) => <button key={k} className={`btn small ${filter === k ? 'pink' : 'ghost'}`} disabled={level < f.level} title={level < f.level ? `Nivel ${f.level}` : ''} onClick={() => setFilter(k)}>{level < f.level ? '🔒 ' : ''}{f.label}</button>)}</div>
        </fieldset>
        <fieldset><legend>Formato</legend>
          <div className="photo-options">{Object.entries(FORMATS).map(([k, f]) => <button key={k} className={`btn small ${format === k ? 'pink' : 'ghost'}`} onClick={() => setFormat(k)}>{f.label}</button>)}</div>
        </fieldset>
        <fieldset><legend>Composición</legend>
          <div className="photo-options">{Object.entries(TEMPLATES).map(([k, t]) => <button key={k} className={`btn small ${template === k ? 'pink' : 'ghost'}`} disabled={k === 'bloque' && !focus} onClick={() => setTemplate(k)}>{t.label}</button>)}</div>
        </fieldset>
        <fieldset><legend>Datos en el cartel</legend>
          <div className="photo-toggles">
            {Object.entries(SHOW_LABELS).map(([k, l]) => (
              <label key={k}><input type="checkbox" checked={show[k]} onChange={e => setShow(s => ({ ...s, [k]: e.target.checked }))} />{l}</label>
            ))}
          </div>
        </fieldset>
        <button className="btn pink" disabled={busy} onClick={shoot}>{busy ? 'Revelando…' : '¡Disparar!'}</button>
      </aside>
      {result && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setResult(null)}>
          <div className="card photo-result" onClick={e => e.stopPropagation()}>
            <img src={result} alt={`Cartel de la mani ${cause.title}`} />
            <div className="row">
              <button className="btn pink" onClick={share}>Compartir</button>
              <button className="btn ghost" onClick={() => setResult(null)}>Otra foto</button>
              {notice && <span className="chip">{notice}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

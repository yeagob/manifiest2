import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { UNIT_ROLES, featureUnlocked } from '@manifiest/shared'
import MarchScene, { pickOnomatopoeia } from '../march/MarchScene.jsx'
import { buildMarch, faithfulScene } from '../march/layout.js'
import { MarchAudio } from '../march/audio.js'
import { ensureFonts } from '../march/paper.js'
import TravelHud from '../march/TravelHud.jsx'
import PhotoMode from '../march/PhotoMode.jsx'
import ComicPanel from '../march/ComicPanel.jsx'
import FigureCard from '../march/FigureCard.jsx'
import { api } from '../lib/api.js'
import { useSession } from '../lib/store.js'
import { num, km } from '../lib/format.js'

const SPECIAL_NAMES = { dragon: 'el dragón de papel', whale: 'la ballena de papel', mosaic: 'el mosaico humano', rainbow: 'el arcoíris gigante', banner: 'la pancarta de cabecera' }
const BANGS = ['¡ZAS!', '¡BOOM!', '¡AQUÍ ESTAMOS!', '¡WOW!', '¡OLÉ!']

export default function MarchPage() {
  const { causeId } = useParams()
  const profile = useSession(s => s.profile)
  const level = profile?.progress.level ?? 1
  const [scene, setScene] = useState(null)
  const [error, setError] = useState(null)
  const [fontsOk, setFontsOk] = useState(false)
  const [ui, setUi] = useState({ mode: 'traveling', speed: 1, paused: false, timeOfDay: 'day', sound: false, volume: 0.8, voice: false, faithful: false })
  const [focus, setFocus] = useState(null)
  const [progress, setProgress] = useState(0)
  const [onos, setOnos] = useState([])
  const [live, setLive] = useState(0)
  const [toast, setToast] = useState(null)
  const [comic, setComic] = useState(null)
  const [photo, setPhoto] = useState(false)
  const [preset, setPreset] = useState('actual')
  const [selected, setSelected] = useState(null)
  const rig = useRef({ s: -6, speed: 1, paused: false, mode: 'traveling', side: 1, comic: false, preset: null })
  const captureRef = useRef(null)
  const audio = useMemo(() => new MarchAudio(), [])
  const march = useMemo(() => (scene ? buildMarch(ui.faithful ? faithfulScene(scene) : scene) : null), [scene, ui.faithful])
  const comicAllowed = !profile || featureUnlocked('comic_panels', level)
  const lastSpoken = useRef(null)
  const comicTimer = useRef(null)

  const load = useCallback(() => api.scene(causeId).then(setScene).catch(setError), [causeId])
  useEffect(() => { load(); ensureFonts().then(() => setFontsOk(true)) }, [load])
  useEffect(() => () => audio.dispose(), [audio])

  useEffect(() => {
    const r = rig.current
    r.speed = ui.speed
    r.paused = ui.paused || (photo && preset === 'actual')
    r.mode = photo && preset !== 'actual' ? 'photo' : ui.mode === 'libre' ? 'libre' : ui.mode
    r.preset = photo ? (preset === 'libre' ? null : preset) : null
  }, [ui, photo, preset])

  useEffect(() => {
    if (ui.sound) audio.start().then(() => audio.setVolume(ui.volume)).catch(() => {})
    else audio.suspend()
  }, [ui.sound, audio])
  useEffect(() => { audio.setVolume(ui.volume) }, [ui.volume, audio])

  const flash = useCallback((text, action) => {
    setToast({ text, action, id: Date.now() })
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(t)
  }, [toast])

  const triggerComic = useCallback((caption, bang, duration = 3400) => {
    if (!comicAllowed) return
    rig.current.comic = ui.mode === 'traveling' && !photo
    setComic({ caption, bang })
    clearTimeout(comicTimer.current)
    comicTimer.current = setTimeout(() => { rig.current.comic = false; setComic(null) }, duration)
  }, [comicAllowed, ui.mode, photo])

  useEffect(() => audio.on(ev => {
    const block = march?.blocks.find(b => b.key === ev.key)
    if (!block) return
    const text = pickOnomatopoeia(ev.kind, ev.text)
    if (!text) return
    const id = `${ev.key}-${performance.now()}`
    setOnos(list => [...list.slice(-6), {
      id, text, born: performance.now(),
      x: (Math.random() - 0.5) * 3.5, y: ev.kind === 'chant' ? 4.6 : 3.8 + Math.random() * 0.6, z: block.center + (Math.random() - 0.5) * 2,
      size: ev.kind === 'chant' ? 0.85 : 0.65, rot: (Math.random() - 0.5) * 0.3
    }])
    setTimeout(() => setOnos(list => list.filter(o => o.id !== id)), 2700)
  }), [audio, march])

  useEffect(() => {
    const source = new EventSource(api.liveUrl(causeId))
    let reloadTimer = null
    source.addEventListener('steps', e => {
      const { steps } = JSON.parse(e.data)
      setLive(n => n + steps)
      setScene(s => s && { ...s, stats: { ...s.stats, totalSteps: s.stats.totalSteps + steps } })
    })
    source.addEventListener('milestone', e => {
      const m = JSON.parse(e.data)
      const label = m.kind === 'people' ? `¡${num(m.threshold)} PERSONAS!` : `¡${num(m.threshold)} PASOS!`
      triggerComic('¡HITO HISTÓRICO EN LA MANI!', label, 4200)
      flash(`${label} La mani acaba de alcanzar un hito. ¡Momento épico!`, 'photo')
      reloadTimer ??= setTimeout(() => { reloadTimer = null; load() }, 4000)
    })
    source.addEventListener('deploy', e => {
      const { delta } = JSON.parse(e.data)
      if (delta > 0) flash(`+${delta} unidades se unen a la mani`)
      clearTimeout(reloadTimer)
      reloadTimer = setTimeout(() => { reloadTimer = null; load() }, 15000)
    })
    return () => { source.close(); clearTimeout(reloadTimer) }
  }, [causeId, load, flash, triggerComic])

  const onFocus = useCallback(block => {
    setFocus(block)
    if (rig.current.mode !== 'traveling') return
    const special = block.specials.find(s => SPECIAL_NAMES[s.type])
    if (block.epic && block.owner) {
      const who = block.owner.displayName.toUpperCase()
      const what = special ? SPECIAL_NAMES[special.type] : block.rarest?.rarity === 'legendary' ? `la unidad legendaria ${block.rarest.name}` : 'un bloque épico'
      triggerComic(`¡LLEGA ${what.toUpperCase()} DE ${who}!`, BANGS[block.index % BANGS.length])
      flash(`Momento épico: ${block.title}`, 'photo')
    }
  }, [triggerComic, flash])

  useEffect(() => {
    if (!ui.sound || !ui.voice || !focus || lastSpoken.current === focus.key) return
    const text = focus.placard?.text ?? (focus.counts.megaphone ? scene?.cause.title : null)
    if (!text) return
    lastSpoken.current = focus.key
    audio.speak(text)
  }, [focus, ui.sound, ui.voice, audio, scene])

  const jumpMine = useCallback(() => {
    const mine = march?.blocks.find(b => scene.blocks[b.index]?.mine)
    if (!mine) return
    rig.current.s = mine.z0 - 4
    setUi(u => ({ ...u, mode: 'traveling' }))
  }, [march, scene])

  if (error && !scene) return <div className="main"><div className="alert error">{error.message}</div></div>
  if (!scene || !march || !fontsOk) return <div className="march-loading"><span className="onomatopeya">¡A LA CALLE!</span><p className="muted">Recortando manifestantes…</p></div>

  const { cause, stats } = scene
  const selectedBlock = selected ? march.blocks.find(b => b.figures.some(f => f.key === selected.key)) : null
  const mineExists = scene.blocks.some(b => b.mine)

  return (
    <div className={`scene-shell march-shell${comic ? ' comic' : ''}${photo ? ' photo' : ''} tod-${ui.timeOfDay}`}>
      <MarchScene march={march} cause={cause} stats={stats} rig={rig} audio={ui.sound ? audio : null} timeOfDay={ui.timeOfDay}
        onomatopoeias={onos} onFocus={onFocus} onProgress={setProgress} onLoop={() => flash('Vuelta a la cabecera: la mani no termina nunca')}
        onSelect={setSelected} captureRef={captureRef} paused={ui.paused} />
      <ComicPanel comic={comic} />

      {!photo && (
        <>
          <div className="scene-hud">
            <div className="scene-panel march-title">
              <div className="row" style={{ gap: '.5rem' }}>
                <span className="march-icon" style={{ background: cause.color }}>{cause.icon}</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.45rem' }}>{cause.title}</h2>
                  <p style={{ margin: 0, fontSize: '.9rem' }}><b>Exigimos:</b> {cause.demand} <span className="muted">→ {cause.target}</span></p>
                </div>
              </div>
            </div>
            <div className="scene-panel march-stats" aria-live="polite">
              <div className="stat"><b>{num(stats.uniquePeople)}</b><span>personas reales</span></div>
              <div className="stat"><b>{num(stats.totalSteps)}</b><span>pasos · {km(stats.totalSteps)}</span></div>
              <div className="stat"><b>{num(ui.faithful ? stats.uniquePeople : stats.figures)}</b><span>{ui.faithful ? 'figuras: 1 por persona' : `figuras en ${num(stats.blocks)} bloques`}</span></div>
              {live > 0 && <div className="stat"><b><span className="live-dot" /> +{num(live)}</b><span>pasos en directo</span></div>}
            </div>
          </div>
          <TravelHud march={march} focus={focus} progress={progress} rig={rig} ui={ui} setUi={setUi}
            onPhoto={() => { setPhoto(true); setPreset('actual') }} onJumpMine={jumpMine} hasMine={mineExists}
            levelOk={{ night: !profile || level >= 8 }} />
          {!profile && <Link className="btn pink march-join" to="/registro">Únete a esta mani</Link>}
          {profile && <Link className="btn kraft march-join" to="/cuartel">Enviar unidades</Link>}
        </>
      )}

      {photo && (
        <PhotoMode capture={() => captureRef.current.capture()} cause={cause} stats={stats} focus={focus} level={profile ? level : 30}
          timeOfDay={ui.timeOfDay} setTimeOfDay={t => setUi(u => ({ ...u, timeOfDay: t }))} preset={preset} setPreset={setPreset}
          onClose={() => setPhoto(false)} />
      )}

      <FigureCard fig={selected} block={selectedBlock} onClose={() => setSelected(null)} />

      {toast && (
        <div className="march-toast scene-panel" key={toast.id}>
          <span>{toast.text}</span>
          {toast.action === 'photo' && !photo && <button className="btn small pink" onClick={() => { setPhoto(true); setPreset(focus ? 'bloque' : 'actual') }}>📷 Capturar</button>}
        </div>
      )}
    </div>
  )
}

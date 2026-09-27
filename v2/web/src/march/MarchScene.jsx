import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { RISO_INKS, EFFECT_COLORS, createRng } from '@manifiest/shared'
import antonUrl from '@fontsource/anton/files/anton-latin-400-normal.woff?url'
import { blockAt, HEAD_DEPTH, LANES, LANE_GAP } from './layout.js'
import { ONOMATOPOEIA } from './audio.js'
import {
  FigureTextures, FIG_ASPECT, quickFigureTexture, carpetTexture, blockPanelTexture, signTexture, headBannerTexture, bannerTexture,
  whaleTexture, dragonTextures, doveTexture, lanternTexture, rainbowTexture, mosaicTexture, glowTexture, puffTexture,
  roadTexture, groundTexture, buildingTexture, treeTexture, lampTexture, cloudTexture, skyTexture
} from './textures.js'

const NEAR = 30
const MID = 150
const HYST = 5
const MARCH_SPEED = 1.1
const TRAVEL_SPEED = 1.7
const STREET_HALF = (LANES * LANE_GAP) / 2 + 1.6
const FIG_H = 2
const DAY = {
  day: { hemi: ['#ffffff', '#C9A26B', 1.25], dir: 1.1, fog: '#EFE3CC', lamps: false },
  dusk: { hemi: ['#FFD2A6', '#8A5A48', 1.1], dir: 0.8, fog: '#F2B37E', lamps: true },
  night: { hemi: ['#A9B2F0', '#3D2B55', 1.05], dir: 0.25, fog: '#241E44', lamps: true }
}

const geoCache = new Map()
function plane(w, h) {
  const key = `${w.toFixed(3)}x${h.toFixed(3)}`
  if (!geoCache.has(key)) geoCache.set(key, new THREE.PlaneGeometry(w, h))
  return geoCache.get(key)
}

function yaw(obj, cam, rate = 0.18) {
  const target = Math.atan2(cam.x - obj.position.x, cam.z - obj.position.z)
  let diff = target - obj.rotation.y
  diff = Math.atan2(Math.sin(diff), Math.cos(diff))
  obj.rotation.y += diff * rate
}

function useMaterial(opts, deps = []) {
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ alphaTest: 0.5, side: THREE.DoubleSide, ...opts }), deps)
  useEffect(() => () => mat.dispose(), [mat])
  return mat
}

const Figure = memo(forwardRef(function Figure({ fig, textures, onSelect }, ref) {
  const alive = useRef(true)
  const [tex, setTex] = useState(() => textures.request(fig, t => alive.current && setTex(t)))
  useEffect(() => () => { alive.current = false }, [])
  const mat = useMaterial({ map: tex ?? quickFigureTexture(fig) }, [])
  useEffect(() => {
    mat.map = tex ?? quickFigureTexture(fig)
    mat.needsUpdate = true
  }, [tex, mat, fig])
  const h = FIG_H * fig.scale
  const w = h * FIG_ASPECT
  return (
    <mesh ref={ref} geometry={plane(w, h)} material={mat} position={[fig.x, h / 2 - 0.1, fig.z]}
      userData={{ baseY: h / 2 - 0.1, fig }}
      onClick={e => { e.stopPropagation(); onSelect?.(fig) }} />
  )
}))

function Sign({ block, cause, position, scale = 1 }) {
  const mat = useMaterial({ map: signTexture(block, cause) }, [block.key, block.placard?.text])
  const ref = useRef()
  const { camera } = useThree()
  useFrame(() => ref.current && yaw(ref.current, camera.position, 0.1))
  return <mesh ref={ref} position={position} geometry={plane(4.2 * scale, 1.8 * scale)} material={mat} />
}

function Banner({ s, fallback }) {
  const mat = useMaterial({ map: bannerTexture(s.text ?? fallback, s.colors) }, [s.text, fallback, s.colors.primary])
  const ref = useRef()
  const { camera } = useThree()
  useFrame(({ clock }) => {
    if (!ref.current) return
    yaw(ref.current, camera.position, 0.08)
    ref.current.position.y = 1.75 + Math.sin(clock.elapsedTime * 2.4) * 0.04
  })
  return <mesh ref={ref} position={[0, 1.75, s.z]} geometry={plane(s.width, s.width * 0.17)} material={mat} />
}

function Dragon({ s }) {
  const tex = dragonTextures(s.colors)
  const headMat = useMaterial({ map: tex.head }, [tex])
  const segMat = useMaterial({ map: tex.segment }, [tex])
  const refs = useRef([])
  const { camera } = useThree()
  const segments = 9
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((m, i) => {
      if (!m) return
      const k = i / segments
      m.position.set(Math.sin(t * 1.8 - i * 0.7) * 0.9, 2.55 + Math.sin(t * 3.2 - i * 0.9) * 0.28, s.z - 0.6 + k * (s.length + 0.8))
      yaw(m, camera.position, 0.2)
    })
  })
  return (
    <group>
      {Array.from({ length: segments + 1 }, (_, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el }} geometry={i === 0 ? plane(1.9, 1.6) : plane(1.5, 1.15)} material={i === 0 ? headMat : segMat} renderOrder={segments - i} />
      ))}
    </group>
  )
}

function Floating({ s, kind }) {
  const tex = kind === 'whale' ? whaleTexture(s.colors) : rainbowTexture()
  const mat = useMaterial({ map: tex }, [tex])
  const ref = useRef()
  const { camera } = useThree()
  const w = kind === 'whale' ? 5.2 : s.width + 2.2
  const h = kind === 'whale' ? 2.15 : (s.width + 2.2) * 0.156
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.position.set(Math.sin(t * 0.5) * 0.4, (kind === 'whale' ? 3.3 : 2.75) + Math.sin(t * 1.3) * 0.18, s.z)
    yaw(ref.current, camera.position, 0.05)
    ref.current.rotation.z = Math.sin(t * 0.9) * (kind === 'whale' ? 0.08 : 0.03)
  })
  return <mesh ref={ref} geometry={plane(w, h)} material={mat} />
}

function Mosaic({ s, cause }) {
  const mat = useMaterial({ map: mosaicTexture(cause.icon, cause.color) }, [cause.icon, cause.color])
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const phase = (clock.elapsedTime % 9) / 9
    ref.current.scale.y = phase < 0.1 ? Math.cos(phase * 10 * Math.PI) : 1
  })
  return <mesh ref={ref} position={[0, 2.35, s.z]} rotation={[-Math.PI / 2, 0, 0]} geometry={plane(5.4, 4.05)} material={mat} />
}

function Doves({ s, night }) {
  const mat = useMaterial({ map: doveTexture() }, [])
  const refs = useRef([])
  const { camera } = useThree()
  const n = 10
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((m, i) => {
      if (!m) return
      const a = t * 0.7 + (i / n) * Math.PI * 2
      const r = 2.2 + (i % 3) * 0.7
      m.position.set(s.x * 0.3 + Math.cos(a) * r, 4.2 + Math.sin(t * 1.7 + i) * 0.5 + (i % 2) * 0.6, s.z + Math.sin(a) * r * 0.7)
      m.scale.y = 0.35 + Math.abs(Math.sin(t * 11 + i)) * 0.65
      yaw(m, camera.position, 0.3)
    })
  })
  return Array.from({ length: n }, (_, i) => <mesh key={i} ref={el => { refs.current[i] = el }} geometry={plane(0.8, 0.6)} material={mat} />)
}

function Lanterns({ s, night }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: lanternTexture(), alphaTest: 0.5, side: THREE.DoubleSide }), [])
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ map: glowTexture('#FFB511'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: night ? 0.9 : 0 }), [night])
  useEffect(() => () => { mat.dispose(); glow.dispose() }, [mat, glow])
  const refs = useRef([])
  const { camera } = useThree()
  const rng = useMemo(() => createRng(`lan:${s.unitId}`), [s.unitId])
  const offsets = useMemo(() => Array.from({ length: 6 }, () => [(rng() - 0.5) * 4, 3 + rng() * 1.2, (rng() - 0.5) * 2.5, rng() * 6]), [rng])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((g, i) => {
      if (!g) return
      const [x, y, z, p] = offsets[i]
      g.position.set(x, y + Math.sin(t * 1.2 + p) * 0.2, s.z + z)
      yaw(g, camera.position, 0.3)
    })
  })
  return offsets.map((_, i) => (
    <group key={i} ref={el => { refs.current[i] = el }}>
      <mesh geometry={plane(0.55, 0.72)} material={mat} />
      <mesh geometry={plane(2.2, 2.2)} material={glow} position={[0, 0, -0.01]} />
    </group>
  ))
}

function Smoke({ s }) {
  const mats = useMemo(() => [s.colors.primary, s.colors.secondary].map(c => new THREE.MeshBasicMaterial({ map: puffTexture(), color: c, transparent: true, depthWrite: false, opacity: 0.6 })), [s.colors.primary, s.colors.secondary])
  useEffect(() => () => mats.forEach(m => m.dispose()), [mats])
  const refs = useRef([])
  const { camera } = useThree()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((m, i) => {
      if (!m) return
      const p = (t * 0.22 + i / 12) % 1
      m.position.set(s.x + Math.sin(i * 2.1) * p * 1.4, 2.1 + p * 4, s.z + Math.cos(i * 1.7) * p * 1.2 + p * 2)
      m.scale.setScalar(0.5 + p * 2.4)
      m.material.opacity = 0.75 * (1 - p)
      yaw(m, camera.position, 1)
    })
  })
  return Array.from({ length: 12 }, (_, i) => <mesh key={i} ref={el => { refs.current[i] = el }} geometry={plane(1, 1)} material={mats[i % 2].clone()} />)
}

function Effects({ figures }) {
  const withFx = figures.filter(f => f.loadout?.effect && EFFECT_COLORS[f.loadout.effect]).slice(0, 24)
  const count = withFx.length * 14
  const { positions, colors, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const seeds = []
    withFx.forEach((f, fi) => {
      const palette = EFFECT_COLORS[f.loadout.effect]
      for (let k = 0; k < 14; k++) {
        const c = new THREE.Color(palette[k % palette.length])
        colors.set([c.r, c.g, c.b], (fi * 14 + k) * 3)
        seeds.push({ f, k, fall: f.loadout.effect !== 'effect_aurora' })
      }
    })
    return { positions, colors, seeds }
  }, [withFx.map(f => f.key).join(), count])
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    seeds.forEach((s, i) => {
      const p = (t * 0.35 + s.k / 14) % 1
      const a = s.k * 2.4 + t
      positions[i * 3] = s.f.x + Math.cos(a) * 0.6
      positions[i * 3 + 1] = s.fall ? 3.4 - p * 2.6 : 2.6 + Math.sin(a) * 0.3
      positions[i * 3 + 2] = s.f.z + Math.sin(a) * 0.6
    })
    ref.current.geometry.attributes.position.needsUpdate = true
  })
  if (!count) return null
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.14} vertexColors />
    </points>
  )
}

function Specials({ block, cause, night, full }) {
  return block.specials.map((s, i) => {
    const key = `${s.type}-${i}`
    if (s.type === 'banner') return <Banner key={key} s={s} fallback={cause.title} />
    if (s.type === 'dragon') return <Dragon key={key} s={s} />
    if (s.type === 'whale' || s.type === 'rainbow') return <Floating key={key} s={s} kind={s.type} />
    if (s.type === 'mosaic') return <Mosaic key={key} s={s} cause={cause} />
    if (!full) return null
    if (s.type === 'doves') return <Doves key={key} s={s} night={night} />
    if (s.type === 'lanterns') return <Lanterns key={key} s={s} night={night} />
    if (s.type === 'smoke') return <Smoke key={key} s={s} />
    return null
  })
}

function NearBlock({ block, cause, textures, night, onSelect }) {
  const refs = useRef([])
  const { camera } = useThree()
  useEffect(() => {
    textures.prioritize(block.figures.map(f => f.key))
  }, [block, textures])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const cam = camera.position
    for (const m of refs.current) {
      if (!m) continue
      const f = m.userData.fig
      m.position.y = m.userData.baseY + Math.abs(Math.sin(t * f.speed * 0.5 + f.phase)) * (f.scale > 1.5 ? 0.12 : 0.07)
      m.rotation.z = Math.sin(t * f.speed * 0.25 + f.phase) * (f.scale > 1.5 ? 0.07 : 0.035)
      yaw(m, cam, 0.16)
    }
  })
  return (
    <group>
      <Sign block={block} cause={cause} position={[0, 2.4, block.z0 + 0.7]} />
      {block.figures.map((f, i) => <Figure key={f.key} ref={el => { refs.current[i] = el }} fig={f} textures={textures} onSelect={onSelect} />)}
      <Specials block={block} cause={cause} night={night} full />
      <Effects figures={block.figures} />
    </group>
  )
}

function Carpet({ block }) {
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ map: carpetTexture(block), transparent: true, depthWrite: false }), [block])
  useEffect(() => () => mat.dispose(), [mat])
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, (block.z0 + block.z1) / 2]} geometry={plane(10, block.z1 - block.z0)} material={mat} renderOrder={1} />
}

function MidBlock({ block, cause, night, aerial }) {
  const mat = useMaterial({ map: blockPanelTexture(block) }, [block.key])
  const ref = useRef()
  const { camera } = useThree()
  const len = block.z1 - block.z0
  useFrame(({ clock }) => {
    if (!ref.current) return
    yaw(ref.current, camera.position, 0.2)
    ref.current.position.y = 1.4 + Math.abs(Math.sin(clock.elapsedTime * 3 + block.index)) * 0.05
  })
  return (
    <group>
      <Carpet block={block} />
      {!aerial && <mesh ref={ref} position={[0, 1.4, block.center]} geometry={plane(Math.min(9, 5 + len * 0.3), 3.2)} material={mat} />}
      <Sign block={block} cause={cause} position={[0, aerial ? 2.2 : 3.6, block.z0 + 0.7]} scale={aerial ? 1.6 : 1.2} />
      <Specials block={block} cause={cause} night={night} full={false} />
    </group>
  )
}

function FarLayer({ march, lods }) {
  const tiles = useRef()
  const strips = useRef()
  const n = march.blocks.length
  useEffect(() => {
    const d = new THREE.Object3D()
    const c = new THREE.Color()
    march.blocks.forEach((b, i) => {
      const far = lods[i] === 2
      const len = b.z1 - b.z0
      d.position.set(0, 0.06, b.center)
      d.scale.set(far ? LANES * LANE_GAP : 0, 1, far ? len : 0)
      d.updateMatrix()
      tiles.current.setMatrixAt(i, d.matrix)
      tiles.current.setColorAt(i, c.set(b.dominant[0] ?? '#FF48B0'))
      d.position.set(0, 0.7, b.center)
      d.scale.set(far ? LANES * LANE_GAP * 0.85 : 0, far ? 1 : 0, far ? len * 0.8 : 0)
      d.updateMatrix()
      strips.current.setMatrixAt(i, d.matrix)
      strips.current.setColorAt(i, c.set(b.dominant[1] ?? b.dominant[0] ?? '#0078BF'))
    })
    for (const m of [tiles.current, strips.current]) {
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  }, [march, lods])
  return (
    <group>
      <instancedMesh ref={tiles} args={[null, null, n]}><boxGeometry args={[1, 0.1, 1]} /><meshLambertMaterial /></instancedMesh>
      <instancedMesh ref={strips} args={[null, null, n]}><boxGeometry args={[1, 1.4, 1]} /><meshLambertMaterial /></instancedMesh>
    </group>
  )
}

function Crowd({ march, cause, textures, night, onSelect, lodsRef }) {
  const { camera } = useThree()
  const [lods, setLods] = useState(() => march.blocks.map(() => 2))
  const [aerial, setAerial] = useState(false)
  const current = useRef(lods)
  const acc = useRef(1)
  useFrame((_, dt) => {
    textures.pump()
    acc.current += dt
    if (acc.current < 0.2) return
    acc.current = 0
    const cam = camera.position
    const high = cam.y > 11
    if (high !== aerial) setAerial(high)
    const next = current.current.slice()
    let changed = false
    march.blocks.forEach((b, i) => {
      const half = (b.z1 - b.z0) / 2
      const dz = Math.max(0, Math.abs(cam.z - b.center) - half)
      const d = Math.hypot(cam.x, cam.y - 1, dz)
      const prev = next[i]
      let lod = d < NEAR ? 0 : d < MID ? 1 : 2
      if (prev === 0 && lod === 1 && d < NEAR + HYST) lod = 0
      if (high && lod === 0) lod = 1
      if (prev === 1 && lod === 2 && d < MID + HYST) lod = 1
      if (lod !== prev) { next[i] = lod; changed = true }
    })
    if (changed) {
      current.current = next
      lodsRef.current = next
      setLods(next)
    }
  })
  return (
    <group>
      {march.blocks.map((b, i) => lods[i] === 0
        ? <NearBlock key={b.key} block={b} cause={cause} textures={textures} night={night} onSelect={onSelect} />
        : lods[i] === 1 ? <MidBlock key={b.key} block={b} cause={cause} night={night} aerial={aerial} /> : null)}
      <FarLayer march={march} lods={lods} />
    </group>
  )
}

function HeadBanner({ cause }) {
  const mat = useMaterial({ map: headBannerTexture(cause) }, [cause.id, cause.title])
  const ref = useRef()
  const { camera } = useThree()
  useFrame(({ clock }) => {
    if (!ref.current) return
    yaw(ref.current, camera.position, 0.05)
    ref.current.position.y = 2.6 + Math.sin(clock.elapsedTime * 2) * 0.05
  })
  return <mesh ref={ref} position={[0, 2.6, HEAD_DEPTH - 2.5]} geometry={plane(12, 2.46)} material={mat} />
}

function Markers({ march }) {
  return march.markers.map(m => (
    <Billboard key={m.people} position={[STREET_HALF + 1.2, 6, m.z]}>
      <mesh position={[0, -2.6, -0.02]}><planeGeometry args={[0.14, 5.4]} /><meshBasicMaterial color="#8B5A2B" /></mesh>
      <mesh><planeGeometry args={[4.4, 1.6]} /><meshBasicMaterial color="#FFFDF6" /></mesh>
      <Text font={antonUrl} fontSize={0.62} color={RISO_INKS.ink} position={[0, 0.2, 0.01]} anchorX="center" anchorY="middle">{m.people.toLocaleString('es-ES')}</Text>
      <Text font={antonUrl} fontSize={0.28} color={RISO_INKS.fluoPink} position={[0, -0.42, 0.01]} anchorX="center" anchorY="middle">PERSONAS HASTA AQUÍ</Text>
    </Billboard>
  ))
}

function scrollZ(base, scroll, camZ, back, span) {
  const start = camZ - back
  return start + ((((base - scroll - start) % span) + span) % span)
}

function City({ timeOfDay, paused }) {
  const { camera, scene } = useThree()
  const road = useMemo(() => { const t = roadTexture().clone(); t.needsUpdate = true; t.repeat.set(1, 60); return t }, [])
  const ground = useMemo(() => { const t = groundTexture().clone(); t.needsUpdate = true; t.repeat.set(120, 200); return t }, [])
  const roadRef = useRef()
  const groundRef = useRef()
  const scroll = useRef(0)
  const BACK = 70
  const SPAN = 240
  const night = DAY[timeOfDay].lamps
  const props = useMemo(() => {
    const rng = createRng('city')
    const list = []
    for (const side of [-1, 1]) {
      for (let i = 0; i < 30; i++) {
        const b = buildingTexture(`${side}:${i}`)
        const h = 7 + rng() * 5
        list.push({ kind: 'building', side, base: i * 8 + rng() * 2, x: side * (STREET_HALF + 5.5 + rng() * 1.5), h, w: h * b.aspect, tex: b.texture, tilt: (rng() - 0.5) * 0.12 })
      }
      for (let i = 0; i < 15; i++) {
        const b = buildingTexture(`back:${side}:${i}`)
        const h = 11 + rng() * 7
        list.push({ kind: 'back', side, base: i * 16 + rng() * 4, x: side * (STREET_HALF + 16 + rng() * 4), h, w: h * b.aspect, tex: b.texture, tilt: 0 })
      }
      for (let i = 0; i < 24; i++) list.push({ kind: i % 2 ? 'lamp' : 'tree', side, base: i * 10 + 4, x: side > 0 ? STREET_HALF + 12 : -(STREET_HALF + 1.3), h: i % 2 ? 4.2 : 4.4, w: i % 2 ? 1.26 : 2.9, tex: i % 2 ? lampTexture() : treeTexture(i), tilt: 0 })
    }
    for (let i = 0; i < 10; i++) list.push({ kind: 'cloud', side: 0, base: i * 24, x: (rng() - 0.5) * 120, y: 30 + rng() * 18, h: 6, w: 14, tex: cloudTexture(i), tilt: 0 })
    return list
  }, [])
  const mats = useMemo(() => props.map(p => new THREE.MeshLambertMaterial({
    map: p.tex, alphaTest: 0.5, side: THREE.DoubleSide,
    color: p.kind === 'back' ? new THREE.Color('#c9c3d9') : new THREE.Color('#ffffff'),
    emissive: new THREE.Color(p.kind === 'cloud' ? '#ffffff' : '#000000'), emissiveIntensity: p.kind === 'cloud' ? 0.3 : 0
  })), [props])
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ map: glowTexture('#FFD27A'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), [])
  useEffect(() => () => { mats.forEach(m => m.dispose()); glowMat.dispose(); road.dispose(); ground.dispose() }, [mats, glowMat, road, ground])
  const refs = useRef([])

  useEffect(() => {
    scene.background = skyTexture(timeOfDay)
    glowMat.opacity = night ? 0.85 : 0
  }, [timeOfDay, scene, glowMat, night])

  useFrame((_, dt) => {
    if (!paused) scroll.current += dt * MARCH_SPEED
    const camZ = camera.position.z
    road.offset.y = -(scroll.current / 8.5) % 1
    ground.offset.y = -(scroll.current / 8) % 1
    roadRef.current.position.z = camZ
    groundRef.current.position.z = camZ
    road.offset.y += camZ / 8.5
    ground.offset.y += camZ / 8
    props.forEach((p, i) => {
      const m = refs.current[i]
      if (!m) return
      const speed = p.kind === 'cloud' ? 0.15 : p.kind === 'back' ? 1 : 1
      const z = scrollZ(p.base, scroll.current * speed, camZ, BACK, SPAN)
      const d = z - camZ
      const pop = THREE.MathUtils.smoothstep(SPAN - BACK - d, 0, 22) * THREE.MathUtils.smoothstep(d + BACK, 0, 10)
      const h = p.h * Math.max(0.001, p.kind === 'cloud' ? 1 : pop)
      m.position.set(p.x, p.kind === 'cloud' ? p.y : h / 2, z)
      m.scale.set(1, Math.max(0.001, p.kind === 'cloud' ? 1 : pop), 1)
      m.rotation.set(p.kind === 'cloud' ? 0 : p.tilt, p.kind === 'cloud' ? 0 : p.side > 0 ? -Math.PI / 2 : Math.PI / 2, 0)
    })
  })

  return (
    <group>
      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[1600, 1600]} />
        <meshLambertMaterial map={ground} />
      </mesh>
      <mesh ref={roadRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[STREET_HALF * 2, 480]} />
        <meshLambertMaterial map={road} />
      </mesh>
      {props.map((p, i) => (
        <group key={i} ref={el => { refs.current[i] = el }}>
          <mesh geometry={plane(p.w, p.h)} material={mats[i]} />
          {p.kind === 'lamp' && <mesh position={[0, p.h / 2 - 0.55, 0.05]} geometry={plane(3.4, 3.4)} material={glowMat} />}
        </group>
      ))}
    </group>
  )
}

function Onomatopoeias({ items }) {
  const { camera } = useThree()
  const refs = useRef({})
  useFrame(() => {
    const now = performance.now()
    for (const item of items) {
      const g = refs.current[item.id]
      if (!g) continue
      const age = (now - item.born) / 1000
      const pop = age < 0.25 ? THREE.MathUtils.lerp(0.2, 1.15, age / 0.25) : age < 0.4 ? THREE.MathUtils.lerp(1.15, 1, (age - 0.25) / 0.15) : 1
      const fade = age > 2 ? Math.max(0, 1 - (age - 2) / 0.5) : 1
      g.scale.setScalar(pop * item.size * Math.max(0.001, fade))
      g.position.y = item.y + age * 0.35
      g.lookAt(camera.position)
      g.rotateZ(item.rot)
    }
  })
  return items.map(item => (
    <group key={item.id} ref={el => { refs.current[item.id] = el }} position={[item.x, item.y, item.z]}>
      <Text font={antonUrl} fontSize={0.9} color={RISO_INKS.fluoPink} position={[0.07, -0.07, -0.02]} anchorX="center" anchorY="middle" maxWidth={9} textAlign="center">{item.text}</Text>
      <Text font={antonUrl} fontSize={0.9} color={RISO_INKS.yellow} outlineWidth={0.07} outlineColor={RISO_INKS.ink} anchorX="center" anchorY="middle" maxWidth={9} textAlign="center">{item.text}</Text>
    </group>
  ))
}

function presetCamera(preset, march, focus) {
  const L = march.length
  const c = focus?.center ?? 10
  switch (preset) {
    case 'rio': return { pos: [3, Math.min(48, 16 + L * 0.05), -10], look: [0, 0, Math.min(L * 0.35, 110)] }
    case 'cabecera': return { pos: [1.2, 1.5, HEAD_DEPTH - 12], look: [0, 2.3, HEAD_DEPTH + 4] }
    case 'bloque': return { pos: [5.2, 2, c - 2.5], look: [0, 1.4, c] }
    case 'pancarta': return { pos: [2.4, 2.3, (focus?.z0 ?? 6) - 3.2], look: [0, 2.3, (focus?.z0 ?? 6) + 0.7] }
    case 'contrapicado': return { pos: [2.6, 0.35, c - 4], look: [0, 3.2, c + 2] }
    default: return null
  }
}

function CameraDirector({ march, rig, onFocus, onProgress, onLoop }) {
  const { camera } = useThree()
  const controls = useRef()
  const look = useRef(new THREE.Vector3(0, 1.5, 8))
  const lastFocus = useRef(-1)
  const acc = useRef(0)
  const tilt = useRef(0)
  const lastPreset = useRef(null)

  useFrame(({ clock }, dt) => {
    const r = rig.current
    const t = clock.elapsedTime
    const focusBlock = blockAt(march, r.s + 1.8)
    if (focusBlock && focusBlock.index !== lastFocus.current) {
      lastFocus.current = focusBlock.index
      onFocus(focusBlock)
    }
    if (r.mode === 'traveling' || r.mode === 'dron') {
      if (!r.paused) {
        const slow = focusBlock?.epic ? 0.55 : 1
        r.s += dt * (r.mode === 'dron' ? TRAVEL_SPEED * 2.2 : TRAVEL_SPEED) * r.speed * slow
        if (r.s > march.length + 3) { r.s = -6; onLoop?.() }
      }
      const target = r.mode === 'dron'
        ? new THREE.Vector3(2, 30, r.s - 18)
        : new THREE.Vector3(r.side * 10.5, 3 + Math.sin(t * 0.35) * 0.12, r.s - 3.5)
      const lookTarget = r.mode === 'dron' ? new THREE.Vector3(0, 0, r.s + 18) : new THREE.Vector3(0, 1.6, r.s + 3)
      if (r.comic && focusBlock) {
        target.set(r.side * 4.2, 1.1, focusBlock.center - 3.2)
        lookTarget.set(0, 2.2, focusBlock.center)
      }
      camera.position.lerp(target, r.comic ? 0.05 : 0.08)
      look.current.lerp(lookTarget, 0.08)
      camera.lookAt(look.current)
      tilt.current = THREE.MathUtils.lerp(tilt.current, r.comic ? 0.14 * r.side : 0, 0.06)
      camera.rotateZ(tilt.current)
      if (controls.current) controls.current.enabled = false
    } else {
      if (controls.current) controls.current.enabled = true
      if (r.preset && r.preset !== lastPreset.current) {
        const p = presetCamera(r.preset, march, focusBlock)
        if (p) {
          camera.position.set(...p.pos)
          controls.current?.target.set(...p.look)
          controls.current?.update()
        }
      }
    }
    lastPreset.current = r.mode === 'traveling' ? null : r.preset
    acc.current += dt
    if (acc.current > 0.25) {
      acc.current = 0
      onProgress?.(Math.max(0, Math.min(1, r.s / march.length)))
    }
  })
  return <OrbitControls ref={controls} makeDefault enabled={false} maxPolarAngle={Math.PI / 2.02} minDistance={1.5} maxDistance={400} />
}

function AudioBridge({ audio, march, cause, lodsRef, people }) {
  const { camera } = useThree()
  const acc = useRef(0)
  useEffect(() => { audio?.setCrowd(people) }, [audio, people])
  useFrame((_, dt) => {
    if (!audio?.running) return
    audio.setListener(camera)
    acc.current += dt
    if (acc.current < 0.2) return
    acc.current = 0
    const cam = camera.position
    const list = []
    march.blocks.forEach((b, i) => {
      if ((lodsRef.current[i] ?? 2) === 2) return
      const d = Math.hypot(cam.x, cam.y - 1.5, cam.z - b.center)
      if (d > 48) return
      list.push({ key: b.key, d, position: [0, 1.6, b.center], counts: b.counts, text: b.placard?.text ?? cause.title })
    })
    list.sort((a, b) => a.d - b.d)
    audio.updateEmitters(list)
  })
  return null
}

const Capture = forwardRef(function Capture(_, ref) {
  const { gl, scene, camera } = useThree()
  useImperativeHandle(ref, () => ({
    capture() {
      gl.render(scene, camera)
      return gl.domElement.toDataURL('image/png')
    }
  }), [gl, scene, camera])
  return null
})

function Lights({ timeOfDay }) {
  const d = DAY[timeOfDay]
  return (
    <>
      <hemisphereLight args={[d.hemi[0], d.hemi[1], d.hemi[2]]} />
      <directionalLight position={[30, 40, -20]} intensity={d.dir} />
      <fog attach="fog" args={[d.fog, 60, 260]} />
    </>
  )
}

export default function MarchScene({ march, cause, stats, rig, audio, timeOfDay, onomatopoeias, onFocus, onProgress, onLoop, onSelect, captureRef, paused }) {
  const textures = useMemo(() => new FigureTextures(900), [])
  const lodsRef = useRef([])
  return (
    <Canvas dpr={[1, 1.8]} camera={{ fov: 46, near: 0.1, far: 900, position: [8, 2.6, -10] }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <Lights timeOfDay={timeOfDay} />
      <City timeOfDay={timeOfDay} paused={paused} />
      <HeadBanner cause={cause} />
      <Crowd march={march} cause={cause} textures={textures} night={DAY[timeOfDay].lamps} onSelect={onSelect} lodsRef={lodsRef} />
      <Markers march={march} />
      <Onomatopoeias items={onomatopoeias} />
      <CameraDirector march={march} rig={rig} onFocus={onFocus} onProgress={onProgress} onLoop={onLoop} />
      <AudioBridge audio={audio} march={march} cause={cause} lodsRef={lodsRef} people={stats.uniquePeople} />
      <Capture ref={captureRef} />
    </Canvas>
  )
}

export function pickOnomatopoeia(kind, text) {
  if (kind === 'chant' && text) {
    const t = text.toUpperCase()
    return `¡${t.length > 28 ? `${t.slice(0, 26)}…` : t}!`
  }
  const list = ONOMATOPOEIA[kind]
  return list ? list[Math.floor(Math.random() * list.length)] : null
}

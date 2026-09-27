import { useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { UNIT_ROLES, RISO_INKS, createRng, PALETTE_OVERRIDES } from '@manifiest/shared'
import antonUrl from '@fontsource/anton/files/anton-latin-400-normal.woff?url'

const MAX_FIGURES = 5000
const LANES = 14
const ROW_GAP = 1.05
const LANE_GAP = 1.05
const BUILDING_COLORS = [RISO_INKS.fluoPink, RISO_INKS.blue, RISO_INKS.yellow, RISO_INKS.mint, RISO_INKS.orange, RISO_INKS.purple, RISO_INKS.teal]

export const THEMES = {
  theme_plaza: { sky: '#CFE8F0', ground: '#E9DFC9', road: '#3D3A55', fog: '#CFE8F0' },
  theme_litoral: { sky: '#BDE6F5', ground: '#F3E2B3', road: '#5B7C99', fog: '#BDE6F5' },
  theme_neon: { sky: '#120F2A', ground: '#1D1B2F', road: '#2A2650', fog: '#120F2A' },
  theme_bosque: { sky: '#D6EDD2', ground: '#9CC58F', road: '#5C4A3A', fog: '#D6EDD2' }
}

function paletteOf(unit) {
  const o = unit.loadout?.palette ? PALETTE_OVERRIDES[unit.loadout.palette] : null
  return { primary: o?.[0] ?? unit.genome.primary, secondary: o?.[1] ?? unit.genome.secondary }
}

export function buildFigures(scene, faithful) {
  const figures = []
  if (faithful) {
    for (const p of scene.people) figures.push({ ...p.genome, special: null, scale: 1 })
    return figures
  }
  const ordered = [...scene.units].sort((a, b) => (UNIT_ROLES[b.role]?.cost ?? 1) - (UNIT_ROLES[a.role]?.cost ?? 1))
  for (const unit of ordered) {
    const role = UNIT_ROLES[unit.role]
    const colors = paletteOf(unit)
    for (let i = 0; i < (role?.figures ?? 1); i++) {
      figures.push({
        ...unit.genome, ...colors,
        special: i === 0 ? unit.role : null,
        effect: i === 0 ? unit.loadout?.effect : null,
        scale: unit.role === 'puppet_giant' ? 2.4 : unit.role === 'float' ? 1.1 : 1
      })
    }
  }
  for (const p of scene.people) if (!p.hasUnits) figures.push({ ...p.genome, special: null, scale: 1 })
  return figures
}

function layout(figures) {
  const rng = createRng('layout')
  return figures.slice(0, MAX_FIGURES).map((f, i) => {
    const row = Math.floor(i / LANES)
    const lane = i % LANES
    return {
      ...f,
      x: (lane - (LANES - 1) / 2) * LANE_GAP + (rng() - 0.5) * 0.45,
      z: row * ROW_GAP + (rng() - 0.5) * 0.4 + (f.special === 'float' ? 1 : 0),
      phase: rng() * Math.PI * 2,
      speed: 5 + rng() * 2
    }
  })
}

function Crowd({ placed, pulse }) {
  const bodies = useRef()
  const heads = useRef()
  const hair = useRef()
  const signs = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const signers = useMemo(() => placed.filter(f => ['sign', 'flag', 'bigflag', 'megaphone', 'smoke'].includes(f.heldItem)), [placed])

  useEffect(() => {
    placed.forEach((f, i) => {
      bodies.current.setColorAt(i, color.set(f.primary))
      heads.current.setColorAt(i, color.set(f.skin))
      hair.current.setColorAt(i, color.set(f.hair === 'bald' ? f.skin : f.hairColor))
    })
    signers.forEach((f, i) => signs.current.setColorAt(i, color.set(f.heldItem === 'sign' ? RISO_INKS.paper : f.secondary)))
    for (const m of [bodies, heads, hair, signs]) if (m.current.instanceColor) m.current.instanceColor.needsUpdate = true
  }, [placed, signers, color])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const excitement = 1 + Math.max(0, 1 - (performance.now() - pulse.current) / 2500) * 2
    placed.forEach((f, i) => {
      const bob = Math.abs(Math.sin(t * f.speed * 0.5 + f.phase)) * 0.09 * excitement
      const s = f.scale * (f.height ?? 1)
      dummy.position.set(f.x, 0.55 * s + bob, f.z)
      dummy.rotation.set(0, 0, Math.sin(t * f.speed * 0.25 + f.phase) * 0.05)
      dummy.scale.set(s, s, s)
      dummy.updateMatrix()
      bodies.current.setMatrixAt(i, dummy.matrix)
      dummy.position.y = 1.18 * s + bob
      dummy.updateMatrix()
      heads.current.setMatrixAt(i, dummy.matrix)
      dummy.position.y = 1.3 * s + bob
      dummy.scale.set(s * 1.05, s * 0.7, s * 1.05)
      dummy.updateMatrix()
      hair.current.setMatrixAt(i, dummy.matrix)
    })
    signers.forEach((f, i) => {
      const bob = Math.abs(Math.sin(t * f.speed * 0.5 + f.phase)) * 0.09 * excitement
      const big = f.heldItem === 'bigflag' ? 1.6 : 1
      dummy.position.set(f.x + 0.35, 2.05 * big + bob, f.z)
      dummy.rotation.set(0, 0, Math.sin(t * 2 + f.phase) * (f.heldItem === 'sign' ? 0.05 : 0.2))
      dummy.scale.set(big, big, 1)
      dummy.updateMatrix()
      signs.current.setMatrixAt(i, dummy.matrix)
    })
    for (const m of [bodies, heads, hair, signs]) m.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={bodies} args={[null, null, placed.length]} castShadow>
        <capsuleGeometry args={[0.26, 0.5, 4, 10]} />
        <meshToonMaterial />
      </instancedMesh>
      <instancedMesh ref={heads} args={[null, null, placed.length]}>
        <sphereGeometry args={[0.24, 14, 12]} />
        <meshToonMaterial />
      </instancedMesh>
      <instancedMesh ref={hair} args={[null, null, placed.length]}>
        <sphereGeometry args={[0.25, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshToonMaterial />
      </instancedMesh>
      <instancedMesh ref={signs} args={[null, null, Math.max(1, signers.length)]}>
        <boxGeometry args={[0.7, 0.45, 0.04]} />
        <meshToonMaterial />
      </instancedMesh>
    </group>
  )
}

function Specials({ placed, placards }) {
  const banners = placed.filter(f => f.special === 'giant_banner')
  const floats = placed.filter(f => f.special === 'float')
  const smokes = placed.filter(f => f.special === 'color_smoke')
  return (
    <group>
      {banners.map((f, i) => (
        <group key={`b${i}`} position={[0, 1.6, f.z - 0.6]}>
          <mesh><planeGeometry args={[6.5, 1.1]} /><meshToonMaterial color={RISO_INKS.paper} side={THREE.DoubleSide} /></mesh>
          <Text font={antonUrl} position={[0, 0, 0.02]} fontSize={0.55} color={f.primary} anchorX="center" anchorY="middle" maxWidth={6.2}>
            {(placards[i]?.text ?? 'NI UN PASO ATRÁS').toUpperCase()}
          </Text>
          <Text font={antonUrl} position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]} fontSize={0.55} color={f.primary} anchorX="center" anchorY="middle" maxWidth={6.2}>
            {(placards[i]?.text ?? 'NI UN PASO ATRÁS').toUpperCase()}
          </Text>
        </group>
      ))}
      {floats.map((f, i) => (
        <group key={`f${i}`} position={[f.x, 0.5, f.z]}>
          <mesh castShadow><boxGeometry args={[3, 1, 4]} /><meshToonMaterial color={f.primary} /></mesh>
          <mesh position={[0, 0.9, 0]}><coneGeometry args={[1.2, 1.6, 6]} /><meshToonMaterial color={f.secondary} /></mesh>
        </group>
      ))}
      {smokes.map((f, i) => <Smoke key={`s${i}`} position={[f.x, 2.2, f.z]} colors={[f.primary, f.secondary]} />)}
    </group>
  )
}

function Smoke({ position, colors }) {
  const ref = useRef()
  const puffs = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ offset: i / 10, color: colors[i % 2] })), [colors])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    ref.current.children.forEach((m, i) => {
      const p = (t * 0.25 + puffs[i].offset) % 1
      m.position.set(Math.sin(i * 3.1) * p * 0.8, p * 3, Math.cos(i * 2.3) * p * 0.8)
      m.scale.setScalar(0.3 + p * 1.2)
      m.material.opacity = 0.7 * (1 - p)
    })
  })
  return (
    <group ref={ref} position={position}>
      {puffs.map((p, i) => <mesh key={i}><sphereGeometry args={[0.5, 10, 8]} /><meshBasicMaterial color={p.color} transparent depthWrite={false} /></mesh>)}
    </group>
  )
}

function Confetti({ pulse, depth }) {
  const ref = useRef()
  const count = 400
  const state = useMemo(() => ({
    positions: new Float32Array(count * 3),
    velocities: new Float32Array(count * 3),
    colors: new Float32Array(Array.from({ length: count }, (_, i) => new THREE.Color(BUILDING_COLORS[i % BUILDING_COLORS.length]).toArray()).flat()),
    last: 0
  }), [])
  useFrame((_, dt) => {
    const geo = ref.current.geometry
    if (pulse.current !== state.last) {
      state.last = pulse.current
      for (let i = 0; i < count; i++) {
        state.positions.set([(Math.random() - 0.5) * 14, 6 + Math.random() * 3, Math.random() * depth], i * 3)
        state.velocities.set([(Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2], i * 3)
      }
    }
    for (let i = 0; i < count; i++) {
      state.velocities[i * 3 + 1] -= 3 * dt
      for (let k = 0; k < 3; k++) state.positions[i * 3 + k] += state.velocities[i * 3 + k] * dt
      if (state.positions[i * 3 + 1] < -1) state.positions[i * 3 + 1] = -50
    }
    geo.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[state.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[state.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.18} vertexColors />
    </points>
  )
}

function City({ length, theme }) {
  const buildings = useMemo(() => {
    const rng = createRng('city')
    const list = []
    for (const side of [-1, 1]) {
      for (let z = -12; z < length + 12; z += 3 + rng() * 2) {
        const h = 3 + rng() * 9
        list.push({ x: side * (LANES * LANE_GAP / 2 + 5 + rng() * 2), z, h, w: 2.5 + rng() * 1.5, color: BUILDING_COLORS[Math.floor(rng() * BUILDING_COLORS.length)] })
      }
    }
    return list
  }, [length])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, length / 2]} receiveShadow>
        <planeGeometry args={[200, length + 200]} />
        <meshToonMaterial color={theme.ground} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, length / 2]}>
        <planeGeometry args={[LANES * LANE_GAP + 4, length + 60]} />
        <meshToonMaterial color={theme.road} />
      </mesh>
      {Array.from({ length: Math.ceil((length + 60) / 4) }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -30 + i * 4]}>
          <planeGeometry args={[0.25, 1.8]} />
          <meshBasicMaterial color={RISO_INKS.paper} />
        </mesh>
      ))}
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow>
          <boxGeometry args={[b.w, b.h, 2.6]} />
          <meshToonMaterial color={b.color} />
        </mesh>
      ))}
    </group>
  )
}

const PRESETS = {
  dron: { position: [16, 24, -14], target: [0, 0, 14] },
  calle: { position: [8.5, 1.7, -3], target: [0, 1.3, 6] },
  cabecera: { position: [0, 2.6, -9], target: [0, 1.2, 2] }
}

function CameraRig({ preset, depth }) {
  const { camera } = useThree()
  const controls = useRef()
  const goal = useRef(null)
  useEffect(() => {
    const p = PRESETS[preset] ?? PRESETS.dron
    const scaleZ = preset === 'dron' ? Math.min(1 + depth / 40, 4) : 1
    goal.current = {
      position: new THREE.Vector3(p.position[0] * scaleZ, p.position[1] * scaleZ, p.position[2] * scaleZ),
      target: new THREE.Vector3(p.target[0], p.target[1], preset === 'dron' ? depth / 2 : p.target[2])
    }
  }, [preset, depth])
  useFrame(() => {
    if (!goal.current || !controls.current) return
    camera.position.lerp(goal.current.position, 0.06)
    controls.current.target.lerp(goal.current.target, 0.06)
    controls.current.update()
    if (camera.position.distanceTo(goal.current.position) < 0.05) goal.current = null
  })
  return <OrbitControls ref={controls} makeDefault maxPolarAngle={Math.PI / 2.05} minDistance={2} maxDistance={220} onStart={() => { goal.current = null }} />
}

function FloatingPlacards({ placards, depth }) {
  return placards.slice(0, 8).map((p, i) => (
    <Billboard key={p.id} position={[((i % 3) - 1) * 4, 3.4 + (i % 2) * 0.6, 3 + (i / 8) * Math.max(depth - 6, 4)]}>
      <mesh><planeGeometry args={[3, 0.9]} /><meshBasicMaterial color={p.style === 'placard_neon' ? '#1D1B2F' : p.style === 'placard_riso' ? RISO_INKS.fluoPink : '#E9D3A8'} /></mesh>
      <Text font={antonUrl} position={[0, 0, 0.01]} fontSize={0.28} maxWidth={2.8} anchorX="center" anchorY="middle" textAlign="center"
        color={p.style === 'placard_neon' ? '#7DF9FF' : p.style === 'placard_riso' ? '#fff' : '#1D1B2F'}>
        {p.text.toUpperCase()}
      </Text>
    </Billboard>
  ))
}

export function AvenueScene({ scene, faithful, preset, pulse }) {
  const theme = THEMES[scene.cause.theme] ?? THEMES.theme_plaza
  const placed = useMemo(() => layout(buildFigures(scene, faithful)), [scene, faithful])
  const depth = Math.max(12, Math.ceil(placed.length / LANES) * ROW_GAP)
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 50, position: [16, 24, -14] }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <color attach="background" args={[theme.sky]} />
      <fog attach="fog" args={[theme.fog, 40, 160 + depth]} />
      <hemisphereLight args={['#ffffff', theme.ground, 1.1]} />
      <directionalLight position={[20, 30, -10]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <City length={depth} theme={theme} />
      {placed.length > 0 && <Crowd placed={placed} pulse={pulse} />}
      <Specials placed={placed} placards={scene.placards} />
      <FloatingPlacards placards={scene.placards} depth={depth} />
      <Confetti pulse={pulse} depth={depth} />
      <CameraRig preset={preset} depth={depth} />
    </Canvas>
  )
}

function WorldAvenue({ cause, angle, maxSteps, onSelect }) {
  const length = 8 + Math.sqrt(cause.totalSteps / Math.max(maxSteps, 1)) * 60
  const crowd = Math.min(400, cause.uniquePeople + cause.figures)
  const ref = useRef()
  const [hover, setHover] = useState(false)
  const points = useMemo(() => {
    const rng = createRng(cause.id)
    return Array.from({ length: crowd }, () => [(rng() - 0.5) * 2.2, 0.35, 6 + rng() * (length - 6)])
  }, [cause.id, crowd, length])
  useEffect(() => {
    const dummy = new THREE.Object3D()
    points.forEach((p, i) => {
      dummy.position.set(...p)
      dummy.updateMatrix()
      ref.current?.setMatrixAt(i, dummy.matrix)
    })
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true
  }, [points])
  return (
    <group rotation={[0, angle, 0]}>
      <mesh position={[0, 0.02, length / 2 + 3]} rotation={[-Math.PI / 2, 0, 0]}
        onClick={() => onSelect(cause.id)} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
        <planeGeometry args={[3.2, length]} />
        <meshToonMaterial color={hover ? RISO_INKS.yellow : '#3D3A55'} />
      </mesh>
      {crowd > 0 && (
        <instancedMesh ref={ref} args={[null, null, crowd]}>
          <capsuleGeometry args={[0.14, 0.3, 3, 6]} />
          <meshToonMaterial color={cause.color} />
        </instancedMesh>
      )}
      <Billboard position={[0, 4, length + 6]}>
        <Text font={antonUrl} fontSize={3.2} color="#1D1B2F" outlineWidth={0.12} outlineColor="#F4EFE6" anchorY="bottom" maxWidth={34} textAlign="center">
          {cause.title.toUpperCase()}
        </Text>
        <Text font={antonUrl} fontSize={2} color={cause.color} outlineWidth={0.1} outlineColor="#1D1B2F" anchorY="top" position={[0, -0.4, 0]}>
          {`${cause.uniquePeople.toLocaleString('es-ES')} personas · ${cause.totalSteps.toLocaleString('es-ES')} pasos`}
        </Text>
      </Billboard>
    </group>
  )
}

export function WorldScene({ causes, onSelect }) {
  const maxSteps = Math.max(1, ...causes.map(c => c.totalSteps))
  return (
    <Canvas dpr={[1, 1.75]} camera={{ fov: 45, position: [0, 55, 70] }}>
      <color attach="background" args={['#CFE8F0']} />
      <fog attach="fog" args={['#CFE8F0', 80, 260]} />
      <hemisphereLight args={['#ffffff', '#E9DFC9', 1.2]} />
      <directionalLight position={[30, 50, 20]} intensity={1.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[160, 64]} /><meshToonMaterial color="#E9DFC9" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><circleGeometry args={[4, 48]} /><meshToonMaterial color={RISO_INKS.fluoPink} /></mesh>
      {causes.map((c, i) => <WorldAvenue key={c.id} cause={c} angle={(i / Math.max(causes.length, 1)) * Math.PI * 2} maxSteps={maxSteps} onSelect={onSelect} />)}
      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} minDistance={10} maxDistance={240} />
    </Canvas>
  )
}

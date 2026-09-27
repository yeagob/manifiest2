import { useMemo, useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { RISO_INKS, createRng } from '@manifiest/shared'
import antonUrl from '@fontsource/anton/files/anton-latin-400-normal.woff?url'

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

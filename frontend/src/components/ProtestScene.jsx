import { useRef, useMemo } from 'react'
import AvatarSVG from './AvatarSVG'
import '../styles/ProtestScene.css'
import { Play, Pause } from 'lucide-react'

const ROAD_LENGTH = 10000 // Virtual units
const VISIBLE_RANGE = 2000 // How far we can see

function ProtestScene({
    supporters = [],
    maxSteps = 10000,
    cameraPosition = 0, // 0 to 100
    onCameraChange,
    isPlaying,
    onTogglePlay
}) {
    // Convert percentage (0-100) to Z position
    // 0% = Start of road (Z=0)
    // 100% = End of road (Z=ROAD_LENGTH)
    const currentZ = (cameraPosition / 100) * ROAD_LENGTH

    // Memoize sorted supporters for correct Z-indexing (painters algorithm)
    // Although CSS preserve-3d handles this mostly, sorting helps with transparency
    const sortedSupporters = useMemo(() => {
        return [...supporters].sort((a, b) => b.steps - a.steps)
    }, [supporters])

    return (
        <div className="scene-wrapper">
            <div className="scene-container">
                {/* Sky / Background */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '50%',
                    background: 'linear-gradient(to bottom, #87CEEB 0%, #E0F7FA 100%)',
                    zIndex: -1
                }} />

                {/* 3D World - Moves opposite to camera to simulate movement */}
                <div
                    className="scene-world"
                    style={{
                        transform: `translateZ(600px) rotateX(-10deg) translateY(100px) translateZ(${-currentZ}px)`
                    }}
                >
                    {/* Ground/Grass */}
                    <div className="ground" />

                    {/* Road */}
                    <div className="road-container">
                        <div className="road-markings" />
                    </div>

                    {/* Supporters */}
                    {sortedSupporters.map((supporter, index) => {
                        // Calculate Z position based on steps
                        // Map 0-maxSteps to 0-ROAD_LENGTH
                        const normalizedSteps = Math.min(supporter.steps, maxSteps)
                        const zPos = (normalizedSteps / maxSteps) * ROAD_LENGTH

                        // Only render if within visible range of camera
                        // Adding some buffer
                        if (zPos < currentZ - 500 || zPos > currentZ + VISIBLE_RANGE) return null

                        // Randomize X position on the road (-300 to 300)
                        // Use a pseudo-random based on ID to keep it consistent
                        const pseudoRandom = (str) => {
                            let hash = 0;
                            for (let i = 0; i < str.length; i++) {
                                hash = str.charCodeAt(i) + ((hash << 5) - hash);
                            }
                            return hash;
                        }
                        const xOffset = (pseudoRandom(supporter.userId) % 300)

                        return (
                            <div
                                key={supporter.userId}
                                className="avatar-container"
                                style={{
                                    transform: `translateX(${xOffset}px) translateY(-50px) translateZ(${zPos}px)`
                                }}
                            >
                                <div className="avatar-billboard" style={{ transform: 'rotateX(-10deg)' }}>
                                    <AvatarSVG config={supporter.avatar} size={80} />
                                    <div className="avatar-shadow" />

                                    <div className="avatar-name">
                                        {supporter.name}
                                    </div>

                                    {supporter.message && (
                                        <div className="avatar-message">
                                            "{supporter.message}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Overlay UI */}
                <div style={{
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    right: 20,
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.9)',
                    padding: '1rem',
                    borderRadius: '1rem',
                    backdropFilter: 'blur(10px)'
                }}>
                    <button
                        onClick={onTogglePlay}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        {isPlaying ? 'Pause' : 'Walk'}
                    </button>

                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={cameraPosition}
                        onChange={(e) => onCameraChange(parseFloat(e.target.value))}
                        style={{ flex: 1 }}
                    />

                    <span style={{ fontWeight: 'bold', minWidth: '4rem', textAlign: 'right' }}>
                        {Math.round(cameraPosition)}%
                    </span>
                </div>
            </div>
        </div>
    )
}

export default ProtestScene

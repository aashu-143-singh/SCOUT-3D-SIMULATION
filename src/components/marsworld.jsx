import { useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

import MarsTerrain, { getTerrainHeight } from './marsterrain.jsx'
import Rover, { gridToWorld } from './rover.jsx'
import Rocks from './rocks.jsx'
import Mountains from './mountains.jsx'

// Visual 3D markers for rocks plotted on the dashboard 2D grid
function GridRockMarkers({ rocks = [] }) {
  return (
    <group>
      {rocks.map(([gx, gy], i) => {
        const [wx, wz] = gridToWorld(gx, gy)
        const wy = getTerrainHeight(wx, wz)
        return (
          <group key={`grid-rock-${i}`} position={[wx, wy, wz]}>
            <mesh position={[0, 0.4, 0]}>
              <dodecahedronGeometry args={[0.9, 0]} />
              <meshStandardMaterial color="#643b2f" roughness={0.9} />
            </mesh>
            {/* Subtle radar marker pulse */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.2, 1.45, 16]} />
              <meshBasicMaterial color="#f97316" transparent opacity={0.35} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

// 3D Path Waypoint Indicators
function RoutePath3D({ route = [], activeStep = 0 }) {
  if (!route || route.length < 2) return null

  const points = route.map(([gx, gy]) => {
    const [wx, wz] = gridToWorld(gx, gy)
    const wy = getTerrainHeight(wx, wz) + 0.25
    return new THREE.Vector3(wx, wy, wz)
  })

  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2)
  const sampledPoints = curve.getPoints(points.length * 3)

  return (
    <group>
      {/* Route Ribbon / Line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(sampledPoints.flatMap((p) => [p.x, p.y, p.z])),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff895a" linewidth={2} transparent opacity={0.7} />
      </line>

      {/* Goal Beacon */}
      {route.length > 0 && (() => {
        const goalCell = route[route.length - 1]
        const [gx, gz] = gridToWorld(goalCell[0], goalCell[1])
        const gy = getTerrainHeight(gx, gz)
        return (
          <group position={[gx, gy, gz]}>
            <mesh position={[0, 3, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 6, 8]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
            </mesh>
            <mesh position={[0, 6, 0]}>
              <octahedronGeometry args={[0.6]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>
        )
      })()}
    </group>
  )
}

export default function MarsWorld({
  status = 'IDLE',
  step = 0,
  route = [],
  speed = 1,
  onStepChange,
  onTelemetryUpdate,
  onObstacleScan,
  addLog,
  showRocks = true,
  gridRocks = [],
}) {
  const [cameraMode, setCameraMode] = useState('third') // 'third' | 'chase' | 'pov' | 'topdown'
  const [driveMode, setDriveMode] = useState('autopilot') // 'autopilot' | 'manual'
  const orbitRef = useRef()

  const handleResetCamera = () => {
    if (orbitRef.current) {
      orbitRef.current.reset()
    }
    setCameraMode('third')
  }

  return (
    <div className="mars-world-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 3D WEBGL CANVAS */}
      <Canvas
        camera={{
          position: [0, 24, 38],
          fov: 52,
          near: 0.1,
          far: 500,
        }}
        dpr={Math.min(window.devicePixelRatio || 1, 2)}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
        }}
      >
        {/* Mars atmosphere background tint */}
        <color attach="background" args={['#c17b5b']} />

        {/* Mars Fog */}
        <fog attach="fog" args={['#b87455', 60, 260]} />

        {/* Dynamic Mars Sun Lighting */}
        <ambientLight intensity={1.3} color="#fce7db" />
        <directionalLight
          position={[40, 65, 30]}
          intensity={2.2}
          color="#fff5ea"
          castShadow
        />
        <directionalLight
          position={[-30, 20, -40]}
          intensity={0.6}
          color="#d9774a"
        />

        {/* 3D Mars Terrain */}
        <MarsTerrain />
        <Mountains />
        {showRocks && <Rocks />}
        {showRocks && <GridRockMarkers rocks={gridRocks} />}

        {/* 3D Visual Active Path */}
        <RoutePath3D route={route} activeStep={step} />

        {/* Scout Rover */}
        <Rover
          status={status}
          currentStep={step}
          activeRoute={route}
          speed={speed}
          driveMode={driveMode}
          cameraMode={cameraMode}
          onStepChange={onStepChange}
          onTelemetryUpdate={onTelemetryUpdate}
          onObstacleScan={onObstacleScan}
          addLog={addLog}
          gridRocks={gridRocks}
        />

        {/* Interactive Orbit Controls for Third / Topdown views */}
        <OrbitControls
          ref={orbitRef}
          enabled={cameraMode === 'third' || cameraMode === 'topdown'}
          enableDamping
          dampingFactor={0.06}
          minDistance={6}
          maxDistance={120}
          maxPolarAngle={cameraMode === 'topdown' ? 0.05 : Math.PI / 2.05}
        />
      </Canvas>

      {/* COMPACT VIEWPORT OVERLAY CONTROLS */}
      <div className="world-overlay-controls">
        {/* Top-right Camera & Drive mode toolbar */}
        <div className="hud-toolbar">
          <div className="hud-group">
            <span className="hud-label">CAMERA:</span>
            <button
              className={`hud-btn ${cameraMode === 'third' ? 'active' : ''}`}
              onClick={() => setCameraMode('third')}
              title="Free Orbit 3D Camera"
            >
              ORBIT
            </button>
            <button
              className={`hud-btn ${cameraMode === 'chase' ? 'active' : ''}`}
              onClick={() => setCameraMode('chase')}
              title="Follow Behind Rover"
            >
              CHASE
            </button>
            <button
              className={`hud-btn ${cameraMode === 'pov' ? 'active' : ''}`}
              onClick={() => setCameraMode('pov')}
              title="First-Person NavCam"
            >
              ROVER POV
            </button>
            <button
              className={`hud-btn ${cameraMode === 'topdown' ? 'active' : ''}`}
              onClick={() => setCameraMode('topdown')}
              title="Satellite Overhead View"
            >
              SATELLITE
            </button>
          </div>

          <div className="hud-divider" />

          <div className="hud-group">
            <span className="hud-label">CONTROL:</span>
            <button
              className={`hud-btn ${driveMode === 'autopilot' ? 'active' : ''}`}
              onClick={() => {
                setDriveMode('autopilot')
                if (addLog) addLog('Navigation Mode: Dashboard Autopilot Engaged')
              }}
              title="Sync with Dashboard Controls"
            >
              AUTOPILOT
            </button>
            <button
              className={`hud-btn manual-btn ${driveMode === 'manual' ? 'active' : ''}`}
              onClick={() => {
                setDriveMode('manual')
                if (addLog) addLog('Navigation Mode: Manual Teleoperation (WASD)')
              }}
              title="Manual Control with WASD / Arrow Keys"
            >
              MANUAL (WASD)
            </button>
          </div>

          <button
            className="hud-btn reset-cam-btn"
            onClick={handleResetCamera}
            title="Reset Camera Angle"
          >
            RESET VIEW
          </button>
        </div>

        {/* Manual drive helper tooltip when active */}
        {driveMode === 'manual' && (
          <div className="manual-drive-pill">
            <span>🎮 MANUAL TELEOP ACTIVE:</span>
            <kbd>W</kbd>/<kbd>S</kbd> Drive · <kbd>A</kbd>/<kbd>D</kbd> Steer · Dashboard map tracks live!
          </div>
        )}
      </div>
    </div>
  )
}

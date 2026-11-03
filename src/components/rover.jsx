

import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { getTerrainHeight } from './marsterrain.jsx'
import { setupRoverControls } from '../simulation/rovermovement.js'
import { checkCollision } from '../simulation/obstacledetection.js'
import { scanSurroundings } from '../simulation/sensorscan.js'
import { rockData } from './rocks.jsx'
import { mountainObstacles } from './mountains.jsx'
import RoverCamera from './rovercamera.jsx'

// GRID COORDINATES
export const gridToWorld = (gx, gy) => [
  (gx - 9.5) * 3,
  (gy - 9.5) * 3,
]

export const worldToGrid = (wx, wz) => [
  Math.max(0, Math.min(19, Math.round(wx / 3 + 9.5))),
  Math.max(0, Math.min(19, Math.round(wz / 3 + 9.5))),
]

// TERRAIN OBSTACLES
const rockObstacles = rockData.map((rock, index) => ({
  id: `rock-${index}`,
  x: rock.position[0],
  z: rock.position[2],
  radius: Math.max(rock.scale[0], rock.scale[2]) * 1.2,
}))

const allTerrainObstacles = [
  ...rockObstacles,
  ...mountainObstacles.map((mountain) => ({
    ...mountain,
    radius: mountain.radius * 1.2,
  })),
]

// DISTANCE FROM POINT TO LINE SEGMENT
function pointToSegmentDistance(point, start, end) {
  const dx = end.x - start.x
  const dz = end.z - start.z
  const lengthSq = dx * dx + dz * dz

  if (lengthSq === 0) {
    return Math.hypot(
      point.x - start.x,
      point.z - start.z
    )
  }

  const t = THREE.MathUtils.clamp(
    ((point.x - start.x) * dx +
      (point.z - start.z) * dz) / lengthSq,
    0,
    1
  )

  const closestX = start.x + dx * t
  const closestZ = start.z + dz * t

  return Math.hypot(
    point.x - closestX,
    point.z - closestZ
  )
}

// CHECK WHETHER A STRAIGHT PATH IS SAFE
function isPathClear(start, end, obstacles, roverRadius) {
  for (const obstacle of obstacles) {
    const distance = pointToSegmentDistance(
      obstacle,
      start,
      end
    )

    const requiredDistance =
      roverRadius + obstacle.radius + 0.35

    if (distance < requiredDistance) {
      return false
    }
  }

  return true
}

// ALTERNATE PATH PLANNER
function findDetourPath(start, target, obstacles, roverRadius) {
  const relevant = obstacles.filter((obstacle) => {
    return (
      pointToSegmentDistance(
        obstacle,
        start,
        target
      ) < 15
    )
  })

  // No obstacle on direct route.
  if (isPathClear(start, target, relevant, roverRadius)) {
    return []
  }

  // Node 0 = rover position.
  // Node 1 = original target.
  const nodes = [
    new THREE.Vector3(start.x, 0, start.z),
    new THREE.Vector3(target.x, 0, target.z),
  ]

  // Create candidate points around each obstacle.
  for (const obstacle of relevant) {
    const safeRadius =
      roverRadius + obstacle.radius + 0.9

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2

      const candidate = new THREE.Vector3(
        obstacle.x + Math.cos(angle) * safeRadius,
        0,
        obstacle.z + Math.sin(angle) * safeRadius
      )

      const safe = relevant.every((other) => {
        const distance = Math.hypot(
          candidate.x - other.x,
          candidate.z - other.z
        )

        return (
          distance >=
          roverRadius + other.radius + 0.25
        )
      })

      if (safe) {
        nodes.push(candidate)
      }
    }
  }

  const count = nodes.length
  const distances = Array(count).fill(Infinity)
  const previous = Array(count).fill(-1)
  const visited = Array(count).fill(false)

  distances[0] = 0

  // Dijkstra shortest safe path search.
  for (let iteration = 0; iteration < count; iteration++) {
    let current = -1
    let bestDistance = Infinity

    for (let i = 0; i < count; i++) {
      if (
        !visited[i] &&
        distances[i] < bestDistance
      ) {
        current = i
        bestDistance = distances[i]
      }
    }

    if (current === -1) break
    if (current === 1) break

    visited[current] = true

    for (let next = 1; next < count; next++) {
      if (visited[next] || next === current) continue

      const clear = isPathClear(
        nodes[current],
        nodes[next],
        relevant,
        roverRadius
      )

      if (!clear) continue

      const edgeDistance = nodes[current].distanceTo(
        nodes[next]
      )

      const newDistance =
        distances[current] + edgeDistance

      if (newDistance < distances[next]) {
        distances[next] = newDistance
        previous[next] = current
      }
    }
  }

  if (!Number.isFinite(distances[1])) {
    return null
  }

  // Reconstruct path from target to start.
  const path = []
  let current = 1

  while (current !== 0 && current !== -1) {
    path.unshift(nodes[current].clone())
    current = previous[current]
  }

  // Remove final target; dashboard target remains unchanged.
  path.pop()

  return path
}

// WHEEL
function Wheel({ position, rotationRef }) {
  const meshRef = useRef()

  useFrame((_, delta) => {
    if (meshRef.current && rotationRef?.current) {
      meshRef.current.rotation.y +=
        rotationRef.current * delta * 4
    }
  })

  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <group ref={meshRef}>
        <mesh>
          <cylinderGeometry args={[0.48, 0.48, 0.38, 20]} />
          <meshStandardMaterial color="#222222" roughness={0.92} />
        </mesh>

        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * Math.PI * 2

          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * 0.46,
                0,
                Math.sin(angle) * 0.46,
              ]}
            >
              <boxGeometry args={[0.16, 0.42, 0.12]} />
              <meshStandardMaterial color="#141414" roughness={1} />
            </mesh>
          )
        })}

        <mesh position={[0, 0.205, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.05, 16]} />
          <meshStandardMaterial
            color="#aba79c"
            metalness={0.8}
            roughness={0.35}
          />
        </mesh>
      </group>
    </group>
  )
}

// ROVER MODEL
export function RoverModel({ wheelSpinRef }) {
  const wheelPositions = [
    [-1.65, 0, -1.1],
    [-1.65, 0, 0],
    [-1.65, 0, 1.1],
    [1.65, 0, -1.1],
    [1.65, 0, 0],
    [1.65, 0, 1.1],
  ]

  return (
    <group>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[3.15, 0.25, 2.45]} />
        <meshStandardMaterial
          color="#6f7169"
          metalness={0.65}
          roughness={0.55}
        />
      </mesh>

      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[2.75, 0.65, 2.1]} />
        <meshStandardMaterial
          color="#c4b89e"
          metalness={0.3}
          roughness={0.8}
        />
      </mesh>

      <mesh position={[0, 1.36, 0]}>
        <boxGeometry args={[2.45, 0.12, 1.85]} />
        <meshStandardMaterial
          color="#73766e"
          metalness={0.65}
          roughness={0.55}
        />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * 1.4, 0.35, -0.35]}
            rotation={[0.16, 0, side * 0.12]}
          >
            <boxGeometry args={[0.2, 0.22, 2.0]} />
            <meshStandardMaterial color="#787e7d" metalness={0.8} />
          </mesh>

          <mesh
            position={[side * 1.55, 0.13, 0.55]}
            rotation={[0.12, 0, side * 0.08]}
          >
            <boxGeometry args={[0.17, 0.18, 1.25]} />
            <meshStandardMaterial color="#9f9c90" metalness={0.75} />
          </mesh>
        </group>
      ))}

      {wheelPositions.map((pos, idx) => (
        <Wheel key={idx} position={pos} rotationRef={wheelSpinRef} />
      ))}

      <mesh position={[0, 2.05, -0.45]}>
        <cylinderGeometry args={[0.09, 0.13, 1.05, 12]} />
        <meshStandardMaterial color="#83857e" metalness={0.75} />
      </mesh>

      <mesh position={[0, 2.72, -0.45]}>
        <boxGeometry args={[0.85, 0.48, 0.55]} />
        <meshStandardMaterial color="#c6b99c" metalness={0.4} />
      </mesh>

      {[-0.24, 0.24].map((x) => (
        <group key={x} position={[x, 2.75, -0.16]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
            <meshStandardMaterial color="#1a242d" metalness={0.85} />
          </mesh>

          <mesh position={[0, 0, 0.055]}>
            <circleGeometry args={[0.08, 16]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}

      <group position={[0.9, 1.15, 0.85]}>
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.19, 12, 12]} />
          <meshStandardMaterial color="#888c83" metalness={0.8} />
        </mesh>

        <mesh
          position={[0.12, 0.48, 0]}
          rotation={[0, 0, -0.3]}
        >
          <cylinderGeometry args={[0.09, 0.11, 0.75, 10]} />
          <meshStandardMaterial color="#c2b79e" metalness={0.65} />
        </mesh>

        <mesh
          position={[0.3, 0.95, 0.08]}
          rotation={[0.25, 0, -0.5]}
        >
          <cylinderGeometry args={[0.07, 0.09, 0.5, 10]} />
          <meshStandardMaterial color="#aaa797" metalness={0.7} />
        </mesh>
      </group>

      <group position={[0, 1.05, -1.48]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.85, 16]} />
          <meshStandardMaterial
            color="#777e7d"
            metalness={0.8}
            roughness={0.45}
          />
        </mesh>

        {[-0.44, 0.44].map((z) => (
          <mesh key={z} position={[0, 0, z]}>
            <cylinderGeometry args={[0.32, 0.32, 0.06, 16]} />
            <meshStandardMaterial color="#a9a89b" metalness={0.75} />
          </mesh>
        ))}
      </group>

      <mesh position={[-1.0, 1.85, -0.7]}>
        <cylinderGeometry args={[0.025, 0.035, 0.65, 8]} />
        <meshStandardMaterial color="#aaa99d" metalness={0.85} />
      </mesh>

      <mesh position={[-1.0, 2.2, -0.7]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#ff895a" metalness={0.65} />
      </mesh>

      <mesh position={[0, 0.98, 1.06]}>
        <boxGeometry args={[1.0, 0.28, 0.03]} />
        <meshStandardMaterial color="#1a1c1d" />
      </mesh>
    </group>
  )
}

// MAIN ROVER
export default function Rover({
  status = 'IDLE',
  currentStep = 0,
  activeRoute = [],
  speed = 1,
  driveMode = 'autopilot',
  cameraMode = 'third',
  onStepChange,
  onTelemetryUpdate,
  onObstacleScan,
  addLog,
  gridRocks = [],
}) {
  const roverRef = useRef()
  const wheelSpinRef = useRef(0)
  const controlsRef = useRef(null)

  const lastReportedStep = useRef(-1)
  const lastScanTime = useRef(0)
  const lastTelemetryTime = useRef(0)

  const avoidancePathRef = useRef([])
  const avoidancePathIndexRef = useRef(0)
  const planningCooldownRef = useRef(0)

  const roverRadius = 1.45

  const routeKey = activeRoute
    .map((cell) => `${cell[0]},${cell[1]}`)
    .join('|')

  const previousRouteKey = useRef('')
  const previousStatus = useRef(status)

  const obstacles = useMemo(() => {
    const list = [...allTerrainObstacles]

    gridRocks.forEach(([gx, gy], index) => {
      const [wx, wz] = gridToWorld(gx, gy)

      list.push({
        id: `grid-rock-${index}`,
        x: wx,
        z: wz,
        radius: 1.8,
      })
    })

    return list
  }, [gridRocks])

  useEffect(() => {
    const controls = setupRoverControls()
    controlsRef.current = controls

    return () => {
      controls.cleanup()
      controlsRef.current = null
    }
  }, [])

  // INITIAL POSITION AND ROUTE RESET
  useEffect(() => {
    if (!roverRef.current || !activeRoute.length) return

    const routeChanged = previousRouteKey.current !== routeKey
    const enteringIdle =
      status === 'IDLE' && previousStatus.current !== 'IDLE'

    if (routeChanged || enteringIdle) {
      const [sx, sz] = gridToWorld(
        activeRoute[0][0],
        activeRoute[0][1]
      )

      roverRef.current.position.set(
        sx,
        getTerrainHeight(sx, sz) + 0.9,
        sz
      )

      if (activeRoute.length > 1) {
        const [nx, nz] = gridToWorld(
          activeRoute[1][0],
          activeRoute[1][1]
        )

        roverRef.current.rotation.set(
          0,
          Math.atan2(nx - sx, nz - sz),
          0
        )
      }

      lastReportedStep.current = 0
      avoidancePathRef.current = []
      avoidancePathIndexRef.current = 0
      planningCooldownRef.current = 0
    }

    previousRouteKey.current = routeKey
    previousStatus.current = status
  }, [routeKey, status, activeRoute])

  useFrame((_, delta) => {
    const rover = roverRef.current
    if (!rover) return

    const dt = Math.min(delta, 0.05)
    const up = new THREE.Vector3(0, 1, 0)

    // AUTOPILOT
    if (
      driveMode === 'autopilot' &&
      status === 'MOVING' &&
      activeRoute.length > 1 &&
      currentStep < activeRoute.length - 1
    ) {
      const targetCell = activeRoute[currentStep + 1]

      const [targetX, targetZ] = gridToWorld(
        targetCell[0],
        targetCell[1]
      )

      const originalTarget = new THREE.Vector3(
        targetX,
        0,
        targetZ
      )

      const roverPosition = new THREE.Vector3(
        rover.position.x,
        0,
        rover.position.z
      )

      // Reduce replanning cooldown.
      planningCooldownRef.current = Math.max(
        0,
        planningCooldownRef.current - dt
      )

      // Advance through intermediate waypoints.
      let path = avoidancePathRef.current
      let pathIndex = avoidancePathIndexRef.current

      while (pathIndex < path.length) {
        const distance = Math.hypot(
          path[pathIndex].x - rover.position.x,
          path[pathIndex].z - rover.position.z
        )

        if (distance > 1.0) break
        pathIndex++
      }

      avoidancePathIndexRef.current = pathIndex

      // Clear completed alternate path.
      if (pathIndex >= path.length) {
        avoidancePathRef.current = []
        avoidancePathIndexRef.current = 0
        path = []
        pathIndex = 0
      }

      // Check the direct path to the dashboard waypoint.
      const directPathClear = isPathClear(
        roverPosition,
        originalTarget,
        obstacles,
        roverRadius
      )

      // Replan if there is no active alternate path.
      let navigationBlocked = false

      if (path.length === 0 && !directPathClear) {
        if (planningCooldownRef.current <= 0) {
          const newPath = findDetourPath(
            roverPosition,
            originalTarget,
            obstacles,
            roverRadius
          )

          if (newPath && newPath.length > 0) {
            avoidancePathRef.current = newPath
            avoidancePathIndexRef.current = 0

            path = newPath
            pathIndex = 0

            addLog?.(
              'Obstacle detected. Alternate path selected.'
            )
          } else {
            planningCooldownRef.current = 0.7
            navigationBlocked = true
          }
        } else {
          navigationBlocked = true
        }
      }

      // Select current navigation waypoint.
      const navigationTarget =
        path.length > 0 && pathIndex < path.length
          ? path[pathIndex]
          : originalTarget

      const toTarget = new THREE.Vector3(
        navigationTarget.x - rover.position.x,
        0,
        navigationTarget.z - rover.position.z
      )

      const targetDistance = toTarget.length()

      if (targetDistance > 0.05 && !navigationBlocked) {
        const desiredDirection = toTarget
          .clone()
          .normalize()

        const desiredYaw = Math.atan2(
          desiredDirection.x,
          desiredDirection.z
        )

        let yawDiff = desiredYaw - rover.rotation.y

        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2

        // Turn toward the selected path point.
        rover.rotation.y += THREE.MathUtils.clamp(
          yawDiff,
          -2.4 * dt,
          2.4 * dt
        )

        const remainingYaw = Math.atan2(
          Math.sin(desiredYaw - rover.rotation.y),
          Math.cos(desiredYaw - rover.rotation.y)
        )

        // Move only when the rover is facing the waypoint.
        if (Math.abs(remainingYaw) < 0.45) {
          const moveDirection = new THREE.Vector3(0, 0, 1)
            .applyAxisAngle(up, rover.rotation.y)
            .normalize()

          const moveSpeed = 3.0 * Math.max(0, speed)

          const travelDistance = Math.min(
            moveSpeed * dt,
            targetDistance
          )

          const nextPosition = rover.position.clone().addScaledVector(
            moveDirection,
            travelDistance
          )

          const collision = checkCollision(
            nextPosition,
            obstacles,
            roverRadius
          )

          if (!collision.collided) {
            rover.position.x = nextPosition.x
            rover.position.z = nextPosition.z
            wheelSpinRef.current = speed * 1.8
          } else {
            // Collision: stop and calculate another path.
            wheelSpinRef.current = 0
            avoidancePathRef.current = []
            avoidancePathIndexRef.current = 0
            planningCooldownRef.current = 0
          }
        } else {
          wheelSpinRef.current = 0
        }
      } else {
        wheelSpinRef.current = 0
      }

      // TERRAIN FOLLOWING
      rover.position.y =
        getTerrainHeight(rover.position.x, rover.position.z) + 0.9

      const frontX = Math.sin(rover.rotation.y) * 1.4
      const frontZ = Math.cos(rover.rotation.y) * 1.4

      const hFront = getTerrainHeight(
        rover.position.x + frontX,
        rover.position.z + frontZ
      )

      const hBack = getTerrainHeight(
        rover.position.x - frontX,
        rover.position.z - frontZ
      )

      rover.rotation.x = Math.atan2(
        hFront - hBack,
        2.8
      )

      const rightX = Math.cos(rover.rotation.y) * 1.4
      const rightZ = -Math.sin(rover.rotation.y) * 1.4

      const hRight = getTerrainHeight(
        rover.position.x + rightX,
        rover.position.z + rightZ
      )

      const hLeft = getTerrainHeight(
        rover.position.x - rightX,
        rover.position.z - rightZ
      )

      rover.rotation.z = Math.atan2(
        hRight - hLeft,
        2.8
      )

      // REPORT DASHBOARD WAYPOINT ARRIVAL ONLY
      const remainingDistance = Math.hypot(
        targetX - rover.position.x,
        targetZ - rover.position.z
      )

      const detourFinished =
        avoidancePathRef.current.length === 0

      if (
        detourFinished &&
        remainingDistance < 1.3 &&
        lastReportedStep.current !== currentStep + 1
      ) {
        lastReportedStep.current = currentStep + 1
        onStepChange?.(currentStep + 1)
      }
    }

    // MANUAL MODE
    else if (driveMode === 'manual') {
      const keys = controlsRef.current?.keys

      if (keys) {
        const forward = keys.w || keys.arrowup
        const backward = keys.s || keys.arrowdown
        const left = keys.a || keys.arrowleft
        const right = keys.d || keys.arrowright

        if (left) rover.rotation.y += 2.4 * dt
        if (right) rover.rotation.y -= 2.4 * dt

        if (forward || backward) {
          const direction = new THREE.Vector3(0, 0, 1)
            .applyAxisAngle(up, rover.rotation.y)
            .normalize()

          if (backward) direction.negate()

          const nextPosition = rover.position.clone().addScaledVector(
            direction,
            5 * speed * dt
          )

          const collision = checkCollision(
            nextPosition,
            obstacles,
            roverRadius
          )

          if (!collision.collided) {
            rover.position.x = nextPosition.x
            rover.position.z = nextPosition.z

            wheelSpinRef.current =
              (forward ? 1 : -1) * speed * 2
          } else {
            wheelSpinRef.current = 0
          }
        } else {
          wheelSpinRef.current = 0
        }

        rover.position.y =
          getTerrainHeight(rover.position.x, rover.position.z) + 0.9

        const [gx, gy] = worldToGrid(
          rover.position.x,
          rover.position.z
        )

        const matchingIndex = activeRoute.findIndex(
          ([rx, ry]) => rx === gx && ry === gy
        )

        if (matchingIndex > currentStep) {
          onStepChange?.(matchingIndex)
        }
      }
    } else {
      wheelSpinRef.current = 0
    }

    // TELEMETRY
    lastTelemetryTime.current += dt

    if (lastTelemetryTime.current >= 0.25) {
      lastTelemetryTime.current = 0

      const yaw = Math.round(
        ((rover.rotation.y * 180 / Math.PI) + 360) % 360
      )

      const [gx, gy] = worldToGrid(
        rover.position.x,
        rover.position.z
      )

      onTelemetryUpdate?.({
        heading: `${yaw}°`,
        pitch: `${(
          rover.rotation.x * 180 / Math.PI
        ).toFixed(1)}°`,
        roll: `${(
          rover.rotation.z * 180 / Math.PI
        ).toFixed(1)}°`,
        speed:
          status === 'MOVING'
            ? (0.45 * speed).toFixed(2)
            : '0.00',
        gridCell: `${gx + 1}, ${gy + 1}`,
        worldPos: [
          Math.round(rover.position.x),
          Math.round(rover.position.z),
        ],
      })
    }

    // OBSTACLE SCANNING
    lastScanTime.current += dt

    if (lastScanTime.current >= 0.6) {
      lastScanTime.current = 0

      const scanResults = scanSurroundings(
        rover.position,
        obstacles,
        18
      )

      const detected = (scanResults?.obstacles || []).map((obs) => {
        const [gx, gy] = worldToGrid(
          obs.position.x,
          obs.position.z
        )

        return {
          id: obs.id,
          distanceMeters: Math.round(obs.distance * 2.8),
          gridX: gx,
          gridY: gy,
        }
      })

      onObstacleScan?.(detected.slice(0, 3))
    }
  })

  return (
    <>
      <group ref={roverRef} position={[0, 0.9, 0]}>
        <RoverModel wheelSpinRef={wheelSpinRef} />
      </group>

      <RoverCamera
        roverRef={roverRef}
        cameraMode={cameraMode}
      />
    </>
  )
}

import { useMemo } from 'react'
import * as THREE from 'three'

// Shared mountain layout for rendering and collision detection
const ranges = [
  { x: -65, z: -65, h: 20, w: 18 },
  { x: -42, z: -72, h: 25, w: 22 },
  { x: -15, z: -78, h: 18, w: 17 },
  { x: 15, z: -75, h: 27, w: 23 },
  { x: 45, z: -68, h: 21, w: 20 },
  { x: 70, z: -58, h: 16, w: 18 },

  { x: -78, z: -25, h: 18, w: 19 },
  { x: 78, z: -15, h: 22, w: 21 },

  { x: -70, z: 40, h: 22, w: 22 },
  { x: -38, z: 62, h: 17, w: 18 },
  { x: 0, z: 70, h: 24, w: 22 },
  { x: 35, z: 65, h: 19, w: 20 },
  { x: 68, z: 48, h: 25, w: 23 },
]

// Both visible mountain parts are included in collision detection
export const mountainObstacles = ranges.flatMap((mountain, index) => [
  {
    id: `mountain-main-${index}`,
    x: mountain.x,
    z: mountain.z,
    radius: mountain.w * 0.75,
  },
  {
    id: `mountain-secondary-${index}`,
    x: mountain.x + mountain.w * 0.65,
    z: mountain.z + 5,
    radius: mountain.w * 0.48,
  },
])

function Mountain({ position, scale, seed }) {
  const geometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(1, 2, 12, 5)
    const positions = geo.attributes.position
    const colors = []

    const lowerColor = new THREE.Color('#633b30')
    const middleColor = new THREE.Color('#89513d')
    const upperColor = new THREE.Color('#aa7052')

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)

      const angle = Math.atan2(z, x)

      const roughness =
        Math.sin(angle * 3 + seed) * 0.12 +
        Math.cos(angle * 5 + seed * 2) * 0.07 +
        Math.sin(y * 9 + angle * 2 + seed) * 0.04

      const newX = x * (1 + roughness)
      const newZ = z * (1 + roughness)

      const heightVariation =
        Math.sin(angle * 4 + seed) * 0.045

      positions.setXYZ(
        i,
        newX,
        y + heightVariation,
        newZ
      )

      // Natural color variation from base to upper slopes
      const heightFactor = THREE.MathUtils.clamp(
        (y + 1) / 2,
        0,
        1
      )

      const color = lowerColor.clone()

      if (heightFactor < 0.55) {
        color.lerpColors(
          lowerColor,
          middleColor,
          heightFactor / 0.55
        )
      } else {
        color.lerpColors(
          middleColor,
          upperColor,
          (heightFactor - 0.55) / 0.45
        )
      }

      const shade =
        0.92 +
        Math.sin(angle * 6 + seed) * 0.07

      color.multiplyScalar(shade)

      colors.push(color.r, color.g, color.b)
    }

    geo.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    )

    geo.computeVertexNormals()

    return geo
  }, [seed])

  return (
    <mesh
      geometry={geometry}
      position={position}
      scale={scale}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        vertexColors
        roughness={1}
        flatShading
      />
    </mesh>
  )
}

function Mountains() {
  return (
    <group>
      {ranges.map((mountain, i) => (
        <group key={i}>
          {/* Main rocky formation */}
          <Mountain
            position={[
              mountain.x,
              mountain.h / 2 - 1,
              mountain.z,
            ]}
            scale={[
              mountain.w,
              mountain.h,
              mountain.w * 0.8,
            ]}
            seed={i * 3}
          />

          {/* Smaller connected rocky formation */}
          <Mountain
            position={[
              mountain.x + mountain.w * 0.65,
              mountain.h * 0.3 - 1,
              mountain.z + 5,
            ]}
            scale={[
              mountain.w * 0.65,
              mountain.h * 0.65,
              mountain.w * 0.7,
            ]}
            seed={i * 7 + 2}
          />
        </group>
      ))}
    </group>
  )
}

export default Mountains

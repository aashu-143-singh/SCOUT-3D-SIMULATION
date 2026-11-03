
import { useMemo } from 'react'
import * as THREE from 'three'

// Existing rock positions and collision data preserved
export const rockData = Array.from({ length: 65 }, (_, i) => {
  const angle = i * 2.399
  const distance = 7 + (i % 13) * 2.4

  const size =
    i % 10 === 0
      ? 1.5
      : i % 4 === 0
        ? 0.9
        : 0.45

  return {
    position: [
      Math.cos(angle) * distance,
      -0.3,
      Math.sin(angle) * distance,
    ],

    scale: [
      size * (0.8 + (i % 3) * 0.2),
      size * (0.6 + (i % 4) * 0.15),
      size * (0.8 + (i % 2) * 0.3),
    ],

    rotation: i * 0.37,

    color:
      i % 3 === 0
        ? '#704638'
        : i % 3 === 1
          ? '#95604b'
          : '#805143',
  }
})

function createRockGeometry(index) {
  const geometry = new THREE.IcosahedronGeometry(1, 1)
  const positions = geometry.attributes.position

  const darkColor = new THREE.Color('#593a30')
  const midColor = new THREE.Color('#895642')
  const lightColor = new THREE.Color('#ad7658')

  const colors = []

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)

    // Irregular natural rock shape
    const variation =
      1 +
      Math.sin(x * 7 + index) * 0.13 +
      Math.cos(y * 6 + index * 0.7) * 0.10 +
      Math.sin(z * 8 + index * 0.4) * 0.08

    const newX = x * variation
    const newY = y * variation
    const newZ = z * variation

    // Slightly flatten the bottom of the rock
    const flattenedY = newY < -0.45
      ? newY * 0.82
      : newY

    positions.setXYZ(i, newX, flattenedY, newZ)

    // Natural reddish-brown surface variation
    const height = THREE.MathUtils.clamp(
      (newY + 1) / 2,
      0,
      1
    )

    const color = new THREE.Color()

    if (height < 0.55) {
      color.lerpColors(
        darkColor,
        midColor,
        height / 0.55
      )
    } else {
      color.lerpColors(
        midColor,
        lightColor,
        (height - 0.55) / 0.45
      )
    }

    const shade =
      0.9 +
      Math.sin(i * 3.1 + index) * 0.08

    color.multiplyScalar(shade)

    colors.push(color.r, color.g, color.b)
  }

  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colors, 3)
  )

  geometry.computeVertexNormals()

  return geometry
}

function Rocks() {
  const rockGeometries = useMemo(() => {
    return rockData.map((rock, index) =>
      createRockGeometry(index)
    )
  }, [])

  return (
    <group>
      {rockData.map((rock, i) => (
        <mesh
          key={i}
          geometry={rockGeometries[i]}
          position={rock.position}
          scale={rock.scale}
          rotation={[
            rock.rotation,
            rock.rotation * 0.7,
            rock.rotation * 0.3,
          ]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            vertexColors
            roughness={1}
            metalness={0}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

export default Rocks





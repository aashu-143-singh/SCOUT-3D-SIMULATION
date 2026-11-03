
import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value))

function smooth(a, b, value) {
  const t = clamp((value - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

function gaussian(value, width) {
  return Math.exp(-Math.pow(value / width, 2))
}

// --------------------------------------------------
// GEOLOGICAL FEATURES
// --------------------------------------------------

const impactPits = [
  { x: 30, z: -28, r: 5, depth: 0.45 },
  { x: 42, z: 24, r: 4, depth: 0.35 },
  { x: -5, z: 38, r: 5, depth: 0.4 },
  { x: 18, z: -52, r: 3, depth: 0.3 },
  { x: -5, z: -35, r: 3, depth: 0.25 },
  { x: -55, z: 25, r: 3.5, depth: 0.28 },
]

const bedrockPatches = [
  { x: 10, z: 15, r: 12 },
  { x: 35, z: -5, r: 9 },
  { x: -15, z: 35, r: 11 },
  { x: 5, z: -48, r: 10 },
  { x: -58, z: -15, r: 9 },
  { x: 48, z: 48, r: 8 },
]

const rockyRidges = [
  { x: -48, z: -38, length: 13, width: 3.5, height: 1.0, angle: 0.35 },
  { x: -62, z: 34, length: 15, width: 4, height: 1.2, angle: -0.4 },
  { x: 28, z: 48, length: 18, width: 3, height: 0.8, angle: 0.2 },
  { x: 57, z: -35, length: 13, width: 3.5, height: 1.0, angle: -0.6 },
  { x: -18, z: -58, length: 11, width: 3, height: 0.7, angle: 0.5 },
]

// --------------------------------------------------
// DELTA AND SEDIMENT
// --------------------------------------------------

function getDeltaFeatures(x, z) {
  const westDistance = -x

  const centerZ =
    -3 + Math.sin((westDistance - 30) * 0.055) * 3

  const relativeZ = z - centerZ

  const fanProgress = smooth(25, 85, westDistance)
  const fanWidth = 5 + fanProgress * 25

  const fanSide =
    1 - smooth(
      fanWidth - 2,
      fanWidth + 2,
      Math.abs(relativeZ)
    )

  const fanStart = smooth(25, 34, westDistance)
  const fanEnd = 1 - smooth(82, 91, westDistance)

  const fanMask = fanSide * fanStart * fanEnd

  const lobe1 =
    gaussian(westDistance - 47, 15) *
    gaussian(relativeZ + 2, 12)

  const lobe2 =
    gaussian(westDistance - 64, 17) *
    gaussian(relativeZ - 5, 15)

  const lobe3 =
    gaussian(westDistance - 76, 12) *
    gaussian(relativeZ + 10, 10)

  const lobes = Math.max(
    lobe1,
    lobe2 * 0.85,
    lobe3 * 0.7
  )

  const channel1Z =
    centerZ + Math.sin(westDistance * 0.10) * 3

  const channel2Z =
    centerZ + 7 + Math.sin(westDistance * 0.08 + 1) * 4

  const channel3Z =
    centerZ - 9 + Math.sin(westDistance * 0.09 + 2) * 3

  const channel1 = gaussian(z - channel1Z, 1.3)
  const channel2 = gaussian(z - channel2Z, 1.5)
  const channel3 = gaussian(z - channel3Z, 1.4)

  const channels = Math.max(
    channel1,
    channel2 * 0.8,
    channel3 * 0.65
  )

  return {
    fanMask,
    lobes,
    channels,
    westDistance,
    relativeZ,
  }
}

// --------------------------------------------------
// BEDROCK AND RIDGES
// --------------------------------------------------

function getBedrockMask(x, z) {
  let mask = 0

  for (const patch of bedrockPatches) {
    const dx = x - patch.x
    const dz = z - patch.z
    const distance = Math.sqrt(dx * dx + dz * dz)

    mask = Math.max(
      mask,
      1 - smooth(patch.r * 0.6, patch.r, distance)
    )
  }

  return mask
}

function getRidgeHeight(x, z) {
  let height = 0

  for (const ridge of rockyRidges) {
    const dx = x - ridge.x
    const dz = z - ridge.z

    const along =
      dx * Math.cos(ridge.angle) +
      dz * Math.sin(ridge.angle)

    const across =
      -dx * Math.sin(ridge.angle) +
      dz * Math.cos(ridge.angle)

    const ridgeShape =
      gaussian(along, ridge.length) *
      gaussian(across, ridge.width)

    height += ridge.height * ridgeShape
  }

  return height
}

// --------------------------------------------------
// SHARED TERRAIN HEIGHT
// Keep this function compatible with rover movement.
// --------------------------------------------------

export function getTerrainHeight(x, z) {
  let height =
    Math.sin(x * 0.035) * 0.22 +
    Math.cos(z * 0.045) * 0.2 +
    Math.sin((x + z) * 0.025) * 0.16 +
    Math.cos((x - z) * 0.055) * 0.08

  const basinDistance = Math.sqrt(
    (x / 95) ** 2 + (z / 90) ** 2
  )

  height -=
    0.45 * Math.exp(-basinDistance * basinDistance * 2)

  const edgeMask = smooth(0.78, 0.99, basinDistance)

  height += edgeMask * (
    0.85 +
    Math.sin(x * 0.09 + z * 0.07) * 0.15
  )

  const delta = getDeltaFeatures(x, z)

  // Delta deposits and sediment lobes
  height += 1.0 * delta.fanMask
  height += 0.55 * delta.lobes * delta.fanMask

  // Less regular sediment layering
  const layerWave =
    Math.sin(
      (delta.westDistance + delta.relativeZ * 0.22) * 0.42
    ) +
    0.3 * Math.sin(
      (delta.westDistance * 0.19 + delta.relativeZ * 0.38)
    )

  height += layerWave * 0.075 * delta.fanMask

  // Eroded channels
  height -=
    0.30 * delta.channels * delta.fanMask

  // Delta-front scarp
  const scarp =
    gaussian(x + 34, 2.8) *
    delta.fanMask

  height += 0.5 * scarp

  // Small terraces
  const terrace =
    Math.sin(delta.westDistance * 0.8) *
    gaussian(delta.relativeZ, 22) *
    delta.fanMask

  height += terrace * 0.10

  // Exposed bedrock
  const bedrockMask = getBedrockMask(x, z)

  height +=
    bedrockMask *
    (0.18 + Math.sin(x * 0.5 + z * 0.3) * 0.12)

  // Low ridges
  height += getRidgeHeight(x, z)

  // Impact pits and raised rims
  for (const pit of impactPits) {
    const dx = x - pit.x
    const dz = z - pit.z
    const distance = Math.sqrt(dx * dx + dz * dz)

    const bowl =
      -pit.depth *
      gaussian(distance, pit.r * 0.7)

    const rim =
      0.13 *
      gaussian(distance - pit.r, 1.4)

    height += bowl + rim
  }

  // Wind-shaped sand ripples
  const rippleMask =
    (1 - delta.fanMask) *
    (1 - bedrockMask) *
    smooth(8, 18, Math.abs(x))

  const ripples =
    Math.sin(z * 1.1 + x * 0.28) * 0.045 +
    Math.sin(z * 0.55 - x * 0.12) * 0.018

  height += ripples * rippleMask

  // Fine surface irregularities
  height +=
    Math.sin(x * 0.13 + z * 0.09) * 0.055 +
    Math.cos(z * 0.15 - x * 0.12) * 0.045

  return height
}

// --------------------------------------------------
// PROCEDURAL SAND TEXTURE
// No external texture file required.
// --------------------------------------------------

function createSandTextures() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512

  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#f4eee8'
  ctx.fillRect(0, 0, 512, 512)

  let seed = 82731

  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  // Fine sand grains
  for (let i = 0; i < 18000; i++) {
    const x = random() * 512
    const y = random() * 512
    const size = 0.3 + random() * 1.4

    const dark = random() > 0.5

    ctx.fillStyle = dark
      ? `rgba(105,65,45,${0.025 + random() * 0.10})`
      : `rgba(255,255,255,${0.04 + random() * 0.15})`

    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  // Fine wind-shaped surface marks
  for (let i = 0; i < 45; i++) {
    const y = random() * 512
    const x = random() * 512
    const length = 25 + random() * 100

    ctx.strokeStyle = `rgba(125,76,52,${0.025 + random() * 0.04})`
    ctx.lineWidth = 0.5 + random() * 1.1

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(
      x + length * 0.5,
      y - 5 + random() * 10,
      x + length,
      y + random() * 4
    )
    ctx.stroke()
  }

  const colorMap = new THREE.CanvasTexture(canvas)

  colorMap.wrapS = THREE.RepeatWrapping
  colorMap.wrapT = THREE.RepeatWrapping
  colorMap.repeat.set(16, 16)
  colorMap.colorSpace = THREE.SRGBColorSpace

  const bumpMap = colorMap.clone()
  bumpMap.colorSpace = THREE.NoColorSpace
  bumpMap.repeat.set(16, 16)

  return { colorMap, bumpMap }
}

// --------------------------------------------------
// DETERMINISTIC RANDOM GENERATOR
// --------------------------------------------------

function createRandom(seed) {
  let value = seed

  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

// --------------------------------------------------
// INSTANCED ROCK FIELD
// Hundreds of rocks without hundreds of React meshes.
// --------------------------------------------------

function InstancedRockLayer({ kind, count }) {
  const meshRef = useRef(null)

  const rockData = useMemo(() => {
    const random = createRandom(
      kind === 'pebble' ? 1937 : 8241
    )

    const geometry =
      kind === 'pebble'
        ? new THREE.IcosahedronGeometry(0.5, 0)
        : new THREE.DodecahedronGeometry(0.5, 0)

    const material = new THREE.MeshStandardMaterial({
      roughness: 1,
      metalness: 0,
      vertexColors: true,
    })

    const matrices = []
    const colors = []

    const palette =
      kind === 'pebble'
        ? ['#795344', '#a16a50', '#6c5145', '#b07a5b', '#8a6250']
        : ['#665047', '#795345', '#8a5b45', '#59463e']

    const dummy = new THREE.Object3D()

    for (let i = 0; i < count; i++) {
      let x = 0
      let z = 0

      // Keep the starting area reasonably clear
      for (let attempt = 0; attempt < 20; attempt++) {
        x = (random() - 0.5) * 188
        z = (random() - 0.5) * 188

        if (Math.sqrt(x * x + z * z) > 5) break
      }

      let sx, sy, sz

      if (kind === 'pebble') {
        sx = 0.13 + random() * 0.34
        sy = 0.09 + random() * 0.16
        sz = 0.13 + random() * 0.34
      } else {
        sx = 0.45 + random() * 0.75
        sy = 0.14 + random() * 0.22
        sz = 0.35 + random() * 0.65
      }

      const groundHeight = getTerrainHeight(x, z)

      dummy.position.set(
        x,
        groundHeight + sy * 0.17,
        z
      )

      dummy.rotation.set(
        random() * 0.35,
        random() * Math.PI * 2,
        random() * 0.35
      )

      dummy.scale.set(sx, sy, sz)
      dummy.updateMatrix()

      matrices.push(dummy.matrix.clone())

      const colorIndex = Math.floor(
        random() * palette.length
      )

      colors.push(new THREE.Color(palette[colorIndex]))
    }

    return {
      geometry,
      material,
      matrices,
      colors,
    }
  }, [kind, count])

  useEffect(() => {
    const mesh = meshRef.current

    if (!mesh) return

    for (let i = 0; i < rockData.matrices.length; i++) {
      mesh.setMatrixAt(i, rockData.matrices[i])
      mesh.setColorAt(i, rockData.colors[i])
    }

    mesh.instanceMatrix.needsUpdate = true

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }

    mesh.computeBoundingSphere()
  }, [rockData])

  useEffect(() => {
    return () => {
      rockData.geometry.dispose()
      rockData.material.dispose()
    }
  }, [rockData])

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        rockData.geometry,
        rockData.material,
        count,
      ]}
      castShadow
      receiveShadow
    />
  )
}

// --------------------------------------------------
// MAIN MARS TERRAIN
// --------------------------------------------------

function MarsTerrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      200,
      200,
      120,
      120
    )

    const positions = geo.attributes.position
    const colors = []

    const regolith = new THREE.Color('#a9674c')
    const darkBedrock = new THREE.Color('#665047')
    const deltaRock = new THREE.Color('#80503f')
    const dustyHigh = new THREE.Color('#bd8060')
    const channelColor = new THREE.Color('#553d34')
    const sedimentColor = new THREE.Color('#b77c5d')
    const ridgeColor = new THREE.Color('#794d3d')

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = -positions.getY(i)

      const height = getTerrainHeight(x, z)

      positions.setZ(i, height)

      const color = regolith.clone()
      const delta = getDeltaFeatures(x, z)

      // Main delta deposit
      const deltaColorMask = clamp(
        delta.fanMask * (0.7 + delta.lobes * 0.3),
        0,
        1
      )

      color.lerp(deltaRock, deltaColorMask * 0.9)

      // Sediment layers
      const layerPattern =
        Math.sin(
          (delta.westDistance + delta.relativeZ * 0.22) * 0.42
        )

      const layerMask =
        smooth(0.35, 0.9, layerPattern) *
        delta.fanMask

      color.lerp(
        sedimentColor,
        layerMask * 0.28
      )

      // Darker channels
      color.lerp(
        channelColor,
        delta.channels * delta.fanMask * 0.55
      )

      // Bedrock patches
      const bedrockMask = getBedrockMask(x, z)

      color.lerp(
        darkBedrock,
        bedrockMask * 0.75
      )

      // Rocky ridges
      const ridgeMask = clamp(
        getRidgeHeight(x, z) * 0.6,
        0,
        0.7
      )

      color.lerp(ridgeColor, ridgeMask)

      // Elevated dusty regions
      const elevationMask = smooth(0.65, 1.5, height)

      color.lerp(
        dustyHigh,
        elevationMask * 0.25
      )

      // Natural colour variation
      const variation =
        Math.sin(x * 0.25 + z * 0.17) * 0.025 +
        Math.cos(x * 0.13 - z * 0.19) * 0.018

      color.offsetHSL(0, 0, variation)

      colors.push(color.r, color.g, color.b)
    }

    geo.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    )

    geo.rotateX(-Math.PI / 2)
    geo.computeVertexNormals()

    return geo
  }, [])

  const textures = useMemo(
    () => createSandTextures(),
    []
  )

  useEffect(() => {
    return () => {
      textures.colorMap.dispose()
      textures.bumpMap.dispose()
      geometry.dispose()
    }
  }, [textures, geometry])

  return (
    <group>
      {/* Main terrain surface */}
      <mesh
        geometry={geometry}
        receiveShadow
      >
        <meshStandardMaterial
          map={textures.colorMap}
          bumpMap={textures.bumpMap}
          bumpScale={0.045}
          vertexColors
          roughness={1}
          metalness={0}
          flatShading={false}
        />
      </mesh>

      {/* Fine scattered sand and stones */}
      <InstancedRockLayer
        kind="pebble"
        count={420}
      />

      {/* Larger broken rock fragments */}
      <InstancedRockLayer
        kind="slab"
        count={85}
      />
    </group>
  )
}

export default MarsTerrain







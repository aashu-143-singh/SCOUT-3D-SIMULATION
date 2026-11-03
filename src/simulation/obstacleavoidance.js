
import * as THREE from 'three'

export function chooseAvoidanceTurn(
  position,
  direction,
  obstacles,
  roverRadius = 1.45
) {
  if (direction.lengthSq() === 0) return null

  const upAxis = new THREE.Vector3(0, 1, 0)

  // Test a wider range of steering directions.
  const angles = [
    -Math.PI / 2,
    Math.PI / 2,
    -Math.PI / 3,
    Math.PI / 3,
    -Math.PI / 4,
    Math.PI / 4,
    -Math.PI / 6,
    Math.PI / 6,
    0,
  ]

  let bestAngle = null
  let bestScore = -Infinity

  for (const angle of angles) {
    const testDirection = direction
      .clone()
      .normalize()
      .applyAxisAngle(upAxis, angle)

    let minimumClearance = Infinity
    let safe = true

    // Sample the proposed path at multiple distances.
    for (let step = 1; step <= 12; step++) {
      const testPosition = position.clone()
      testPosition.addScaledVector(testDirection, step * 0.8)

      for (const obstacle of obstacles) {
        const dx = testPosition.x - obstacle.x
        const dz = testPosition.z - obstacle.z
        const distance = Math.hypot(dx, dz)

        const clearance =
          distance - roverRadius - obstacle.radius - 0.5

        minimumClearance = Math.min(minimumClearance, clearance)

        if (clearance < 0) {
          safe = false
          break
        }
      }

      if (!safe) break
    }

    if (!safe) continue

    // Prefer directions that remain closer to the original heading.
    const alignment = testDirection.dot(direction.clone().normalize())
    const score = minimumClearance + alignment * 2

    if (score > bestScore) {
      bestScore = score
      bestAngle = angle
    }
  }

  return bestAngle
}

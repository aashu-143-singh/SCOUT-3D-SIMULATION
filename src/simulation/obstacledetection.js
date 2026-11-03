export function detectObstacle(roverPosition, obstacles, safeDistance = 4) {
  let nearestObstacle = null
  let nearestDistance = Infinity

  obstacles.forEach((obstacle) => {
    const dx = roverPosition.x - obstacle.x
    const dz = roverPosition.z - obstacle.z

    const centerDistance = Math.sqrt(dx * dx + dz * dz)
    const surfaceDistance = Math.max(0, centerDistance - obstacle.radius)

    if (surfaceDistance < nearestDistance) {
      nearestDistance = surfaceDistance
      nearestObstacle = obstacle
    }
  })

  return {
    detected: nearestDistance <= safeDistance,
    distance: nearestDistance,
    obstacle: nearestObstacle,
    warning:
      nearestDistance <= safeDistance
        ? 'Obstacle detected nearby!'
        : 'Path clear',
  }
}

// Checks whether an obstacle is in the rover's current direction.
export function detectObstacleAhead(
  position,
  direction,
  obstacles,
  lookAhead = 7,
  roverRadius = 1.45
) {
  let nearestObstacle = null
  let nearestForwardDistance = Infinity

  if (direction.lengthSq() === 0) {
    return { detected: false, obstacle: null, distance: Infinity }
  }

  const forward = direction.clone().normalize()

  obstacles.forEach((obstacle) => {
    const dx = obstacle.x - position.x
    const dz = obstacle.z - position.z

    // Distance along the rover's direction
    const forwardDistance = dx * forward.x + dz * forward.z

    // Ignore obstacles behind the rover or too far ahead
    if (forwardDistance < 0 || forwardDistance > lookAhead) return

    // Distance sideways from the rover's path
    const totalDistance = Math.sqrt(dx * dx + dz * dz)
    const sideDistance = Math.sqrt(
      Math.max(0, totalDistance * totalDistance - forwardDistance * forwardDistance)
    )

    const safeCorridor = roverRadius + obstacle.radius + 0.35

    if (
      sideDistance <= safeCorridor &&
      forwardDistance < nearestForwardDistance
    ) {
      nearestForwardDistance = forwardDistance
      nearestObstacle = obstacle
    }
  })

  return {
    detected: nearestObstacle !== null,
    obstacle: nearestObstacle,
    distance: nearestForwardDistance,
  }
}

// Final safety check before movement
export function checkCollision(nextPosition, obstacles, roverRadius = 1.45) {
  for (const obstacle of obstacles) {
    const dx = nextPosition.x - obstacle.x
    const dz = nextPosition.z - obstacle.z

    const distance = Math.sqrt(dx * dx + dz * dz)
    const minimumDistance = roverRadius + obstacle.radius

    if (distance < minimumDistance) {
      return { collided: true, obstacle, distance }
    }
  }

  return { collided: false, obstacle: null, distance: Infinity }
}

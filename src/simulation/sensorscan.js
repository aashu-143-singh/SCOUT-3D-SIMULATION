
export function scanSurroundings(
  roverPosition,
  obstacles,
  maxDistance = 12
) {
  const detectedObstacles = []

  obstacles.forEach((obstacle) => {
    const dx = roverPosition.x - obstacle.x
    const dz = roverPosition.z - obstacle.z

    
    const centerDistance = Math.sqrt(
      dx * dx + dz * dz
    )

    
    const surfaceDistance = Math.max(
      0,
      centerDistance - obstacle.radius
    )

    if (surfaceDistance <= maxDistance) {
      detectedObstacles.push({
        id: obstacle.id,
        distance: Number(surfaceDistance.toFixed(2)),
        position: {
          x: obstacle.x,
          z: obstacle.z,
        },
      })
    }
  })

  // Nearest obstacle ko sabse pehle rakho
  detectedObstacles.sort(
    (a, b) => a.distance - b.distance
  )

  return {
    scanned: true,
    totalDetected: detectedObstacles.length,
    nearestObstacle: detectedObstacles[0] || null,
    obstacles: detectedObstacles,
    message:
      detectedObstacles.length > 0
        ? `${detectedObstacles.length} obstacle(s) detected`
        : 'Surroundings clear',
  }
}

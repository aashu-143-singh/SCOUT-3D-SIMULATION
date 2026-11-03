

export function createLearningMemory() {
  const mistakes = []

  return {

    rememberMistake(obstacleId, direction) {
      mistakes.push({
        obstacleId,
        direction,
        time: Date.now(),
      })
    },

    
    hasFailedBefore(obstacleId, direction) {
      return mistakes.some(
        (mistake) =>
          mistake.obstacleId === obstacleId &&
          mistake.direction === direction
      )
    },

    
    getMistakes() {
      return [...mistakes]
    },
  }
}